import { parsePlanTasks } from './lib/parsing.js';
import { GitHubClient } from './lib/githubClient.js';
import { PAT_STORAGE_KEY } from './lib/state.js';
import { goalTemplate, planTemplate, requirementsTemplate, slugifyEpicName } from './lib/templates.js';

const sections = new Map();
const links = [];

const patModal = document.getElementById('pat-modal');
const patInput = document.getElementById('pat-input');
const savePat = document.getElementById('save-pat');
const ownerInput = document.getElementById('owner');
const repoInput = document.getElementById('repo');
const branchInput = document.getElementById('branch');
const epicInput = document.getElementById('epic-name');
const createEpicButton = document.getElementById('create-epic');
const generatePlanButton = document.getElementById('generate-plan');
const writeFilesButton = document.getElementById('write-files');
const editor = document.getElementById('editor');
const status = document.getElementById('status');
const editorTitle = document.getElementById('editor-title');
const linksContainer = document.getElementById('github-links');

function currentToken() {
  return localStorage.getItem(PAT_STORAGE_KEY);
}

function ensurePatGate() {
  patModal.classList.toggle('hidden', Boolean(currentToken()));
}

function setStatus(message) {
  status.textContent = message;
}

function setSection(key) {
  editorTitle.textContent = key[0].toUpperCase() + key.slice(1);
  editor.value = sections.get(key) || '';
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.nav === key);
  });
}

function updateSection(key, value) {
  sections.set(key, value);
}

function renderLinks() {
  linksContainer.innerHTML = '';
  for (const item of links) {
    const anchor = document.createElement('a');
    anchor.href = item.url;
    anchor.textContent = item.path;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer noopener';
    linksContainer.appendChild(anchor);
  }
}

savePat.addEventListener('click', () => {
  const token = patInput.value.trim();
  if (!token) {
    setStatus('A token is required.');
    return;
  }
  localStorage.setItem(PAT_STORAGE_KEY, token);
  ensurePatGate();
  setStatus('Token saved locally.');
});

createEpicButton.addEventListener('click', () => {
  const epicName = epicInput.value.trim();
  if (!epicName) {
    setStatus('Epic name is required.');
    return;
  }

  sections.set('goal', goalTemplate(epicName));
  sections.set('requirements', requirementsTemplate());
  sections.set('plan', planTemplate(epicName));
  sections.set('tasks', '# Tasks\n');
  setSection('goal');
  setStatus('Epic files scaffolded in editor.');
});

generatePlanButton.addEventListener('click', () => {
  const plan = sections.get('plan') || editor.value;
  const parsed = parsePlanTasks(plan);
  const tasksMarkdown = parsed
    .map((task) => `- ${task.id}: ${task.title}`)
    .join('\n');

  sections.set('tasks', `# Tasks\n\n${tasksMarkdown}`);
  if ((document.querySelector('.nav-btn.active')?.dataset.nav || 'goal') === 'tasks') {
    setSection('tasks');
  }
  setStatus(`Generated ${parsed.length} tasks from plan.`);
});

writeFilesButton.addEventListener('click', async () => {
  const token = currentToken();
  if (!token) {
    ensurePatGate();
    setStatus('Please save a token first.');
    return;
  }

  const owner = ownerInput.value.trim();
  const repo = repoInput.value.trim();
  const branch = branchInput.value.trim() || 'main';
  const epicSlug = slugifyEpicName(epicInput.value || 'epic');

  if (!owner || !repo || !epicSlug) {
    setStatus('Owner, repo and epic name are required.');
    return;
  }

  const client = new GitHubClient(token);
  const basePath = `epics/${epicSlug}`;
  const docs = [
    ['goal.md', sections.get('goal') || ''],
    ['requirements.md', sections.get('requirements') || ''],
    ['plan.md', sections.get('plan') || ''],
  ];

  const parsedTasks = parsePlanTasks(sections.get('plan') || '');
  const taskDocs = parsedTasks.map((task) => [
    `tasks/${task.id}-${task.slug}.md`,
    `# ${task.title}\n\n## Research\n- Collect links and findings\n\n## Work\n- Implement and test`,
  ]);

  try {
    links.length = 0;
    for (const [fileName, content] of [...docs, ...taskDocs]) {
      const path = `${basePath}/${fileName}`;
      await client.putContent({
        owner,
        repo,
        path,
        content,
        message: `Create ${path}`,
        branch,
      });
      links.push({
        path,
        url: `https://github.com/${owner}/${repo}/blob/${branch}/${path}`,
      });
    }
    renderLinks();
    setStatus(`Wrote ${docs.length + taskDocs.length} files to GitHub.`);
  } catch (error) {
    setStatus(error.message);
  }
});

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    updateSection(document.querySelector('.nav-btn.active')?.dataset.nav || 'goal', editor.value);
    setSection(btn.dataset.nav);
  });
});

editor.addEventListener('input', () => {
  const active = document.querySelector('.nav-btn.active')?.dataset.nav || 'goal';
  updateSection(active, editor.value);
});

ensurePatGate();
setSection('goal');
