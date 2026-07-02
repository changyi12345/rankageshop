import { Link } from "react-router-dom";
import { EVENTS_PATH } from "../config/siteNav";
import { formatEventDate, resolveCmsImageUrl } from "../utils/cmsContent";

function EventCard({ event }) {
  const imageUrl = resolveCmsImageUrl(event.imageUrl);

  return (
    <li>
      <Link
        to={`${EVENTS_PATH}/${event.slug}`}
        className="group glass-panel flex h-full flex-col overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-glow"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-raised">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/25 to-surface-raised px-4 text-center">
              <span className="text-sm font-bold uppercase tracking-widest text-accent-light">Event</span>
            </div>
          )}
          {event.isPinned ? (
            <span className="absolute left-3 top-3 rounded-full border border-accent/40 bg-accent/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-light backdrop-blur-sm">
              Featured
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <time className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {formatEventDate(event.publishedAt)}
          </time>
          <h3 className="mt-2 text-lg font-bold text-white group-hover:text-accent-light">{event.title}</h3>
          {event.excerpt ? (
            <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-400">{event.excerpt}</p>
          ) : null}
          <span className="mt-4 text-sm font-medium text-accent-light">Read more →</span>
        </div>
      </Link>
    </li>
  );
}

export default function ShopEventsSection({ events = [], title = "Latest events", showViewAll = true }) {
  if (!events.length) return null;

  return (
    <section className="border-b border-surface-border py-12 sm:py-16">
      <div className="site-container">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="section-heading">{title}</h2>
            <p className="section-sub mt-2">News, promos, and updates from RanKageShop.</p>
          </div>
          {showViewAll && events.length > 0 ? (
            <Link to={EVENTS_PATH} className="btn-secondary text-sm">
              View all events
            </Link>
          ) : null}
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </ul>
      </div>
    </section>
  );
}
