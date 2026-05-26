"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheckIcon,
  KeyIcon,
  EyeIcon,
  PencilSquareIcon,
  CheckIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  LockClosedIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  CpuChipIcon,
  UserGroupIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import {
  AppRole,
  DEFAULT_PERMISSION_MATRIX,
  PERMISSION_STORAGE_KEY,
  PermissionMatrix,
  parsePermissionMatrix,
  sanitizePermissionMatrix,
} from "@/lib/permissions";

type RoleType = AppRole;

interface PermissionItem {
  id: string;
  name: string;
  description: string;
}

interface PermissionModule {
  id: string;
  name: string;
  icon: any;
  permissions: PermissionItem[];
}

const ROLES = [
  {
    id: "owner" as const,
    name: "Owner",
    badge: "Full Control",
    description: "Account owner with full workspace access, billing oversight, and user management authority.",
    color: "from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500",
    bgSoft: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300",
    glowColor: "rgba(245, 158, 11, 0.15)",
    icon: ShieldCheckIcon,
    capabilities: ["Access all modules", "Manage subscriptions & billing", "Delete workspace & logs"],
  },
  {
    id: "admin" as const,
    name: "Admin",
    badge: "Management",
    description: "Co-manager who handles day-to-day workspace settings, teammates, and custom attributes.",
    color: "from-teal-500 to-emerald-600 dark:from-teal-400 dark:to-emerald-500",
    bgSoft: "bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300",
    glowColor: "rgba(20, 184, 166, 0.15)",
    icon: KeyIcon,
    capabilities: ["Invite and manage members", "Configure core system defaults", "Create & edit custom lanes"],
  },
  {
    id: "editor" as const,
    name: "Editor",
    badge: "Content Creator",
    description: "Active team member executing tasks, participating in team spaces, and creating resources.",
    color: "from-indigo-500 to-violet-600 dark:from-indigo-400 dark:to-violet-500",
    bgSoft: "bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300",
    glowColor: "rgba(99, 102, 241, 0.15)",
    icon: PencilSquareIcon,
    capabilities: ["Create, edit, and assign tasks", "Engage in chat channels", "Create brainboard notes"],
  },
  {
    id: "observer" as const,
    name: "Observer",
    badge: "Read Only",
    description: "Outside collaborator or auditor who views progress, chats, and files without modification power.",
    color: "from-slate-500 to-zinc-600 dark:from-slate-400 dark:to-zinc-500",
    bgSoft: "bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300",
    glowColor: "rgba(100, 116, 139, 0.15)",
    icon: EyeIcon,
    capabilities: ["Read-only tasks & Kanban view", "View chats & shared files", "Audit board layouts"],
  },
];

