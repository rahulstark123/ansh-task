type PrismaLikeError = {
  code?: string;
  message?: string;
};

export function formatApiError(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const err = error as PrismaLikeError;
  const message = err.message ?? "";

  if (err.code === "P2003") {
    return "Workspace not found. Please refresh the page and try again.";
  }

  if (err.code === "P2002") {
    return "A project with these details already exists.";
  }

  if (message.includes("Argument `workspace` is missing")) {
    return "Could not save the project. Please refresh the page and try again.";
  }

  if (message.includes("Argument `due` is missing")) {
    return "Could not save the project without a due date. Please set a due date or refresh and try again.";
  }

  if (message.includes("Null constraint violation") && message.toLowerCase().includes("due")) {
    return "Due date could not be saved. Please try again.";
  }

  if (message.startsWith("Invalid `prisma.")) {
    return fallback;
  }

  if (message.length > 0 && message.length <= 160 && !message.includes("\n")) {
    return message;
  }

  return fallback;
}
