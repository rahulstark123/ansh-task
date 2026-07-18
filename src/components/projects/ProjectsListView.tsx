"use client";

import { useState, useId, useEffect, useRef, useMemo } from "react";
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
import {
  FREE_PLAN_PROJECTS_LIMIT,
  isUpgradeRequiredError,
} from "@/lib/plans";
import { useWorkspacePlan } from "@/lib/useWorkspacePlan";
import { AppMultiSelect } from "@/components/ui/AppMultiSelect";
import { AnshProjectCopilotModal, type GeneratedProject } from "@/components/copilot/AnshProjectCopilotModal";

function RobotIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 8V4M10 4h4" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M9 13h.01M15 13h.01" />
      <path d="M9 17h6" />
      <path d="M2 13h2M20 13h2" />
    </svg>
  );
}

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

const projectModalLabel =
  "text-[11px] font-medium text-zinc-600 dark:text-zinc-400";
const projectModalInput =
  "mt-1.5 block w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:border-[var(--app-primary)] focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100 dark:placeholder:text-zinc-500";

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
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-left transition-colors ${isSelected
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

function TruncateText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`block min-w-0 truncate ${className}`} title={text}>
      {text}
    </span>
  );
}

export function ProjectsListView() {
  const { showToast } = useToast();
  const { ready: planReady, isPro, guardPlanFeature } = useWorkspacePlan();
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
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [tableMenuPosition, setTableMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const closeProjectMenu = () => {
    setActiveMenuId(null);
    setTableMenuPosition(null);
  };

  const openTableProjectMenu = (projectId: string, button: HTMLButtonElement) => {
    if (activeMenuId === projectId) {
      closeProjectMenu();
      return;
    }

    const rect = button.getBoundingClientRect();
    const menuWidth = 128;
    const menuHeight = 130;
    const spaceBelow = window.innerHeight - rect.bottom;

    setActiveMenuId(projectId);
    setTableMenuPosition({
      top: spaceBelow >= menuHeight ? rect.bottom + 4 : rect.top - menuHeight - 4,
      left: Math.max(8, rect.right - menuWidth),
    });
  };

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
  const canCreateMoreProjects = isPro || projects.length < FREE_PLAN_PROJECTS_LIMIT;

  // AI Copilot state
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const handleProjectGenerated = (generated: GeneratedProject) => {
    // Pre-fill the Add Project form with AI-generated data
    setName(generated.name || "");
    setDescription(generated.description || "");
    if (["Engineering","Design","Marketing","Sales","Operations","HR","Finance","Product","Support","Research"].includes(generated.category)) {
      setCategory(generated.category as any);
    }
    if (["Discovery","Planning","Active","Review","Completed","On Hold"].includes(generated.status)) {
      setStatus(generated.status as any);
    }
    if (["Urgent","High","Normal","Low"].includes(generated.priority)) {
      setPriority(generated.priority as any);
    }
    if (["good","warn","danger","neutral"].includes(generated.health)) {
      setHealth(generated.health as any);
    }
    if (generated.estimatedHours) {
      setEstimatedHours(String(generated.estimatedHours));
    }
    setEditingProjectId(null);
    setIsAddModalOpen(true);
  };

  const enforceProjectLimit = () => {
    if (!planReady || canCreateMoreProjects) return true;
    return guardPlanFeature("projectsLimit");
  };

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

  useEffect(() => {
    if (activeTab === "tasks" && selectedProject?.id) {
      fetchProjectTasks(selectedProject.id);
    }
  }, [activeTab, selectedProject?.id]);

  const visibleProjectTasks = useMemo(() => {
    if (!selectedProject) return [];
    return projectTasks.filter((task) => task.projectId === selectedProject.id);
  }, [projectTasks, selectedProject]);

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
        setIsAddTaskModalOpen(false);
        if (selectedProject && effectiveProjectId === selectedProject.id) {
          await fetchProjectTasks(selectedProject.id);
        }
      } else {
        if (isUpgradeRequiredError(json)) {
          guardPlanFeature(json.feature || "tasksLimit", json.error);
          return;
        }
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
        closeProjectMenu();
        setSelectedProject(null);
        setIsAddModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    closeProjectMenu();
  }, [viewMode]);

  useEffect(() => {
    const scrollEl = tableScrollRef.current;
    if (!scrollEl || viewMode !== "table") return;

    const handleScroll = () => closeProjectMenu();
    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [viewMode, activeMenuId]);

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

  const memberOptions = availableUsers.map((user) => ({
    value: user.name,
    label: user.name,
    icon: (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[9px] font-black text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        {user.initial}
      </span>
    ),
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
      const apiPayload: Record<string, unknown> = { id, ...updates };
      if ("due" in updates) {
        apiPayload.due = updates.due ? updates.due : null;
      }
      if ("startDate" in updates) {
        apiPayload.startDate = updates.startDate ? updates.startDate : null;
      }

      const res = await fetch("/api/project", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
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

  const resetProjectForm = () => {
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
  };

  const openCreateProjectModal = () => {
    setEditingProjectId(null);
    resetProjectForm();
    setIsAddModalOpen(true);
  };

  const openEditProjectModal = (project: Project) => {
    setEditingProjectId(project.id);
    setName(project.name || "");
    setDescription(project.description || "");
    setCategory(project.category || "Engineering");
    setOwner(project.owner || availableUsers[0]?.name || "Aisha Khan");
    setStartDate(project.startDate || "");
    setDue(project.due || "");
    setPriority(project.priority || "Normal");
    setStatus(project.status || "Discovery");
    setHealth(project.health || "good");
    setEstimatedHours(String(project.estimatedHours || 80));
    setSelectedMembers(project.members || []);
    setIsAddModalOpen(true);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProjectId) {
      const updates: Partial<Project> = {
        name: name.trim(),
        description: description.trim() || "No description provided.",
        category,
        owner,
        startDate: startDate || undefined,
        due: due || undefined,
        priority,
        status,
        health,
        estimatedHours: parseInt(estimatedHours) || 80,
        members: selectedMembers,
      };
      await handleUpdateProject(editingProjectId, updates);
      showToast(`Project "${name.trim()}" updated successfully!`, "success");
      setEditingProjectId(null);
      resetProjectForm();
      setIsAddModalOpen(false);
      return;
    }

    if (!enforceProjectLimit()) return;

    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || "No description provided.",
          category,
          owner,
          startDate: startDate || undefined,
          due: due || undefined,
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
        resetProjectForm();
        setIsAddModalOpen(false);
      } else {
        if (isUpgradeRequiredError(json)) {
          guardPlanFeature(json.feature || "projectsLimit", json.error);
          return;
        }
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
                Projects Overview
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
                className={`relative flex h-8 items-center gap-2 rounded-md px-3 text-xs font-bold transition-colors ${viewMode === "cards" ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
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
                className={`relative flex h-8 items-center gap-2 rounded-md px-3 text-xs font-bold transition-colors ${viewMode === "table" ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
              >
                {viewMode === "table" && (
                  <motion.div layoutId={`viewToggle-${layoutId}`} className="absolute inset-0 rounded-md bg-white shadow-sm dark:bg-zinc-800" />
                )}
                <TableCellsIcon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">Table</span>
              </button>
            </div>

            {/* ANSH Copilot Button */}
            <button
              type="button"
              onClick={() => setIsCopilotOpen(true)}
              className="relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-lg bg-white px-3.5 text-xs font-bold text-zinc-800 shadow-sm transition-all hover:bg-stone-50/50 hover:scale-105 active:scale-95 dark:bg-zinc-900 dark:text-zinc-100 cursor-pointer border border-indigo-400/50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 animate-pulse" />
              <RobotIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span className="relative bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                ANSH Copilot
              </span>
            </button>

            {/* Add Project Button */}
            <button
              onClick={() => {
                if (!enforceProjectLimit()) return;
                openCreateProjectModal();
              }}
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
                          setTableMenuPosition(null);
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
                                closeProjectMenu();
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                              <EyeIcon className="h-4 w-4 text-zinc-400" />
                              Preview
                            </button>
                            <button
                              onClick={() => {
                                openEditProjectModal(p);
                                closeProjectMenu();
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
                                closeProjectMenu();
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
          <>
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/60">
              <div ref={tableScrollRef} className="overflow-x-auto">
                <table className="w-full table-fixed text-left text-sm text-zinc-600 dark:text-zinc-400 min-w-[960px]">
                  <thead className="border-b border-zinc-200 bg-zinc-50/50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:border-white/10 dark:bg-zinc-900/50">
                    <tr>
                      <th className="w-[22%] px-5 py-4 font-semibold">Project Name</th>
                      <th className="w-[11%] px-5 py-4 font-semibold">Category</th>
                      <th className="w-[10%] px-5 py-4 font-semibold">Owner</th>
                      <th className="w-[10%] px-5 py-4 font-semibold">Status</th>
                      <th className="w-[10%] px-5 py-4 font-semibold">Priority</th>
                      <th className="w-[12%] px-5 py-4 font-semibold">Progress</th>
                      <th className="w-[15%] px-5 py-4 font-semibold">Timeline</th>
                      <th className="w-[8%] px-5 py-4 font-semibold text-right">Team</th>
                      <th className="w-12 px-3 py-4 font-semibold text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                    {filteredProjects.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedProject(p)}
                        className="group cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.02]"
                      >
                        <td className="max-w-0 px-5 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${healthDot(p.health)}`} />
                            <TruncateText text={p.name} className="font-bold text-zinc-900 dark:text-zinc-100" />
                          </div>
                        </td>
                        <td className="max-w-0 px-5 py-3 text-xs font-semibold text-indigo-500">
                          <TruncateText text={p.category} />
                        </td>
                        <td className="max-w-0 px-5 py-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          <TruncateText text={p.owner} />
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex max-w-full truncate rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyle(p.status)}`} title={p.status}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex max-w-full truncate rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityColor(p.priority)}`} title={p.priority}>
                            {p.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${p.progress}%` }} />
                            </div>
                            <span className="shrink-0 text-[11px] font-bold text-zinc-500">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="max-w-0 px-5 py-3 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                          <TruncateText text={`${formatDate(p.startDate)} - ${formatDate(p.due)}`} />
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
                        <td
                          className="relative px-3 py-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openTableProjectMenu(p.id, e.currentTarget);
                            }}
                            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            title="Project options"
                          >
                            <EllipsisVerticalIcon className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <AnimatePresence>
              {activeMenuId && tableMenuPosition && (() => {
                const menuProject = filteredProjects.find((project) => project.id === activeMenuId);
                if (!menuProject) return null;

                return (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={closeProjectMenu}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      style={{ top: tableMenuPosition.top, left: tableMenuPosition.left }}
                      className="fixed z-50 w-32 rounded-xl border border-zinc-200 bg-white p-1.5 text-left shadow-xl dark:border-white/10 dark:bg-zinc-900"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProject(menuProject);
                          closeProjectMenu();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <EyeIcon className="h-4 w-4 text-zinc-400" />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          openEditProjectModal(menuProject);
                          closeProjectMenu();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <PencilSquareIcon className="h-4 w-4 text-zinc-400" />
                        Edit
                      </button>
                      <div className="my-1 border-t border-zinc-100 dark:border-white/5" />
                      <button
                        type="button"
                        onClick={() => {
                          setProjectToDelete(menuProject);
                          closeProjectMenu();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      >
                        <TrashIcon className="h-4 w-4 text-rose-500" />
                        Delete
                      </button>
                    </motion.div>
                  </>
                );
              })()}
            </AnimatePresence>
          </>
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
                    onClick={() => {
                      openEditProjectModal(selectedProject);
                      setSelectedProject(null);
                      setIsEditing(false);
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                    title="Edit Project"
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
              <div className="flex border-b border-zinc-100 px-6 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-950/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className={`relative py-3 text-xs font-bold transition-all border-b-2 px-1 ${activeTab === "details"
                      ? "border-[var(--app-primary)] text-[var(--app-primary)]"
                      : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    }`}
                >
                  Project Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("tasks")}
                  className={`relative py-3 text-xs font-bold transition-all border-b-2 px-1 ml-6 ${activeTab === "tasks"
                      ? "border-[var(--app-primary)] text-[var(--app-primary)]"
                      : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    }`}
                >
                  Tasks ({visibleProjectTasks.length})
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
                              className={`flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-black text-indigo-600 transition-colors shadow-sm ${isEditing
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
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                        {visibleProjectTasks.length} task{visibleProjectTasks.length !== 1 ? "s" : ""}
                      </span>
                      {selectedProject && (
                        <span className="max-w-[180px] truncate rounded-md border border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--app-primary-soft-text)]">
                          {selectedProject.name}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddTaskModalOpen(true)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--app-primary)] px-3 py-1.5 text-[11px] font-bold text-[var(--app-primary-foreground)] shadow-sm transition-all hover:bg-[var(--app-primary-hover)] active:scale-95"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      Add Task
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="flex-1 overflow-y-auto p-4 scrollbar-thin space-y-2">
                    {tasksLoading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--app-primary)] border-t-transparent" />
                        <span className="mt-3 text-[11px] font-semibold text-zinc-400">Loading project tasks...</span>
                      </div>
                    ) : visibleProjectTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center py-16">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 mb-3">
                          <CheckIcon className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-200">No tasks yet</h4>
                        <p className="mt-1 max-w-[200px] text-[11px] text-zinc-500 dark:text-zinc-400">Click &quot;Add Task&quot; to build the project backlog.</p>
                        <button
                          type="button"
                          onClick={() => setIsAddTaskModalOpen(true)}
                          className="mt-4 flex items-center gap-1.5 rounded-lg border border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)] px-3 py-1.5 text-[11px] font-bold text-[var(--app-primary)] transition-colors hover:opacity-90"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                          Add first task
                        </button>
                      </div>
                    ) : (
                      visibleProjectTasks.map((task) => {
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
                                : task.status === "on_hold"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                                  : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700";

                        const statusLabel =
                          task.status === "in_progress" ? "In Progress" :
                            task.status === "blocked" ? "Blocked" :
                              task.status === "on_hold" ? "On Hold" :
                                task.status === "done" ? "Done" : "To Do";

                        const assigneeInitials = task.assignee && task.assignee !== "Unassigned"
                          ? task.assignee.trim().split(/\s+/).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                          : null;

                        return (
                          <div
                            key={task.id}
                            className="group rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/80 hover:border-zinc-300 dark:hover:border-white/15 transition-all"
                          >
                            {/* Top row: status dot + title + priority badge */}
                            <div className="flex items-start gap-2.5">
                              <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${priorityStyle.dot}`} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[12px] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                                  {task.title}
                                </p>
                                {task.description && (
                                  <p className="mt-0.5 line-clamp-1 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
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

                              {selectedProject && (
                                <span className="inline-flex max-w-full items-center gap-1 truncate rounded-md border border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--app-primary-soft-text)]">
                                  <FolderIcon className="h-2.5 w-2.5 shrink-0" />
                                  <span className="truncate">{selectedProject.name}</span>
                                </span>
                              )}

                              <div className="flex items-center gap-2 ml-auto">
                                {task.assignees && task.assignees.length > 0 ? (
                                  <div className="flex -space-x-1 overflow-hidden">
                                    {task.assignees.slice(0, 3).map((a: string) => {
                                      const initials = a === "Unassigned" ? "??" : a.trim().split(/\s+/).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                                      return (
                                        <div key={a} className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--app-primary-soft)] text-[7px] font-black text-[var(--app-primary)] ring-1 ring-white dark:ring-zinc-900" title={a}>
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
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--app-primary-soft)] text-[8px] font-black text-[var(--app-primary)]" title={task.assignee}>
                                    {assigneeInitials}
                                  </div>
                                ) : (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800" title="Unassigned">
                                    <UserIcon className="h-2.5 w-2.5 text-zinc-400" />
                                  </div>
                                )}
                                {task.due && task.due !== "No date" && (
                                  <div className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
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
              className="fixed inset-0 z-50 m-auto flex h-[min(90vh,680px)] w-[calc(100%-2rem)] max-w-[560px] flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#121418]"
            >
              {/* Modal Header */}
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5 dark:border-white/5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--app-primary-soft)]">
                      <FolderIcon className="h-5 w-5 text-[var(--app-primary)]" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                        {editingProjectId ? "Edit Project" : "New Project"}
                      </h3>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {editingProjectId
                          ? "Update project details and team assignments."
                          : "Set up a project with timeline, status, and team."}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProjectId(null);
                    resetProjectForm();
                  }}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddProject} className="flex min-h-0 flex-1 flex-col">
                {/* Scrollable Form body */}
                <div className="flex-1 space-y-7 overflow-y-auto px-6 py-5 scrollbar-thin">
                  {/* Basics */}
                  <section className="space-y-4">
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                      Basics
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-baseline justify-between gap-3">
                          <label htmlFor="project-name" className={projectModalLabel}>
                            Project name
                          </label>
                          {name.length > 60 && (
                            <span className="shrink-0 text-[10px] text-zinc-400">{name.length}/80</span>
                          )}
                        </div>
                        <input
                          id="project-name"
                          type="text"
                          required
                          maxLength={80}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Q3 Website Redesign"
                          className={projectModalInput}
                        />
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between gap-3">
                          <label htmlFor="project-description" className={projectModalLabel}>
                            Description
                          </label>
                          {description.length > 240 && (
                            <span className="shrink-0 text-[10px] text-zinc-400">{description.length}/300</span>
                          )}
                        </div>
                        <textarea
                          id="project-description"
                          rows={3}
                          maxLength={300}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Briefly describe goals and scope..."
                          className={`${projectModalInput} resize-none leading-relaxed`}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Ownership & timeline */}
                  <section className="space-y-4 border-t border-zinc-100 pt-6 dark:border-white/5">
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                      Ownership & timeline
                    </h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={projectModalLabel}>Category</label>
                        <CustomSelect
                          value={category}
                          onChange={setCategory}
                          options={categoryOptions}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <label className={projectModalLabel}>Project lead</label>
                        <CustomSelect
                          value={owner}
                          onChange={setOwner}
                          options={leadOptions}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <label htmlFor="project-start-date" className={projectModalLabel}>
                          Start date
                        </label>
                        <input
                          id="project-start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className={`${projectModalInput} cursor-pointer`}
                        />
                      </div>
                      <div>
                        <label htmlFor="project-due-date" className={projectModalLabel}>
                          Due date <span className="font-normal text-zinc-400">(optional)</span>
                        </label>
                        <input
                          id="project-due-date"
                          type="date"
                          value={due}
                          onChange={(e) => setDue(e.target.value)}
                          className={`${projectModalInput} cursor-pointer`}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Status & workload */}
                  <section className="space-y-4 border-t border-zinc-100 pt-6 dark:border-white/5">
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                      Status & workload
                    </h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={projectModalLabel}>Status</label>
                        <CustomSelect
                          value={status}
                          onChange={setStatus}
                          options={statusOptions}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <label className={projectModalLabel}>Priority</label>
                        <CustomSelect
                          value={priority}
                          onChange={setPriority}
                          options={priorityOptions}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <label className={projectModalLabel}>Health</label>
                        <CustomSelect
                          value={health}
                          onChange={setHealth}
                          options={healthOptions}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <label htmlFor="project-hours" className={projectModalLabel}>
                          Estimated hours
                        </label>
                        <div className="relative mt-1.5">
                          <input
                            id="project-hours"
                            type="number"
                            min={0}
                            value={estimatedHours}
                            onChange={(e) => setEstimatedHours(e.target.value)}
                            placeholder="120"
                            className={`${projectModalInput} mt-0 pr-12`}
                          />
                          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
                            hrs
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Team */}
                  <section className="space-y-3 border-t border-zinc-100 pt-6 dark:border-white/5">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                        Team
                      </h4>
                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        Assign members who will work on this project.
                      </p>
                    </div>
                    <AppMultiSelect
                      value={selectedMembers}
                      onChange={setSelectedMembers}
                      options={memberOptions}
                      placeholder="Select team members..."
                      emptyMessage="No team members in this workspace"
                    />
                  </section>
                </div>

                {/* Sticky footer */}
                <div className="flex shrink-0 gap-3 border-t border-zinc-100 px-6 py-4 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingProjectId(null);
                      resetProjectForm();
                    }}
                    className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[var(--app-primary)] py-2.5 text-sm font-semibold text-[var(--app-primary-foreground)] shadow-md transition-all hover:bg-[var(--app-primary-hover)] active:scale-[0.98]"
                  >
                    {editingProjectId ? "Save changes" : "Create project"}
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

      {/* ANSH PROJECT COPILOT MODAL */}
      <AnshProjectCopilotModal
        open={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onGenerated={handleProjectGenerated}
      />

    </div>
  );
}
