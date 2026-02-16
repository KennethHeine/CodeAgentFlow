const STORAGE_KEYS = {
  pat: "codeagentflow_pat",
  cache: "codeagentflow_cache"
};

const patInput = document.getElementById("pat");
const runtimeOwnerInput = document.getElementById("runtimeOwner");
const runtimeRepoInput = document.getElementById("runtimeRepo");
const epicOwnerInput = document.getElementById("epicOwner");
const epicRepoInput = document.getElementById("epicRepo");
const runtimeSummary = document.getElementById("runtimeSummary");
const epicList = document.getElementById("epicList");

patInput.value = localStorage.getItem(STORAGE_KEYS.pat) || "";

function setCache(key, value) {
  const cache = JSON.parse(localStorage.getItem(STORAGE_KEYS.cache) || "{}");
  cache[key] = { value, ts: Date.now() };
  localStorage.setItem(STORAGE_KEYS.cache, JSON.stringify(cache));
}

function getAuthHeaders() {
  const token = localStorage.getItem(STORAGE_KEYS.pat);
  if (!token) {
    throw new Error("Missing PAT. Save a token first.");
  }

  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

async function ghJson(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status}: ${text}`);
  }

  return response.json();
}

function renderList(element, lines) {
  element.replaceChildren();
  for (const line of lines) {
    const li = document.createElement("li");
    li.textContent = line;
    element.appendChild(li);
  }
}

function onError(element, error) {
  renderList(element, [`Error: ${error.message}`]);
}

async function loadRuntimeState(owner, repo) {
  const pulls = await ghJson(`/repos/${owner}/${repo}/pulls?state=all&per_page=100`);

  const checkRunsByPr = await Promise.all(
    pulls.map(async (pr) => {
      const checks = await ghJson(`/repos/${owner}/${repo}/commits/${pr.head.sha}/check-runs?per_page=100`);
      return checks.total_count || 0;
    })
  );

  const [issues, labels, comments] = await Promise.all([
    ghJson(`/repos/${owner}/${repo}/issues?state=all&per_page=100`),
    ghJson(`/repos/${owner}/${repo}/labels?per_page=100`),
    ghJson(`/repos/${owner}/${repo}/issues/comments?per_page=100`)
  ]);

  const mergedPrs = pulls.filter((pr) => Boolean(pr.merged_at)).length;
  const totalChecks = checkRunsByPr.reduce((sum, count) => sum + count, 0);

  return {
    issues: issues.filter((issue) => !issue.pull_request).length,
    prs: pulls.length,
    labels: labels.length,
    comments: comments.length,
    checks: totalChecks,
    merges: mergedPrs
  };
}

async function loadEpics(owner, repo) {
  const entries = await ghJson(`/repos/${owner}/${repo}/contents/epics`);
  return entries
    .filter((entry) => entry.type === "file" && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => ({ name: entry.name, path: entry.path, url: entry.html_url }));
}

document.getElementById("savePatBtn").addEventListener("click", () => {
  localStorage.setItem(STORAGE_KEYS.pat, patInput.value.trim());
});

document.getElementById("loadRuntimeBtn").addEventListener("click", async () => {
  const owner = runtimeOwnerInput.value.trim();
  const repo = runtimeRepoInput.value.trim();

  if (!owner || !repo) {
    renderList(runtimeSummary, ["Provide runtime owner and repo."]);
    return;
  }

  try {
    const summary = await loadRuntimeState(owner, repo);
    setCache(`runtime:${owner}/${repo}`, summary);
    renderList(runtimeSummary, [
      `Issues: ${summary.issues}`,
      `PRs: ${summary.prs}`,
      `Labels: ${summary.labels}`,
      `Comments: ${summary.comments}`,
      `Checks: ${summary.checks}`,
      `Merges: ${summary.merges}`,
      "Source of truth: Live GitHub API data"
    ]);
  } catch (error) {
    onError(runtimeSummary, error);
  }
});

document.getElementById("loadEpicsBtn").addEventListener("click", async () => {
  const owner = epicOwnerInput.value.trim();
  const repo = epicRepoInput.value.trim();

  if (!owner || !repo) {
    renderList(epicList, ["Provide epic owner and repo."]);
    return;
  }

  try {
    const epics = await loadEpics(owner, repo);
    setCache(`epics:${owner}/${repo}`, epics);

    if (epics.length === 0) {
      renderList(epicList, ["No markdown specs found in /epics."]);
      return;
    }

    epicList.replaceChildren();
    for (const epic of epics) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = epic.url;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.textContent = `${epic.name} (${epic.path})`;
      li.appendChild(a);
      epicList.appendChild(li);
    }
  } catch (error) {
    onError(epicList, error);
  }
});
