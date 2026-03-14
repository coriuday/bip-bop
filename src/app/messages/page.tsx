"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
  useMemo,
} from "react";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Send, ArrowLeft, Loader2, Search,
  Paperclip, X, ImageIcon, Play, PenSquare, Users,
} from "lucide-react";
import { Avatar } from "~/components/ui/avatar";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import Image from "next/image";
import { formatTimeAgo } from "~/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { MessageStatus } from "~/app/_components/message-status";
import { getPusherClient, conversationChannel, PUSHER_EVENTS } from "~/lib/pusher";
import type { EventEnvelope, MessageSendPayload, MessageReadPayload, MessageReactionPayload } from "~/lib/aurora/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface MaterializedMessage {
  id: string;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  senderId: string;
  createdAt: Date;
  status: "sent" | "delivered" | "read";
  readAt: Date | null;
  deliveredAt: Date | null;
  reactions?: Record<string, string[]>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Media bubble
// ─────────────────────────────────────────────────────────────────────────────
function MediaBubble({ url, type }: { url: string; type: "image" | "video" }) {
  const [lightbox, setLightbox] = useState(false);

  if (type === "image") {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Shared image"
          className="max-w-[220px] rounded-xl cursor-pointer object-cover"
          onClick={() => setLightbox(true)}
        />
        <AnimatePresence>
          {lightbox && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center"
              onClick={() => setLightbox(false)}
            >
              <Image 
                src={url} 
                alt="Full size" 
                width={1200}
                height={1200}
                className="max-h-[80vh] max-w-[90vw] w-auto h-auto object-contain rounded-2xl" 
                quality={100}
              />
              <button
                className="absolute top-4 right-4 p-2 bg-white/10 rounded-full"
                onClick={() => setLightbox(false)}
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <video
      src={url}
      controls
      muted
      playsInline
      className="max-w-[280px] rounded-xl"
      aria-label="Shared video"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Typing indicator (3-dot animated pulse)
// ─────────────────────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-1 px-4 py-2 bg-white/10 rounded-2xl w-fit">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-white/60 rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Attachment preview chip (before send)
// ─────────────────────────────────────────────────────────────────────────────
function AttachmentChip({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const isVideo = file.type.startsWith("video/");
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  return (
    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20 flex-shrink-0">
      {isVideo ? (
        <div className="w-full h-full bg-white/10 flex items-center justify-center">
          <Play className="w-8 h-8 text-white/70" />
        </div>
      ) : (
        <Image src={previewUrl} alt="Preview" fill className="object-cover" sizes="64px" />
      )}
      <button
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center"
        aria-label="Remove attachment"
      >
        <X className="w-3 h-3 text-white" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
function MessagesContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const recipientId = searchParams.get("recipientId");
  const conversationId = searchParams.get("conversationId");

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [newRecipientId, setNewRecipientId] = useState<string | null>(recipientId);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupParticipantIds, setGroupParticipantIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debounce search query 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── API queries ────────────────────────────────────────────────────────────
  const { data: conversations, refetch: refetchConversations } =
    api.message.getConversations.useQuery(undefined, { enabled: !!session });

  const { data: events, refetch: refetchMessages } = api.message.getMessages.useQuery(
    { conversationId: selectedConversation! },
    { enabled: !!selectedConversation }
  );

  const { data: searchResults, isLoading: isSearching } = api.user.searchByUsername.useQuery(
    { query: debouncedSearch },
    { enabled: debouncedSearch.length >= 1 }
  );

  const { data: recipientUser } = api.user.getById.useQuery(
    { userId: newRecipientId ?? "" },
    { enabled: !!newRecipientId && newRecipientId.length > 0 }
  );

  // ── Local event state (optimistic + real-time) ─────────────────────────────
  const [localEvents, setLocalEvents] = useState<EventEnvelope[]>([]);

  useEffect(() => {
    if (events?.items) {
      const mapped: EventEnvelope[] = events.items.map((msg) => ({
        id: msg.id,
        type: "message:send",
        payload: {
          messageId: msg.id,
          content: msg.content,
          mediaUrl: (msg as unknown as { mediaUrl?: string }).mediaUrl,
          mediaType: (msg as unknown as { mediaType?: string }).mediaType,
        },
        vectorClock: {},
        timestamp: new Date(msg.createdAt).getTime(),
        senderId: msg.senderId,
        conversationId: msg.conversationId,
      }));
      setLocalEvents(mapped);
    }
  }, [events]);

  const markAsDeliveredMutation = api.message.markAsDelivered.useMutation();
  const markAsReadMutation = api.message.markAsRead.useMutation({
    onSuccess: () => { void refetchMessages(); void refetchConversations(); },
  });
  const sendTypingMutation = api.message.sendTyping.useMutation();
  const createGroupMutation = api.message.createGroupConversation.useMutation({
    onSuccess: (conv) => {
      void refetchConversations();
      setSelectedConversation(conv.id);
      setShowGroupModal(false);
      setGroupName("");
      setGroupParticipantIds([]);
      toast.success("Group chat created!");
    },
    onError: (err) => toast.error(err.message),
  });

  const sendMessageMutation = api.message.sendMessage.useMutation({
    onSuccess: (data, _variables) => {
      setMessageText("");
      setNewRecipientId(null);
      setPendingFile(null);
      void refetchConversations();
      scrollToBottom();

      // If this was a new conversation, update URL
      if (data.conversationId && !selectedConversation) {
        window.history.replaceState({}, "", `/messages?conversationId=${data.conversationId}`);
        setSelectedConversation(data.conversationId);
      }
      
      // We can optionally replace the optimistic event with the real server data here if we tracked the temp ID
      // but Refetching / Pusher sync usually covers us.
    },
    onError: (err, _variables, _context) => {
      toast.error(`Send failed: ${err.message}`);
      // In a robust implementation, we'd rollback the optimistic message here using the context
    },
  });

  const toggleReactionMutation = api.message.toggleReaction.useMutation({
    onSuccess: (data, variables) => {
      // Optimistically update the local events based on the new reactions returned
      const reactionEvent: EventEnvelope = {
        id: `reaction_${Date.now()}`,
        type: "message:reaction",
        payload: {
          messageId: variables.messageId,
          reactions: data.reactions,
        },
        vectorClock: {},
        timestamp: Date.now(),
        senderId: session?.user?.id ?? "",
        conversationId: selectedConversation ?? "",
      };
      setLocalEvents((prev) => [...prev, reactionEvent]);
    },
    onError: (err) => {
      toast.error(`Reaction failed: ${err.message}`);
    }
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [localEvents, scrollToBottom]);

  // ── Pusher real-time ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedConversation || !session?.user?.id) return;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(conversationChannel(selectedConversation));

    channel.bind(PUSHER_EVENTS.NEW_MESSAGE, (newEvent: EventEnvelope) => {
      setLocalEvents((prev) => {
        if (!prev) return [newEvent];
        if (prev.some((e) => e.id === newEvent.id)) return prev;
        return [...prev, newEvent];
      });
      void refetchConversations();
      scrollToBottom();
    });

    channel.bind(PUSHER_EVENTS.MESSAGE_STATUS, () => void refetchMessages());

    // Typing indicator from server-side Pusher trigger
    channel.bind("typing", (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== session.user.id) {
        setOtherTyping(data.isTyping);
        if (data.isTyping) setTimeout(() => setOtherTyping(false), 3000);
      }
    });
    // Also handle client-typed direct events as fallback
    channel.bind("client-typing", (data: { userId: string }) => {
      if (data.userId !== session.user.id) {
        setOtherTyping(true);
        setTimeout(() => setOtherTyping(false), 2500);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(conversationChannel(selectedConversation));
    };
  }, [selectedConversation, session?.user?.id, refetchMessages, refetchConversations, scrollToBottom]);

  // Send typing indicator via server route (works in private channels)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTyping = useCallback(() => {
    if (!selectedConversation) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingMutation.mutate({ conversationId: selectedConversation, isTyping: true });
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingMutation.mutate({ conversationId: selectedConversation, isTyping: false });
    }, 2000);
    // Also try client-event as fallback
    try {
      const pusher = getPusherClient();
      const ch = pusher.channel(conversationChannel(selectedConversation));
      ch?.trigger?.("client-typing", { userId: session?.user?.id });
    } catch {/* ignore */}
  }, [selectedConversation, sendTypingMutation, session?.user?.id]);

  // ── URL params ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (conversationId && conversations) {
      setSelectedConversation(conversationId);
    } else if (recipientId && conversations) {
      const existing = conversations.find((c) => c.otherParticipant?.id === recipientId);
      if (existing) setSelectedConversation(existing.id);
      else setNewRecipientId(recipientId);
    }
  }, [conversationId, recipientId, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      markAsDeliveredMutation.mutate({ conversationId: selectedConversation });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation && localEvents && localEvents.length > 0) {
      const t = setTimeout(() => {
        markAsReadMutation.mutate({ conversationId: selectedConversation });
      }, 1000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation, localEvents]);

  // ── Upload attachment ──────────────────────────────────────────────────────
  const uploadAndSend = async (conversationId: string | undefined, recipientId: string, content: string) => {
    let mediaUrl: string | undefined;
    let mediaType: "image" | "video" | undefined;

    if (pendingFile) {
      setIsUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", pendingFile);
        const res = await fetch("/api/upload-dm-media", { method: "POST", body: fd });
        const json = await res.json() as { url?: string; mediaType?: "image" | "video"; error?: string };
        if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed");
        mediaUrl = json.url;
        mediaType = json.mediaType;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    sendMessageMutation.mutate({
      conversationId,
      recipientId,
      content: content.trim() || " ",
      mediaUrl,
      mediaType,
    });
  };

  // ── Send handler ───────────────────────────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !pendingFile) return;
    if (!session?.user?.id) return;

    const content = messageText.trim();
    
    // Optistic UI Update: Instantly add the text message to the screen if no file is present
    if (!pendingFile && (selectedConversation || newRecipientId)) {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const optimisticEvent: EventEnvelope = {
        id: tempId,
        type: "message:send",
        payload: {
          messageId: tempId,
          content: content,
        },
        vectorClock: {},
        timestamp: Date.now(),
        senderId: session.user.id,
        conversationId: selectedConversation ?? "temp_conv_id",
      };
      
      setLocalEvents((prev) => [...prev, optimisticEvent]);
      setMessageText(""); // Clear input immediately
      setShowEmojiPicker(false);
      scrollToBottom();
    }

    if (newRecipientId && !selectedConversation) {
      await uploadAndSend(undefined, newRecipientId, content);
      return;
    }
    if (!selectedConversation) return;
    const conv = conversations?.find((c) => c.id === selectedConversation);
    if (!conv?.otherParticipant) return;
    await uploadAndSend(selectedConversation, conv.otherParticipant.id, content);
  };

  // ── Project events → UI messages ──────────────────────────────────────────
  const materializedMessages: MaterializedMessage[] = useMemo(() => {
    if (!localEvents || localEvents.length === 0) return [];

    const msgMap = new Map<string, MaterializedMessage>();
    const sorted = [...localEvents].sort((a, b) => a.timestamp - b.timestamp);

    for (const ev of sorted) {
      if (ev.type === "message:send") {
        const p = ev.payload as MessageSendPayload & { mediaUrl?: string; mediaType?: "image" | "video" };
        msgMap.set(p.messageId, {
          id: p.messageId,
          content: p.content,
          mediaUrl: p.mediaUrl,
          mediaType: p.mediaType,
          senderId: ev.senderId,
          createdAt: new Date(ev.timestamp),
          status: "sent",
          readAt: null,
          deliveredAt: null,
          reactions: {},
        });
      }
      if (ev.type === "message:read") {
        const p = ev.payload as MessageReadPayload;
        for (const [mid, msg] of msgMap.entries()) {
          if (msg.senderId !== ev.senderId && msg.id <= p.lastReadEventId) {
            msgMap.set(mid, { ...msg, status: "read", readAt: new Date(ev.timestamp) });
          }
        }
      }
      if (ev.type === "message:reaction") {
        const p = ev.payload as MessageReactionPayload;
        const msg = msgMap.get(p.messageId);
        if (msg) {
          msgMap.set(p.messageId, { ...msg, reactions: p.reactions });
        }
      }
    }
    return Array.from(msgMap.values()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [localEvents]);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view messages</h2>
          <p className="text-white/60 mb-6">Connect with your friends and creators</p>
          <Link href="/auth/signin">
            <Button variant="primary" size="lg">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedConv = conversations?.find((c) => c.id === selectedConversation);

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <main className="fixed inset-0 top-0 bg-[#0a0a0a] text-white flex overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <div
        className={`${selectedConversation ? "hidden md:flex" : "flex"
          } flex-col w-full md:w-96 md:max-w-[400px] border-r border-white/10 flex-shrink-0`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Messages</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGroupModal(true)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="New group chat"
                title="New group chat"
              >
                <Users className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedConversation(null);
                  setNewRecipientId("__new__");
                }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="New message"
                title="New message"
              >
                <PenSquare className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="text"
              placeholder="Search users by @username..."
              className="pl-10 bg-white/10 border-white/20"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
              onFocus={() => setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 150)}
              aria-label="Search users to message"
            />

            {/* Search results dropdown */}
            <AnimatePresence>
              {showSearchResults && debouncedSearch.length >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                >
                  {isSearching ? (
                    <div className="p-3 flex items-center gap-2 text-white/50">
                      <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                    </div>
                  ) : searchResults && searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <button
                        key={user.id}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                        onMouseDown={() => {
                          setSearchQuery("");
                          setSelectedConversation(null);
                          const existing = conversations?.find((c) => c.otherParticipant?.id === user.id);
                          if (existing) setSelectedConversation(existing.id);
                          else setNewRecipientId(user.id);
                        }}
                      >
                        <Avatar
                          src={user.image ?? undefined}
                          fallback={(user.username ?? user.name ?? "U").charAt(0).toUpperCase()}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{user.name ?? user.username}</p>
                          {user.username && <p className="text-sm text-white/50">@{user.username}</p>}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-white/40 text-sm">No users found for &quot;{debouncedSearch}&quot;</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {conversations && conversations.length > 0 ? (
            conversations.map((conversation) => (
              <motion.button
                key={conversation.id}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                onClick={() => setSelectedConversation(conversation.id)}
                className={`w-full p-4 flex items-center gap-3 border-b border-white/5 transition-colors ${selectedConversation === conversation.id
                  ? "bg-gradient-to-r from-[#FF2D55]/10 to-transparent border-l-2 border-l-[#FF2D55]"
                  : ""}`}
              >
                <Avatar
                  src={conversation.otherParticipant?.image ?? undefined}
                  fallback={conversation.otherParticipant?.username?.charAt(0).toUpperCase() ?? "U"}
                  size="lg"
                />
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="font-semibold truncate">
                    {conversation.otherParticipant?.name ?? conversation.otherParticipant?.username ?? "User"}
                  </h3>
                  <div className="flex items-center gap-1">
                    {conversation.lastMessage?.senderId === session.user.id && (
                      <MessageStatus
                        status={conversation.lastMessage?.status as "sent" | "delivered" | "read" ?? "sent"}
                        isOwn={true}
                        readAt={conversation.lastMessage?.readAt as Date | undefined}
                      />
                    )}
                    <p className="text-sm text-white/60 truncate">
                      {(conversation.lastMessage as unknown as { mediaType?: string })?.mediaType === "image"
                        ? "📷 Photo"
                        : (conversation.lastMessage as unknown as { mediaType?: string })?.mediaType === "video"
                        ? "🎥 Video"
                        : conversation.lastMessage?.content ?? "No messages yet"}
                    </p>
                  </div>
                </div>
                {conversation.lastMessage && (
                  <span className="text-xs text-white/40 flex-shrink-0">
                    {formatTimeAgo(new Date(conversation.lastMessage.createdAt))}
                  </span>
                )}
              </motion.button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageCircle className="w-16 h-16 text-white/20 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-white/60 text-sm">
                Search for a user above to start chatting!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      <div className={`${selectedConversation || newRecipientId ? "flex" : "hidden md:flex"} flex-col flex-1 min-w-0`}>
        {selectedConv || (newRecipientId && newRecipientId !== "__new__") ? (
          <div className="flex flex-col h-full">
            {/* Chat header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3 flex-shrink-0 bg-[#0a0a0a]/80 backdrop-blur-md">
              <button
                onClick={() => { setSelectedConversation(null); setNewRecipientId(null); window.history.replaceState({}, "", "/messages"); }}
                className="md:hidden p-1"
                aria-label="Back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <Avatar
                src={selectedConv?.otherParticipant?.image ?? recipientUser?.image ?? undefined}
                fallback={(
                  selectedConv?.otherParticipant?.username ??
                  recipientUser?.username ??
                  selectedConv?.otherParticipant?.name ??
                  recipientUser?.name ?? "U"
                ).charAt(0).toUpperCase()}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate">
                  {selectedConv?.otherParticipant?.name ?? recipientUser?.name ??
                    selectedConv?.otherParticipant?.username ?? recipientUser?.username ?? "..."}
                </h2>
                <p className="text-sm text-white/50">
                  @{selectedConv?.otherParticipant?.username ?? recipientUser?.username ?? "..."}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {materializedMessages.length > 0 ? (
                <>
                  {materializedMessages.map((message) => {
                    const isOwn = message.senderId === session.user.id;
                    const hasMedia = !!message.mediaUrl && !!message.mediaType;
                    const hasText = message.content.trim().length > 0 && message.content !== " ";

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"} group relative`}
                      >
                        <div className={`max-w-[75%] flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"} relative`}>
                          
                          {/* Add Reaction Button (Hover) */}
                          <div className={`absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 
                            ${isOwn ? "right-full mr-2" : "left-full ml-2"}`}>
                             <button
                               onClick={() => setActiveReactionMessageId(
                                 activeReactionMessageId === message.id ? null : message.id
                               )}
                               className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/60 transition-colors"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                             </button>
                          </div>

                          {/* Reaction Picker Popup */}
                          {activeReactionMessageId === message.id && (
                             <div className={`absolute top-0 z-50 ${isOwn ? "right-[calc(100%+30px)]" : "left-[calc(100%+30px)]"}`}>
                               <EmojiPicker
                                 theme={Theme.DARK}
                                 width={280}
                                 height={350}
                                 onEmojiClick={(emojiData: EmojiClickData) => {
                                   toggleReactionMutation.mutate({
                                     messageId: message.id,
                                     emoji: emojiData.emoji,
                                   });
                                   setActiveReactionMessageId(null);
                                 }}
                               />
                             </div>
                          )}
                          {/* Media bubble */}
                          {hasMedia && (
                            <MediaBubble
                              url={message.mediaUrl!}
                              type={message.mediaType!}
                            />
                          )}
                          {/* Text bubble */}
                          {hasText && (
                            <div
                              className={`rounded-2xl px-4 py-2 ${isOwn
                                ? "bg-gradient-to-r from-[#FF2D55] to-[#7B2FFF] text-white"
                                : "bg-white/10 text-white"}`}
                            >
                              <p className="break-words">{message.content}</p>
                            </div>
                          )}
                          
                          {/* Reactions Display */}
                          {message.reactions && Object.keys(message.reactions).length > 0 && (
                            <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                               {Object.entries(message.reactions).map(([emoji, users]) => (
                                  <button
                                    key={emoji}
                                    onClick={() => toggleReactionMutation.mutate({
                                      messageId: message.id,
                                      emoji
                                    })}
                                    className={`text-sm px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1
                                      ${users.includes(session.user.id) ? "bg-[#FF2D55]/20 border-[#FF2D55]/50" : "bg-black/40 hover:bg-white/10"}`}
                                  >
                                    <span>{emoji}</span>
                                    {users.length > 1 && <span className="text-xs text-white/70">{users.length}</span>}
                                  </button>
                               ))}
                            </div>
                          )}

                          {/* Time + status */}
                          <div className="flex items-center gap-1 px-1">
                            <span className="text-xs text-white/40">
                              {formatTimeAgo(new Date(message.createdAt))}
                            </span>
                            <MessageStatus
                              status={message.status}
                              isOwn={isOwn}
                              readAt={message.readAt}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Typing indicator */}
                  {otherTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-start"
                    >
                      <TypingIndicator />
                    </motion.div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Start the conversation</h3>
                    <p className="text-white/50">
                      Say hi to{" "}
                      {selectedConv?.otherParticipant?.name ?? recipientUser?.name ?? "this user"} 👋
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="p-3 border-t border-white/10 flex-shrink-0 bg-[#0a0a0a]/80 backdrop-blur-md">
              {/* Attachment preview */}
              {pendingFile && (
                <div className="flex gap-2 mb-2">
                  <AttachmentChip file={pendingFile} onRemove={() => setPendingFile(null)} />
                </div>
              )}

              <form onSubmit={(e) => { void handleSendMessage(e); }} className="flex items-end gap-2 relative">
                
                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 z-50 shadow-2xl">
                    <EmojiPicker
                      theme={Theme.DARK}
                      onEmojiClick={(emoji: EmojiClickData) => {
                        setMessageText(prev => prev + emoji.emoji);
                      }}
                      lazyLoadEmojis={true}
                    />
                  </div>
                )}
                
                {/* Emoji button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                  aria-label="Add emoji"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                </button>

                {/* Attachment button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPendingFile(f);
                    e.target.value = "";
                  }}
                  aria-label="Attach file"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                  aria-label="Attach photo or video"
                  title="Attach photo or video"
                >
                  {pendingFile
                    ? <ImageIcon className="w-5 h-5 text-[#FF2D55]" />
                    : <Paperclip className="w-5 h-5 text-white/60" />}
                </button>

                <Input
                  type="text"
                  value={messageText}
                  onChange={(e) => { setMessageText(e.target.value); handleTyping(); }}
                  placeholder={pendingFile ? "Add a caption..." : "Type a message..."}
                  className="flex-1 rounded-full bg-white/10 border-white/20"
                  disabled={sendMessageMutation.isPending || isUploading}
                  aria-label="Message text"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={(!messageText.trim() && !pendingFile) || sendMessageMutation.isPending || isUploading}
                  className="rounded-full flex-shrink-0"
                  aria-label="Send message"
                >
                  {sendMessageMutation.isPending || isUploading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <Send className="w-5 h-5" />}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          /* Empty state when no conversation selected */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FF2D55]/20 to-[#7B2FFF]/20 border border-white/10 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-white/40" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
              <p className="text-white/50 mb-6 max-w-xs mx-auto">
                Search for a user or select a conversation to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Group Chat Creation Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {showGroupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowGroupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">New Group Chat</h2>
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="p-2 rounded-full hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">Group Name</label>
                  <Input
                    placeholder="e.g. Squad Goals 🔥"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="bg-white/10 border-white/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">
                    Add Participants
                    {groupParticipantIds.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center rounded-full bg-pink-500 px-2 py-0.5 text-xs font-bold text-white">
                        {groupParticipantIds.length}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      placeholder="Search @username..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                      onFocus={() => setShowSearchResults(true)}
                      className="pl-10 bg-white/10 border-white/20"
                    />
                  </div>

                  {/* Group participant search results */}
                  {showSearchResults && debouncedSearch.length >= 1 && searchResults && searchResults.length > 0 && (
                    <div className="mt-2 rounded-xl border border-white/10 bg-[#111] overflow-hidden">
                      {searchResults.filter((u) => u.id !== session.user.id).slice(0, 5).map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setGroupParticipantIds((prev) =>
                              prev.includes(user.id) ? prev.filter((id) => id !== user.id) : [...prev, user.id]
                            );
                          }}
                          className="flex items-center gap-3 w-full p-3 hover:bg-white/5 transition-colors"
                        >
                          <Avatar
                            src={user.image ?? undefined}
                            fallback={(user.username ?? "U").charAt(0).toUpperCase()}
                            size="sm"
                          />
                          <div className="text-left">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-white/50">@{user.username}</p>
                          </div>
                          {groupParticipantIds.includes(user.id) && (
                            <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-pink-500">
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  disabled={!groupName.trim() || groupParticipantIds.length === 0 || createGroupMutation.isPending}
                  onClick={() => {
                    if (!groupName.trim() || groupParticipantIds.length === 0) return;
                    createGroupMutation.mutate({ name: groupName.trim(), participantIds: groupParticipantIds });
                  }}
                >
                  {createGroupMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `Create Group (${groupParticipantIds.length + 1} members)`
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF2D55]" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
