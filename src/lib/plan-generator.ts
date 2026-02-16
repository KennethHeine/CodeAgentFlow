function sanitizeIntent(intent: string) {
  return intent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}

export interface GeneratedTask {
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

export interface GeneratedPlan {
  summary: string;
  tasks: GeneratedTask[];
}

export function generatePlan(title: string, intent: string): GeneratedPlan {
  const cleanIntent = sanitizeIntent(intent);
  const base = [
    "Project skeleton and configuration",
    "Data model and persistence",
    "API orchestration endpoints",
    "Core workflow UI",
    "Validation and retry loop",
    "Documentation and local verification",
  ];

  const tasks = base.slice(0, 6).map((item, index) => ({
    title: `${index + 1}. ${item}`,
    description: `${item} for ${title} aligned with intent: ${cleanIntent}`,
    acceptanceCriteria: [
      "Code changes are scoped to a small PR-friendly unit",
      "Behavior is visible from the UI with clear status",
      "Audit trail is recorded for user-triggered actions",
    ],
  }));

  return {
    summary: `Plan generated from intent: ${cleanIntent}`,
    tasks,
  };
}
