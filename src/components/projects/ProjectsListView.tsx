"use client";

import { useState, useId, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TableCellsIcon,
  XMarkIcon,
  FolderIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  PlusIcon,
  UserIcon,
  TagIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  HeartIcon,
  CheckIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { AddTaskModal } from "@/components/tasks/AddTaskModal";
import type { NewTaskPayload } from "@/types/task";


type Project = {
  id: string;
  name: string;
  description: string;
  progress: number;
  startDate: string;
  due: string;
  priority: "Urgent" | "High" | "Normal" | "Low";
  status: "Discovery" | "Planning" | "Active" | "Review" | "Completed" | "On Hold";
  health: "good" | "warn" | "danger" | "neutral";
  members: string[];
  owner: string;
  estimatedHours: number;
  category: string;
};

const INITIAL_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "ANSH Task — Core platform",
    description: "Building the core task management layout and real-time synchronization engine.",
    progress: 68,
    startDate: "2026-04-10",
    due: "2026-08-18",
    priority: "Urgent",
    status: "Active",
    health: "good",
    members: ["A", "L", "R"],
    owner: "Aisha Khan",
    estimatedHours: 420,
    category: "Engineering",
  },
  {
    id: "p2",
    name: "Enterprise rollout & SSO",
    description: "Implementing SAML/SSO authentication for enterprise clients.",
    progress: 41,
    startDate: "2026-05-01",
    due: "2026-09-02",
    priority: "High",
    status: "Review",
    health: "warn",
    members: ["M", "S"],
    owner: "Sam Rivera",
    estimatedHours: 180,
    category: "Security",
  },
  {
    id: "p3",
    name: "Brain board beta",
    description: "AI-assisted project mapping and automated tagging feature.",
    progress: 22,
    startDate: "2026-05-10",
    due: "2026-10-01",
    priority: "Normal",
    status: "Discovery",
    health: "neutral",
    members: ["J", "K", "Y", "V"],
    owner: "Priya Sharma",
    estimatedHours: 350,
    category: "Product",
  },
  {
    id: "p4",
    name: "Billing System Migration",
    description: "Migrating from Stripe legacy API to the new unified checkout.",
    progress: 5,
    startDate: "2026-05-15",
    due: "2026-11-15",
    priority: "High",
    status: "Planning",
    health: "good",
    members: ["A", "J"],
    owner: "Aisha Khan",
    estimatedHours: 120,
    category: "Operations",
  },
  {
    id: "p5",
    name: "Mobile App Re-architecture",
    description: "Complete rewrite of the React Native app for better memory profiling.",
    progress: 89,
    startDate: "2026-03-01",
    due: "2026-07-30",
    priority: "Urgent",
    status: "Active",
    health: "danger",
    members: ["L", "S", "K"],
    owner: "Leo Park",
    estimatedHours: 600,
    category: "Engineering",
  },
];

const STATUSES = ["All", "Discovery", "Planning", "Active", "Review", "Completed", "On Hold"] as const;
const PRIORITIES = ["All", "Urgent", "High", "Normal", "Low"] as const;
const HEALTHS = ["good", "warn", "danger", "neutral"] as const;
const CATEGORIES = ["Engineering", "Design", "Product", "Operations", "Security", "Marketing", "Sales"] as const;

const AVAILABLE_USERS = [
  { name: "Aisha Khan", initial: "A" },
  { name: "Leo Park", initial: "L" },
  { name: "Sam Rivera", initial: "R" },
  { name: "Marcus Vance", initial: "M" },
  { name: "Priya Sharma", initial: "P" },
  { name: "Yuki Tanaka", initial: "Y" },
  { name: "David Chen", initial: "D" },
  { name: "Chloe Dupont", initial: "C" },
];

function healthDot(health: string) {
  if (health === "good") return "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]";
  if (health === "warn") return "bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.28)]";
  if (health === "danger") return "bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.25)]";
  return "bg-zinc-300 shadow-[0_0_0_4px_rgba(212,212,216,0.25)] dark:bg-zinc-500 dark:shadow-white/10";
}

function healthText(health: string) {
  if (health === "good") return "On Track";
  if (health === "warn") return "At Risk";
  if (health === "danger") return "Off Track";
  return "Neutral";
}

function priorityColor(priority: string) {
  switch (priority) {
    case "Urgent": return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50";
    case "High": return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50";
    case "Normal": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50";
    case "Low": return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50";
    default: return "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusStyle(status: string) {
  switch (status) {
    case "Discovery":
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/40";
    case "Planning":
      return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900/40";
    case "Active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40";
    case "Review":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40";
    case "Completed":
      return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-350 dark:border-teal-900/40";
    case "On Hold":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40";
    default:
      return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
  }
}

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  colorDot?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: any) => void;
  options: readonly SelectOption[] | SelectOption[];
  placeholder?: string;
  className?: string;
}

