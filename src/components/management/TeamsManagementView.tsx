"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserGroupIcon,
  UserPlusIcon,
  XMarkIcon,
  PlusIcon,
  CheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowUpRightIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import { AddTaskModal } from "@/components/tasks/AddTaskModal";
import { usePermissionAccess } from "@/lib/usePermissionAccess";
import {
  FREE_PLAN_TEAM_MEMBERS_LIMIT,
  isUpgradeRequiredError,
} from "@/lib/plans";
import { useWorkspacePlan } from "@/lib/useWorkspacePlan";

type TaskMock = {
  id?: string;
  title: string;
  description?: string | null;
  project: string;
  projectId?: string | null;
  category?: string | null;
  priority?: string;
  labels?: string[];
  estimate?: string | null;
  due?: string;
  assignee?: string | null;
  assignees?: string[];
  status: "In Progress" | "Completed" | "Todo" | "Blocked";
  progress: number;
};

type ActivityMock = {
  time: string;
  description: string;
};

type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  designation?: string;
  dept: string;
  reportsTo: string;
  joinedDate: string;
  tasks: TaskMock[];
  activities: ActivityMock[];
};

const FIXED_TEAM_ROLES = ["Owner", "Admin", "Editor", "Observer"] as const;
const DEFAULT_DESIGNATIONS = ["Senior Engineer", "Product Manager", "Team Lead", "Member"] as const;

const INITIAL_MEMBERS: Member[] = [
  {
    id: "m1",
    name: "Aisha Khan",
    email: "aisha@ansh.ai",
    phone: "+1 (555) 234-5678",
    role: "Admin",
    dept: "Product",
    reportsTo: "None",
    joinedDate: "Jan 12, 2024",
    tasks: [
      { title: "Define Q3 Roadmap & Targets", project: "Strategy", status: "In Progress", progress: 65 },
      { title: "Review hiring requirements", project: "HR Tech", status: "Completed", progress: 100 },
    ],
    activities: [
      { time: "2 hours ago", description: "Approved PR for auth refactoring" },
      { time: "Yesterday", description: "Created 'Strategy' workspace roadmap" },
    ],
  },
  {
    id: "m2",
    name: "Leo Park",
    email: "leo@ansh.ai",
    phone: "+1 (555) 987-6543",
    role: "Member",
    dept: "Engineering",
    reportsTo: "Aisha Khan",
    joinedDate: "Mar 15, 2024",
    tasks: [
      { title: "Migrate production DB to RDS pgSQL", project: "Infrastructure", status: "In Progress", progress: 40 },
      { title: "Implement theme-context variables", project: "App Core", status: "Completed", progress: 100 },
    ],
    activities: [
      { time: "30 mins ago", description: "Pushed 3 commits to branch 'feature/theme-vars'" },
    ],
  },
  {
    id: "m3",
    name: "Sam Rivera",
    email: "sam@ansh.ai",
    phone: "+1 (555) 345-6789",
    role: "Lead",
    dept: "Design",
    reportsTo: "Aisha Khan",
    joinedDate: "Feb 20, 2024",
    tasks: [
      { title: "Design Figma mockups for Teams drawer", project: "Design System", status: "Completed", progress: 100 },
      { title: "Create custom marketing illustrations", project: "Branding", status: "In Progress", progress: 80 },
    ],
    activities: [
      { time: "1 hour ago", description: "Uploaded final Figma assets to project shared drive" },
    ],
  },
  {
    id: "m4",
    name: "Elena Rostova",
    email: "elena@ansh.ai",
    phone: "+1 (555) 456-7890",
    role: "Member",
    dept: "Engineering",
    reportsTo: "Aisha Khan",
    joinedDate: "Apr 02, 2024",
    tasks: [
      { title: "Set up Jest testing framework", project: "Testing", status: "In Progress", progress: 50 },
    ],
    activities: [
      { time: "3 hours ago", description: "Fixed 4 failing test suites" },
    ],
  },
  {
    id: "m5",
    name: "Marcus Vance",
    email: "marcus@ansh.ai",
    phone: "+1 (555) 567-8901",
    role: "Member",
    dept: "Marketing",
    reportsTo: "Aisha Khan",
    joinedDate: "Jan 20, 2024",
    tasks: [
      { title: "Prepare product newsletter", project: "Outreach", status: "Completed", progress: 100 },
    ],
    activities: [
      { time: "Yesterday", description: "Sent newsletter draft for admin review" },
    ],
  },
  {
    id: "m6",
    name: "Priya Sharma",
    email: "priya@ansh.ai",
    phone: "+1 (555) 678-9012",
    role: "Lead",
    dept: "Product",
    reportsTo: "Aisha Khan",
    joinedDate: "Nov 05, 2023",
    tasks: [
      { title: "Conduct user feedback sessions", project: "User Research", status: "In Progress", progress: 30 },
    ],
    activities: [
      { time: "2 days ago", description: "Interviewed 3 enterprise users" },
    ],
  },
  {
    id: "m7",
    name: "Yuki Tanaka",
    email: "yuki@ansh.ai",
    phone: "+1 (555) 789-0123",
    role: "Member",
    dept: "Design",
    reportsTo: "Sam Rivera",
    joinedDate: "Feb 28, 2024",
    tasks: [
      { title: "Create landing page assets", project: "Branding", status: "Completed", progress: 100 },
    ],
    activities: [
      { time: "4 hours ago", description: "Exported page vectors" },
    ],
  },
  {
    id: "m8",
    name: "David Chen",
    email: "david@ansh.ai",
    phone: "+1 (555) 890-1234",
    role: "Member",
    dept: "Engineering",
    reportsTo: "Aisha Khan",
    joinedDate: "May 01, 2024",
    tasks: [
      { title: "Configure Sentry alerts pipeline", project: "Operations", status: "In Progress", progress: 90 },
    ],
    activities: [
      { time: "1 day ago", description: "Wrote alerts routing documentation" },
    ],
  },
  {
    id: "m9",
    name: "Chloe Dupont",
    email: "chloe@ansh.ai",
    phone: "+1 (555) 901-2345",
    role: "Member",
    dept: "Sales",
    reportsTo: "Aisha Khan",
    joinedDate: "Dec 15, 2023",
    tasks: [
      { title: "Draft Q2 pipeline projection", project: "Sales Dev", status: "Todo", progress: 0 },
    ],
    activities: [
      { time: "2 days ago", description: "Closed pilot deal with Alpha Corp" },
    ],
  },
  {
    id: "m10",
    name: "Arjun Mehta",
    email: "arjun@ansh.ai",
    phone: "+1 (555) 012-3456",
    role: "Member",
    dept: "Engineering",
    reportsTo: "Elena Rostova",
    joinedDate: "Mar 22, 2024",
    tasks: [
      { title: "Refactor tailwind styling variables", project: "App Core", status: "Completed", progress: 100 },
    ],
    activities: [
      { time: "Yesterday", description: "Merged pull request #452" },
    ],
  },
  {
    id: "m11",
    name: "Sarah Jenkins",
    email: "sarah@ansh.ai",
    phone: "+1 (555) 123-4567",
    role: "Member",
    dept: "Marketing",
    reportsTo: "Marcus Vance",
    joinedDate: "Feb 10, 2024",
    tasks: [
      { title: "Schedule social media calendar", project: "Outreach", status: "In Progress", progress: 75 },
    ],
    activities: [
      { time: "Yesterday", description: "Designed graphics for product announcement" },
    ],
  },
  {
    id: "m12",
    name: "Mateo Silva",
    email: "mateo@ansh.ai",
    phone: "+1 (555) 234-5670",
    role: "Member",
    dept: "Product",
    reportsTo: "Priya Sharma",
    joinedDate: "Apr 15, 2024",
    tasks: [
      { title: "Refine feature spec documents", project: "User Research", status: "Todo", progress: 0 },
    ],
    activities: [
      { time: "3 days ago", description: "Conducted internal presentation on Q3 focus" },
    ],
  },
  {
    id: "m13",
    name: "Olivia Taylor",
    email: "olivia@ansh.ai",
    phone: "+1 (555) 345-6781",
    role: "Member",
    dept: "Design",
    reportsTo: "Sam Rivera",
    joinedDate: "Mar 01, 2024",
    tasks: [
      { title: "Create layout guidelines document", project: "Design System", status: "Completed", progress: 100 },
    ],
    activities: [
      { time: "5 days ago", description: "Uploaded document details to team wiki" },
    ],
  },
  {
    id: "m14",
    name: "Liam Wilson",
    email: "liam@ansh.ai",
    phone: "+1 (555) 456-7892",
    role: "Member",
    dept: "Sales",
    reportsTo: "Chloe Dupont",
    joinedDate: "Jan 30, 2024",
    tasks: [
      { title: "Update sales decks for client pitches", project: "Sales Dev", status: "In Progress", progress: 40 },
    ],
    activities: [
      { time: "2 hours ago", description: "Completed discovery call with Beta Team" },
    ],
  },
  {
    id: "m15",
    name: "Fatima Al-Sayed",
    email: "fatima@ansh.ai",
    phone: "+1 (555) 567-8903",
    role: "Observer",
    dept: "Engineering",
    reportsTo: "Aisha Khan",
    joinedDate: "May 10, 2024",
    tasks: [
      { title: "Review system architecture", project: "Infrastructure", status: "Completed", progress: 100 },
    ],
    activities: [
      { time: "Just now", description: "Created an account as an observer" },
    ],
  },
];

