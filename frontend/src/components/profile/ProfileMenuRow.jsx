import { Link } from "react-router-dom";
import { NavIcon } from "../nav/NavIcons";

function RowInner({ icon, title, subtitle, trailing, danger }) {
  return (
    <>
      <span className={`profile-menu-row__icon ${danger ? `profile-menu-row__icon--${danger}` : ""}`}>
        <NavIcon name={icon} />
      </span>
      <span className="profile-menu-row__text">
        <span className={`profile-menu-row__title ${danger ? `profile-menu-row__title--${danger}` : ""}`}>
          {title}
        </span>
        {subtitle ? <span className="profile-menu-row__subtitle">{subtitle}</span> : null}
      </span>
      {trailing ? <span className="profile-menu-row__trailing">{trailing}</span> : null}
    </>
  );
}

export default function ProfileMenuRow({
  icon,
  title,
  subtitle,
  to,
  href,
  onClick,
  trailing,
  danger,
  external,
}) {
  const inner = (
    <RowInner
      icon={icon}
      title={title}
      subtitle={subtitle}
      trailing={trailing ?? (onClick || to || href ? <NavIcon name="chevron" className="h-4 w-4 opacity-40" /> : null)}
      danger={danger}
    />
  );

  if (onClick) {
    return (
      <button type="button" className="profile-menu-row" onClick={onClick}>
        {inner}
      </button>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className="profile-menu-row"
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {inner}
      </a>
    );
  }

  if (to) {
    return (
      <Link to={to} className="profile-menu-row">
        {inner}
      </Link>
    );
  }

  return <div className="profile-menu-row profile-menu-row--static">{inner}</div>;
}