function CustomSelect({ value, onChange, options, placeholder = "Select...", className = "" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-750 outline-none hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/80 transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.colorDot && (
            <span className={`h-2 w-2 rounded-full ${selectedOption.colorDot}`} />
          )}
          {selectedOption?.icon && (
            <span className="text-zinc-400 dark:text-zinc-500 shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDownIcon className={`h-3.5 w-3.5 text-zinc-450 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 z-40 mt-1 max-h-60 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#121418] scrollbar-thin min-w-[160px]"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-left transition-colors ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "text-zinc-650 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.colorDot && (
                      <span className={`h-2 w-2 rounded-full ${opt.colorDot}`} />
                    )}
                    {opt.icon && (
                      <span className="text-zinc-400 dark:text-zinc-500 shrink-0">{opt.icon}</span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <CheckIcon className="h-3.5 w-3.5 stroke-[2.5]" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function statusColorDot(status: string) {
  switch (status) {
    case "Discovery": return "bg-purple-500";
    case "Planning": return "bg-sky-550";
    case "Active": return "bg-emerald-500";
    case "Review": return "bg-amber-400";
    case "Completed": return "bg-teal-500";
    case "On Hold": return "bg-rose-500";
    default: return "bg-zinc-400";
  }
}

function priorityColorDot(priority: string) {
  switch (priority) {
    case "Urgent": return "bg-rose-500";
    case "High": return "bg-amber-400";
    case "Normal": return "bg-blue-500";
    case "Low": return "bg-emerald-500";
    default: return "bg-zinc-400";
  }
}

function healthColorDot(health: string) {
  switch (health) {
    case "good": return "bg-emerald-500";
    case "warn": return "bg-amber-400";
    case "danger": return "bg-rose-500";
    default: return "bg-zinc-350";
  }
}

export function ProjectsListView() {
  const { showToast } = useToast();
  const layoutId = useId();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number>(1);
  
  // View & Filter State
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  
  // Drawer & Modal States
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Edit Drawer Form States
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const [tempCategory, setTempCategory] = useState("");
  const [tempOwner, setTempOwner] = useState("");
  const [tempStatus, setTempStatus] = useState<Project["status"]>("Discovery");
  const [tempPriority, setTempPriority] = useState<Project["priority"]>("Normal");
  const [tempHealth, setTempHealth] = useState<Project["health"]>("good");
  const [tempEstimatedHours, setTempEstimatedHours] = useState(0);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempDue, setTempDue] = useState("");
  const [tempMembers, setTempMembers] = useState<string[]>([]);
  const [tempProgress, setTempProgress] = useState(0);

  // Tabbed Drawer States
  const [activeTab, setActiveTab] = useState<"details" | "tasks">("details");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);

  const fetchProjectTasks = async (projectId: string) => {
    setTasksLoading(true);
    try {
      const res = await fetch(`/api/project/tasks?projectId=${projectId}`);
      const json = await res.json();
      if (json.success) {
        setProjectTasks(json.tasks);
      }
    } catch (err) {
      console.error("Error fetching project tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      setTempName(selectedProject.name);
      setTempDescription(selectedProject.description || "");
      setTempCategory(selectedProject.category);
      setTempOwner(selectedProject.owner);
      setTempStatus(selectedProject.status);
      setTempPriority(selectedProject.priority);
      setTempHealth(selectedProject.health);
      setTempEstimatedHours(selectedProject.estimatedHours);
      setTempStartDate(selectedProject.startDate);
      setTempDue(selectedProject.due);
      setTempMembers(selectedProject.members);
      setTempProgress(selectedProject.progress);
      setIsEditing(false); // Default to read-only when opening
      setActiveTab("details");
      fetchProjectTasks(selectedProject.id);
    } else {
      setProjectTasks([]);
    }
  }, [selectedProject]);

  const handleSaveDrawerEdits = async () => {
    if (!selectedProject) return;
    if (!tempName.trim()) {
      showToast("Project name cannot be empty", "error");
      return;
    }

    const updates: Partial<Project> = {
      name: tempName.trim(),
      description: tempDescription.trim(),
      category: tempCategory,
      owner: tempOwner,
      status: tempStatus,
      priority: tempPriority,
      health: tempHealth,
      estimatedHours: tempEstimatedHours,
      startDate: tempStartDate,
      due: tempDue,
      members: tempMembers,
    };

    await handleUpdateProject(selectedProject.id, updates);
    setIsEditing(false);
    showToast("Project changes saved successfully!", "success");
  };

  const handleAddTask = async (payload: NewTaskPayload) => {
    setIsAddingTask(true);
    try {
      const effectiveProjectId = payload.projectId ?? (selectedProject?.id ?? null);
      const res = await fetch("/api/project/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          projectId: effectiveProjectId,
          workspaceId: activeWorkspaceId,
          priority: payload.priority,
          status: payload.status,
          assignee: payload.assignees.length > 0 ? payload.assignees[0] : "Unassigned",
          assignees: payload.assignees,
          due: payload.dueLabel,
          labels: payload.labels,
          estimate: payload.estimate,
          category: payload.category,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Task "${payload.title}" created successfully!`, "success");
        // Refresh tasks panel if this task belongs to the open project
        if (selectedProject && effectiveProjectId === selectedProject.id) {
          await fetchProjectTasks(selectedProject.id);
        }
      } else {
        showToast(json.error || "Failed to add task", "error");
      }
    } catch (err) {
      console.error("Error adding task:", err);
      showToast("Error adding task.", "error");
    } finally {
      setIsAddingTask(false);
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // New Project Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Engineering");
  const [owner, setOwner] = useState<string>("Aisha Khan");
  const [startDate, setStartDate] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<Project["priority"]>("Normal");
  const [status, setStatus] = useState<Project["status"]>("Discovery");
  const [health, setHealth] = useState<Project["health"]>("good");
  const [estimatedHours, setEstimatedHours] = useState("80");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [availableUsers, setAvailableUsers] = useState<{ name: string; initial: string }[]>(AVAILABLE_USERS);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);

  const fetchProjects = async (wid: number, email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/project?wid=${wid}&email=${encodeURIComponent(email)}`);
      const json = await res.json();
      if (json.success) {
        const mapped = json.projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          progress: p.progress,
          startDate: p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "",
          due: p.due ? new Date(p.due).toISOString().split("T")[0] : "",
          priority: p.priority,
          status: p.status,
          health: p.health,
          members: p.members,
          owner: p.owner,
          estimatedHours: p.estimatedHours,
          category: p.category,
        }));
        setProjects(mapped);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const email = user?.email || "";
        const onboardingWid = sessionStorage.getItem("ansh_onboarding_wid");
        const wid = onboardingWid ? parseInt(onboardingWid, 10) : 1;
        
        setActiveWorkspaceId(wid);
        await fetchProjects(wid, email);
        
        const res = await fetch(`/api/team?email=${encodeURIComponent(email)}&wid=${wid}`);
        const json = await res.json();
        if (json.success && json.members) {
          const mapped = json.members.map((u: any) => {
            const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email.split("@")[0];
            const initial = (u.firstName ? u.firstName[0] : (u.lastName ? u.lastName[0] : u.email[0])).toUpperCase();
            return { name, initial };
          });
          if (mapped.length > 0) {
            setAvailableUsers(mapped);
            if (!mapped.some((u: { name: string; initial: string }) => u.name === owner)) {
              setOwner(mapped[0].name);
            }
          }
        }
      } catch (err) {
        console.error("Error loading team in projects page:", err);
      }
    };

    init();
  }, []);

  // Esc key to close drawer
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedProject(null);
        setIsAddModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Filter Logic
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || p.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statusFilterOptions = STATUSES.map((s) => ({
    value: s,
    label: s === "All" ? "All Statuses" : s,
    colorDot: s === "All" ? undefined : statusColorDot(s)
  }));

  const categoryOptions = CATEGORIES.map((cat) => ({ value: cat, label: cat }));
  
  const leadOptions = availableUsers.map((user) => ({
    value: user.name,
    label: user.name,
    icon: (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-150 text-[8px] font-black text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
        {user.initial}
      </span>
    )
  }));

  const statusOptions = STATUSES.filter(s => s !== "All").map((s) => ({
    value: s,
    label: s,
    colorDot: statusColorDot(s)
  }));

  const priorityOptions = PRIORITIES.filter(p => p !== "All").map((p) => ({
    value: p,
    label: p,
    colorDot: priorityColorDot(p)
  }));

  const healthOptions = HEALTHS.map((h) => ({
    value: h,
    label: healthText(h),
    colorDot: healthColorDot(h)
  }));

  const handleUpdateProject = async (id: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    if (selectedProject?.id === id) {
      setSelectedProject((prev) => (prev ? { ...prev, ...updates } : null));
    }
    
    const updateKeys = Object.keys(updates);
    if (updateKeys.length > 0 && !updateKeys.includes("name") && !updateKeys.includes("description")) {
      const key = updateKeys[0];
      const val = updates[key as keyof Partial<Project>];
      showToast(`Project updated: ${key} set to ${val}`, "info");
    }

    try {
      const res = await fetch("/api/project", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const json = await res.json();
      if (!json.success) {
        showToast(json.error || "Failed to save update to database", "error");
      }
    } catch (err) {
      console.error("Error updating project:", err);
      showToast("Error updating project in database.", "error");
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || "No description provided.",
          category,
          owner,
          startDate: startDate || new Date().toISOString().split("T")[0],
          due: due || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          priority,
          status,
          health,
          estimatedHours: parseInt(estimatedHours) || 80,
          members: selectedMembers,
          workspaceId: activeWorkspaceId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Project "${name.trim()}" created successfully!`, "success");
        const { data: { user } } = await supabase.auth.getUser();
        await fetchProjects(activeWorkspaceId, user?.email || "");
        
        // Reset Form
        setName("");
        setDescription("");
        setCategory("Engineering");
        setOwner(availableUsers[0]?.name || "Aisha Khan");
        setStartDate("");
        setDue("");
        setPriority("Normal");
        setStatus("Discovery");
        setHealth("good");
        setEstimatedHours("80");
        setSelectedMembers([]);
        setIsTeamDropdownOpen(false);
        setIsAddModalOpen(false);
      } else {
        showToast(json.error || "Failed to create project", "error");
      }
    } catch (err) {
      console.error("Error creating project:", err);
      showToast("An error occurred while creating project.", "error");
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/project?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("Project deleted successfully.", "success");
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setSelectedProject(null);
      } else {
        showToast(json.error || "Failed to delete project", "error");
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      showToast("An error occurred while deleting the project.", "error");
    }
  };

  const toggleMemberSelection = (name: string) => {
    setSelectedMembers((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    );
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.75rem)] w-full items-center justify-center bg-transparent dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <span className="text-sm font-semibold text-zinc-500">Loading projects portfolio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.75rem)] w-full flex-col overflow-hidden bg-transparent dark:bg-zinc-950">
      
      {/* HEADER & FILTERS BAR */}
      <div className="shrink-0 border-b border-zinc-200/80 bg-white px-6 py-4 dark:border-white/[0.06] dark:bg-zinc-950/80 backdrop-blur-sm z-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
              <FolderIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Portfolio Overview
              </h1>
              <p className="text-[11px] font-medium text-zinc-500">
                {filteredProjects.length} active projects
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative group">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-[var(--app-primary)] transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="h-9 w-48 rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs outline-none transition-all focus:border-[var(--app-primary)] focus:bg-white focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-950"
              />
            </div>
            
            {/* Status Filter */}
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusFilterOptions}
              className="w-36"
            />

            {/* View Toggle */}
            <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100/50 p-0.5 dark:border-white/10 dark:bg-zinc-900/50">
              <button
                onClick={() => setViewMode("cards")}
                className={`relative flex h-8 items-center gap-2 rounded-md px-3 text-xs font-bold transition-colors ${
                  viewMode === "cards" ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {viewMode === "cards" && (
                  <motion.div layoutId={`viewToggle-${layoutId}`} className="absolute inset-0 rounded-md bg-white shadow-sm dark:bg-zinc-800" />
                )}
                <Squares2X2Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">Cards</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`relative flex h-8 items-center gap-2 rounded-md px-3 text-xs font-bold transition-colors ${
                  viewMode === "table" ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {viewMode === "table" && (
                  <motion.div layoutId={`viewToggle-${layoutId}`} className="absolute inset-0 rounded-md bg-white shadow-sm dark:bg-zinc-800" />
                )}
                <TableCellsIcon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">Table</span>
              </button>
            </div>

            {/* Add Project Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex h-9 items-center gap-2 rounded-lg bg-[var(--app-primary)] px-3 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <PlusIcon className="h-4 w-4" />
              Add Project
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {filteredProjects.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
              <FolderIcon className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-zinc-900 dark:text-zinc-100">No projects found</h3>
            <p className="mt-1 text-xs text-zinc-500">Create a new project to get started.</p>
          </div>
        ) : viewMode === "cards" ? (
          /* CARD GRID VIEW */
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filteredProjects.map((p) => (
              <motion.div
                layoutId={`project-card-${p.id}`}
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className="group relative flex cursor-pointer flex-col rounded-[20px] border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:border-white/10 dark:bg-zinc-900/60 dark:hover:border-white/20 dark:hover:shadow-black/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-1">
                      {p.category}
                    </span>
                    <h2 className="truncate font-heading text-[15px] font-extrabold text-zinc-900 dark:text-zinc-50">
                      {p.name}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-relaxed text-zinc-400 dark:text-zinc-500">
                      {p.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${healthDot(p.health)}`} title={`Health: ${healthText(p.health)}`} />
                    
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === p.id ? null : p.id);
                        }}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        title="Project Options"
                      >
                        <EllipsisVerticalIcon className="h-4.5 w-4.5" />
                      </button>
                      
                      <AnimatePresence>
                        {activeMenuId === p.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            className="absolute right-0 mt-1 z-30 w-32 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900 text-left"
                          >
                            <button
                              onClick={() => {
                                setSelectedProject(p);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                              <EyeIcon className="h-4 w-4 text-zinc-400" />
                              Preview
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProject(p);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                              <PencilSquareIcon className="h-4 w-4 text-zinc-400" />
                              Edit
                            </button>
                            <div className="my-1 border-t border-zinc-100 dark:border-white/5" />
                            <button
                              onClick={() => {
                                setProjectToDelete(p);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            >
                              <TrashIcon className="h-4 w-4 text-rose-500" />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${priorityColor(p.priority)}`}>
                    {p.priority}
                  </span>
                  <span className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusStyle(p.status)}`}>
                    {p.status}
                  </span>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[9px] font-bold text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400 ml-auto">
                    {p.estimatedHours} hrs
                  </span>
                </div>
                
                <div className="mt-auto pt-5">
                  <div className="mb-3 flex justify-between text-[11px] font-bold text-zinc-400">
                    <span>Progress</span>
                    <span className="text-zinc-700 dark:text-zinc-300">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
                
                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-white/[0.06]">
                  <div className="flex -space-x-1.5">
                    {p.members.map((m, idx) => {
                      const user = availableUsers.find((u) => u.name === m);
                      const initial = user ? user.initial : (m[0]?.toUpperCase() || "");
                      return (
                        <div
                          key={idx}
                          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-zinc-200 text-[9px] font-bold text-zinc-700 dark:border-zinc-900 dark:bg-zinc-700 dark:text-zinc-200 shadow-sm"
                          title={m}
                        >
                          {initial}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {formatDate(p.due)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                <thead className="border-b border-zinc-200 bg-zinc-50/50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:border-white/10 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Project Name</th>
                    <th className="px-5 py-4 font-semibold">Category</th>
                    <th className="px-5 py-4 font-semibold">Owner</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Priority</th>
                    <th className="px-5 py-4 font-semibold">Progress</th>
                    <th className="px-5 py-4 font-semibold">Timeline</th>
                    <th className="px-5 py-4 font-semibold text-right">Team</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                  {filteredProjects.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProject(p)}
                      className="group cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${healthDot(p.health)}`} />
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-indigo-500">
                        {p.category}
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {p.owner}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyle(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityColor(p.priority)}`}>
                          {p.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${p.progress}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-zinc-500">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                        {formatDate(p.startDate)} - {formatDate(p.due)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end -space-x-1.5">
                          {p.members.map((m, idx) => {
                            const user = availableUsers.find((u) => u.name === m);
                            const initial = user ? user.initial : (m[0]?.toUpperCase() || "");
                            return (
                              <div
                                key={idx}
                                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-zinc-200 text-[9px] font-bold text-zinc-700 dark:border-zinc-900 dark:bg-zinc-700 dark:text-zinc-200"
                                title={m}
                              >
                                {initial}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR DRAWER (Details Panel) */}
      <AnimatePresence>
        {selectedProject && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 z-40 bg-zinc-900/20 backdrop-blur-sm dark:bg-black/40"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.5 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="absolute right-0 top-0 z-50 flex h-full w-[460px] flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#121418]"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${healthDot(isEditing ? tempHealth : selectedProject.health)}`} />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Project Settings & Details
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className={`rounded-lg p-1.5 transition-colors ${
                      isEditing 
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400" 
                        : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    }`}
                    title={isEditing ? "Viewing Mode" : "Edit Project"}
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(selectedProject)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-455 transition-colors"
                    title="Delete Project"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                  <div className="h-4 w-[1px] bg-zinc-200 dark:bg-white/10 mx-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProject(null);
                      setIsEditing(false);
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex border-b border-zinc-100 px-6 dark:border-white/5 bg-zinc-50/50 dark:bg-[#121418] shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className={`relative py-3 text-xs font-bold transition-all border-b-2 px-1 ${
                    activeTab === "details"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-405 font-black"
                      : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  Project Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("tasks")}
                  className={`relative py-3 text-xs font-bold transition-all border-b-2 px-1 ml-6 ${
                    activeTab === "tasks"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-405 font-black"
                      : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  Tasks ({projectTasks.length})
                </button>
              </div>

              {/* Drawer Content - Details Tab */}
              {activeTab === "details" && (
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-4">
                  
                  {/* Project Name */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-550 uppercase tracking-wide">
                      <FolderIcon className="h-4 w-4 text-zinc-400" />
                      Project Name
                    </div>
                    {isEditing ? (
                      <div className="flex flex-col items-end gap-1">
                        <input
                          value={tempName}
                          maxLength={80}
                          onChange={(e) => setTempName(e.target.value)}
                          placeholder="Project Name"
                          className="w-48 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800 outline-none transition-all dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 pr-1">{tempName.length}/80</span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250 truncate max-w-[200px]" title={selectedProject.name}>
                        {selectedProject.name}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-550 uppercase tracking-wide">
                      <DocumentTextIcon className="h-4 w-4 text-zinc-400" />
                      Description
                    </div>
                    {isEditing ? (
                      <div className="flex flex-col items-end gap-1 w-full">
                        <textarea
                          value={tempDescription}
                          maxLength={300}
                          onChange={(e) => setTempDescription(e.target.value)}
                          rows={3}
                          placeholder="Project Description"
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 outline-none transition-all dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-250 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                        />
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-555 pr-1">{tempDescription.length}/300</span>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs leading-relaxed text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 shadow-inner">
                        {selectedProject.description || (
                          <span className="italic text-zinc-400 dark:text-zinc-655">No description provided.</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="my-4 border-t border-zinc-150 dark:border-white/5" />

                  <div className="space-y-4 pt-1">
                    {/* Category */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-550 uppercase tracking-wide">
                        <TagIcon className="h-4 w-4 text-zinc-400" />
                        Category
                      </div>
                      {isEditing ? (
                        <CustomSelect
                          value={tempCategory}
                          onChange={setTempCategory}
                          options={categoryOptions}
                          className="w-48"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50/80 px-2.5 py-1 text-xs font-bold text-indigo-650 border border-indigo-100/50 dark:bg-indigo-950/30 dark:text-indigo-350 dark:border-indigo-900/30">
                          {selectedProject.category}
                        </span>
                      )}
                    </div>

                    {/* Owner */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-550 uppercase tracking-wide">
                        <UserIcon className="h-4 w-4 text-zinc-400" />
                        Project Lead
                      </div>
                      {isEditing ? (
                        <CustomSelect
                          value={tempOwner}
                          onChange={setTempOwner}
                          options={leadOptions}
                          className="w-48"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-750 dark:bg-indigo-950/60 dark:text-indigo-300">
                            {selectedProject.owner ? selectedProject.owner.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : "A"}
                          </div>
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{selectedProject.owner}</span>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-555 uppercase tracking-wide">
                        <ChartBarIcon className="h-4 w-4 text-zinc-400" />
                        Status
                      </div>
                      {isEditing ? (
                        <CustomSelect
                          value={tempStatus}
                          onChange={setTempStatus}
                          options={statusOptions}
                          className="w-48"
                        />
                      ) : (
                        <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${statusStyle(selectedProject.status)}`}>
                          {selectedProject.status}
                        </span>
                      )}
                    </div>

                    {/* Priority */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-555 uppercase tracking-wide">
                        <Squares2X2Icon className="h-4 w-4 text-zinc-400" />
                        Priority
                      </div>
                      {isEditing ? (
                        <CustomSelect
                          value={tempPriority}
                          onChange={setTempPriority}
                          options={priorityOptions}
                          className="w-48"
                        />
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${priorityColor(selectedProject.priority)}`}>
                          {selectedProject.priority}
                        </span>
                      )}
                    </div>

                    {/* Health */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-555 uppercase tracking-wide">
                        <HeartIcon className="h-4 w-4 text-zinc-400" />
                        Health Index
                      </div>
                      {isEditing ? (
                        <CustomSelect
                          value={tempHealth}
                          onChange={setTempHealth}
                          options={healthOptions}
                          className="w-48"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-zinc-50 px-2.5 py-1 text-xs font-bold text-zinc-700 border border-zinc-200/50 dark:bg-zinc-900 dark:text-zinc-300 dark:border-white/5">
                          <span className={`h-2.5 w-2.5 rounded-full ${healthDot(selectedProject.health)}`} />
                          {healthText(selectedProject.health)}
                        </span>
                      )}
                    </div>

                    {/* Estimated Hours */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-555 uppercase tracking-wide">
                        <CurrencyDollarIcon className="h-4 w-4 text-zinc-400" />
                        Allocated Workload
                      </div>
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={tempEstimatedHours}
                            onChange={(e) => setTempEstimatedHours(parseInt(e.target.value) || 0)}
                            className="w-20 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-center text-xs font-bold text-zinc-700 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
                          />
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">hrs</span>
                        </div>
                      ) : (
                        <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100 bg-zinc-50 border border-zinc-200/50 dark:bg-zinc-900 dark:border-white/5 px-2.5 py-1 rounded-lg">
                          {selectedProject.estimatedHours} <span className="text-[10px] text-zinc-450 font-bold uppercase ml-0.5">hrs</span>
                        </span>
                      )}
                    </div>

                    {/* Start Date & Target Due Date */}
                    {isEditing ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-555 uppercase tracking-wide">
                            <CalendarDaysIcon className="h-4 w-4 text-zinc-400" />
                            Start Date
                          </div>
                          <input
                            type="date"
                            value={tempStartDate}
                            onChange={(e) => setTempStartDate(e.target.value)}
                            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-750 outline-none transition-all dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 focus:border-indigo-500"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-555 uppercase tracking-wide">
                            <ClockIcon className="h-4 w-4 text-zinc-400" />
                            Target Due Date
                          </div>
                          <input
                            type="date"
                            value={tempDue}
                            onChange={(e) => setTempDue(e.target.value)}
                            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-750 outline-none transition-all dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 focus:border-indigo-500"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-555 uppercase tracking-wide">
                          <CalendarDaysIcon className="h-4 w-4 text-zinc-400" />
                          Timeline
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          <span>{formatDate(selectedProject.startDate)}</span>
                          <span className="text-zinc-400 dark:text-zinc-650">—</span>
                          <span>{formatDate(selectedProject.due)}</span>
                        </div>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-550 uppercase tracking-wide">
                          Completion Status
                        </div>
                        <span className="text-xs font-extrabold text-indigo-500">
                          {selectedProject.progress}%
                        </span>
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-zinc-150 dark:bg-zinc-800 overflow-hidden shadow-inner">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                          style={{ width: `${selectedProject.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Members list update */}
                    <div className="pt-4 border-t border-zinc-100 dark:border-white/5">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-555 uppercase tracking-wide mb-3">
                        <UserGroupIcon className="h-4 w-4 text-zinc-400" />
                        Project Team contributors
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(isEditing ? tempMembers : selectedProject.members).map((m, idx) => {
                          const user = availableUsers.find((u) => u.name === m);
                          const initial = user ? user.initial : (m[0]?.toUpperCase() || "");
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (!isEditing) return;
                                setTempMembers((prev) => prev.filter((x) => x !== m));
                              }}
                              className={`flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-black text-indigo-600 transition-colors shadow-sm ${
                                isEditing 
                                  ? "cursor-pointer hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-350" 
                                  : "cursor-default"
                              } dark:bg-indigo-950/30 dark:text-indigo-300`}
                              title={isEditing ? `Click to remove ${m} from project` : m}
                            >
                              {initial}
                            </div>
                          );
                        })}
                        
                        {/* Quick drop contributors */}
                        {isEditing && availableUsers.map((user) => {
                          if (tempMembers.includes(user.name)) return null;
                          return (
                            <button
                              key={user.name}
                              type="button"
                              onClick={() => setTempMembers((prev) => [...prev, user.name])}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-zinc-300 text-zinc-400 hover:border-indigo-500 hover:bg-indigo-50/50 hover:text-indigo-600 dark:border-zinc-700 dark:hover:bg-zinc-800/50 text-[10px] font-bold"
                              title={`Add ${user.name}`}
                            >
                              +{user.initial}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Drawer Content - Tasks Tab */}
              {activeTab === "tasks" && (
                <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">

                  {/* Tasks Tab Header with Add Button */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {projectTasks.length} task{projectTasks.length !== 1 ? "s" : ""}
                      </span>
                      {selectedProject && (
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 uppercase tracking-wider">
                          {selectedProject.name}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddTaskModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-indigo-600 active:scale-95 transition-all"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      Add Task
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="flex-1 overflow-y-auto p-4 scrollbar-thin space-y-2">
                    {tasksLoading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                        <span className="mt-3 text-[11px] font-semibold text-zinc-400">Loading project tasks...</span>
                      </div>
                    ) : projectTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center py-16">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 mb-3">
                          <CheckIcon className="h-6 w-6 text-zinc-350 dark:text-zinc-600" />
                        </div>
                        <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No tasks yet</h4>
                        <p className="mt-1 text-[11px] text-zinc-450 dark:text-zinc-550 max-w-[200px]">Click "Add Task" to build the project backlog.</p>
                        <button
                          type="button"
                          onClick={() => setIsAddTaskModalOpen(true)}
                          className="mt-4 flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                          Add first task
                        </button>
                      </div>
                    ) : (
                      projectTasks.map((task) => {
                        const priorityStyle =
                          task.priority === "high"
                            ? { badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30", dot: "bg-rose-500" }
                            : task.priority === "medium"
                            ? { badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30", dot: "bg-amber-400" }
                            : { badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30", dot: "bg-emerald-500" };

                        const statusStyle =
                          task.status === "done"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                            : task.status === "in_progress"
                            ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30"
                            : task.status === "blocked"
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
                            : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700";

                        const statusLabel =
                          task.status === "in_progress" ? "In Progress" :
                          task.status === "blocked" ? "Blocked" :
                          task.status === "done" ? "Done" : "To Do";

                        const assigneeInitials = task.assignee && task.assignee !== "Unassigned"
                          ? task.assignee.trim().split(/\s+/).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                          : null;

                        return (
                          <div
                            key={task.id}
                            className="group rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-sm dark:border-white/[0.06] dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-white/10 transition-all"
                          >
                            {/* Top row: status dot + title + priority badge */}
                            <div className="flex items-start gap-2.5">
                              <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${priorityStyle.dot}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-150 leading-snug truncate">
                                  {task.title}
                                </p>
                                {task.description && (
                                  <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-450 dark:text-zinc-550 line-clamp-1">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${priorityStyle.badge}`}>
                                {task.priority}
                              </span>
                            </div>

                            {/* Bottom row: status + assignee + due */}
                            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusStyle}`}>
                                {statusLabel}
                              </span>

                              {task.projectId && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-500 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400">
                                  <FolderIcon className="h-2.5 w-2.5" />
                                  {selectedProject?.name || task.projectId}
                                </span>
                              )}

                              <div className="flex items-center gap-2 ml-auto">
                                {task.assignees && task.assignees.length > 0 ? (
                                  <div className="flex -space-x-1 overflow-hidden">
                                    {task.assignees.slice(0, 3).map((a: string) => {
                                      const initials = a === "Unassigned" ? "??" : a.trim().split(/\s+/).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                                      return (
                                        <div key={a} className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[7px] font-black text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 ring-1 ring-white dark:ring-zinc-900 shrink-0" title={a}>
                                          {initials}
                                        </div>
                                      );
                                    })}
                                    {task.assignees.length > 3 && (
                                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[7px] font-bold text-zinc-650 dark:bg-zinc-800 dark:text-zinc-450 ring-1 ring-white dark:ring-zinc-900 shrink-0">
                                        +{task.assignees.length - 3}
                                      </div>
                                    )}
                                  </div>
                                ) : assigneeInitials ? (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[8px] font-black text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300" title={task.assignee}>
                                    {assigneeInitials}
                                  </div>
                                ) : (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800" title="Unassigned">
                                    <UserIcon className="h-2.5 w-2.5 text-zinc-400" />
                                  </div>
                                )}
                                {task.due && task.due !== "No date" && (
                                  <div className="flex items-center gap-1 text-[10px] font-semibold text-zinc-450 dark:text-zinc-500">
                                    <CalendarDaysIcon className="h-3 w-3" />
                                    <span>{task.due}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Labels row */}
                            {task.labels && Array.isArray(task.labels) && task.labels.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {task.labels.map((label: string) => (
                                  <span key={label} className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                    {label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Drawer Footer / Save Options */}
              {isEditing && activeTab === "details" && (
                <div className="shrink-0 border-t border-zinc-100 bg-zinc-50/60 px-6 py-4 dark:border-white/5 dark:bg-zinc-950/30 flex items-center justify-end gap-3 z-10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset values to saved state
                      setTempName(selectedProject.name);
                      setTempDescription(selectedProject.description || "");
                      setTempCategory(selectedProject.category);
                      setTempOwner(selectedProject.owner);
                      setTempStatus(selectedProject.status);
                      setTempPriority(selectedProject.priority);
                      setTempHealth(selectedProject.health);
                      setTempEstimatedHours(selectedProject.estimatedHours);
                      setTempStartDate(selectedProject.startDate);
                      setTempDue(selectedProject.due);
                      setTempMembers(selectedProject.members);
                      setTempProgress(selectedProject.progress);
                    }}
                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-650 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDrawerEdits}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-98 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ADD PROJECT MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 z-50 m-auto flex h-[90vh] max-h-[620px] w-full max-w-[500px] flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <FolderIcon className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Add New Project
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Form body */}
              <form onSubmit={handleAddProject} className="flex-1 overflow-y-auto pr-1 py-4 space-y-4 scrollbar-thin">
                
                 {/* Project Name */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-550">
                      Project Name
                    </label>
                    <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-550">{name.length}/80</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Q3 Website Redesign"
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-550">
                      Description
                    </label>
                    <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-550">{description.length}/300</span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe project objectives and scope..."
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 resize-none"
                  />
                </div>

                {/* Row: Category & Lead */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-550">
                      Category
                    </label>
                    <CustomSelect
                      value={category}
                      onChange={setCategory}
                      options={categoryOptions}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-555">
                      Project Lead
                    </label>
                    <CustomSelect
                      value={owner}
                      onChange={setOwner}
                      options={leadOptions}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Row: Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-555">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-2 block w-full cursor-pointer rounded-xl border border-zinc-200 px-3 py-2.5 text-xs text-zinc-700 outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-555">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                      className="mt-2 block w-full cursor-pointer rounded-xl border border-zinc-200 px-3 py-2.5 text-xs text-zinc-700 outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
                    />
                  </div>
                </div>

                {/* Row: Status & Priority */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-550">
                      Status
                    </label>
                    <CustomSelect
                      value={status}
                      onChange={setStatus}
                      options={statusOptions}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-550">
                      Priority
                    </label>
                    <CustomSelect
                      value={priority}
                      onChange={setPriority}
                      options={priorityOptions}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-550">
                      Health Index
                    </label>
                    <CustomSelect
                      value={health}
                      onChange={setHealth}
                      options={healthOptions}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Allocated Hours */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-550">
                    Allocated workload budget (Estimated Hours)
                  </label>
                  <input
                    type="number"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    placeholder="e.g. 120"
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Team contributors multi selector */}
                <div className="relative">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-550 mb-2">
                    Assign Team Members
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTeamDropdownOpen((prev) => !prev)}
                    className="flex min-h-[46px] w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-700 outline-none hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
                      <div className="flex flex-wrap gap-1.5 max-w-[90%] text-left">
                      {selectedMembers.length === 0 ? (
                        <span className="text-zinc-400">Select team members...</span>
                      ) : (
                        selectedMembers.map((name) => {
                          const user = availableUsers.find((u) => u.name === name);
                          const initial = user ? user.initial : (name[0]?.toUpperCase() || "");
                          return (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-500/20 dark:text-indigo-200"
                            >
                              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-200/50 text-[7px] font-black text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                                {initial}
                              </span>
                              {name}
                            </span>
                          );
                        })
                      )}
                    </div>
                    <ChevronDownIcon className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${isTeamDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
 
                  <AnimatePresence>
                    {isTeamDropdownOpen && (
                      <>
                        {/* Dropdown Backdrop to close on click outside */}
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setIsTeamDropdownOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          className="absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900 scrollbar-thin"
                        >
                          {availableUsers.map((user) => {
                            const isSelected = selectedMembers.includes(user.name);
                            return (
                              <button
                                key={user.name}
                                type="button"
                                onClick={() => toggleMemberSelection(user.name)}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold text-left transition-colors ${
                                  isSelected
                                    ? "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/50 dark:text-white"
                                    : "text-zinc-650 hover:bg-zinc-50/50 dark:text-zinc-400 dark:hover:bg-zinc-800/30"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[9px] font-black text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                    {user.initial}
                                  </span>
                                  <span>{user.name}</span>
                                </div>
                                <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                                  isSelected
                                    ? "border-[var(--app-primary)] bg-[var(--app-primary)] text-white"
                                    : "border-zinc-300 bg-white dark:border-zinc-750 dark:bg-zinc-900"
                                }`}>
                                  {isSelected && <CheckIcon className="h-3 w-3 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-white/5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 rounded-xl border border-zinc-200 py-3 text-xs font-bold text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-98 transition-all"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DELETE PROJECT CONFIRMATION MODAL */}
      <AnimatePresence>
        {projectToDelete && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProjectToDelete(null)}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 z-50 m-auto flex h-fit max-w-[400px] flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418] overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400 mb-4 shadow-sm">
                  <ExclamationTriangleIcon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Delete Project
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Are you sure you want to delete <span className="font-semibold text-zinc-700 dark:text-zinc-300">"{projectToDelete.name}"</span>? This will dissociate any linked tasks and cannot be undone.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setProjectToDelete(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-650 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = projectToDelete.id;
                    setProjectToDelete(null);
                    await handleDeleteProject(id);
                  }}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:scale-95 transition-all"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ADD TASK MODAL (project-scoped or standalone) */}
      <AddTaskModal
        open={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onCreate={handleAddTask}
        assignees={["Unassigned", ...availableUsers.map((u) => u.name)]}
        defaultProjectId={selectedProject?.id ?? null}
      />

    </div>
  );
}
