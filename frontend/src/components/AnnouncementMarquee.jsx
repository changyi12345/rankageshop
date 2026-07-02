import { useMemo } from "react";
import { HEADER_ANNOUNCEMENT } from "../config/siteNav";
import { useAnnouncements } from "../hooks/useAnnouncements";

function MarqueeItem({ message, linkUrl }) {
  const inner = (
    <>
      <span className="announcement-marquee__dot" aria-hidden />
      <span className="announcement-marquee__text">{message}</span>
    </>
  );

  if (linkUrl) {
    return (
      <a
        href={linkUrl}
        className="announcement-marquee__item announcement-marquee__item--link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {inner}
      </a>
    );
  }

  return <span className="announcement-marquee__item">{inner}</span>;
}

export default function AnnouncementMarquee() {
  const { items, loading } = useAnnouncements();

  const messages = useMemo(() => {
    if (items.length > 0) {
      return items.map((row) => ({
        id: row.id,
        message: row.message,
        linkUrl: row.link_url || "",
      }));
    }
    if (!loading) {
      return [{ id: "fallback", message: HEADER_ANNOUNCEMENT, linkUrl: "" }];
    }
    return [];
  }, [items, loading]);

  if (loading && messages.length === 0) {
    return (
      <div className="announcement-marquee" aria-hidden>
        <div className="announcement-marquee__shimmer" />
      </div>
    );
  }

  if (messages.length === 0) return null;

  const track = [...messages, ...messages];

  return (
    <div className="announcement-marquee" role="region" aria-label="Announcements">
      <div className="announcement-marquee__fade announcement-marquee__fade--left" aria-hidden />
      <div className="announcement-marquee__viewport">
        <div
          className="announcement-marquee__track"
          style={{ "--marquee-count": messages.length }}
        >
          {track.map((row, index) => (
            <MarqueeItem
              key={`${row.id}-${index}`}
              message={row.message}
              linkUrl={row.linkUrl}
            />
          ))}
        </div>
      </div>
      <div className="announcement-marquee__fade announcement-marquee__fade--right" aria-hidden />
    </div>
  );
}