const MODULES: PermissionModule[] = [
  {
    id: "admin",
    name: "Workspace Administration",
    icon: CpuChipIcon,
    permissions: [
      { id: "modify_workspace", name: "Modify Workspace Configurations", description: "Edit workspace name, domain, industry parameters and landing layout." },
      { id: "manage_members", name: "Teammate Access Management", description: "Invite new users, update user profile fields, or remove team members." },
      { id: "setup_integrations", name: "API & Webhook Configurations", description: "Setup Slack integration hooks, custom APIs and workspace tokens." },
    ],
  },
  {
    id: "chat",
    name: "Team Space (Chat)",
    icon: ChatBubbleLeftRightIcon,
    permissions: [
      { id: "create_channels", name: "Create Public & Private Channels", description: "Establish new work threads, set topics, and define access rights." },
      { id: "delete_channels", name: "Permanently Delete Channels", description: "Remove a chat channel completely and erase historical message links." },
      { id: "post_messages", name: "Send Chat & Attach Multiple Files", description: "Compose messages, pick emojis, and select multi-file payloads in chats." },
      { id: "manage_channel_members", name: "Add/Remove Channel Participants", description: "Manually handle workspace participant subscriptions inside channels." },
    ],
  },
  {
    id: "tasks",
    name: "Tasks & Projects",
    icon: ClipboardDocumentCheckIcon,
    permissions: [
      { id: "create_projects", name: "Define Workspace Projects", description: "Create project folders, set estimated hours, and assign health levels." },
      { id: "create_tasks", name: "Add Kanban Board Tasks", description: "Create standard work items with estimates and custom categorizations." },
      { id: "edit_tasks", name: "Modify Tasks & Assignees", description: "Edit priorities, update text descriptions, and manage multi-assignees." },
      { id: "delete_tasks", name: "Permanently Delete Task Items", description: "Erase tasks, notes and attachments from task boards." },
      { id: "reorder_columns", name: "Reorder Lane Status Columns", description: "Drag or navigate status lanes left/right to modify Kanban layouts." },
    ],
  },
  {
    id: "billing",
    name: "Billing & Subscription",
    icon: CreditCardIcon,
    permissions: [
      { id: "view_invoices", name: "Audit Invoices & Transaction Receipts", description: "Read past order transaction payments and print invoices." },
      { id: "manage_subscription", name: "Update Subscriptions & Plans", description: "Change billing cycles, seats count, and execute payments (Razorpay checkout)." },
    ],
  },
  {
    id: "brain",
    name: "Brain Board",
    icon: Squares2X2Icon,
    permissions: [
      { id: "create_sticky_notes", name: "Create Sticky Notes", description: "Pin new brainstorming thoughts to the workspace Brain board." },
      { id: "edit_notes", name: "Move, Resize & Rotate Notes", description: "Update board positions, colors, size coordinates and angles." },
      { id: "delete_notes", name: "Remove Brain Board Sticky Notes", description: "Erase canvas ideas, sketches and board notes." },
    ],
  },
];

const DEFAULT_PRESETS = DEFAULT_PERMISSION_MATRIX;

function syncLocalPermissions(nextPermissions: PermissionMatrix) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(nextPermissions));
}

