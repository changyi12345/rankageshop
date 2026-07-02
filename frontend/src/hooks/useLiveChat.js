import { useCallback, useEffect, useRef, useState } from "react";
import { fetchChatThread, pollChatMessages, sendChatMessage } from "../api/chat";
import { useAuth } from "../context/AuthContext";
import { useShopContact } from "./useShopContact";
import { toast } from "../utils/toast";

const POLL_MS = 3000;

export function useLiveChatPanel() {  const { user } = useAuth();
  const { contact, loading: contactLoading } = useShopContact();
  const enabled = !contactLoading && contact?.liveChatEnabled !== false;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const lastIdRef = useRef(0);
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const mergeMessages = useCallback((incoming) => {
    if (!incoming?.length) return;
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const msg of incoming) map.set(msg.id, msg);
      const merged = [...map.values()].sort((a, b) => a.id - b.id);
      lastIdRef.current = merged[merged.length - 1]?.id ?? lastIdRef.current;
      return merged;
    });
  }, []);

  const loadThread = useCallback(async () => {
    if (!user || !enabled) return;
    setLoading(true);
    try {
      const data = await fetchChatThread();
      const rows = data?.messages ?? [];
      setMessages(rows);
      lastIdRef.current = rows[rows.length - 1]?.id ?? 0;
      setUnread(0);
    } catch (err) {
      toast.error(err.message || "Could not load chat.");
    } finally {
      setLoading(false);
    }
  }, [user, enabled]);

  const poll = useCallback(async () => {
    if (!user || !enabled) return;
    try {
      const data = await pollChatMessages(lastIdRef.current || undefined);
      const rows = data?.messages ?? [];
      if (rows.length) {
        mergeMessages(rows);
        if (!openRef.current) {
          const newAdmin = rows.filter((m) => m.senderType === "ADMIN").length;
          if (newAdmin > 0) setUnread((n) => n + newAdmin);
        }
      } else if (typeof data?.unreadAdmin === "number" && openRef.current) {
        setUnread(0);
      }
    } catch {
      /* ignore poll errors */
    }
  }, [user, enabled, mergeMessages]);

  useEffect(() => {
    if (!user || !enabled) return undefined;
    poll();
    const id = window.setInterval(poll, POLL_MS);
    return () => window.clearInterval(id);
  }, [user, enabled, poll]);

  useEffect(() => {
    if (open && user) loadThread();
  }, [open, user, loadThread]);

  useEffect(() => {
    const onOpen = () => {
      if (!enabled) {
        toast.info("Live chat is currently unavailable.");
        return;
      }
      setOpen(true);
      setUnread(0);
    };
    window.addEventListener("rankage:open-live-chat", onOpen);
    return () => window.removeEventListener("rankage:open-live-chat", onOpen);
  }, [enabled]);

  const send = async (text) => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const msg = await sendChatMessage(body);
      mergeMessages([msg]);
      setUnread(0);
    } catch (err) {
      toast.error(err.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  return {
    enabled,
    open,
    setOpen,
    messages,
    loading,
    sending,
    unread,
    send,
    user,
  };
}
