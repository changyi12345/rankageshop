import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchShopEvent } from "../api/content";
import { EVENTS_PATH } from "../config/siteNav";
import { formatEventDate, resolveCmsImageUrl } from "../utils/cmsContent";

export default function EventDetailPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const data = await fetchShopEvent(slug);
        if (!cancelled) setEvent(data);
      } catch (err) {
        if (!cancelled) {
          setEvent(null);
          setError(err?.message || "Event not found");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const imageUrl = resolveCmsImageUrl(event?.imageUrl);

  return (
    <section className="py-10 sm:py-14">
      <div className="site-container max-w-3xl">
        <Link to={EVENTS_PATH} className="text-sm font-medium text-accent-light hover:underline">
          ← All events
        </Link>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : error || !event ? (
          <div className="glass-panel mt-8 p-8 text-center">
            <h1 className="text-xl font-bold text-white">Event not found</h1>
            <p className="mt-2 text-slate-400">{error || "This event may have been removed or unpublished."}</p>
            <Link to={EVENTS_PATH} className="btn-primary mt-6 inline-flex">
              Back to events
            </Link>
          </div>
        ) : (
          <article className="mt-6">
            {imageUrl ? (
              <div className="overflow-hidden rounded-3xl border border-surface-border">
                <img src={imageUrl} alt="" className="max-h-[28rem] w-full object-cover" />
              </div>
            ) : null}
            <time className="mt-6 block text-sm font-semibold uppercase tracking-wider text-slate-500">
              {formatEventDate(event.publishedAt)}
            </time>
            <h1 className="section-heading mt-2">{event.title}</h1>
            {event.excerpt ? <p className="section-sub mt-4">{event.excerpt}</p> : null}
            <div className="glass-panel mt-8 whitespace-pre-wrap p-6 text-sm leading-relaxed text-slate-300 sm:p-8 sm:text-base">
              {event.content}
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