function formatMemberPhone(phone?: string | null) {
  const trimmed = phone?.trim();
  return trimmed || "";
}

const mapDbUserToMember = (user: any): Member => {
  const normalizedRole = (user.role || "").toString().toLowerCase();
  const roleLabel =
    normalizedRole === "owner"
      ? "Owner"
      : normalizedRole === "admin"
      ? "Admin"
      : normalizedRole === "observer"
      ? "Observer"
      : "Editor";

  return {
    id: user.id,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email.split("@")[0],
    email: user.email,
    phone: formatMemberPhone(user.phone),
    role: roleLabel,
    designation: user.designation || user.jobTitle || "Member",
    dept: user.department || "Engineering",
    reportsTo: user.reportsTo || "None",
    joinedDate: new Date(user.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    tasks: user.tasks || [],
    activities: [
      { time: "Just now", description: "Created an account" }
    ]
  };
};

function getAvatarInitials(name: string) {
  if (!name || name === "Unassigned") return "??";
  return name.trim().split(/\s+/).map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarBgColor(name: string) {
  if (!name || name === "Unassigned") return "bg-zinc-500";
  const colors = [
    "bg-indigo-600",
    "bg-teal-600",
    "bg-purple-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-sky-600",
    "bg-emerald-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
}

function priorityBadgeColor(p: string) {
  const priority = (p || "").toLowerCase();
  if (priority === "high" || priority === "urgent") return "text-rose-500 bg-rose-500/10 border border-rose-500/20";
  if (priority === "medium") return "text-amber-500 bg-amber-500/10 border border-amber-500/20";
  return "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20";
}

export function TeamsManagementView() {
  const { showToast } = useToast();
  const { can, alertNoPermission } = usePermissionAccess();
  const { ready: planReady, isPro, guardPlanFeature } = useWorkspacePlan();
  const canManageMembers = can("manage_members");
  const canCreateTasks = can("create_tasks");

  const enforcePermission = (allowed: boolean) => {
    if (allowed) return true;
    alertNoPermission();
    return false;
  };

  const [members, setMembers] = useState<Member[]>([]);
  const canAddMoreMembers = isPro || members.length < FREE_PLAN_TEAM_MEMBERS_LIMIT;

  const enforceTeamMemberLimit = () => {
    if (!planReady || canAddMoreMembers) return true;
    return guardPlanFeature("teamMembersLimit");
  };

  const openAddMemberModal = () => {
    if (!enforcePermission(canManageMembers)) return;
    if (!enforceTeamMemberLimit()) return;
    setIsAddModalOpen(true);
  };

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce timer
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredMembers = useMemo(() => {
    if (!debouncedQuery.trim()) return members;
    const q = debouncedQuery.toLowerCase();
    return members.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      m.dept.toLowerCase().includes(q)
    );
  }, [members, debouncedQuery]);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  // Dropdown menus state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Add Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<string | undefined>("");
  const [role, setRole] = useState("Editor");
  const [designation, setDesignation] = useState("");
  const [dept, setDept] = useState("Engineering");
  const [reportsTo, setReportsTo] = useState("None");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState<string | undefined>("");
  const [editRole, setEditRole] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editReportsTo, setEditReportsTo] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Add Member Dropdown states
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isAddReportsOpen, setIsAddReportsOpen] = useState(false);

  // Edit Member Dropdown states
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isEditDeptOpen, setIsEditDeptOpen] = useState(false);
  const [isEditReportsOpen, setIsEditReportsOpen] = useState(false);

  // Roles State (Strictly 3 fixed team roles)
  const [availableRoles, setAvailableRoles] = useState<string[]>([...FIXED_TEAM_ROLES]);

  // Designation State
  const [availableDesignations, setAvailableDesignations] = useState<string[]>([...DEFAULT_DESIGNATIONS]);
  const [isAddDesignationOpen, setIsAddDesignationOpen] = useState(false);
  const [isEditDesignationOpen, setIsEditDesignationOpen] = useState(false);
  const [isCreatingDesignation, setIsCreatingDesignation] = useState(false);
  const [newDesignationName, setNewDesignationName] = useState("");

  // Departments State
  const [availableDepts, setAvailableDepts] = useState<string[]>([
    "Engineering",
    "Product",
    "Design",
    "Sales",
    "Marketing",
  ]);
  const [isCreatingDept, setIsCreatingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "activity">("overview");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || "";
      const onboardingWid = sessionStorage.getItem("ansh_onboarding_wid") || "";
      
      const res = await fetch(`/api/team?email=${encodeURIComponent(email)}` + (onboardingWid ? `&wid=${onboardingWid}` : ""));
      const json = await res.json();
      if (json.success) {
        setMembers(json.members.map(mapDbUserToMember));
        if (json.roles && json.roles.length > 0) {
          const validRoles = FIXED_TEAM_ROLES.filter((fixedRole) =>
            json.roles.some((r: string) => r.toLowerCase() === fixedRole.toLowerCase())
          );
          setAvailableRoles(validRoles.length > 0 ? [...validRoles] : [...FIXED_TEAM_ROLES]);
        }
        if (json.departments && json.departments.length > 0) {
          setAvailableDepts(json.departments);
        }
        const designationsFromMembers = json.members
          .map((m: any) => (m.designation || m.jobTitle || "").trim())
          .filter((d: string) => d.length > 0);
        if (designationsFromMembers.length > 0) {
          setAvailableDesignations((prev) =>
            Array.from(new Set([...prev, ...designationsFromMembers]))
          );
        }
        setActiveWorkspaceId(json.workspaceId);

        // Fetch projects for this workspace
        try {
          const projRes = await fetch(`/api/project?wid=${json.workspaceId}&email=${encodeURIComponent(email)}`);
          const projJson = await projRes.json();
          if (projJson.success) {
            setProjects(projJson.projects);
          }
        } catch (err) {
          console.error("Error fetching projects in team view:", err);
        }
      }
    } catch (err) {
      console.error("Error fetching team:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enforcePermission(canManageMembers)) return;
    if (!enforceTeamMemberLimit()) return;
    if (!name.trim()) return;
    const digits = (phone || "").replace(/\D/g, "");
    if (digits.length > 0 && (digits.length < 8 || digits.length > 15)) {
      showToast("Please enter a valid phone number.", "error");
      return;
    }

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email.trim(),
          phone: phone?.trim() || null,
          role,
          designation: designation || "",
          dept,
          reportsTo,
          password,
          workspaceId: activeWorkspaceId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`${name} added to team successfully!`, "success");
        fetchTeam();
        setName("");
        setEmail("");
        setPhone("");
        setRole("Editor");
        setDesignation("");
        setDept("Engineering");
        setReportsTo("None");
        setPassword("");
        setIsAddModalOpen(false);
      } else {
        if (isUpgradeRequiredError(json)) {
          guardPlanFeature(json.feature || "teamMembersLimit", json.error);
          return;
        }
        showToast(json.error || "Failed to add team member", "error");
      }
    } catch (err) {
      showToast("An error occurred while adding team member.", "error");
      console.error("Error adding member:", err);
    }
  };

  const handleStartEdit = (member: Member) => {
    if (!enforcePermission(canManageMembers)) return;
    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditPhone(member.phone);
    setEditRole(member.role);
    setEditDesignation(member.designation || "");
    setEditDept(member.dept);
    setEditReportsTo(member.reportsTo);
    setEditPassword("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enforcePermission(canManageMembers)) return;
    if (!editingMember || !editName.trim()) return;
    const editDigits = (editPhone || "").replace(/\D/g, "");
    if (editDigits.length > 0 && (editDigits.length < 8 || editDigits.length > 15)) {
      showToast("Please enter a valid phone number.", "error");
      return;
    }

    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingMember.id,
          name: editName,
          email: editEmail,
          phone: editPhone?.trim() || null,
          role: editRole,
          designation: editDesignation,
          dept: editDept,
          reportsTo: editReportsTo,
          password: editPassword || undefined,
          workspaceId: activeWorkspaceId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Team member updated successfully!", "success");
        fetchTeam();
        setEditingMember(null);
        setEditPassword("");
      } else {
        showToast(json.error || "Failed to update team member", "error");
      }
    } catch (err) {
      showToast("An error occurred while updating team member.", "error");
      console.error("Error updating member:", err);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!enforcePermission(canManageMembers)) return;
    try {
      const res = await fetch(`/api/team?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("Team member removed successfully.", "success");
        fetchTeam();
        if (selectedMember?.id === id) {
          setSelectedMember(null);
        }
      } else {
        showToast(json.error || "Failed to delete team member", "error");
      }
    } catch (err) {
      showToast("An error occurred while removing team member.", "error");
      console.error("Error deleting member:", err);
    }
  };

  const handleCreateTask = async (payload: import("@/types/task").NewTaskPayload) => {
    if (!enforcePermission(canCreateTasks)) return;
    if (!selectedMember) return;
    setIsAddingTask(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || "";
      const onboardingWid = sessionStorage.getItem("ansh_onboarding_wid") || "";

      const res = await fetch("/api/project/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title.trim(),
          projectId: payload.projectId || null,
          workspaceId: activeWorkspaceId,
          priority: payload.priority,
          status: payload.status || "todo",
          assignee: payload.assignees.length > 0 ? payload.assignees[0] : "Unassigned",
          assignees: payload.assignees,
          due: payload.dueLabel || "No date",
          description: payload.description.trim() || null,
          category: payload.category.trim() || "General",
          labels: payload.labels || [],
          attachmentUrls: payload.attachmentUrls || [],
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Task created and assigned successfully!", "success");
        setIsTaskModalOpen(false);
        
        // Re-fetch team to get updated tasks list
        const latestRes = await fetch(`/api/team?email=${encodeURIComponent(email)}` + (onboardingWid ? `&wid=${onboardingWid}` : ""));
        const latestJson = await latestRes.json();
        if (latestJson.success) {
          const updatedMembers = latestJson.members.map(mapDbUserToMember);
          setMembers(updatedMembers);
          const updatedSelected = updatedMembers.find((m: any) => m.id === selectedMember.id);
          if (updatedSelected) {
            setSelectedMember(updatedSelected);
          }
        }
      } else {
        if (isUpgradeRequiredError(json)) {
          guardPlanFeature(json.feature || "tasksLimit", json.error);
          return;
        }
        showToast(json.error || "Failed to add task", "error");
      }
    } catch (err) {
      console.error("Error adding member task:", err);
      showToast("Error adding task.", "error");
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleCreateDesignation = () => {
    if (!enforcePermission(canManageMembers)) return;
    const trimmed = newDesignationName.trim();
    if (!trimmed) return;
    if (!availableDesignations.includes(trimmed)) {
      setAvailableDesignations((prev) => [...prev, trimmed]);
    }
    if (editingMember) {
      setEditDesignation(trimmed);
    } else {
      setDesignation(trimmed);
    }
    setNewDesignationName("");
    setIsCreatingDesignation(false);
  };

  const handleCreateDept = () => {
    if (!enforcePermission(canManageMembers)) return;
    const trimmed = newDeptName.trim();
    if (!trimmed) return;
    if (!availableDepts.includes(trimmed)) {
      setAvailableDepts((prev) => [...prev, trimmed]);
    }
    if (editingMember) {
      setEditDept(trimmed);
    } else {
      setDept(trimmed);
    }
    setNewDeptName("");
    setIsCreatingDept(false);
  };

  if (loading && members.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.75rem)] w-full items-center justify-center bg-transparent dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <span className="text-sm font-semibold text-zinc-500">Loading team members...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.75rem)] w-full flex-col overflow-hidden bg-transparent dark:bg-zinc-950">
      
      {/* HEADER BAR */}
      <div className="shrink-0 border-b border-zinc-200/80 bg-white px-6 py-4 dark:border-white/[0.06] dark:bg-zinc-950/80 backdrop-blur-sm z-20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
              <UserGroupIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Teams Management
              </h1>
              <p className="text-[11px] font-medium text-zinc-500">
                {members.length} team members active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar input */}
            <div className="relative group">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-[var(--app-primary)] transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team members..."
                className="h-9 w-52 rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs outline-none transition-all focus:border-[var(--app-primary)] focus:bg-white focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-950"
              />
            </div>

            <button
              onClick={openAddMemberModal}
              disabled={!canManageMembers}
              className="flex h-9 items-center gap-2 rounded-lg bg-[var(--app-primary)] px-3 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-45"
            >
              <UserPlusIcon className="h-4 w-4" />
              Add Member
            </button>
          </div>
        </div>
      </div>

      {/* MEMBERS TABLE CONTAINER */}
      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/60 overflow-hidden">
          
          {/* Scrollable Table viewport */}
          <div className="flex-1 overflow-auto scrollbar-thin">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400 min-w-[700px]">
              <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:border-white/10 dark:bg-zinc-900/90">
                <tr>
                  <th className="px-6 py-4 font-semibold">Member Details</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Department</th>
                  <th className="px-6 py-4 font-semibold">Reports To</th>
                  <th className="px-6 py-4 font-semibold w-16 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                {paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <div className="mx-auto flex max-w-[340px] flex-col items-center justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 ring-8 ring-zinc-50/50 dark:bg-zinc-900/60 dark:text-zinc-500 dark:ring-zinc-900/20">
                          <UserGroupIcon className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <h3 className="mt-5 font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          No team members found
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                          Get started by adding teammates to your workspace. They will be able to collaborate on tasks, assign projects, and log activities.
                        </p>
                        <button
                          onClick={openAddMemberModal}
                          disabled={!canManageMembers}
                          className="mt-5 flex h-9 items-center gap-1.5 rounded-xl bg-[var(--app-primary)] px-4 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Add Member
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => {
                        setSelectedMember(m);
                        setActiveTab("overview");
                      }}
                      className="cursor-pointer transition-colors hover:bg-zinc-50/50 dark:hover:bg-white/[0.01]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 text-xs font-bold text-zinc-700 dark:from-zinc-700 dark:to-zinc-800 dark:text-zinc-300">
                            {m.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                            <EnvelopeIcon className="h-3 w-3 text-zinc-400" />
                            {m.email}
                          </span>
                          {m.phone ? (
                            <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                              <PhoneIcon className="h-3 w-3 text-zinc-500/80" />
                              {m.phone}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-md border border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--app-primary-soft-text)] dark:border-teal-500/15 dark:bg-teal-950/35 dark:text-teal-100">
                          {m.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {m.dept}
                      </td>
                      <td className="px-6 py-4">
                        {m.reportsTo === "None" ? (
                          <span className="text-xs text-zinc-400 dark:text-zinc-600 italic">
                            None (Exec)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            <ArrowUpRightIcon className="h-3 w-3 text-zinc-400" />
                            {m.reportsTo}
                          </span>
                        )}
                      </td>
                      <td 
                        className="px-6 py-4 text-center relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === m.id ? null : m.id);
                          }}
                          disabled={!canManageMembers}
                          title={!canManageMembers ? "Requires team management permission" : "Member actions"}
                          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>

                        {/* Options Dropdown Menu */}
                        <AnimatePresence>
                          {activeMenuId === m.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              className="absolute right-6 top-12 z-30 w-36 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900 text-left"
                            >
                              <button
                                onClick={() => {
                                  setSelectedMember(m);
                                  setActiveTab("overview");
                                  setActiveMenuId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              >
                                <EyeIcon className="h-4 w-4 text-zinc-400" />
                                Preview
                              </button>
                              {canManageMembers && (
                                <button
                                  onClick={() => {
                                    handleStartEdit(m);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                  <PencilSquareIcon className="h-4 w-4 text-zinc-400" />
                                  Edit Member
                                </button>
                              )}
                              {canManageMembers && <div className="my-1 border-t border-zinc-100 dark:border-white/5" />}
                              {canManageMembers && (
                                <button
                                  onClick={() => {
                                    setMemberToDelete(m);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  Delete
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="shrink-0 border-t border-zinc-200 bg-zinc-50/50 px-6 py-4 flex items-center justify-between dark:border-white/10 dark:bg-zinc-900/50">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Showing <span className="font-semibold text-zinc-950 dark:text-zinc-50">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                {Math.min(startIndex + itemsPerPage, filteredMembers.length)}
              </span>{" "}
              of <span className="font-semibold text-zinc-950 dark:text-zinc-50">{filteredMembers.length}</span> members
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-white dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-white dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* MEMBER DETAILS SIDEBAR DRAWER */}
      <AnimatePresence>
        {selectedMember && (
          <>
            {/* Drawer Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 z-45 flex w-full max-w-[500px] flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--app-gradient-from)] to-[var(--app-gradient-to)] text-sm font-bold text-white shadow-md">
                    {selectedMember.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                      {selectedMember.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-md border border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-primary-soft-text)] dark:border-teal-500/15 dark:bg-teal-950/35 dark:text-teal-100">
                        {selectedMember.role}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        {selectedMember.dept}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-zinc-100 px-6 dark:border-white/5">
                {(["overview", "tasks", "activity"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative py-3.5 text-xs font-bold capitalize transition-all pr-5 ${
                      activeTab === tab
                        ? "text-[var(--app-primary)]"
                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-5 h-0.5 bg-[var(--app-primary)]"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-6">
                
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    
                    {/* Employment Details Section */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Personal & Professional Info
                      </h4>
                      <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-white/5 dark:bg-zinc-950/20 space-y-3.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Email Address</span>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-200">{selectedMember.email}</span>
                        </div>
                        {selectedMember.phone ? (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400">Phone Number</span>
                            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{selectedMember.phone}</span>
                          </div>
                        ) : null}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Joined Date</span>
                          <div className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-200">
                            <CalendarDaysIcon className="h-3.5 w-3.5 text-zinc-400" />
                            {selectedMember.joinedDate}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-zinc-100 dark:border-white/5 pt-3">
                          <span className="text-zinc-400">Reports To</span>
                          <span className="font-bold text-[var(--app-primary-soft-text)] bg-[var(--app-primary-soft)] px-2 py-0.5 rounded text-[11px] border border-[var(--app-primary-soft-border)]">
                            {selectedMember.reportsTo}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Performance Widgets
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60 shadow-sm">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                            <ClipboardDocumentCheckIcon className="h-4.5 w-4.5" />
                          </div>
                          <p className="mt-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Completed Tasks</p>
                          <p className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-50">
                            {selectedMember.tasks.filter(t => t.status === "Completed").length}
                          </p>
                        </div>

                        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60 shadow-sm">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                            <ClockIcon className="h-4.5 w-4.5" />
                          </div>
                          <p className="mt-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Active Items</p>
                          <p className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-50">
                            {selectedMember.tasks.filter(t => t.status === "In Progress").length}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* TASKS TAB */}
                {activeTab === "tasks" && (
                  <div className="space-y-4 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Assigned Workspace Tasks
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          if (!enforcePermission(canCreateTasks)) return;
                          setIsTaskModalOpen(true);
                        }}
                        disabled={!canCreateTasks}
                        className="flex h-8 items-center gap-1.5 rounded-xl bg-teal-500 px-3 text-xs font-bold text-white shadow-sm hover:bg-teal-650 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Task
                      </button>
                    </div>

                    {/* Task list container */}
                    <div className="flex-1 overflow-y-auto pr-0.5 space-y-3.5 scrollbar-thin">
                      {selectedMember.tasks.length === 0 ? (
                        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 py-8 italic">
                          No tasks assigned to this user.
                        </p>
                      ) : (
                        selectedMember.tasks.map((task, i) => (
                          <div 
                            key={i} 
                            className="group relative flex flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-200/40 hover:border-zinc-300 dark:border-white/[0.05] dark:bg-[#1c1d22]/90 dark:shadow-none dark:hover:border-zinc-700 transition-[border-color,box-shadow]"
                          >
                            {/* Card Top Row: Category & Priority */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">
                                {task.category || "General"}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${priorityBadgeColor(
                                  task.priority ?? "medium"
                                )}`}
                              >
                                {task.priority || "medium"}
                              </span>
                            </div>

                            {/* Task Title */}
                            <h5 className="mt-2 text-xs font-bold leading-snug tracking-tight text-zinc-900 group-hover:text-teal-500 dark:text-zinc-100 dark:group-hover:text-teal-400 transition-colors">
                              {task.title}
                            </h5>

                            {/* Task Description snippet */}
                            {task.description && (
                              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                                {task.description}
                              </p>
                            )}

                            {/* Labels list */}
                            {task.labels && task.labels.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1">
                                {task.labels.map((label: string) => (
                                  <span
                                    key={label}
                                    className="rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-700/50"
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Card Footer: Due Date, Estimates & Assignee */}
                            <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-white/[0.03]">
                              
                              {/* Estimate and Due Dates */}
                              <div className="flex items-center gap-2">

                                {task.due && task.due !== "No date" && (
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                                    task.due.includes("Today") || task.due.includes("Urgent") || task.due.includes("Yesterday")
                                      ? "text-rose-500 font-semibold"
                                      : "text-zinc-400"
                                  }`}>
                                    <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                    <span>{task.due}</span>
                                  </span>
                                )}
                              </div>

                              {/* Assignee Avatar / Avatars Group */}
                              {task.assignees && task.assignees.length > 0 ? (
                                <div className="flex -space-x-1.5 overflow-hidden">
                                  {task.assignees.slice(0, 3).map((a) => (
                                    <div 
                                      key={a}
                                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold tracking-wider ring-1 ring-white dark:ring-zinc-900 ${getAvatarBgColor(a)} text-white shrink-0`}
                                      title={a}
                                    >
                                      {getAvatarInitials(a)}
                                    </div>
                                  ))}
                                  {task.assignees.length > 3 && (
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[8px] font-bold text-zinc-650 dark:bg-zinc-800 dark:text-zinc-450 ring-1 ring-white dark:ring-zinc-900 shrink-0">
                                      +{task.assignees.length - 3}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div 
                                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold tracking-wider ring-1 ring-black/5 dark:ring-white/10 ${getAvatarBgColor(task.assignee || selectedMember.name)} text-white`}
                                  title={task.assignee || selectedMember.name}
                                >
                                  {getAvatarInitials(task.assignee || selectedMember.name)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ACTIVITY TAB */}
                {activeTab === "activity" && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      Recent Activity Timeline
                    </h4>

                    <div className="relative border-l border-zinc-150 pl-5 ml-2 dark:border-white/5 space-y-6">
                      {selectedMember.activities.map((act, i) => (
                        <div key={i} className="relative">
                          {/* Timeline dot */}
                          <div className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-white bg-zinc-400 dark:border-zinc-900" />
                          
                          <div>
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                              {act.time}
                            </span>
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                              {act.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ADD MEMBER MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddModalOpen(false);
                setIsCreatingDesignation(false);
                setNewDesignationName("");
                setIsAddDesignationOpen(false);
              }}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 z-50 m-auto flex h-fit w-full max-w-[480px] flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418]"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <UserPlusIcon className="h-5 w-5 text-[var(--app-primary)]" />
                  <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    Add Team Member
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsCreatingDesignation(false);
                    setNewDesignationName("");
                    setIsAddDesignationOpen(false);
                  }}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="mt-4 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maya Patel"
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. maya@ansh.ai"
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Phone Number
                  </label>
                  <div className="mt-2">
                    <PhoneInput
                      country="us"
                      value={phone}
                      onChange={(value) => setPhone(value ? `+${value}` : "")}
                      enableSearch={true}
                      countryCodeEditable={false}
                      inputProps={{
                        name: "phone",
                        placeholder: "Enter phone number (optional)",
                      }}
                    />
                  </div>
                </div>

                {/* Designation Row with custom creation option */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Designation
                  </label>

                  <div className="mt-2 flex items-center gap-2">
                    {isCreatingDesignation ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={newDesignationName}
                          onChange={(e) => setNewDesignationName(e.target.value)}
                          placeholder="Type new designation..."
                          className="flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                        <button
                          type="button"
                          onClick={handleCreateDesignation}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--app-primary)] text-white shadow-sm hover:brightness-110 active:scale-95"
                          title="Save Custom Designation"
                        >
                          <CheckIcon className="h-4.5 w-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingDesignation(false);
                            setNewDesignationName("");
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400"
                          title="Cancel"
                        >
                          <XMarkIcon className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative flex-1">
                          <button
                            type="button"
                            onClick={() => setIsAddDesignationOpen(!isAddDesignationOpen)}
                            className="flex min-h-[46px] w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <span>{designation || "Select designation"}</span>
                            <ChevronDownIcon className={`h-4.5 w-4.5 text-zinc-400 transition-transform duration-200 ${isAddDesignationOpen ? "rotate-180" : ""}`} />
                          </button>

                          <AnimatePresence>
                            {isAddDesignationOpen && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setIsAddDesignationOpen(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                  className="absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900 scrollbar-thin"
                                >
                                  {availableDesignations.map((d) => {
                                    const isSelected = designation === d;
                                    return (
                                      <button
                                        key={d}
                                        type="button"
                                        onClick={() => {
                                          setDesignation(d);
                                          setIsAddDesignationOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-left transition-colors ${
                                          isSelected
                                            ? "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/50 dark:text-white"
                                            : "text-zinc-650 hover:bg-zinc-50/50 dark:text-zinc-400 dark:hover:bg-zinc-800/30"
                                        }`}
                                      >
                                        <span>{d}</span>
                                        {isSelected && <CheckIcon className="h-3.5 w-3.5 text-[var(--app-primary)] stroke-[3]" />}
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsCreatingDesignation(true)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:border-[var(--app-primary)] hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)] transition-all dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          title="Create custom designation"
                        >
                          <PlusIcon className="h-4.5 w-4.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                  
                {/* Password Field */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create teammate password"
                      className="block w-full rounded-xl border border-zinc-200 pl-4 pr-10 py-3 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4.5 w-4.5" />
                      ) : (
                        <EyeIcon className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Role row (fixed roles only) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Role
                  </label>
                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddRoleOpen(!isAddRoleOpen)}
                      className="flex min-h-[46px] w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span>{role}</span>
                      <ChevronDownIcon className={`h-4.5 w-4.5 text-zinc-400 transition-transform duration-200 ${isAddRoleOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {isAddRoleOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsAddRoleOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            className="absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900 scrollbar-thin"
                          >
                            {availableRoles.map((r) => {
                              const isSelected = role === r;
                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => {
                                    setRole(r);
                                    setIsAddRoleOpen(false);
                                  }}
                                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-left transition-colors ${
                                    isSelected
                                      ? "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/50 dark:text-white"
                                      : "text-zinc-650 hover:bg-zinc-50/50 dark:text-zinc-400 dark:hover:bg-zinc-800/30"
                                  }`}
                                >
                                  <span>{r}</span>
                                  {isSelected && <CheckIcon className="h-3.5 w-3.5 text-[var(--app-primary)] stroke-[3]" />}
                                </button>
                              );
                            })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Department Row with custom creation option */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Department
                  </label>
                  
                  <div className="mt-2 flex items-center gap-2">
                    {isCreatingDept ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          placeholder="Type new dept..."
                          className="flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                        <button
                          type="button"
                          onClick={handleCreateDept}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--app-primary)] text-white shadow-sm hover:brightness-110 active:scale-95"
                          title="Save Custom Department"
                        >
                          <CheckIcon className="h-4.5 w-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingDept(false);
                            setNewDeptName("");
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400"
                          title="Cancel"
                        >
                          <XMarkIcon className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative flex-1">
                          <button
                            type="button"
                            onClick={() => setIsAddDeptOpen(!isAddDeptOpen)}
                            className="flex min-h-[46px] w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <span>{dept}</span>
                            <ChevronDownIcon className={`h-4.5 w-4.5 text-zinc-400 transition-transform duration-200 ${isAddDeptOpen ? "rotate-180" : ""}`} />
                          </button>
                          
                          <AnimatePresence>
                            {isAddDeptOpen && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setIsAddDeptOpen(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                  className="absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900 scrollbar-thin"
                                >
                                  {availableDepts.map((d) => {
                                    const isSelected = dept === d;
                                    return (
                                      <button
                                        key={d}
                                        type="button"
                                        onClick={() => {
                                          setDept(d);
                                          setIsAddDeptOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-left transition-colors ${
                                          isSelected
                                            ? "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/50 dark:text-white"
                                            : "text-zinc-650 hover:bg-zinc-50/50 dark:text-zinc-400 dark:hover:bg-zinc-800/30"
                                        }`}
                                      >
                                        <span>{d}</span>
                                        {isSelected && <CheckIcon className="h-3.5 w-3.5 text-[var(--app-primary)] stroke-[3]" />}
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setIsCreatingDept(true)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:border-[var(--app-primary)] hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)] transition-all dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          title="Create custom department"
                        >
                          <PlusIcon className="h-4.5 w-4.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Reports To Row */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Reports To
                  </label>
                  <div className="relative mt-2">
                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddReportsOpen(!isAddReportsOpen)}
                      className="flex min-h-[46px] w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/55 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span>{reportsTo === "None" ? "None (Direct / Exec)" : reportsTo}</span>
                      <ChevronDownIcon className={`h-4.5 w-4.5 text-zinc-400 transition-transform duration-200 ${isAddReportsOpen ? "rotate-180" : ""}`} />
                    </button>
                    
                    <AnimatePresence>
                      {isAddReportsOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsAddReportsOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            className="absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900 scrollbar-thin"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setReportsTo("None");
                                setIsAddReportsOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-left transition-colors ${
                                reportsTo === "None"
                                  ? "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/50 dark:text-white"
                                  : "text-zinc-650 hover:bg-zinc-50/50 dark:text-zinc-400 dark:hover:bg-zinc-800/30"
                              }`}
                            >
                              <span>None (Direct / Exec)</span>
                              {reportsTo === "None" && <CheckIcon className="h-3.5 w-3.5 text-[var(--app-primary)] stroke-[3]" />}
                            </button>
                            
                            {members.map((m) => {
                              const isSelected = reportsTo === m.name;
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setReportsTo(m.name);
                                    setIsAddReportsOpen(false);
                                  }}
                                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-left transition-colors ${
                                    isSelected
                                      ? "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/50 dark:text-white"
                                      : "text-zinc-650 hover:bg-zinc-50/50 dark:text-zinc-400 dark:hover:bg-zinc-800/30"
                                  }`}
                                >
                                  <span>{m.name}</span>
                                  {isSelected && <CheckIcon className="h-3.5 w-3.5 text-[var(--app-primary)] stroke-[3]" />}
                                </button>
                              );
                            })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsCreatingDesignation(false);
                      setNewDesignationName("");
                      setIsAddDesignationOpen(false);
                      setIsCreatingDept(false);
                    }}
                    className="flex-1 rounded-xl border border-zinc-200 py-3 text-xs font-bold text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[var(--app-primary)] py-3 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-98 transition-all"
                  >
                    Add to Team
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EDIT MEMBER MODAL */}
      <AnimatePresence>
        {editingMember && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingMember(null);
                setIsCreatingDesignation(false);
                setNewDesignationName("");
                setIsEditDesignationOpen(false);
              }}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 z-50 m-auto flex h-fit w-full max-w-[480px] flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418]"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <PencilSquareIcon className="h-5 w-5 text-[var(--app-primary)]" />
                  <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    Edit Team Member
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setEditingMember(null);
                    setIsCreatingDesignation(false);
                    setNewDesignationName("");
                    setIsEditDesignationOpen(false);
                  }}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Maya Patel"
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="e.g. maya@ansh.ai"
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Phone Number
                  </label>
                  <div className="mt-2">
                    <PhoneInput
                      country="us"
                      value={editPhone}
                      onChange={(value) => setEditPhone(value ? `+${value}` : "")}
                      enableSearch={true}
                      countryCodeEditable={false}
                      inputProps={{
                        name: "phone",
                        placeholder: "Enter phone number (optional)",
                      }}
                    />
                  </div>
                </div>

                {/* Designation Row with custom creation option */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Designation
                  </label>

                  <div className="mt-2 flex items-center gap-2">
                    {isCreatingDesignation ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={newDesignationName}
                          onChange={(e) => setNewDesignationName(e.target.value)}
                          placeholder="Type new designation..."
                          className="flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                        <button
                          type="button"
                          onClick={handleCreateDesignation}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--app-primary)] text-white shadow-sm hover:brightness-110 active:scale-95"
                          title="Save Custom Designation"
                        >
                          <CheckIcon className="h-4.5 w-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingDesignation(false);
                            setNewDesignationName("");
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400"
                          title="Cancel"
                        >
                          <XMarkIcon className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative flex-1">
                          <button
                            type="button"
                            onClick={() => setIsEditDesignationOpen(!isEditDesignationOpen)}
                            className="flex min-h-[46px] w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <span>{editDesignation || "Select designation"}</span>
                            <ChevronDownIcon className={`h-4.5 w-4.5 text-zinc-400 transition-transform duration-200 ${isEditDesignationOpen ? "rotate-180" : ""}`} />
                          </button>

                          <AnimatePresence>
                            {isEditDesignationOpen && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setIsEditDesignationOpen(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                  className="absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900 scrollbar-thin"
                                >
                                  {availableDesignations.map((d) => {
                                    const isSelected = editDesignation === d;
                                    return (
                                      <button
                                        key={d}
                                        type="button"
                                        onClick={() => {
                                          setEditDesignation(d);
                                          setIsEditDesignationOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-left transition-colors ${
                                          isSelected
                                            ? "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/50 dark:text-white"
                                            : "text-zinc-650 hover:bg-zinc-50/50 dark:text-zinc-400 dark:hover:bg-zinc-800/30"
                                        }`}
                                      >
                                        <span>{d}</span>
                                        {isSelected && <CheckIcon className="h-3.5 w-3.5 text-[var(--app-primary)] stroke-[3]" />}
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsCreatingDesignation(true)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:border-[var(--app-primary)] hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)] transition-all dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          title="Create custom designation"
                        >
                          <PlusIcon className="h-4.5 w-4.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Password Field (Optional) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Password (leave blank to keep unchanged)
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showEditPassword ? "text" : "password"}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="New password"
                      className="block w-full rounded-xl border border-zinc-200 pl-4 pr-10 py-3 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      {showEditPassword ? (
                        <EyeSlashIcon className="h-4.5 w-4.5" />
                      ) : (
                        <EyeIcon className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Role row (fixed roles only) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Role
                  </label>
                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditRoleOpen(!isEditRoleOpen)}
                      className="flex min-h-[46px] w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span>{editRole}</span>
                      <ChevronDownIcon className={`h-4.5 w-4.5 text-zinc-400 transition-transform duration-200 ${isEditRoleOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {isEditRoleOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsEditRoleOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            className="absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900 scrollbar-thin"
                          >
                            {availableRoles.map((r) => {
                              const isSelected = editRole === r;
                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => {
                                    setEditRole(r);
                                    setIsEditRoleOpen(false);
                                  }}
                                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-left transition-colors ${
                                    isSelected
                                      ? "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/50 dark:text-white"
                                      : "text-zinc-650 hover:bg-zinc-50/50 dark:text-zinc-400 dark:hover:bg-zinc-800/30"
                                  }`}
                                >
                                  <span>{r}</span>
                                  {isSelected && <CheckIcon className="h-3.5 w-3.5 text-[var(--app-primary)] stroke-[3]" />}
                                </button>
                              );
                            })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Department Row with custom creation option */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Department
                  </label>
                  
                  <div className="mt-2 flex items-center gap-2">
                    {isCreatingDept ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          placeholder="Type new dept..."
                          className="flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                        <button
                          type="button"
                          onClick={handleCreateDept}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--app-primary)] text-white shadow-sm hover:brightness-110 active:scale-95"
                          title="Save Custom Department"
                        >
                          <CheckIcon className="h-4.5 w-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingDept(false);
                            setNewDeptName("");
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400"
                          title="Cancel"
                        >
                          <XMarkIcon className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative flex-1">
                          <button
                            type="button"
                            onClick={() => setIsEditDeptOpen(!isEditDeptOpen)}
                            className="flex min-h-[46px] w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <span>{editDept}</span>
                            <ChevronDownIcon className={`h-4.5 w-4.5 text-zinc-400 transition-transform duration-200 ${isEditDeptOpen ? "rotate-180" : ""}`} />
                          </button>
                          
                          <AnimatePresence>
                            {isEditDeptOpen && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setIsEditDeptOpen(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                  className="absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900 scrollbar-thin"
                                >
                                  {availableDepts.map((d) => {
                                    const isSelected = editDept === d;
                                    return (
                                      <button
                                        key={d}
                                        type="button"
                                        onClick={() => {
                                          setEditDept(d);
                                          setIsEditDeptOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-left transition-colors ${
                                          isSelected
                                            ? "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/50 dark:text-white"
                                            : "text-zinc-650 hover:bg-zinc-50/50 dark:text-zinc-400 dark:hover:bg-zinc-800/30"
                                        }`}
                                      >
                                        <span>{d}</span>
                                        {isSelected && <CheckIcon className="h-3.5 w-3.5 text-[var(--app-primary)] stroke-[3]" />}
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setIsCreatingDept(true)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:border-[var(--app-primary)] hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)] transition-all dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          title="Create custom department"
                        >
                          <PlusIcon className="h-4.5 w-4.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Reports To Row */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Reports To
                  </label>
                  <div className="relative mt-2">
                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditReportsOpen(!isEditReportsOpen)}
                      className="flex min-h-[46px] w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/55 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span>{editReportsTo === "None" ? "None (Direct / Exec)" : editReportsTo}</span>
                      <ChevronDownIcon className={`h-4.5 w-4.5 text-zinc-400 transition-transform duration-200 ${isEditReportsOpen ? "rotate-180" : ""}`} />
                    </button>
                    
                    <AnimatePresence>
                      {isEditReportsOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsEditReportsOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            className="absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900 scrollbar-thin"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setEditReportsTo("None");
                                setIsEditReportsOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-left transition-colors ${
                                editReportsTo === "None"
                                  ? "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/50 dark:text-white"
                                  : "text-zinc-650 hover:bg-zinc-50/50 dark:text-zinc-400 dark:hover:bg-zinc-800/30"
                              }`}
                            >
                              <span>None (Direct / Exec)</span>
                              {editReportsTo === "None" && <CheckIcon className="h-3.5 w-3.5 text-[var(--app-primary)] stroke-[3]" />}
                            </button>
                            
                            {members
                              .filter((m) => m.id !== editingMember.id)
                              .map((m) => {
                                const isSelected = editReportsTo === m.name;
                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                      setEditReportsTo(m.name);
                                      setIsEditReportsOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-left transition-colors ${
                                      isSelected
                                        ? "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/50 dark:text-white"
                                        : "text-zinc-650 hover:bg-zinc-50/50 dark:text-zinc-400 dark:hover:bg-zinc-800/30"
                                    }`}
                                  >
                                    <span>{m.name}</span>
                                    {isSelected && <CheckIcon className="h-3.5 w-3.5 text-[var(--app-primary)] stroke-[3]" />}
                                  </button>
                                );
                              })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMember(null);
                      setIsCreatingDesignation(false);
                      setNewDesignationName("");
                      setIsEditDesignationOpen(false);
                      setIsCreatingDept(false);
                    }}
                    className="flex-1 rounded-xl border border-zinc-200 py-3 text-xs font-bold text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[var(--app-primary)] py-3 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-98 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DELETE TEAM MEMBER CONFIRMATION MODAL */}
      <AnimatePresence>
        {memberToDelete && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMemberToDelete(null)}
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
                  Remove Member
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Are you sure you want to remove <span className="font-semibold text-zinc-700 dark:text-zinc-350">"{memberToDelete.name}"</span> from the team? They will lose access to all tasks and project boards in this workspace.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-650 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!canManageMembers}
                  onClick={async () => {
                    if (!enforcePermission(canManageMembers)) return;
                    const id = memberToDelete.id;
                    setMemberToDelete(null);
                    await handleDeleteMember(id);
                  }}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Yes, Remove
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AddTaskModal
        open={isTaskModalOpen && canCreateTasks}
        onClose={() => setIsTaskModalOpen(false)}
        onCreate={handleCreateTask}
        assignees={members.map((m) => m.name)}
        defaultAssignee={selectedMember?.name}
      />

    </div>
  );
}
