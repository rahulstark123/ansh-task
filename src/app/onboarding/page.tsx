"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  UserIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  GlobeAltIcon,
  TagIcon,
  UsersIcon,
  ClipboardDocumentIcon,
  SparklesIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";

type Step = "profile" | "workspace" | "project" | "tasks" | "completing";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [loading, setLoading] = useState(false);
  const [dbResult, setDbResult] = useState<any>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [customJobTitle, setCustomJobTitle] = useState("");
  const [email, setEmail] = useState("ansh.user@example.com");
  const [jobTitle, setJobTitle] = useState("Product Manager");
  const [department, setDepartment] = useState("Product");
  
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSize, setWorkspaceSize] = useState("2-9 people");
  const [workspaceIndustry, setWorkspaceIndustry] = useState("Technology");
  
  const [projectName, setProjectName] = useState("");
  const [projectCategory, setProjectCategory] = useState("Product");
  const [projectPriority, setProjectPriority] = useState("High");

  const [task1, setTask1] = useState("");
  const [task2, setTask2] = useState("");
  const [task3, setTask3] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = sessionStorage.getItem("ansh_onboarding_name");
      if (savedName) {
        setFullName(savedName);
        setWorkspaceName(`${savedName}'s Workspace`);
      }
      const savedEmail = sessionStorage.getItem("ansh_onboarding_email");
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }
  }, []);

  const handleNextFromProfile = () => {
    if (!fullName.trim()) return;
    if (jobTitle === "Other" && !customJobTitle.trim()) return;
    if (!workspaceName) {
      setWorkspaceName(`${fullName}'s Workspace`);
    }
    setStep("workspace");
  };

  const handleNextFromWorkspace = () => {
    if (!workspaceName.trim()) return;
    if (!projectName) {
      setProjectName(`Launch ${workspaceIndustry} Project`);
    }
    setStep("project");
  };

  const handleNextFromProject = () => {
    if (!projectName.trim()) return;
    // Set some defaults for tasks if empty
    if (!task1) setTask1("Define roadmap & requirements");
    if (!task2) setTask2("Conduct stakeholder kickoff call");
    if (!task3) setTask3("Setup project boards & assign tasks");
    setStep("tasks");
  };

  const submitOnboarding = async (projName: string, taskList: string[]) => {
    setStep("completing");
    setLoading(true);

    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    let userId = undefined;
    if (typeof window !== "undefined") {
      userId = sessionStorage.getItem("ansh_onboarding_uid") || undefined;
    }

    const payload = {
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        jobTitle: jobTitle === "Other" ? customJobTitle : jobTitle,
        department,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${firstName}`,
      },
      workspace: {
        name: workspaceName,
        industry: workspaceIndustry,
        size: workspaceSize,
      },
      project: {
        name: projName,
        category: projectCategory,
        priority: projectPriority,
      },
      tasks: taskList.filter(Boolean)
    };

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      setDbResult(result);

      if (result?.success && typeof window !== "undefined") {
        const createdWorkspaceId = result?.data?.workspace?.id;
        const createdUserRole = result?.data?.user?.role;

        if (createdWorkspaceId) {
          sessionStorage.setItem("ansh_onboarding_wid", String(createdWorkspaceId));
        }
        if (createdUserRole) {
          sessionStorage.setItem("ansh_user_role", String(createdUserRole).toLowerCase());
        } else {
          sessionStorage.setItem("ansh_user_role", "owner");
        }
      }
      
      // Keep loader spinning for 3.5 seconds to make the UI transition extremely premium and clear
      setTimeout(() => {
        setLoading(false);
      }, 3500);
    } catch (err) {
      console.error(err);
      setTimeout(() => {
        setLoading(false);
      }, 3500);
    }
  };

  const handleFinish = async () => {
    await submitOnboarding(projectName, [task1, task2, task3]);
  };

  const handleSkipProject = async () => {
    await submitOnboarding("General Tasks", ["Welcome to ANSH Task!"]);
  };

  const stepIndex = () => {
    switch (step) {
      case "profile": return 1;
      case "workspace": return 2;
      case "project": return 3;
      case "tasks": return 4;
      default: return 5;
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50/50 dark:bg-zinc-950">
      
      {/* Onboarding Banner Card (Left Column) */}
      <div className="relative hidden w-[32rem] shrink-0 border-r border-zinc-200/80 bg-white p-12 lg:flex lg:flex-col lg:justify-between dark:border-white/5 dark:bg-zinc-900/30">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-lg font-black text-white shadow-md shadow-teal-500/20">
              A
            </div>
            <span className="font-heading text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              ANSH Task
            </span>
          </div>

          <div className="space-y-4">
            <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
              Step {stepIndex()} of 4 · SETUP WIZARD
            </span>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
              Let's customize your workspace experience
            </h1>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              We adjust your notification thresholds, priority rules, and UI accent presets to match your workflow profile.
            </p>
          </div>
        </div>

        {/* Live checklist status indicator */}
        <div className="space-y-4 py-8">
          {[
            { id: "profile", label: "Personal profile details" },
            { id: "workspace", label: "Workspace name & industry" },
            { id: "project", label: "First collaborative project" },
            { id: "tasks", label: "Initial backlog seed tasks" },
          ].map((s, idx) => {
            const isCompleted = stepIndex() > idx + 1;
            const isActive = stepIndex() === idx + 1;

            return (
              <div key={s.id} className="flex items-center gap-3">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold transition-all ${
                  isCompleted 
                    ? "bg-teal-500 border-teal-500 text-white" 
                    : isActive
                      ? "bg-white border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                      : "bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:border-white/5"
                }`}>
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span className={`text-xs font-semibold ${
                  isActive || isCompleted 
                    ? "text-zinc-800 dark:text-zinc-200" 
                    : "text-zinc-400"
                }`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
          © 2026 ANSH Enterprise. All rights reserved.
        </p>
      </div>

      {/* Main interactive form card (Right Column) */}
      <div className="flex flex-1 items-center justify-center p-8 sm:p-12 lg:p-20">
        <div className="w-full max-w-xl">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Profile Details */}
            {step === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="font-heading text-2xl font-black text-zinc-900 dark:text-zinc-50">
                    Create your profile
                  </h2>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Enter your name and workspace title so colleagues can identify you.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="Alex Rivera"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900/50 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                      Your Job Title
                    </label>
                    <div className="relative">
                      <BriefcaseIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400 z-10" />
                      <select
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        style={{ colorScheme: "light dark" }}
                        className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-9 pr-10 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200 appearance-none relative"
                      >
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Founder / CEO">Founder / CEO</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Product Manager">Product Manager</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Software Engineer">Software Engineer</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Designer">Designer</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Operations Lead">Operations Lead</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Other">Other Role</option>
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                      Department
                    </label>
                    <div className="relative">
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        style={{ colorScheme: "light dark" }}
                        className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-3 pr-10 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200 appearance-none relative"
                      >
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Product">Product</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Design">Design</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Engineering">Engineering</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Marketing">Marketing</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Sales">Sales</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Operations">Operations</option>
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    </div>
                  </div>
                </div>

                {jobTitle === "Other" && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Please specify your role
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., QA Specialist, Support Lead"
                      value={customJobTitle}
                      onChange={(e) => setCustomJobTitle(e.target.value)}
                      className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 outline-none focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900/50 dark:text-zinc-100"
                    />
                  </motion.div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    disabled={!fullName.trim() || (jobTitle === "Other" && !customJobTitle.trim())}
                    onClick={handleNextFromProfile}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-6 text-xs font-bold text-white shadow-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                  >
                    Continue
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Workspace details */}
            {step === "workspace" && (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="font-heading text-2xl font-black text-zinc-900 dark:text-zinc-50">
                    Setup your Workspace
                  </h2>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Give your organization environment a name. You can invite your team to join this space later.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Workspace Name
                  </label>
                  <div className="relative">
                    <BuildingOffice2Icon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="My Workspace"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900/50 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                      Workspace Size
                    </label>
                    <div className="relative">
                      <UsersIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400 z-10" />
                      <select
                        value={workspaceSize}
                        onChange={(e) => setWorkspaceSize(e.target.value)}
                        style={{ colorScheme: "light dark" }}
                        className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-9 pr-10 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200 appearance-none relative"
                      >
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Only me">Only me</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="2-9 people">2-9 people</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="10-49 people">10-49 people</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="50+ people">50+ people</option>
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                      Primary Industry
                    </label>
                    <div className="relative">
                      <select
                        value={workspaceIndustry}
                        onChange={(e) => setWorkspaceIndustry(e.target.value)}
                        style={{ colorScheme: "light dark" }}
                        className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-3 pr-10 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200 appearance-none relative"
                      >
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Technology">Technology & SaaS</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Marketing">Marketing Agency</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Healthcare">Healthcare</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Finance">Finance & Banking</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Education">Education</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="General">General / Other</option>
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setStep("profile")}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/5 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    disabled={!workspaceName.trim()}
                    onClick={handleNextFromWorkspace}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-6 text-xs font-bold text-white shadow-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                  >
                    Continue
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Define your first project */}
            {step === "project" && (
              <motion.div
                key="project"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="font-heading text-2xl font-black text-zinc-900 dark:text-zinc-50">
                    Start a Project
                  </h2>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    What is something your team is planning or actively building? We will create a Kanban board for this.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Project Name
                  </label>
                  <div className="relative">
                    <TagIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Website Redesign"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900/50 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={projectCategory}
                        onChange={(e) => setProjectCategory(e.target.value)}
                        style={{ colorScheme: "light dark" }}
                        className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-3 pr-10 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200 appearance-none relative"
                      >
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Product">Product Management</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Engineering">Engineering</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Design">Design</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Marketing">Marketing</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Operations">Operations</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="General">General</option>
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                      Priority Level
                    </label>
                    <div className="relative">
                      <select
                        value={projectPriority}
                        onChange={(e) => setProjectPriority(e.target.value)}
                        style={{ colorScheme: "light dark" }}
                        className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-3 pr-10 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200 appearance-none relative"
                      >
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Urgent">Urgent</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="High">High</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Normal">Normal</option>
                        <option className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" value="Low">Low</option>
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    onClick={() => setStep("workspace")}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/5 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Back
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSkipProject}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white hover:bg-stone-100 px-5 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:border-white/5 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      Skip this step
                    </button>
                    <button
                      disabled={!projectName.trim()}
                      onClick={handleNextFromProject}
                      className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-6 text-xs font-bold text-white shadow-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                    >
                      Continue
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Seed Tasks */}
            {step === "tasks" && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="font-heading text-2xl font-black text-zinc-900 dark:text-zinc-50">
                    Add initial tasks
                  </h2>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Break your project down into some starter task titles. These will seed your new task list.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                      Task 1
                    </label>
                    <div className="relative">
                      <ClipboardDocumentIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Define roadmap & requirements"
                        value={task1}
                        onChange={(e) => setTask1(e.target.value)}
                        className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900/50 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                      Task 2 (Optional)
                    </label>
                    <div className="relative">
                      <ClipboardDocumentIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Conduct stakeholder kickoff call"
                        value={task2}
                        onChange={(e) => setTask2(e.target.value)}
                        className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900/50 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                      Task 3 (Optional)
                    </label>
                    <div className="relative">
                      <ClipboardDocumentIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Setup project boards & assign tasks"
                        value={task3}
                        onChange={(e) => setTask3(e.target.value)}
                        className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs font-semibold text-zinc-800 outline-none focus:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-900/50 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setStep("project")}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/5 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    onClick={handleFinish}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-teal-500 px-6 text-xs font-bold text-white shadow-md hover:bg-teal-600 dark:bg-teal-500 dark:text-white dark:hover:bg-teal-600"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    Build My Workspace
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Completing Setup Loader */}
            {step === "completing" && (
              <motion.div
                key="completing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                {loading ? (
                  <>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/20 text-teal-500">
                      <ArrowPathIcon className="h-8 w-8 animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        Configuring your custom environment...
                      </h3>
                      <p className="max-w-xs mx-auto text-xs text-zinc-400 leading-relaxed dark:text-zinc-500">
                        Inserting schema records, setting up workspace templates, and preparing database transactions.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
                      <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        Workspace Provisioned!
                      </h3>
                      <p className="max-w-xs mx-auto text-xs text-zinc-400 leading-relaxed dark:text-zinc-500">
                        {dbResult?.message || "Onboarding completed successfully!"}
                      </p>
                    </div>
                    
                    <div className="pt-4">
                      <button
                        onClick={() => router.push("/dashboard")}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-8 text-xs font-bold text-white shadow-md hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                      >
                        Enter Workspace
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
      
    </div>
  );
}
