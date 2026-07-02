import { useEffect, useState } from "react";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { getDisplayInitials, getDisplayInitialsFromUser } from "../utils/displayInitials";

const SIZE_CLASS = {
  sm: "user-avatar--sm",
  md: "user-avatar--md",
  lg: "user-avatar--lg",
};

function resolveProfileSrc(user, src) {
  const raw = src ?? user?.profile ?? user?.profile_url;
  if (raw == null) return null;
  if (typeof raw === "string" && !raw.trim()) return null;
  return resolveMediaUrl(raw);
}

/**
 * Profile image or themed initials fallback (e.g. Daniel Aveiro → DA).
 */
export default function UserAvatar({
  user,
  name,
  src,
  size = "lg",
  className = "",
  imgClassName = "",
}) {
  const label = name ?? user?.username ?? user?.email?.split("@")[0] ?? "";
  const initials = name
    ? getDisplayInitials(name)
    : getDisplayInitialsFromUser(user);
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.lg;

  const imageSrc = resolveProfileSrc(user, src);

  const [showImage, setShowImage] = useState(Boolean(imageSrc));

  useEffect(() => {
    setShowImage(Boolean(imageSrc));
  }, [imageSrc]);

  const fallbackClass =
    `user-avatar user-avatar--fallback ${sizeClass} ${className}`.trim();
  const imageClass =
    `user-avatar user-avatar--img ${sizeClass} ${imgClassName} ${className}`.trim();

  if (showImage && imageSrc) {
    return (
      <span className={`user-avatar ${sizeClass} ${className}`.trim()}>
        <img
          src={imageSrc}
          alt=""
          className={imageClass}
          onError={() => setShowImage(false)}
        />
      </span>
    );
  }

  return (
    <span
      className={fallbackClass}
      role="img"
      aria-label={label ? `${label} avatar` : "User avatar"}
      title={label || undefined}
    >
      {initials}
    </span>
  );
}
