import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveChatPanel } from "../../hooks/useLiveChat";

function formatTime(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function LiveChatLoginPrompt({ onClose }) {
  return (
    <div className="live-chat-panel__guest">
      <p className="text-sm text-slate-300">Sign in to chat with our support team.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/login" className="btn-primary px-4 py-2 text-sm" onClick={onClose}>
          Sign in
        </Link>
        <Link to="/register" className="btn-secondary px-4 py-2 text-sm" onClick={onClose}>
          Create account
        </Link>
      </div>
    </div>
  );
}

function LiveChatMessageList({ messages, loading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  if (loading && messages.length === 0) {
    return <p className="live-chat-panel__empty">Loading chat…</p>;
  }

  if (!messages.length) {
    return (
      <p className="live-chat-panel__empty">
        Say hello — tell us your order ID or question and we will reply here.
      </p>
    );
  }

  return (
    <ul className="live-chat-panel__messages">
      {messages.map((msg) => {
        const mine = msg.senderType === "USER";
        return (
          <li
            key={msg.id}
            className={`live-chat-bubble-msg ${mine ? "live-chat-bubble-msg--mine" : "live-chat-bubble-msg--theirs"}`}
          >
            <p className="live-chat-bubble-msg__text">{msg.body}</p>
            <span className="live-chat-bubble-msg__time">{formatTime(msg.createdAt)}</span>
          </li>
        );
      })}
      <li ref={endRef} aria-hidden />
    </ul>
  );
}

export default function LiveChatWidget() {
  const { enabled, open, setOpen, messages, loading, sending, unread, send, user } =
    useLiveChatPanel();
  const [draft, setDraft] = useState("");

  if (!enabled) return null;

  const onSubmit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    send(text);
    setDraft("");
  };

  return (
    <>
      {open ? (
        <div className="live-chat-panel" role="dialog" aria-label="Live support chat">
          <header className="live-chat-panel__header">
            <div className="min-w-0">
              <h2 className="live-chat-panel__title">Support chat</h2>
              <p className="live-chat-panel__subtitle">We usually reply within minutes</p>
            </div>
            <button
              type="button"
              className="live-chat-panel__close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </header>

          <div className="live-chat-panel__body">
            {!user ? (
              <LiveChatLoginPrompt onClose={() => setOpen(false)} />
            ) : (
              <>
                <LiveChatMessageList messages={messages} loading={loading} />
                <form className="live-chat-panel__composer" onSubmit={onSubmit}>
                  <textarea
                    className="live-chat-panel__input"
                    rows={2}
                    placeholder="Type your message…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={sending}
                    maxLength={2000}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSubmit(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="btn-primary shrink-0 px-4 py-2 text-sm"
                    disabled={sending || !draft.trim()}
                  >
                    {sending ? "…" : "Send"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="live-chat-bubble"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close live chat" : "Open live chat"}
        aria-expanded={open}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className="live-chat-bubble__label">Chat</span>
        {unread > 0 ? (
          <span className="live-chat-bubble__badge" aria-label={`${unread} unread messages`}>
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
    </>
  );
}
