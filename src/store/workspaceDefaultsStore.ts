import { create } from "zustand";

interface WorkspaceDefaultsState {
  priority: string;
  status: string;
  category: string;
  labels: string[];
  customCategories: string[];
  customLabels: string[];
  loading: boolean;
  initialized: boolean;
  fetchDefaults: (workspaceId: number) => Promise<void>;
  updateDefaults: (
    workspaceId: number,
    data: {
      priority?: string;
      status?: string;
      category?: string;
      labels?: string[];
      customCategories?: string[];
      customLabels?: string[];
    }
  ) => Promise<boolean>;
}

export const useWorkspaceDefaultsStore = create<WorkspaceDefaultsState>((set, get) => ({
  priority: "medium",
  status: "todo",
  category: "General",
  labels: [],
  customCategories: ["General", "Product", "Engineering", "Design", "Operations", "Marketing"],
  customLabels: ["Bug", "Feature", "Improvement", "Docs", "Design", "Meeting"],
  loading: false,
  initialized: false,

  fetchDefaults: async (workspaceId: number) => {
    if (get().loading && get().initialized) return;

    set({ loading: true });
    try {
      const res = await fetch(`/api/workspace/defaults?wid=${workspaceId}`);
      const json = await res.json();
      if (json.success) {
        set({
          priority: json.defaults?.priority || "medium",
          status: json.defaults?.status || "todo",
          category: json.defaults?.category || "General",
          labels: json.defaults?.labels || [],
          customCategories: json.customCategories || ["General", "Product", "Engineering", "Design", "Operations", "Marketing"],
          customLabels: json.customLabels || ["Bug", "Feature", "Improvement", "Docs", "Design", "Meeting"],
          initialized: true,
        });
      }
    } catch (error) {
      console.error("Failed to fetch workspace defaults:", error);
    } finally {
      set({ loading: false });
    }
  },

  updateDefaults: async (workspaceId: number, data) => {
    set({ loading: true });
    try {
      const res = await fetch("/api/workspace/defaults", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          ...data,
        }),
      });
      const json = await res.json();
      if (json.success) {
        set({
          priority: json.defaults?.priority || "medium",
          status: json.defaults?.status || "todo",
          category: json.defaults?.category || "General",
          labels: json.defaults?.labels || [],
          customCategories: json.customCategories || ["General", "Product", "Engineering", "Design", "Operations", "Marketing"],
          customLabels: json.customLabels || ["Bug", "Feature", "Improvement", "Docs", "Design", "Meeting"],
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update workspace defaults:", error);
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
