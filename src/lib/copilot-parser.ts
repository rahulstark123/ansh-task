import type { TaskPriority, TaskStatus } from "@/types/task";

export interface ParsedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  assignees: string[];
  projectId: string | null;
  dueLabel: string;
  labels: string[];
}

export function parsePromptToTask(
  prompt: string,
  projects: { id: string; name: string }[],
  assignees: string[],
  customCategories: string[] = []
): ParsedTask {
  const text = prompt.toLowerCase();

  // 1. Extract priority
  let priority: TaskPriority = "medium";
  if (text.includes("urgent") || text.includes("critical") || text.includes("immediate")) {
    priority = "urgent";
  } else if (text.includes("high") || text.includes("important") || text.includes("priority 1") || text.includes("p1")) {
    priority = "high";
  } else if (text.includes("low") || text.includes("trivial") || text.includes("p3") || text.includes("minor")) {
    priority = "low";
  }

  // 2. Extract status
  let status: TaskStatus = "todo";
  if (text.includes("in progress") || text.includes("working on") || text.includes("started")) {
    status = "in_progress";
  } else if (text.includes("blocked") || text.includes("stuck") || text.includes("impeded")) {
    status = "blocked";
  } else if (text.includes("on hold") || text.includes("paused") || text.includes("waiting")) {
    status = "on_hold";
  } else if (text.includes("done") || text.includes("completed") || text.includes("finished") || text.includes("solved")) {
    status = "done";
  } else if (text.includes("review") || text.includes("verify") || text.includes("testing")) {
    status = "review";
  }

  // 3. Extract assignee
  const matchedAssignees: string[] = [];
  const assignRegex = /(?:assign(?:ed)?\s+to|for|owner:|assigned:)\s+([a-zA-Z0-9_\s]+)/i;
  const matchAssign = prompt.match(assignRegex);
  if (matchAssign && matchAssign[1]) {
    const candidateName = matchAssign[1].trim().toLowerCase();
    const matched = assignees.find(
      (a) => a.toLowerCase().includes(candidateName) || candidateName.includes(a.toLowerCase())
    );
    if (matched && matched !== "Unassigned") {
      matchedAssignees.push(matched);
    }
  } else {
    // Fallback: search for any assignee name mentioned in the prompt
    for (const assignee of assignees) {
      if (assignee === "Unassigned") continue;
      const nameParts = assignee.split(" ");
      const firstName = nameParts[0]?.toLowerCase();
      if (firstName && firstName.length > 2 && text.includes(firstName)) {
        matchedAssignees.push(assignee);
        break;
      }
    }
  }

  // 4. Extract project
  let projectId: string | null = null;
  const projRegex = /(?:in\s+project|under\s+project|project:)\s+([a-zA-Z0-9_\s]+)/i;
  const matchProj = prompt.match(projRegex);
  if (matchProj && matchProj[1]) {
    const candidateName = matchProj[1].trim().toLowerCase();
    const matched = projects.find(
      (p) => p.name.toLowerCase().includes(candidateName) || candidateName.includes(p.name.toLowerCase())
    );
    if (matched) {
      projectId = matched.id;
    }
  } else {
    // Fallback: search for any project name in prompt
    for (const p of projects) {
      if (text.includes(p.name.toLowerCase())) {
        projectId = p.id;
        break;
      }
    }
  }

  // 5. Extract category
  let category = "General";
  const defaultCategories = ["product", "engineering", "design", "operations", "marketing"];
  const allCategories = Array.from(new Set([...defaultCategories, ...customCategories.map(c => c.toLowerCase())]));
  for (const cat of allCategories) {
    if (text.includes(cat)) {
      category = customCategories.find(c => c.toLowerCase() === cat) || (cat.charAt(0).toUpperCase() + cat.slice(1));
      break;
    }
  }

  // 6. Extract labels
  const labels: string[] = [];
  const possibleLabels = ["Bug", "Feature", "Improvement", "Docs", "Design", "Meeting"];
  for (const lab of possibleLabels) {
    if (text.includes(lab.toLowerCase())) {
      labels.push(lab);
    }
  }

  // 7. Clean up prompt to get a title
  let cleanedTitle = prompt;

  // Remove leading create action keywords
  cleanedTitle = cleanedTitle.replace(/^(create\s+a\s+task\s+to|create\s+task\s+to|create\s+a\s+task\s+for|create\s+task\s+for|create\s+a|create\s+an|create|new\s+task|task|add\s+a\s+task\s+to|add\s+task\s+to|add\s+task|add)\s+/i, "");

  // Remove assignee phrases
  cleanedTitle = cleanedTitle.replace(/(?:assign(?:ed)?\s+to|for|owner:|assigned:)\s+([a-zA-Z0-9_\s]+)/i, "");

  // Remove project phrases
  cleanedTitle = cleanedTitle.replace(/(?:in\s+project|under\s+project|project:)\s+([a-zA-Z0-9_\s]+)/i, "");

  // Remove priority keyword structures
  cleanedTitle = cleanedTitle.replace(/\b(high|medium|low|urgent|critical|immediate)\b\s+priority\b/gi, "");
  cleanedTitle = cleanedTitle.replace(/\bwith\s+(high|medium|low|urgent|critical|immediate)\s+priority\b/gi, "");
  cleanedTitle = cleanedTitle.replace(/\b(high|medium|low|urgent|critical|immediate)\b/gi, "");

  // Remove category words
  cleanedTitle = cleanedTitle.replace(/\b(product|engineering|design|operations|marketing|general)\b/gi, "");

  // Clean up extra spaces, trailing punctuation, and prepositions
  cleanedTitle = cleanedTitle
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(to|for|a|an)\s+/i, "")
    .replace(/[.,;:!\s]+$/, "");

  // Capitalize first letter
  if (cleanedTitle) {
    cleanedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
  } else {
    cleanedTitle = "New Task by Copilot";
  }

  // 6.5 Parse due date (relative & absolute)
  let dueLabel = "No date";
  const dateMatch = text.match(/\b(?:by|due|on|before)\s+(\d{4}-\d{2}-\d{2})\b/);
  if (dateMatch && dateMatch[1]) {
    dueLabel = dateMatch[1];
  } else if (text.includes("today")) {
    dueLabel = new Date().toISOString().slice(0, 10);
  } else if (text.includes("tomorrow")) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueLabel = tomorrow.toISOString().slice(0, 10);
  } else {
    const inDaysMatch = text.match(/\bin\s+(\d+)\s+days?\b/);
    if (inDaysMatch && inDaysMatch[1]) {
      const days = parseInt(inDaysMatch[1], 10);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      dueLabel = targetDate.toISOString().slice(0, 10);
    }
  }

  // Description includes details parsed from user request
  const description = `Task details:
- Plan and execute: ${cleanedTitle}
- Request context: "${prompt}"

(Generated by ANSH Copilot)`;

  return {
    title: cleanedTitle,
    description,
    priority,
    status,
    category,
    assignees: matchedAssignees,
    projectId,
    dueLabel,
    labels
  };
}