export default function PermissionsSettingsPage() {
  const [selectedRole, setSelectedRole] = useState<RoleType>("owner");
  const [searchQuery, setSearchQuery] = useState("");
  const [rolePermissions, setRolePermissions] = useState<PermissionMatrix>(DEFAULT_PRESETS);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPermissions() {
      try {
        const saved = typeof window !== "undefined"
          ? window.localStorage.getItem(PERMISSION_STORAGE_KEY)
          : null;
        if (saved) {
          setRolePermissions(parsePermissionMatrix(saved));
        }
      } catch (err) {
        console.error("Error loading permissions from localStorage:", err);
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const query = user?.email ? `?email=${encodeURIComponent(user.email)}` : "";
        const res = await fetch(`/api/permissions${query}`, { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json?.success) {
          throw new Error(json?.error || "Failed to load permissions");
        }

        const nextPermissions = sanitizePermissionMatrix(json.matrix);
        if (!active) return;

        setRolePermissions(nextPermissions);
        syncLocalPermissions(nextPermissions);
      } catch (err) {
        console.error("Error loading permissions from API:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadPermissions();
    return () => {
      active = false;
    };
  }, []);

  // Filter permission items dynamically based on search query
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return MODULES;
    const query = searchQuery.toLowerCase();
    return MODULES.map((mod) => {
      const matchedPerms = mod.permissions.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
      return {
        ...mod,
        permissions: matchedPerms,
      };
    }).filter((mod) => mod.permissions.length > 0);
  }, [searchQuery]);

  const savePermissions = async (
    nextPermissions: PermissionMatrix,
    previousPermissions: PermissionMatrix,
    successMessage: string,
    errorMessage: string
  ) => {
    setRolePermissions(nextPermissions);
    syncLocalPermissions(nextPermissions);
    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const res = await fetch("/api/permissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user?.email ?? null,
          matrix: nextPermissions,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save permissions");
      }

      const persistedPermissions = sanitizePermissionMatrix(json.matrix);
      setRolePermissions(persistedPermissions);
      syncLocalPermissions(persistedPermissions);
      triggerToast(successMessage);
    } catch (err) {
      console.error("Error saving permissions:", err);
      setRolePermissions(previousPermissions);
      syncLocalPermissions(previousPermissions);
      triggerToast(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (role: RoleType, permissionId: string) => {
    // Owner is locked to true for safety
    if (role === "owner") {
      triggerToast("Owner permissions are locked to full access for security.");
      return;
    }

    if (isSaving || isLoading) {
      return;
    }

    const previousPermissions = rolePermissions;
    const nextPermissions = sanitizePermissionMatrix({
      ...rolePermissions,
      [role]: {
        ...rolePermissions[role],
        [permissionId]: !rolePermissions[role][permissionId],
      },
    });
    const roleLabel = ROLES.find(r => r.id === role)?.name || role;
    await savePermissions(
      nextPermissions,
      previousPermissions,
      `Updated ${roleLabel} permission toggle.`,
      `Failed to update ${roleLabel} permissions.`
    );
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    const id = setTimeout(() => {
      setShowToast((curr) => (curr === msg ? null : curr));
    }, 4000);
    return () => clearTimeout(id);
  };

  const handleResetToDefaults = async () => {
    if (isSaving || isLoading) {
      return;
    }

    await savePermissions(
      DEFAULT_PRESETS,
      rolePermissions,
      "Permissions reverted to system presets.",
      "Failed to reset permissions."
    );
  };

  return (
    <div className="relative space-y-10">
      
      {/* Page Header */}
      <div className="flex flex-col gap-3 pb-6 border-b border-zinc-200/60 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <LockClosedIcon className="h-5 w-5 text-teal-500" />
            Roles & Permissions
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Configure system capabilities for the available role templates and fine-tune application module access.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetToDefaults}
          disabled={isSaving || isLoading}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-250/60 bg-white/50 px-4 text-xs font-bold text-zinc-600 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-800 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ArrowPathIcon className={`h-3.5 w-3.5 ${(isSaving || isLoading) ? "animate-spin" : ""}`} />
          Reset Defaults
        </button>
      </div>

      {/* Role Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          <UserGroupIcon className="h-4 w-4" />
          Select Role Template
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.id;
            const Icon = role.icon;
            
            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all duration-300 cursor-pointer select-none overflow-hidden ${
                  isSelected
                    ? "border-teal-500 bg-white dark:bg-zinc-900 ring-2 ring-teal-500/10 scale-[1.01]"
                    : "border-zinc-200 bg-white/60 hover:border-zinc-300 hover:bg-white dark:border-white/[0.06] dark:bg-zinc-900/20 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/40"
                }`}
                style={{
                  boxShadow: isSelected ? `0 12px 24px -10px ${role.glowColor}` : undefined
                }}
              >
                {/* Accent glow on selected */}
                {isSelected && (
                  <div className={`absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br ${role.color} opacity-10 blur-xl -translate-y-8 translate-x-8`} />
                )}

                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br ${role.color} text-white shadow-sm`}>
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${role.bgSoft}`}>
                      {role.badge}
                    </span>
                  </div>

                  <div className="text-left">
                    <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {role.name}
                    </h3>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-zinc-450 dark:text-zinc-450">
                      {role.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-zinc-100 dark:border-white/5 pt-4 text-left relative z-10">
                  <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-2">Key Capabilities</span>
                  <ul className="space-y-1.5">
                    {role.capabilities.map((cap, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                        <CheckIcon className="h-3 w-3 text-teal-500 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="space-y-4">
        {/* Toolbar with Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-white/5 px-4 py-3 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-450 uppercase tracking-wider">Module Permissions Matrix</span>
            <div className="flex items-center gap-1.5 text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-500/10">
              <SparklesIcon className="h-3 w-3" />
              <span>Editing: {ROLES.find(r => r.id === selectedRole)?.name} view</span>
            </div>
          </div>
          
          <div className="relative max-w-xs w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-xl border border-zinc-250 bg-white pl-9 pr-4 text-xs font-medium text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:border-teal-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-650"
            />
          </div>
        </div>

        {/* Matrix Card / Table */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950/40">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left table-fixed">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:border-white/5 dark:bg-zinc-900/20">
                  <th className="px-6 py-4.5 font-bold w-[40%] text-zinc-500 dark:text-zinc-450">Capabilities & Scope</th>
                  {ROLES.map((role) => {
                    const isSelected = selectedRole === role.id;
                    return (
                      <th
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        className={`px-4 py-4.5 text-center font-bold transition-all cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-100 w-[15%] ${
                          isSelected ? "bg-teal-500/[0.04] text-teal-650 dark:text-teal-400 border-x border-teal-500/10 shadow-[inset_0_-2px_0_0_#0d9488]" : "text-zinc-400 dark:text-zinc-550"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{role.name}</span>
                          {isSelected && (
                            <span className="h-1 w-5 rounded-full bg-teal-500 mt-0.5 animate-pulse" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                {filteredModules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-zinc-400 dark:text-zinc-500 font-semibold">
                      <InformationCircleIcon className="h-6 w-6 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                      No permissions match your search query &ldquo;{searchQuery}&rdquo;
                    </td>
                  </tr>
                ) : (
                  filteredModules.map((module) => {
                    const ModIcon = module.icon;
                    return (
                      <Fragment key={module.id}>
                        {/* Module Header Row */}
                        <tr className="bg-stone-50/30 dark:bg-zinc-900/5">
                          <td colSpan={5} className="px-6 py-3 text-[10px] font-bold text-teal-650 dark:text-teal-450 uppercase tracking-widest bg-zinc-50/20 dark:bg-zinc-900/10">
                            <div className="flex items-center gap-2">
                              <ModIcon className="h-4 w-4 shrink-0 text-teal-500" />
                              <span>{module.name}</span>
                            </div>
                          </td>
                        </tr>
 
                        {/* Permission Items */}
                        {module.permissions.map((perm) => (
                          <tr key={perm.id} className="hover:bg-zinc-50/40 dark:hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col text-left">
                                <span className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200">
                                  {perm.name}
                                </span>
                                <span className="text-[10px] text-zinc-405 dark:text-zinc-500 mt-0.5 font-medium leading-relaxed">
                                  {perm.description}
                                </span>
                              </div>
                            </td>
                            {ROLES.map((role) => {
                              const isSelected = selectedRole === role.id;
                              const isEnabled = rolePermissions[role.id][perm.id] ?? false;
                              const isOwner = role.id === "owner";
                              
                              return (
                                <td
                                  key={role.id}
                                  className={`px-4 py-4 text-center transition-all ${
                                    isSelected ? "bg-teal-500/[0.02] dark:bg-teal-500/[0.01] border-x border-teal-500/5" : ""
                                  }`}
                                >
                                  <div className="flex justify-center">
                                    {isOwner ? (
                                      <div className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 dark:bg-teal-500/20 px-2 py-0.5 border border-teal-500/20 text-teal-600 dark:text-teal-400 shadow-sm cursor-not-allowed select-none">
                                        <LockClosedIcon className="h-3 w-3 shrink-0 text-teal-500" />
                                        <span className="text-[9px] font-extrabold uppercase tracking-wider">System</span>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleToggle(role.id, perm.id)}
                                        disabled={isSaving || isLoading}
                                        className={`relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full border transition-all duration-300 focus:outline-none hover:scale-[1.05] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${
                                          isEnabled
                                            ? "bg-gradient-to-r from-teal-500 to-emerald-500 border-teal-500/20 shadow-[0_0_8px_rgba(20,184,166,0.25)]"
                                            : "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-white/[0.08]"
                                        }`}
                                      >
                                        <span
                                          className={`pointer-events-none flex h-4.5 w-4.5 transform items-center justify-center rounded-full bg-white dark:bg-zinc-100 shadow-md ring-0 transition-transform duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                                            isEnabled ? "translate-x-[18px]" : "translate-x-[2px]"
                                          }`}
                                        >
                                          <span
                                            className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
                                              isEnabled ? "bg-teal-500" : "bg-zinc-300 dark:bg-zinc-550"
                                            }`}
                                          />
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating success toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 rounded-2xl border border-teal-500/10 bg-teal-600 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-teal-950/20"
          >
            <CheckIcon className="h-5 w-5 shrink-0 text-teal-200" />
            <span>{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
