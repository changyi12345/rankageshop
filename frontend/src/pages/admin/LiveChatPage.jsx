import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { adminApi } from "../../api/admin";
import AdminPageLoader from "../../components/admin/AdminPageLoader";
import { useAuth } from "../../context/AuthContext";
import { isAdminRole } from "../../utils/roles";
import { toast } from "react-toastify";

const POLL_MS = 3000;

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function formatShortTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(
    new Date(value),
  );
}

export default function LiveChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const lastIdRef = useRef(0);
  const selectedIdRef = useRef(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const fetchConversations = useCallback(
    async (silent = false) => {
      if (!user || !isAdminRole(user.role)) return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await adminApi.getChatConversations(statusFilter);
        const rows = Array.isArray(res.data) ? res.data : [];
        setConversations(rows);
        if (!selectedIdRef.current && rows.length > 0) {
          setSelectedId(rows[0].id);
        }
      } catch {
        toast.error("Failed to load conversations");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, statusFilter],
  );

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

  const loadMessages = useCallback(
    async (conversationId, silent = false) => {
      if (!conversationId) return;
      if (!silent) setLoadingMessages(true);
      try {
        const res = await adminApi.getChatMessages(conversationId);
        const rows = res.data?.messages ?? [];
        setMessages(rows);
        setActiveUser(res.data?.conversation?.user ?? null);
        lastIdRef.current = rows[rows.length - 1]?.id ?? 0;
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)),
        );
      } catch {
        toast.error("Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    },
    [],
  );

  const pollMessages = useCallback(async () => {
    const id = selectedIdRef.current;
    if (!id || !user || !isAdminRole(user.role)) return;
    try {
      const since = lastIdRef.current || undefined;
      const res = await adminApi.getChatMessages(id, since);
      const rows = res.data?.messages ?? [];
      if (rows.length) mergeMessages(rows);
    } catch {
      /* ignore poll errors */
    }
  }, [user, mergeMessages]);

  useEffect(() => {
    if (!authLoading) fetchConversations();
  }, [authLoading, fetchConversations]);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
    else {
      setMessages([]);
      setActiveUser(null);
      lastIdRef.current = 0;
    }
  }, [selectedId, loadMessages]);

  useEffect(() => {
    if (!selectedId) return undefined;
    pollMessages();
    const id = window.setInterval(pollMessages, POLL_MS);
    return () => window.clearInterval(id);
  }, [selectedId, pollMessages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const haystack = [c.user?.username, c.user?.email, c.preview, c.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [conversations, search]);

  const stats = useMemo(() => {
    const unread = conversations.reduce((sum, c) => sum + (c.unread ?? 0), 0);
    return { total: conversations.length, unread };
  }, [conversations]);

  const sendReply = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    try {
      const res = await adminApi.sendChatReply(selectedId, text);
      mergeMessages([res.data]);
      setDraft("");
      fetchConversations(true);
    } catch (err) {
      toast.error(err?.message || "Could not send reply");
    } finally {
      setSending(false);
    }
  };

  const closeConversation = async () => {
    if (!selectedId) return;
    try {
      await adminApi.closeChatConversation(selectedId);
      toast.success("Conversation closed");
      setSelectedId(null);
      fetchConversations();
    } catch {
      toast.error("Could not close conversation");
    }
  };

  if (authLoading || loading) return <AdminPageLoader />;

  if (!user || !isAdminRole(user.role)) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-3xl font-extrabold text-transparent">
            Live chat
          </h1>
          <p className="mt-2 text-blue-600">
            {stats.unread > 0
              ? `${stats.unread} unread message${stats.unread === 1 ? "" : "s"}`
              : `${stats.total} conversation${stats.total === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchConversations(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
        >
          <RefreshIcon sx={{ fontSize: 18 }} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="admin-live-chat">
        <aside className="admin-live-chat__list">
          <div className="admin-live-chat__list-toolbar">
            <div className="relative">
              <SearchIcon
                sx={{ fontSize: 18 }}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="admin-live-chat__input pl-9 text-sm"
                placeholder="Search users…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="admin-live-chat__input text-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setSelectedId(null);
              }}
            >
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="all">All</option>
            </select>
          </div>

          <ul className="admin-live-chat__threads">
            {filtered.length === 0 ? (
              <li className="admin-live-chat__empty">No conversations yet.</li>
            ) : (
              filtered.map((conv) => {
                const active = conv.id === selectedId;
                return (
                  <li key={conv.id}>
                    <button
                      type="button"
                      className={`admin-live-chat__thread ${active ? "admin-live-chat__thread--active" : ""}`}
                      onClick={() => setSelectedId(conv.id)}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0 text-left">
                          <p className="truncate font-semibold text-slate-900">
                            {conv.user?.username ?? `User #${conv.user?.id}`}
                          </p>
                          <p className="truncate text-xs text-slate-500">{conv.user?.email}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-[10px] text-slate-400">
                            {formatShortTime(conv.lastMessageAt)}
                          </span>
                          {conv.unread > 0 ? (
                            <span className="mt-1 block rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {conv.unread}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {conv.preview ? (
                        <p className="mt-1 truncate text-left text-xs text-slate-600">{conv.preview}</p>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        <section className="admin-live-chat__panel">
          {!selectedId ? (
            <div className="admin-live-chat__placeholder">
              <ChatIcon sx={{ fontSize: 48 }} className="text-blue-300" />
              <p className="mt-3 text-sm text-slate-500">Select a conversation to reply</p>
            </div>
          ) : (
            <>
              <header className="admin-live-chat__panel-header">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-900">
                    {activeUser?.username ?? "Customer"}
                  </h2>
                  <p className="truncate text-sm text-slate-500">{activeUser?.email}</p>
                </div>
                {statusFilter !== "CLOSED" ? (
                  <button
                    type="button"
                    onClick={closeConversation}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                    Close
                  </button>
                ) : null}
              </header>

              <div className="admin-live-chat__messages">
                {loadingMessages && messages.length === 0 ? (
                  <p className="text-sm text-slate-500">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-slate-500">No messages in this thread yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {messages.map((msg) => {
                      const mine = msg.senderType === "ADMIN";
                      return (
                        <li
                          key={msg.id}
                          className={`admin-live-chat__bubble ${mine ? "admin-live-chat__bubble--admin" : "admin-live-chat__bubble--user"}`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm">{msg.body}</p>
                          <span
                            className={`mt-1 block text-[10px] ${mine ? "text-white/75" : "text-slate-500"}`}
                          >
                            {formatTime(msg.createdAt)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <form className="admin-live-chat__composer" onSubmit={sendReply}>
                <textarea
                  className="admin-live-chat__input min-h-[4.5rem] resize-y text-sm"
                  rows={3}
                  placeholder="Type your reply…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={sending}
                  maxLength={2000}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  className="self-end rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={sending || !draft.trim()}
                >
                  {sending ? "Sending…" : "Send reply"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
