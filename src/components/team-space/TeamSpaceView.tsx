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
  XMarkIcon,
  CheckIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
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

/** Default channels seeded into the DB when a workspace has none yet. */
const SEED_CHANNELS: ChatTarget[] = [
  { id: "seed-general", name: "general", type: "channel", topic: "Company-wide announcements and work-based matters" },
  { id: "seed-engineering", name: "engineering", type: "channel", topic: "Tech discussions, PRs, and deployments" },
  { id: "seed-design", name: "design", type: "channel", topic: "UI/UX, Figma links, and design system updates" },
  { id: "seed-product", name: "product", type: "channel", topic: "Roadmap planning and feature specs" },
  { id: "seed-exec", name: "exec-updates", type: "channel", isPrivate: true, topic: "Leadership alignment" },
];

export function TeamSpaceView() {
  const [channels, setChannels] = useState<ChatTarget[]>([]);
  const [dms, setDms] = useState<ChatTarget[]>([]);
  const [activeChat, setActiveChat] = useState<ChatTarget | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [workspaceMembers, setWorkspaceMembers] = useState<{ id: string; name: string; email: string; jobTitle?: string }[]>([]);

  // Modals state
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelTopic, setNewChannelTopic] = useState("");
  const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showNewDmModal, setShowNewDmModal] = useState(false);

  // Edit/Delete Channel Modal and Menu states
  const [activeChannelMenuId, setActiveChannelMenuId] = useState<string | null>(null);
  const [showEditChannelModal, setShowEditChannelModal] = useState(false);
  const [editChannelId, setEditChannelId] = useState("");
  const [editChannelName, setEditChannelName] = useState("");
  const [editChannelTopic, setEditChannelTopic] = useState("");
  const [editChannelIsPrivate, setEditChannelIsPrivate] = useState(false);
  const [editChannelMembers, setEditChannelMembers] = useState<string[]>([]);
  const [memberSearchCreate, setMemberSearchCreate] = useState("");
  const [memberSearchEdit, setMemberSearchEdit] = useState("");

  const [showDeleteChannelModal, setShowDeleteChannelModal] = useState(false);
  const [deleteChannelId, setDeleteChannelId] = useState("");
  const [deleteChannelName, setDeleteChannelName] = useState("");
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  // Formatting / Composer Rich states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionTriggerIdx, setMentionTriggerIdx] = useState(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; initials: string; email: string } | null>(null);

  // Custom states for resolved workspace and side details drawer
  const [resolvedWorkspaceId, setResolvedWorkspaceId] = useState<number>(1);
  const [activeMentionIdx, setActiveMentionIdx] = useState<number>(0);
  const [showRightDrawer, setShowRightDrawer] = useState<boolean>(false);
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false);
  const [channelDetails, setChannelDetails] = useState<any>(null);
  const [memberDetails, setMemberDetails] = useState<any>(null);

  // Fetch channels from database API
  async function loadChannels(workspaceId: number, email?: string) {
    try {
      const emailQuery = email ? `&email=${encodeURIComponent(email)}` : "";
      const res = await fetch(`/api/channel?wid=${workspaceId}${emailQuery}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.channels) && json.channels.length > 0) {
        const mapped = json.channels.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: "channel" as const,
          topic: c.topic || undefined,
          isPrivate: c.isPrivate,
        }));
        setChannels(mapped);
        const defaultActive = mapped.find((m: any) => m.name === "general") || mapped[0];
        setActiveChat(defaultActive);
      } else {
        // Seed default channels in DB if empty
        const created: ChatTarget[] = [];
        for (const ch of SEED_CHANNELS) {
          const seedRes = await fetch("/api/channel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: ch.name,
              topic: ch.topic,
              isPrivate: ch.isPrivate,
              workspaceId: workspaceId,
              email: email || null,
            }),
          });
          const seedJson = await seedRes.json();
          if (seedJson.success && seedJson.channel) {
            created.push({
              id: seedJson.channel.id,
              name: seedJson.channel.name,
              type: "channel",
              topic: seedJson.channel.topic || undefined,
              isPrivate: seedJson.channel.isPrivate,
            });
          }
        }
        if (created.length > 0) {
          setChannels(created);
          const defaultActive = created.find((m: any) => m.name === "general") || created[0];
          setActiveChat(defaultActive);
        }
      }
    } catch (err) {
      console.error("Error loading channels:", err);
    }
  }

  // Fetch messages from database API
  async function loadChatMessages(chatId: string, chatType: ChatType, email: string, workspaceId: number) {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/message?chatId=${chatId}&type=${chatType}&email=${encodeURIComponent(email)}&workspaceId=${workspaceId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.messages)) {
        const mapped = json.messages.map((m: any) => {
          const senderName = `${m.sender.firstName || ""} ${m.sender.lastName || ""}`.trim() || m.sender.email.split("@")[0];
          const initials = senderName.split(/\s+/).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
          const timeString = new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          return {
            id: m.id,
            user: senderName,
            initials,
            avatarColor: "",
            time: timeString,
            content: m.content
          };
        });
        setMessages(mapped);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Error loading chat messages:", err);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }

  // Load chat messages when activeChat or user workspace session updates
  useEffect(() => {
    if (!currentUser?.email || !activeChat?.id) {
      setMessages([]);
      return;
    }
    setMessages([]);
    loadChatMessages(activeChat.id, activeChat.type, currentUser.email, resolvedWorkspaceId);
  }, [activeChat?.id, activeChat?.type, currentUser?.email, resolvedWorkspaceId]);

  // Load current user and team
  useEffect(() => {
    async function loadCurrentUserAndTeam() {
      setIsInitializing(true);
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
          setCurrentUser({ name, initials, email: user.email || "" });

          const onboardingWid = sessionStorage.getItem("ansh_onboarding_wid");
          const wid = onboardingWid ? parseInt(onboardingWid, 10) : 1;
          const res = await fetch(`/api/team?email=${encodeURIComponent(user.email || "")}&wid=${wid}`);
          const json = await res.json();
          if (json.success && json.members) {
            // All members mapping for autocomplete list (including current user)
            const allMembersMapped = json.members.map((u: any) => {
              const memberName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email.split("@")[0];
              return {
                id: u.id,
                name: memberName,
                email: u.email,
                jobTitle: u.jobTitle || "Team Member"
              };
            });
            setWorkspaceMembers(allMembersMapped);

            // DMs list contains only OTHER members
            const otherMembers = json.members.filter((u: any) => u.email !== user.email);
            const mappedDms = otherMembers.map((m: any) => {
              const memberName = `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email.split("@")[0];
              return {
                id: m.id,
                name: memberName,
                type: "dm" as const,
                topic: m.jobTitle || "Team Member"
              };
            });
            setDms(mappedDms);

            const activeWid = json.workspaceId || wid;
            setResolvedWorkspaceId(activeWid);
            await loadChannels(activeWid, user.email || "");
          }
        }
      } catch (err) {
        console.error("Error loading user and team in TeamSpaceView:", err);
      } finally {
        setIsInitializing(false);
      }
    }
    loadCurrentUserAndTeam();
  }, []);

  // Fetch right side profile details when open or activeChat changes
  useEffect(() => {
    if (!showRightDrawer || !activeChat) return;
    const chat = activeChat;

    async function loadRightDrawerDetails() {
      setDrawerLoading(true);
      try {
        if (chat.type === "channel") {
          const res = await fetch(`/api/channel?id=${chat.id}`);
          const json = await res.json();
          if (json.success && json.channel) {
            setChannelDetails(json.channel);
          } else {
            setChannelDetails({
              name: chat.name,
              topic: chat.topic || "No topic set",
              isPrivate: chat.isPrivate || false,
              createdAt: new Date().toISOString()
            });
          }
        } else if (chat.type === "dm") {
          const res = await fetch(`/api/profile?id=${chat.id}`);
          const json = await res.json();
          if (json.success && json.user) {
            setMemberDetails(json.user);
          } else {
            const matched = workspaceMembers.find(m => m.id === chat.id);
            if (matched) {
              setMemberDetails({
                firstName: matched.name.split(" ")[0],
                lastName: matched.name.split(" ")[1] || "",
                email: matched.email,
                jobTitle: matched.jobTitle,
              });
            } else {
              setMemberDetails({
                firstName: chat.name,
                lastName: "",
                jobTitle: "Team Member"
              });
            }
          }
        }
      } catch (err) {
        console.error("Error loading drawer details:", err);
      } finally {
        setDrawerLoading(false);
      }
    }
    loadRightDrawerDetails();
  }, [activeChat?.id, activeChat?.type, showRightDrawer, workspaceMembers]);

  // Fetch details for editing when edit modal opens
  useEffect(() => {
    if (!showEditChannelModal || !editChannelId) return;

    async function loadChannelDetailsForEdit() {
      try {
        const res = await fetch(`/api/channel?id=${editChannelId}`);
        const json = await res.json();
        if (json.success && json.channel) {
          setEditChannelTopic(json.channel.topic || "");
          if (json.channel.members) {
            const memberIds = json.channel.members.map((m: any) => m.userId);
            setEditChannelMembers(memberIds);
          }
        }
      } catch (err) {
        console.error("Error loading channel details for edit:", err);
      }
    }
    loadChannelDetailsForEdit();
  }, [showEditChannelModal, editChannelId]);

  const activeMessages = messages;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeChat?.id]);

  async function handleSendMessage() {
    if (!draft.trim() || !currentUser || !activeChat) return;
    
    const draftText = draft.trim();
    setDraft("");

    // Optimistic UI update
    const tempId = crypto.randomUUID();
    const optimisticMessage: Message = {
      id: tempId,
      user: currentUser.name,
      initials: currentUser.initials,
      avatarColor: "opacity-60",
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      content: draftText,
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: draftText,
          type: activeChat.type,
          targetId: activeChat.id,
          email: currentUser.email,
          workspaceId: resolvedWorkspaceId
        })
      });

      const json = await res.json();
      if (json.success && json.message) {
        const m = json.message;
        const senderName = `${m.sender.firstName || ""} ${m.sender.lastName || ""}`.trim() || m.sender.email.split("@")[0];
        const initials = senderName.split(/\s+/).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
        const timeString = new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        
        const realMessage: Message = {
          id: m.id,
          user: senderName,
          initials,
          avatarColor: "",
          time: timeString,
          content: m.content
        };

        setMessages(prev => prev.map(msg => msg.id === tempId ? realMessage : msg));
      } else {
        console.error("Failed to save message:", json.error);
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showMentionMenu && filteredTeammates.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveMentionIdx((prev) => (prev + 1) % filteredTeammates.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveMentionIdx((prev) => (prev - 1 + filteredTeammates.length) % filteredTeammates.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        insertMention(filteredTeammates[activeMentionIdx].name);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionMenu(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  // Insert Rich Text Formatting
  const insertFormatting = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);
    const replacement = prefix + (selectedText || "") + suffix;
    setDraft(before + replacement + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText ? selectedText.length : 0));
    }, 50);
  };

  // Insert Emojis
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setDraft(prev => prev + emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    setDraft(before + emoji + after);
    setShowEmojiPicker(false);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 50);
  };

  // Autocomplete Mentions
  const handleDraftChange = (val: string) => {
    setDraft(val);
    const cursorIdx = textareaRef.current?.selectionStart ?? val.length;
    const textBeforeCursor = val.substring(0, cursorIdx);
    const atIdx = textBeforeCursor.lastIndexOf("@");
    
    if (atIdx !== -1 && (atIdx === 0 || /\s/.test(textBeforeCursor[atIdx - 1]))) {
      const search = textBeforeCursor.substring(atIdx + 1);
      if (!/\s/.test(search)) {
        setShowMentionMenu(true);
        setMentionSearch(search);
        setMentionTriggerIdx(atIdx);
        setActiveMentionIdx(0);
        return;
      }
    }
    setShowMentionMenu(false);
  };

  const insertMention = (memberName: string) => {
    const val = draft;
    const triggerIdx = mentionTriggerIdx !== -1 ? mentionTriggerIdx : (textareaRef.current?.selectionStart ?? val.length);
    const cursorIdx = textareaRef.current?.selectionStart ?? val.length;
    const before = val.substring(0, triggerIdx);
    const after = val.substring(cursorIdx);
    const replacement = `@${memberName} `;
    setDraft(before + replacement + after);
    setShowMentionMenu(false);
    setMentionTriggerIdx(-1);
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = triggerIdx + replacement.length;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handleAtClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const before = draft.substring(0, pos);
    const after = draft.substring(pos);
    setDraft(before + "@" + after);
    setShowMentionMenu(true);
    setMentionSearch("");
    setMentionTriggerIdx(pos);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(pos + 1, pos + 1);
    }, 50);
  };

  const filteredTeammates = workspaceMembers.filter((m) =>
    m.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleCreateChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newChannelName.trim();
    if (!name) return;

    try {
      const onboardingWid = sessionStorage.getItem("ansh_onboarding_wid");
      const wid = onboardingWid ? parseInt(onboardingWid, 10) : 1;
      const res = await fetch("/api/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          topic: newChannelTopic.trim() || null,
          isPrivate: newChannelIsPrivate,
          workspaceId: wid,
          email: currentUser?.email || null,
          memberIds: newChannelIsPrivate ? selectedMembers : [],
        }),
      });
      const json = await res.json();
      if (json.success && json.channel) {
        const newChan: ChatTarget = {
          id: json.channel.id,
          name: json.channel.name,
          type: "channel",
          topic: json.channel.topic || undefined,
          isPrivate: json.channel.isPrivate,
        };
        setChannels(prev => [...prev, newChan]);
        setActiveChat(newChan);
        setNewChannelName("");
        setNewChannelTopic("");
        setNewChannelIsPrivate(false);
        setSelectedMembers([]);
        setShowNewChannelModal(false);
      }
    } catch (err) {
      console.error("Error creating channel:", err);
    }
  };

  const handleEditChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = editChannelName.trim();
    if (!name || !editChannelId) return;

    try {
      const res = await fetch("/api/channel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editChannelId,
          name,
          topic: editChannelTopic.trim() || null,
          isPrivate: editChannelIsPrivate,
          email: currentUser?.email || null,
          memberIds: editChannelIsPrivate ? editChannelMembers : [],
        }),
      });
      const json = await res.json();
      if (json.success && json.channel) {
        const updated: ChatTarget = {
          id: json.channel.id,
          name: json.channel.name,
          type: "channel",
          topic: json.channel.topic || undefined,
          isPrivate: json.channel.isPrivate,
        };
        setChannels(prev => prev.map(c => c.id === editChannelId ? updated : c));
        if (activeChat?.id === editChannelId) {
          setActiveChat(updated);
        }
        
        // Refresh details drawer if open
        if (showRightDrawer && activeChat?.id === editChannelId) {
          const detailRes = await fetch(`/api/channel?id=${editChannelId}`);
          const detailJson = await detailRes.json();
          if (detailJson.success && detailJson.channel) {
            setChannelDetails(detailJson.channel);
          }
        }

        setShowEditChannelModal(false);
      }
    } catch (err) {
      console.error("Error editing channel:", err);
    }
  };

  const handleDeleteChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isConfirmed = deleteConfirmationText === deleteChannelName || deleteConfirmationText === `#${deleteChannelName}`;
    if (!deleteChannelId || !isConfirmed) return;

    try {
      const res = await fetch(`/api/channel?id=${deleteChannelId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        const remaining = channels.filter(c => c.id !== deleteChannelId);
        setChannels(remaining);

        if (activeChat?.id === deleteChannelId) {
          const fallback = remaining.find(c => c.name === "general") || remaining[0];
          setActiveChat(fallback ?? null);
        }
        setShowDeleteChannelModal(false);
      }
    } catch (err) {
      console.error("Error deleting channel:", err);
    }
  };

  const handleCreateDm = (member: { id: string; name: string; jobTitle?: string }) => {
    const existing = dms.find((d) => d.id === member.id || d.name === member.name);
    if (existing) {
      setActiveChat(existing);
    } else {
      const newDm: ChatTarget = {
        id: member.id,
        name: member.name,
        type: "dm",
        topic: member.jobTitle || "Team Member",
      };
      setDms(prev => [...prev, newDm]);
      setActiveChat(newDm);
    }
    setShowNewDmModal(false);
  };

  // Custom Rich Text Formatter
  function formatMessageContent(content: string) {
    let safe = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Bold: **text** -> <strong>text</strong>
    safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Italic: *text* -> <em>text</em>
    safe = safe.replace(/\*(.*?)\*/g, "<em>$1</em>");
    
    // Mentions highlighting
    workspaceMembers.forEach((m) => {
      const escapedName = m.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`@${escapedName}\\b`, 'g');
      safe = safe.replace(regex, `<span class="bg-teal-500/15 text-teal-600 dark:text-teal-300 font-bold px-1.5 py-0.5 rounded">@${m.name}</span>`);
    });
    if (currentUser) {
      const escapedName = currentUser.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`@${escapedName}\\b`, 'g');
      safe = safe.replace(regex, `<span class="bg-teal-500/15 text-teal-600 dark:text-teal-300 font-bold px-1.5 py-0.5 rounded">@${currentUser.name}</span>`);
    }

    return <span dangerouslySetInnerHTML={{ __html: safe }} />;
  }

  return (
    <div className="flex h-[calc(100vh-3.75rem)] w-full overflow-hidden bg-[#f0f0f4] dark:bg-zinc-950 font-sans relative">
      
      {/* 1. Internal Sidebar (Slack-style Channels & DMs) */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-300/80 bg-[#e6e6eb] dark:border-white/[0.06] dark:bg-[#1a1d21]">
        
        {/* Workspace Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200/80 px-4 dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
          <h2 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            ANSH Workspace
          </h2>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-white/10">
            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">{currentUser?.initials || "ME"}</span>
          </div>
        </div>

        {/* Navigation Lists */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          
          {/* Channels Section */}
          <div className="mb-6 px-2">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Channels
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowNewChannelModal(true);
                  setNewChannelName("");
                  setNewChannelTopic("");
                  setNewChannelIsPrivate(false);
                  setMemberSearchCreate("");
                  setSelectedMembers([]);
                }}
                className="flex items-center justify-center h-5 w-5 rounded-md border border-zinc-250 bg-white/60 text-[var(--app-primary)] shadow-sm hover:bg-white hover:text-[var(--app-primary-hover)] dark:border-white/5 dark:bg-white/[0.04] dark:text-teal-400 dark:hover:bg-white/[0.08] dark:hover:text-teal-300 transition-all cursor-pointer"
                title="Add channel"
              >
                <PlusIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-1 space-y-0.5">
              {isInitializing ? (
                <div className="space-y-1.5 px-1 py-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 rounded-md bg-zinc-200/70 animate-pulse dark:bg-white/10" />
                  ))}
                </div>
              ) : channels.length === 0 ? (
                <p className="px-2 py-1 text-[11px] text-zinc-500 dark:text-zinc-400">No channels yet</p>
              ) : (
              channels.map((channel) => {
                const isActive = activeChat?.id === channel.id;
                const isMenuOpen = activeChannelMenuId === channel.id;

                return (
                  <div
                    key={channel.id}
                    className="group relative flex items-center justify-between rounded-md transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveChat(channel)}
                      className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-left transition-colors truncate ${
                        isActive
                          ? "bg-teal-50 text-teal-900 dark:bg-teal-900/30 dark:text-teal-100 font-semibold"
                          : "text-zinc-650 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5 font-medium"
                      }`}
                    >
                      {channel.isPrivate ? (
                        <LockClosedIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "opacity-80" : "opacity-60"}`} />
                      ) : (
                        <HashtagIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "opacity-80" : "opacity-60"}`} />
                      )}
                      <span className="truncate pr-6">{channel.name}</span>
                    </button>

                    {/* Options Menu Trigger */}
                    <div className="absolute right-1 flex items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveChannelMenuId(isMenuOpen ? null : channel.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 p-0.5 rounded text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 transition-all cursor-pointer"
                        title="Channel Actions"
                      >
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </button>

                      {/* Floating Options Dropdown */}
                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveChannelMenuId(null)} />
                          <div className="absolute right-0 top-6 z-50 w-32 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setEditChannelId(channel.id);
                                setEditChannelName(channel.name);
                                setEditChannelTopic(channel.topic || "");
                                setEditChannelIsPrivate(channel.isPrivate || false);
                                setMemberSearchEdit("");
                                setEditChannelMembers([]);
                                setShowEditChannelModal(true);
                                setActiveChannelMenuId(null);
                              }}
                              className="flex w-full items-center px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              Edit Channel
                            </button>
                            <button
                              type="button"
                              disabled={channel.name === "general"}
                              onClick={() => {
                                setDeleteChannelId(channel.id);
                                setDeleteChannelName(channel.name);
                                setDeleteConfirmationText("");
                                setShowDeleteChannelModal(true);
                                setActiveChannelMenuId(null);
                              }}
                              className="flex w-full items-center px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-zinc-50 dark:text-rose-400 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Delete Channel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div className="px-2">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Direct messages
              </span>
              <button
                type="button"
                onClick={() => setShowNewDmModal(true)}
                className="flex items-center justify-center h-5 w-5 rounded-md border border-zinc-250 bg-white/60 text-[var(--app-primary)] shadow-sm hover:bg-white hover:text-[var(--app-primary-hover)] dark:border-white/5 dark:bg-white/[0.04] dark:text-teal-400 dark:hover:bg-white/[0.08] dark:hover:text-teal-300 transition-all cursor-pointer"
                title="Add direct message"
              >
                <PlusIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-1 space-y-0.5">
              {isInitializing ? (
                <div className="space-y-1.5 px-1 py-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 rounded-md bg-zinc-200/70 animate-pulse dark:bg-white/10" />
                  ))}
                </div>
              ) : dms.length === 0 ? (
                <p className="px-2 py-1 text-[11px] text-zinc-500 dark:text-zinc-400">No teammates to message</p>
              ) : (
                dms.map((dm) => {
                  const isActive = activeChat?.id === dm.id;
                  return (
                    <button
                      key={dm.id}
                      onClick={() => setActiveChat(dm)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                        isActive
                          ? "bg-teal-50 text-teal-900 dark:bg-teal-950/30 dark:text-teal-100 font-semibold"
                          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5 font-medium"
                      }`}
                    >
                      <span 
                        className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: getAvatarHsl(dm.name) }}
                      >
                        {dm.name.split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-500 dark:border-[#1a1d21]" />
                      </span>
                      <span className="truncate">{dm.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Chat Area */}
      <main className="flex min-w-0 flex-1 flex-col bg-white dark:bg-[#1a1d21] relative text-left">
        {isInitializing ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading team space…</p>
          </div>
        ) : !activeChat ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No channel selected</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Sign in or create a channel to get started.</p>
          </div>
        ) : (
        <>
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
            <button className="rounded p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-650 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer">
              <MagnifyingGlassIcon className="h-4.5 w-4.5" />
            </button>
            <button 
              type="button"
              onClick={() => setShowRightDrawer(!showRightDrawer)}
              className={`rounded p-2 transition-colors cursor-pointer ${showRightDrawer ? "bg-teal-50 text-teal-650 dark:bg-teal-950/30 dark:text-teal-350 font-semibold" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-650 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"}`}
              title="Show Details"
            >
              <InformationCircleIcon className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* Chat background decoration */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
          <svg className="absolute inset-0 h-full w-full opacity-[0.045] dark:opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="chat-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#chat-dots)" className="text-zinc-600 dark:text-zinc-300" />
          </svg>
          <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-teal-400/10 dark:bg-teal-500/10 blur-[72px]" />
          <div className="absolute -bottom-32 -left-32 h-[360px] w-[360px] rounded-full bg-violet-400/6 dark:bg-violet-500/8 blur-[72px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-[var(--app-primary)]/4 dark:bg-[var(--app-primary)]/5 blur-[80px]" />
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin relative">
          {messagesLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Chat Beginning Empty State */}
              {activeMessages.length === 0 && (
                <div className="mb-8 mt-12 px-2 animate-fadeIn">
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
                  <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-405 max-w-2xl font-medium">
                    {activeChat.type === "channel" 
                      ? `This is the start of the #${activeChat.name} channel. ${activeChat.topic || "Use this space for team updates and collaboration."}`
                      : `This is the very beginning of your direct message history with ${activeChat.name}.`}
                  </p>
                </div>
              )}

              {/* Messages */}
              <div className="space-y-1">
                {activeMessages.map((msg, idx) => {
                  const prevMsg = idx > 0 ? activeMessages[idx - 1] : null;
                  const isGrouped = prevMsg && prevMsg.user === msg.user && prevMsg.time === msg.time;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex gap-3 px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors rounded"
                    >
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

                      <div className="min-w-0 flex-1 text-left">
                        {!isGrouped && (
                          <div className="flex items-baseline gap-2">
                            <span className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100">
                              {msg.user}
                            </span>
                            <span className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold">
                              {msg.time}
                            </span>
                          </div>
                        )}
                        <p className="text-[14px] leading-relaxed text-zinc-800 dark:text-zinc-300 mt-0.5 break-words font-medium font-sans">
                          {formatMessageContent(msg.content)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>

        {/* Message Composer */}
        <div className="shrink-0 px-5 pb-5 pt-2 relative">
          
          {/* Floating Emoji Picker Popover */}
          <AnimatePresence>
            {showEmojiPicker && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-6 bottom-24 z-40 rounded-2xl border border-zinc-200 bg-white p-2.5 shadow-2xl dark:border-white/10 dark:bg-[#121418] w-48"
                >
                  <div className="grid grid-cols-4 gap-1.5">
                    {["😀", "😂", "🔥", "👍", "🎉", "🚀", "💡", "💯"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-lg hover:bg-zinc-55 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Floating Mention Suggestions Popover */}
          <AnimatePresence>
            {showMentionMenu && filteredTeammates.length > 0 && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMentionMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-14 bottom-24 z-40 w-60 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-2xl dark:border-white/10 dark:bg-[#121418] max-h-48 overflow-y-auto scrollbar-thin text-left"
                >
                  <div className="px-2.5 py-1.5 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-white/5 mb-1.5">
                    Teammates
                  </div>
                  {filteredTeammates.map((member, idx) => {
                    const isActive = idx === activeMentionIdx;
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => insertMention(member.name)}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                          isActive 
                            ? "bg-teal-50 text-teal-950 dark:bg-teal-950/30 dark:text-teal-100 ring-1 ring-teal-500/20" 
                            : "text-zinc-650 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <span 
                          className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: getAvatarHsl(member.name) }}
                        >
                          {member.name.split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                        <div className="flex flex-col truncate">
                          <span className="truncate">{member.name}</span>
                          {member.jobTitle && <span className="text-[9px] text-zinc-450 dark:text-zinc-500 truncate">{member.jobTitle}</span>}
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="rounded-xl border border-zinc-300 bg-white shadow-sm focus-within:border-[var(--app-primary)] focus-within:ring-1 focus-within:ring-[var(--app-primary)] dark:border-zinc-700 dark:bg-[#222529] dark:focus-within:border-teal-500 dark:focus-within:ring-teal-500 transition-all overflow-hidden flex flex-col">
            
            {/* Toolbar Top */}
            <div className="flex items-center gap-1 bg-zinc-50/55 px-2 py-1.5 border-b border-zinc-100 dark:bg-[#1a1d21]/50 dark:border-zinc-800/50">
              <button
                type="button"
                onClick={() => insertFormatting("**", "**")}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-250 transition-colors cursor-pointer"
                title="Format Bold"
              >
                <span className="font-serif font-bold text-sm px-1.5">B</span>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("*", "*")}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-250 transition-colors cursor-pointer"
                title="Format Italic"
              >
                <span className="font-serif italic text-sm px-1.5">I</span>
              </button>
              <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700 mx-1" />
              <button className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-250 transition-colors cursor-pointer" title="Attach file">
                <PaperClipIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Input Area */}
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeChat.type === "channel" ? `#${activeChat.name}` : activeChat.name}`}
              className="w-full resize-none bg-transparent px-3 py-3 text-[14px] text-zinc-900 placeholder:text-zinc-505 outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500 max-h-48"
              rows={1}
              style={{ minHeight: "44px" }}
            />

            {/* Toolbar Bottom */}
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-250 transition-colors cursor-pointer"
                  title="Add emoji"
                >
                  <FaceSmileIcon className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={handleAtClick}
                  className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-250 transition-colors cursor-pointer"
                  title="Mention teammate"
                >
                  <AtSymbolIcon className="h-4.5 w-4.5" />
                </button>
              </div>
              
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!draft.trim()}
                className="flex items-center justify-center rounded-lg bg-[var(--app-primary)] p-1.5 text-white transition-all hover:bg-[var(--app-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                <PaperAirplaneIcon className="h-4 w-4 -translate-y-[0.5px] translate-x-[0.5px]" />
              </button>
            </div>
          </div>
          
          <div className="mt-1.5 flex justify-end px-1">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              <strong className="font-semibold">Return</strong> to send, <strong className="font-semibold">Shift + Return</strong> to add a new line
            </span>
          </div>
        </div>
        </>
        )}
      </main>

      {/* ── CREATE CHANNEL MODAL ── */}
      <AnimatePresence>
        {showNewChannelModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewChannelModal(false)}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 z-50 m-auto flex h-fit w-full max-w-[420px] max-h-[90vh] overflow-y-auto flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418] text-left scrollbar-none"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <HashtagIcon className="h-5 w-5 text-teal-500" />
                  <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Create a Channel
                  </h3>
                </div>
                <button
                  onClick={() => setShowNewChannelModal(false)}
                  className="rounded-lg p-1 text-zinc-455 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateChannelSubmit} className="mt-4 space-y-4">
                {/* Channel Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="e.g. marketing-updates"
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-xs text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <span className="block text-[9px] text-zinc-400 mt-1 font-semibold">Names must be lowercase, without spaces or hash signs.</span>
                </div>

                {/* Topic */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Topic / Description
                  </label>
                  <input
                    type="text"
                    value={newChannelTopic}
                    onChange={(e) => setNewChannelTopic(e.target.value)}
                    placeholder="What is this channel about?"
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-xs text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Private toggle */}
                <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 p-3.5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Make Private</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Only invited members can view this channel.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewChannelIsPrivate(!newChannelIsPrivate)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${newChannelIsPrivate ? "bg-teal-500" : "bg-zinc-250 dark:bg-zinc-700"}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${newChannelIsPrivate ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>

                {/* Member selection checklist for Private Channels */}
                {newChannelIsPrivate && (
                  <div className="space-y-2 animate-fadeIn">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Add Members</label>
                      {selectedMembers.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                          {selectedMembers.length} added
                        </span>
                      )}
                    </div>

                    {/* Selected chips */}
                    {selectedMembers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {workspaceMembers
                          .filter((m) => selectedMembers.includes(m.id))
                          .map((member) => (
                            <span
                              key={member.id}
                              className="inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/10 pl-1.5 pr-1 py-0.5 text-[10px] font-semibold text-teal-700 dark:text-teal-300"
                            >
                              <span
                                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[7px] font-black text-white"
                                style={{ backgroundColor: getAvatarHsl(member.name) }}
                              >
                                {member.name[0].toUpperCase()}
                              </span>
                              {member.name.split(" ")[0]}
                              <button
                                type="button"
                                onClick={() => setSelectedMembers(prev => prev.filter(id => id !== member.id))}
                                className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-teal-500 hover:bg-teal-500/20 transition-colors cursor-pointer"
                              >
                                <XMarkIcon className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Search + list combined */}
                    <div className="rounded-xl border border-zinc-200/70 dark:border-white/8 overflow-hidden">
                      <div className="flex items-center gap-2 border-b border-zinc-200/70 dark:border-white/8 bg-zinc-50 dark:bg-zinc-900/50 px-2.5 py-1.5">
                        <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                        <input
                          type="text"
                          value={memberSearchCreate}
                          onChange={(e) => setMemberSearchCreate(e.target.value)}
                          placeholder="Search members..."
                          className="flex-1 bg-transparent text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none"
                        />
                      </div>
                      <div className="max-h-28 overflow-y-auto bg-white dark:bg-zinc-900/30 divide-y divide-zinc-100/60 dark:divide-white/5">
                        {workspaceMembers.filter(m => m.email !== currentUser?.email).length === 0 ? (
                          <div className="py-3 text-center text-[11px] text-zinc-400 dark:text-zinc-500">No other workspace members.</div>
                        ) : (() => {
                          const filtered = workspaceMembers
                            .filter((m) => m.email !== currentUser?.email)
                            .filter((m) => {
                              const q = memberSearchCreate.toLowerCase();
                              return m.name.toLowerCase().includes(q) || (m.jobTitle || "").toLowerCase().includes(q);
                            });
                          if (filtered.length === 0) return (
                            <div className="py-3 text-center text-[11px] text-zinc-400 dark:text-zinc-500">No results for &ldquo;{memberSearchCreate}&rdquo;</div>
                          );
                          return filtered.map((member) => {
                            const isChecked = selectedMembers.includes(member.id);
                            return (
                              <label
                                key={member.id}
                                className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer transition-colors select-none ${isChecked ? "bg-teal-500/8 dark:bg-teal-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"}`}
                              >
                                <span
                                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white"
                                  style={{ backgroundColor: getAvatarHsl(member.name) }}
                                >
                                  {member.name.split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                </span>
                                <span className="flex-1 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{member.name}</span>
                                {member.jobTitle && <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate max-w-[90px] hidden sm:block">{member.jobTitle}</span>}
                                <span className={`ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${isChecked ? "border-teal-500 bg-teal-500" : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"}`}>
                                  {isChecked && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </span>
                                <input type="checkbox" checked={isChecked} onChange={() => {
                                  if (isChecked) setSelectedMembers(prev => prev.filter(id => id !== member.id));
                                  else setSelectedMembers(prev => [...prev, member.id]);
                                }} className="sr-only" />
                              </label>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowNewChannelModal(false)}
                    className="flex-1 rounded-xl border border-zinc-200 py-3 text-xs font-bold text-zinc-650 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[var(--app-primary)] py-3 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                  >
                    Create Channel
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── EDIT CHANNEL MODAL ── */}
      <AnimatePresence>
        {showEditChannelModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditChannelModal(false)}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 z-50 m-auto flex h-fit w-full max-w-[420px] flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418] text-left"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <PencilIcon className="h-5 w-5 text-teal-500" />
                  <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Edit Channel Settings
                  </h3>
                </div>
                <button
                  onClick={() => setShowEditChannelModal(false)}
                  className="rounded-lg p-1 text-zinc-450 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditChannelSubmit} className="mt-4 space-y-4">
                {/* Channel Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editChannelName === "general"}
                    value={editChannelName}
                    onChange={(e) => setEditChannelName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="e.g. marketing-updates"
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-xs text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {editChannelName === "general" ? (
                    <span className="block text-[9px] text-zinc-400 mt-1 font-semibold">The default #general channel name cannot be modified.</span>
                  ) : (
                    <span className="block text-[9px] text-zinc-400 mt-1 font-semibold">Names must be lowercase, without spaces or hash signs.</span>
                  )}
                </div>

                {/* Topic */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Topic / Description
                  </label>
                  <input
                    type="text"
                    value={editChannelTopic}
                    onChange={(e) => setEditChannelTopic(e.target.value)}
                    placeholder="What is this channel about?"
                    className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-xs text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Private toggle */}
                <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 p-3.5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Make Private</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Only invited members can view this channel.</span>
                  </div>
                  <button
                    type="button"
                    disabled={editChannelName === "general"}
                    onClick={() => setEditChannelIsPrivate(!editChannelIsPrivate)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${editChannelIsPrivate ? "bg-teal-500" : "bg-zinc-250 dark:bg-zinc-700"}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editChannelIsPrivate ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>

                {/* Member selection checklist for Private Channels */}
                {editChannelIsPrivate && (
                  <div className="space-y-2 animate-fadeIn">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Manage Members</label>
                      {editChannelMembers.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                          {editChannelMembers.length} member{editChannelMembers.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Selected chips */}
                    {editChannelMembers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {workspaceMembers
                          .filter((m) => editChannelMembers.includes(m.id))
                          .map((member) => (
                            <span
                              key={member.id}
                              className="inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/10 pl-1.5 pr-1 py-0.5 text-[10px] font-semibold text-teal-700 dark:text-teal-300"
                            >
                              <span
                                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[7px] font-black text-white"
                                style={{ backgroundColor: getAvatarHsl(member.name) }}
                              >
                                {member.name[0].toUpperCase()}
                              </span>
                              {member.name.split(" ")[0]}
                              <button
                                type="button"
                                onClick={() => setEditChannelMembers(prev => prev.filter(id => id !== member.id))}
                                className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-teal-500 hover:bg-teal-500/20 transition-colors cursor-pointer"
                              >
                                <XMarkIcon className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Search + list combined */}
                    <div className="rounded-xl border border-zinc-200/70 dark:border-white/8 overflow-hidden">
                      <div className="flex items-center gap-2 border-b border-zinc-200/70 dark:border-white/8 bg-zinc-50 dark:bg-zinc-900/50 px-2.5 py-1.5">
                        <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                        <input
                          type="text"
                          value={memberSearchEdit}
                          onChange={(e) => setMemberSearchEdit(e.target.value)}
                          placeholder="Search members..."
                          className="flex-1 bg-transparent text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none"
                        />
                      </div>
                      <div className="max-h-28 overflow-y-auto bg-white dark:bg-zinc-900/30 divide-y divide-zinc-100/60 dark:divide-white/5">
                        {workspaceMembers.filter(m => m.email !== currentUser?.email).length === 0 ? (
                          <div className="py-3 text-center text-[11px] text-zinc-400 dark:text-zinc-500">No other workspace members.</div>
                        ) : (() => {
                          const filtered = workspaceMembers
                            .filter((m) => m.email !== currentUser?.email)
                            .filter((m) => {
                              const q = memberSearchEdit.toLowerCase();
                              return m.name.toLowerCase().includes(q) || (m.jobTitle || "").toLowerCase().includes(q);
                            });
                          if (filtered.length === 0) return (
                            <div className="py-3 text-center text-[11px] text-zinc-400 dark:text-zinc-500">No results for &ldquo;{memberSearchEdit}&rdquo;</div>
                          );
                          return filtered.map((member) => {
                            const isChecked = editChannelMembers.includes(member.id);
                            return (
                              <label
                                key={member.id}
                                className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer transition-colors select-none ${isChecked ? "bg-teal-500/8 dark:bg-teal-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"}`}
                              >
                                <span
                                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white"
                                  style={{ backgroundColor: getAvatarHsl(member.name) }}
                                >
                                  {member.name.split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                </span>
                                <span className="flex-1 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{member.name}</span>
                                {member.jobTitle && <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate max-w-[90px] hidden sm:block">{member.jobTitle}</span>}
                                <span className={`ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${isChecked ? "border-teal-500 bg-teal-500" : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"}`}>
                                  {isChecked && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </span>
                                <input type="checkbox" checked={isChecked} onChange={() => {
                                  if (isChecked) setEditChannelMembers(prev => prev.filter(id => id !== member.id));
                                  else setEditChannelMembers(prev => [...prev, member.id]);
                                }} className="sr-only" />
                              </label>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowEditChannelModal(false)}
                    className="flex-1 rounded-xl border border-zinc-200 py-3 text-xs font-bold text-zinc-650 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[var(--app-primary)] py-3 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── DELETE CHANNEL MODAL ── */}
      <AnimatePresence>
        {showDeleteChannelModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteChannelModal(false)}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 z-50 m-auto flex h-fit w-full max-w-[420px] flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418] text-left"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <TrashIcon className="h-5 w-5 text-rose-500" />
                  <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Delete Channel
                  </h3>
                </div>
                <button
                  onClick={() => setShowDeleteChannelModal(false)}
                  className="rounded-lg p-1 text-zinc-450 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleDeleteChannelSubmit} className="mt-4 space-y-4">
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/15 p-4 border border-rose-100 dark:border-rose-900/30">
                  <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold leading-relaxed">
                    <strong>Warning:</strong> Deleting this channel will permanently remove all message history and files shared within it. This action cannot be undone.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    To confirm, type <span className="font-mono text-zinc-850 dark:text-zinc-100 font-bold bg-zinc-150 dark:bg-zinc-800 px-1 py-0.5 rounded">#{deleteChannelName}</span> below:
                  </label>
                  <input
                    type="text"
                    required
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder={`Type #${deleteChannelName}`}
                    className="mt-2.5 block w-full rounded-xl border border-zinc-250 px-4 py-3 text-xs text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowDeleteChannelModal(false)}
                    className="flex-1 rounded-xl border border-zinc-200 py-3 text-xs font-bold text-zinc-650 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteConfirmationText !== deleteChannelName && deleteConfirmationText !== '#' + deleteChannelName}
                    className="flex-1 rounded-xl bg-rose-600 py-3 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-600 transition-all cursor-pointer"
                  >
                    Delete Channel
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── DIRECT MESSAGE CREATION MODAL ── */}
      <AnimatePresence>
        {showNewDmModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewDmModal(false)}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 z-50 m-auto flex h-fit w-full max-w-[420px] flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418] text-left"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-teal-500" />
                  <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Direct Message Teammate
                  </h3>
                </div>
                <button
                  onClick={() => setShowNewDmModal(false)}
                  className="rounded-lg p-1 text-zinc-450 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Select a teammate from your team space to start a conversation:</p>
                
                <div className="divide-y divide-zinc-100 dark:divide-white/5 max-h-60 overflow-y-auto scrollbar-thin pr-1">
                  {workspaceMembers.length === 0 ? (
                    <div className="text-center py-6 text-xs text-zinc-400">
                      No other team members found in this workspace.
                    </div>
                  ) : (
                    workspaceMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleCreateDm(member)}
                        className="flex w-full items-center gap-3 py-3 px-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-left transition-colors cursor-pointer"
                      >
                        <span 
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: getAvatarHsl(member.name) }}
                        >
                          {member.name.split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                        <div className="flex flex-col truncate">
                          <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200 truncate">{member.name}</span>
                          <span className="text-[10px] text-zinc-450 dark:text-zinc-500 truncate">{member.jobTitle || "Team Member"}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── SLIDING RIGHT DETAILS DRAWER ── */}
      <AnimatePresence>
        {showRightDrawer && activeChat && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="flex h-full w-[340px] shrink-0 flex-col border-l border-zinc-200 bg-white dark:border-white/[0.06] dark:bg-[#181a1d] text-left relative z-25 shadow-xl overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200/80 px-4 dark:border-white/[0.06] bg-stone-50/50 dark:bg-zinc-900/40">
              <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {activeChat.type === "channel" ? "Channel Details" : "User Profile"}
              </h3>
              <button
                onClick={() => setShowRightDrawer(false)}
                className="rounded-lg p-1 text-zinc-450 hover:bg-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
              {drawerLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                </div>
              ) : activeChat.type === "channel" ? (
                // Channel Details Content
                <div className="space-y-6">
                  <div className="flex flex-col items-center text-center pb-4 border-b border-zinc-100 dark:border-white/5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-350 shadow-sm border border-teal-100/50 dark:border-teal-900/30">
                      {activeChat.isPrivate ? <LockClosedIcon className="h-7 w-7" /> : <HashtagIcon className="h-7 w-7" />}
                    </div>
                    <h4 className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-50">
                      #{activeChat.name}
                    </h4>
                    <p className="mt-1 text-[11px] font-semibold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">
                      {activeChat.isPrivate ? "Private Channel" : "Public Channel"}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Description</span>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-white/5 p-3 rounded-xl">
                      {channelDetails?.topic || activeChat.topic || "No description set for this channel."}
                    </p>
                  </div>

                   <div className="rounded-xl border border-zinc-100 bg-zinc-50/30 p-3.5 dark:border-white/5 dark:bg-zinc-900/20 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-450 dark:text-zinc-500">Created</span>
                      <span className="text-zinc-800 dark:text-zinc-200">
                        {channelDetails?.createdAt ? new Date(channelDetails.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-450 dark:text-zinc-500">Members Count</span>
                      <span className="text-zinc-800 dark:text-zinc-200 font-bold">
                        {activeChat.isPrivate ? (channelDetails?.members?.length || 1) : workspaceMembers.length} members
                      </span>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="space-y-2 border-t border-zinc-100 dark:border-white/5 pt-4">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Channel Actions</span>
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditChannelId(activeChat.id);
                          setEditChannelName(activeChat.name);
                          setEditChannelTopic(channelDetails?.topic || activeChat.topic || "");
                          setEditChannelIsPrivate(activeChat.isPrivate || false);
                          setMemberSearchEdit("");
                          setEditChannelMembers([]);
                          setShowEditChannelModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-350 py-2.5 transition-colors cursor-pointer"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                        Edit Settings
                      </button>
                      <button
                        type="button"
                        disabled={activeChat.name === "general"}
                        onClick={() => {
                          setDeleteChannelId(activeChat.id);
                          setDeleteChannelName(activeChat.name);
                          setDeleteConfirmationText("");
                          setShowDeleteChannelModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 hover:bg-rose-100/50 dark:bg-rose-950/15 dark:hover:bg-rose-900/20 text-xs font-bold text-rose-600 dark:text-rose-450 py-2.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Delete Channel
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Channel Members</span>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin pr-1 divide-y divide-zinc-100 dark:divide-white/5">
                      {activeChat.isPrivate ? (
                        (channelDetails?.members || []).map((m: any) => {
                          if (!m.user) return null;
                          const name = `${m.user.firstName || ""} ${m.user.lastName || ""}`.trim() || m.user.email;
                          return (
                            <div key={m.user.id} className="flex items-center gap-2.5 py-2 first:pt-0">
                              <span 
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold text-white shadow-sm"
                                style={{ backgroundColor: getAvatarHsl(name) }}
                              >
                                {name.split(/\s+/).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </span>
                              <div className="flex flex-col truncate">
                                <span className="text-xs font-bold text-zinc-805 dark:text-zinc-200 truncate">{name}</span>
                                <span className="text-[9px] text-zinc-450 dark:text-zinc-500 truncate">{m.user.jobTitle || "Team Member"}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        workspaceMembers.map((member) => (
                          <div key={member.id} className="flex items-center gap-2.5 py-2 first:pt-0">
                            <span 
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: getAvatarHsl(member.name) }}
                            >
                              {member.name.split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </span>
                            <div className="flex flex-col truncate">
                              <span className="text-xs font-bold text-zinc-805 dark:text-zinc-200 truncate">{member.name}</span>
                              <span className="text-[9px] text-zinc-450 dark:text-zinc-500 truncate">{member.jobTitle || "Team Member"}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Teammate Profile Content
                <div className="space-y-6">
                  <div className="flex flex-col items-center text-center pb-4 border-b border-zinc-100 dark:border-white/5">
                    <span 
                      className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-md border-2 border-white dark:border-zinc-850"
                      style={{ backgroundColor: getAvatarHsl(activeChat.name) }}
                    >
                      {activeChat.name.split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                    <h4 className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-50">
                      {activeChat.name}
                    </h4>
                    <p className="mt-1 text-xs font-bold text-teal-600 dark:text-teal-400">
                      {memberDetails?.jobTitle || activeChat.topic || "Team Member"}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">About Me</span>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-white/5 p-3 rounded-xl">
                      {memberDetails?.bio || "No biography shared yet."}
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Contact & Details</span>
                    
                    <div className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/30 p-4 dark:border-white/5 dark:bg-zinc-900/20">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Email</span>
                        <a 
                          href={`mailto:${memberDetails?.email || ""}`}
                          className="text-xs font-bold text-zinc-800 hover:text-teal-600 dark:text-zinc-200 dark:hover:text-teal-400 mt-0.5 truncate transition-colors"
                        >
                          {memberDetails?.email || "No email available"}
                        </a>
                      </div>

                      {memberDetails?.phone && (
                        <div className="flex flex-col border-t border-zinc-100 dark:border-white/5 pt-2.5">
                          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Phone</span>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{memberDetails.phone}</span>
                        </div>
                      )}

                      <div className="flex flex-col border-t border-zinc-100 dark:border-white/5 pt-2.5">
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Department</span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                          {memberDetails?.department || "Engineering"}
                        </span>
                      </div>

                      <div className="flex flex-col border-t border-zinc-100 dark:border-white/5 pt-2.5">
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Timezone</span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 flex items-center gap-1.5">
                          {memberDetails?.timezone || "UTC+05:30"}
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                      </div>

                      <div className="flex flex-col border-t border-zinc-100 dark:border-white/5 pt-2.5">
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Preferred Language</span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                          {memberDetails?.language || "English"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

    </div>
  );
}
