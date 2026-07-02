import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchShopEvents } from "../api/content";
import { EVENTS_PATH } from "../config/siteNav";
import { formatEventDate, resolveCmsImageUrl } from "../utils/cmsContent";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchShopEvents();
        if (!cancelled) setEvents(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) {
          setEvents([]);
          setError(err?.message || "Events are not available right now.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-14 sm:py-20">
      <div className="site-container">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-light">News & promos</p>
          <h1 className="section-heading mt-2">Shop events</h1>
          <p className="section-sub mt-3">Announcements, campaigns, and updates from our team.</p>
        </div>

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : error ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-slate-300">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-slate-300">No events published yet. Check back soon.</p>
          </div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const imageUrl = resolveCmsImageUrl(event.imageUrl);
              return (
                <li key={event.id}>
                  <Link
                    to={`${EVENTS_PATH}/${event.slug}`}
                    className="group glass-panel flex h-full flex-col overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-glow"
                  >
                    <div className="relative aspect-[16/10] bg-surface-raised">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/20 to-surface-raised">
                          <span className="text-xs font-bold uppercase tracking-widest text-accent-light">Event</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <time className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {formatEventDate(event.publishedAt)}
                      </time>
                      <h2 className="mt-2 text-xl font-bold text-white group-hover:text-accent-light">{event.title}</h2>
                      {event.excerpt ? (
                        <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-400">{event.excerpt}</p>
                      ) : null}
                      <span className="mt-4 text-sm font-medium text-accent-light">Read article →</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
