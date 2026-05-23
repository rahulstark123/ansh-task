"use client";

import {
  HashtagIcon,
  LockClosedIcon,
  PlusIcon,
  FaceSmileIcon,
  PaperClipIcon,
  AtSymbolIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const getAvatarHsl = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 60%, 40%)`;
};


type ChatType = "channel" | "dm";

type ChatTarget = {
  id: string;
  name: string;
  type: ChatType;
  isPrivate?: boolean;
  topic?: string;
};

type Message = {
  id: string;
  user: string;
  time: string;
  content: string;
  avatarColor: string;
  initials: string;
};

const CHANNELS: ChatTarget[] = [
  { id: "c1", name: "general", type: "channel", topic: "Company-wide announcements and work-based matters" },
  { id: "c2", name: "engineering", type: "channel", topic: "Tech discussions, PRs, and deployments" },
  { id: "c3", name: "design", type: "channel", topic: "UI/UX, Figma links, and design system updates" },
  { id: "c4", name: "product", type: "channel", topic: "Roadmap planning and feature specs" },
  { id: "c5", name: "exec-updates", type: "channel", isPrivate: true, topic: "Leadership alignment" },
];

const DIRECT_MESSAGES: ChatTarget[] = [
  { id: "u1", name: "Alex Rivera", type: "dm", topic: "Product Manager" },
  { id: "u2", name: "Jordan Lee", type: "dm", topic: "Lead Designer" },
  { id: "u3", name: "Sam Chen", type: "dm", topic: "Senior Engineer" },
  { id: "u4", name: "Maya Patel", type: "dm", topic: "Marketing Director" },
];

const SEED_MESSAGES: Record<string, Message[]> = {
  "c2": [
    {
      id: "m1",
      user: "Sam Chen",
      initials: "SC",
      avatarColor: "bg-amber-600 text-amber-50",
      time: "9:42 AM",
      content: "Morning team! I just opened a PR for the new Task Dashboard layout. It fixes the Turbopack crashing issue we saw yesterday.",
    },
    {
      id: "m2",
      user: "Alex Rivera",
      initials: "AR",
      avatarColor: "bg-indigo-600 text-indigo-50",
      time: "9:45 AM",
      content: "Awesome, I'll take a look before standup. Did you manage to get the drag-and-drop working with HTML5?",
    },
    {
      id: "m3",
      user: "Sam Chen",
      initials: "SC",
      avatarColor: "bg-amber-600 text-amber-50",
      time: "9:47 AM",
      content: "Yes! Dropped the dnd-kit dependency entirely. The native HTML5 implementation is much smoother and entirely type-safe now. Feel free to test the edge cases.",
    },
    {
      id: "m4",
      user: "Jordan Lee",
      initials: "JL",
      avatarColor: "bg-purple-600 text-purple-50",
      time: "10:15 AM",
      content: "Design looks spot on. The new drawer interactions are buttery smooth. ✨",
    }
  ]
};

export function TeamSpaceView() {
  const [channels, setChannels] = useState<ChatTarget[]>(CHANNELS);
  const [dms, setDms] = useState<ChatTarget[]>(DIRECT_MESSAGES);
  const [activeChat, setActiveChat] = useState<ChatTarget>(channels[1]);
  const [messages, setMessages] = useState<Record<string, Message[]>>(SEED_MESSAGES);
  const [draft, setDraft] = useState("");
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [showNewDm, setShowNewDm] = useState(false);
  const [newDmName, setNewDmName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<{ name: string; initials: string } | null>(null);

  useEffect(() => {
    async function loadCurrentUserAndTeam() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Me";
          const initials = name
            .trim()
            .split(/\s+/)
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          setCurrentUser({ name, initials });

          const onboardingWid = sessionStorage.getItem("ansh_onboarding_wid");
          const wid = onboardingWid ? parseInt(onboardingWid, 10) : 1;
          const res = await fetch(`/api/team?email=${encodeURIComponent(user.email || "")}&wid=${wid}`);
          const json = await res.json();
          if (json.success && json.members) {
            const otherMembers = json.members.filter((u: any) => u.email !== user.email);
            if (otherMembers.length > 0) {
              const mapped = otherMembers.map((u: any) => {
                const memberName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email.split("@")[0];
                return {
                  id: u.id,
                  name: memberName,
                  type: "dm" as const,
                  topic: u.jobTitle || "Team Member",
                };
              });
              setDms(mapped);
            }
          }
        }
      } catch (err) {
        console.error("Error loading user and team in TeamSpaceView:", err);
      }
    }
    loadCurrentUserAndTeam();
  }, []);


  const activeMessages = messages[activeChat.id] || [];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, activeChat.id]);

  function handleSendMessage() {
    if (!draft.trim()) return;
    
    const newMessage: Message = {
      id: crypto.randomUUID(),
      user: currentUser?.name || "Me",
      initials: currentUser?.initials || "ME",
      avatarColor: "",
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      content: draft.trim(),
    };

    setMessages(prev => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMessage]
    }));
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.75rem)] w-full overflow-hidden bg-transparent dark:bg-zinc-950 font-sans">
      
      {/* 1. Internal Sidebar (Slack-style Channels & DMs) */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-300 bg-[#dfdeda]/90 dark:border-white/[0.06] dark:bg-[#1a1d21]">
        
        {/* Workspace Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200/80 px-4 dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
          <h2 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            ANSH Workspace
          </h2>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-white/10">
            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">ME</span>
          </div>
        </div>

        {/* Navigation Lists */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          
          {/* Channels Section */}
          <div className="mb-6 px-2">
            <div className="group flex items-center justify-between px-2 py-1">
              <span className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                Channels
              </span>
              <button
                type="button"
                onClick={() => { setShowNewChannel(true); setNewChannelName(""); }}
                className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-all"
                title="Add channel"
              >
                <PlusIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            
            {showNewChannel && (
              <div className="px-2 py-1 mb-1">
                <input
                  autoFocus
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newChannelName.trim()) {
                      const newChan: ChatTarget = { id: `c-${crypto.randomUUID()}`, name: newChannelName.trim().replace(/^#\s*/, ''), type: "channel" };
                      setChannels([...channels, newChan]);
                      setActiveChat(newChan);
                      setNewChannelName("");
                      setShowNewChannel(false);
                    } else if (e.key === "Escape") {
                      setShowNewChannel(false);
                    }
                  }}
                  onBlur={() => setShowNewChannel(false)}
                  placeholder="e.g. marketing"
                  className="w-full rounded-md bg-white px-2.5 py-1 text-[13px] outline-none border border-zinc-200 focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:bg-zinc-950/80 dark:border-zinc-800 dark:focus:border-teal-500 dark:focus:ring-teal-500 text-zinc-900 dark:text-zinc-100 shadow-sm transition-all"
                />
              </div>
            )}

            <div className="mt-1 space-y-0.5">
              {channels.map((channel) => {
                const isActive = activeChat.id === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChat(channel)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                      isActive
                        ? "bg-teal-50 text-teal-900 dark:bg-teal-900/30 dark:text-teal-100 font-semibold"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5 font-medium"
                    }`}
                  >
                    {channel.isPrivate ? (
                      <LockClosedIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "opacity-80" : "opacity-60"}`} />
                    ) : (
                      <HashtagIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "opacity-80" : "opacity-60"}`} />
                    )}
                    <span className="truncate">{channel.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div className="px-2">
            <div className="group flex items-center justify-between px-2 py-1">
              <span className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                Direct messages
              </span>
              <button
                type="button"
                onClick={() => { setShowNewDm(true); setNewDmName(""); }}
                className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-all"
                title="Add direct message"
              >
                <PlusIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {showNewDm && (
              <div className="px-2 py-1 mb-1">
                <input
                  autoFocus
                  type="text"
                  value={newDmName}
                  onChange={(e) => setNewDmName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newDmName.trim()) {
                      const newDm: ChatTarget = { id: `u-${crypto.randomUUID()}`, name: newDmName.trim(), type: "dm" };
                      setDms([...dms, newDm]);
                      setActiveChat(newDm);
                      setNewDmName("");
                      setShowNewDm(false);
                    } else if (e.key === "Escape") {
                      setShowNewDm(false);
                    }
                  }}
                  onBlur={() => setShowNewDm(false)}
                  placeholder="e.g. Maya Patel"
                  className="w-full rounded-md bg-white px-2.5 py-1 text-[13px] outline-none border border-zinc-200 focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:bg-zinc-950/80 dark:border-zinc-800 dark:focus:border-teal-500 dark:focus:ring-teal-500 text-zinc-900 dark:text-zinc-100 shadow-sm transition-all"
                />
              </div>
            )}

            <div className="mt-1 space-y-0.5">
              {dms.map((dm) => {
                const isActive = activeChat.id === dm.id;
                return (
                  <button
                    key={dm.id}
                    onClick={() => setActiveChat(dm)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                      isActive
                        ? "bg-teal-50 text-teal-900 dark:bg-teal-900/30 dark:text-teal-100 font-semibold"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5 font-medium"
                    }`}
                  >
                    <span 
                      className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: getAvatarHsl(dm.name) }}
                    >
                      {dm.name.split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      {/* Online dot indicator */}
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-500 dark:border-[#1a1d21]" />
                    </span>
                    <span className="truncate">{dm.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Chat Area */}
      <main className="flex min-w-0 flex-1 flex-col bg-zinc-50/70 backdrop-blur-md dark:bg-[#1a1d21]/40">
        
        {/* Chat Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-250 px-5 dark:border-white/[0.06] bg-white dark:bg-transparent shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="flex items-center gap-1.5 font-heading text-[15px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {activeChat.type === "channel" ? (
                activeChat.isPrivate ? <LockClosedIcon className="h-4 w-4 text-zinc-400" /> : <HashtagIcon className="h-4 w-4 text-zinc-400" />
              ) : null}
              {activeChat.name}
            </h1>
            {activeChat.topic && (
              <>
                <span className="hidden h-3 w-[1px] bg-zinc-300 dark:bg-zinc-700 sm:block" />
                <span className="hidden truncate text-xs text-zinc-500 dark:text-zinc-400 sm:block max-w-md">
                  {activeChat.topic}
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button className="rounded p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors">
              <MagnifyingGlassIcon className="h-4.5 w-4.5" />
            </button>
            <button className="rounded p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors">
              <InformationCircleIcon className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
          
          {/* Chat Beginning Empty State */}
          <div className="mb-8 mt-12 px-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
              {activeChat.type === "channel" ? (
                activeChat.isPrivate ? <LockClosedIcon className="h-6 w-6 text-zinc-600 dark:text-zinc-300" /> : <HashtagIcon className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
              ) : (
                <UserIcon className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
              )}
            </div>
            <h2 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {activeChat.type === "channel" ? "Welcome to " : "This is your conversation with "} 
              {activeChat.type === "channel" ? `#${activeChat.name}` : activeChat.name}!
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
              {activeChat.type === "channel" 
                ? `This is the start of the #${activeChat.name} channel. ${activeChat.topic || "Use this space for team updates and collaboration."}`
                : `This is the very beginning of your direct message history with ${activeChat.name}.`}
            </p>
          </div>

          {/* Messages */}
          <div className="space-y-1">
            {activeMessages.map((msg, idx) => {
              // Simple check to group messages from the same user if they are consecutive
              const prevMsg = idx > 0 ? activeMessages[idx - 1] : null;
              const isGrouped = prevMsg && prevMsg.user === msg.user && prevMsg.time === msg.time;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group flex gap-3 px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors rounded"
                >
                  {/* Avatar or Timestamp for grouped messages */}
                  <div className="w-9 shrink-0 flex justify-center mt-0.5">
                    {isGrouped ? (
                      <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                        {msg.time.split(" ")[0]}
                      </span>
                    ) : (
                      <div 
                        className={`flex h-9 w-9 items-center justify-center rounded text-[11px] font-bold shadow-sm ${msg.avatarColor}`}
                        style={msg.avatarColor ? {} : { backgroundColor: getAvatarHsl(msg.user), color: '#ffffff' }}
                      >
                        {msg.initials}
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="min-w-0 flex-1">
                    {!isGrouped && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100">
                          {msg.user}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-500">
                          {msg.time}
                        </span>
                      </div>
                    )}
                    <p className="text-[14px] leading-relaxed text-zinc-800 dark:text-zinc-300 mt-0.5 break-words">
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Composer */}
        <div className="shrink-0 px-5 pb-5 pt-2">
          <div className="rounded-xl border border-zinc-300 bg-white shadow-sm focus-within:border-[var(--app-primary)] focus-within:ring-1 focus-within:ring-[var(--app-primary)] dark:border-zinc-700 dark:bg-[#222529] dark:focus-within:border-teal-500 dark:focus-within:ring-teal-500 transition-all overflow-hidden flex flex-col">
            
            {/* Toolbar Top */}
            <div className="flex items-center gap-1 bg-zinc-50/50 px-2 py-1.5 border-b border-zinc-100 dark:bg-[#1a1d21]/50 dark:border-zinc-800/50">
              <button className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition-colors" title="Format">
                <span className="font-serif font-bold text-sm px-1">B</span>
              </button>
              <button className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition-colors" title="Italic">
                <span className="font-serif italic text-sm px-1">I</span>
              </button>
              <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700 mx-1" />
              <button className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition-colors" title="Attach file">
                <PaperClipIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Input Area */}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeChat.type === "channel" ? `#${activeChat.name}` : activeChat.name}`}
              className="w-full resize-none bg-transparent px-3 py-3 text-[14px] text-zinc-900 placeholder:text-zinc-500 outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500 max-h-48"
              rows={1}
              style={{ minHeight: "44px" }}
            />

            {/* Toolbar Bottom */}
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1">
                <button className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors" title="Add emoji">
                  <FaceSmileIcon className="h-4.5 w-4.5" />
                </button>
                <button className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors" title="Mention someone">
                  <AtSymbolIcon className="h-4.5 w-4.5" />
                </button>
              </div>
              
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!draft.trim()}
                className="flex items-center justify-center rounded-lg bg-[var(--app-primary)] p-1.5 text-white transition-all hover:bg-[var(--app-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <PaperAirplaneIcon className="h-4 w-4 -translate-y-[0.5px] translate-x-[0.5px]" />
              </button>
            </div>
          </div>
          
          <div className="mt-1.5 flex justify-end px-1">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
              <strong className="font-semibold">Return</strong> to send, <strong className="font-semibold">Shift + Return</strong> to add a new line
            </span>
          </div>
        </div>
      </main>

    </div>
  );
}
