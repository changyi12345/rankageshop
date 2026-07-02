import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updateMe, changePassword } from "../api/auth";
import { PROFILE_PATH } from "../config/siteNav";
import RequireAuth from "../components/RequireAuth";
import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "../components/UserAvatar";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { toast } from "../utils/toast";

function ProfileEditContent() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setPhone(user.phone || "");
      setPreview(resolveMediaUrl(user.avatar_url ?? user.profile) || "");
    }
  }, [user]);

  useEffect(() => {
    setPreviewFailed(false);
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    setPreviewFailed(false);
  }, [preview]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMe({ username: username.trim() });
      if (password) {
        if (!currentPassword) {
          toast.error("Enter your current password to set a new one.");
          return;
        }
        await changePassword({ currentPassword, newPassword: password });
      }
      await refreshUser();
      toast.success("Profile updated.");
      navigate(PROFILE_PATH);
    } catch (err) {
      toast.error(err.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const displayName = username.trim() || user?.username || user?.email?.split("@")[0] || "";

  return (
    <div className="profile-page profile-page--edit">
      <Link to={PROFILE_PATH} className="profile-edit-back">
        ← Back to profile
      </Link>
      <h1 className="section-heading mt-4">Update profile</h1>
      <p className="mt-2 text-sm text-slate-400 lg:text-base">
        Change how you appear on RanKageShop. Your email stays the same for security.
      </p>

      <div className="profile-edit-shell">
        <aside className="profile-edit-aside" aria-hidden="false">
          {preview && !previewFailed ? (
            <span className="user-avatar user-avatar--md lg:h-28 lg:w-28">
              <img
                src={preview}
                alt=""
                className="user-avatar user-avatar--img user-avatar--md h-full w-full lg:h-28 lg:w-28"
                onError={() => setPreviewFailed(true)}
              />
            </span>
          ) : (
            <UserAvatar
              user={user}
              name={displayName}
              size="md"
              className="lg:!h-28 lg:!w-28 lg:!text-4xl"
            />
          )}
          <p className="mt-4 text-lg font-bold text-white">{displayName || "Account"}</p>
          <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
        </aside>

        <form onSubmit={onSubmit} className="glass-panel mt-6 p-6 sm:mt-8 sm:p-8 lg:mt-0">
          <div className="flex flex-col items-center lg:hidden">
            {preview && !previewFailed ? (
              <span className="user-avatar user-avatar--md">
                <img
                  src={preview}
                  alt=""
                  className="user-avatar user-avatar--img user-avatar--md"
                  onError={() => setPreviewFailed(true)}
                />
              </span>
            ) : (
              <UserAvatar user={user} name={displayName} size="md" />
            )}
            <label className="btn-secondary mt-4 cursor-pointer text-sm">
              Change photo
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <label className="hidden lg:block">
            <span className="field-label">Profile photo</span>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="btn-secondary cursor-pointer text-sm">
                Upload new photo
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                />
              </label>
              {photo ? (
                <span className="text-xs text-slate-500">{photo.name}</span>
              ) : null}
            </div>
          </label>

          <label className="mt-6 block lg:mt-0">
            <span className="field-label">Username</span>
            <input
              className="input-field mt-2 w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={2}
            />
          </label>

          <label className="mt-4 block">
            <span className="field-label">Phone (optional)</span>
            <input
              className="input-field mt-2 w-full"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxxx"
            />
          </label>

          <label className="mt-4 block">
            <span className="field-label">Email</span>
            <input className="input-field mt-2 w-full opacity-60" value={user?.email || ""} disabled />
            <p className="form-note mt-1">Email cannot be changed here.</p>
          </label>

          <label className="mt-4 block">
            <span className="field-label">New password (optional)</span>
            <PasswordInput
              className="input-field mt-2 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          {password ? (
            <label className="mt-4 block">
              <span className="field-label">Current password</span>
              <PasswordInput
                className="input-field mt-2 w-full"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="submit" className="btn-primary flex-1 py-3" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            <Link to={PROFILE_PATH} className="btn-secondary flex-1 py-3 text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfileEditPage() {
  return (
    <RequireAuth>
      <div className="site-container site-container--profile py-5 sm:py-8 lg:py-10">
        <ProfileEditContent />
      </div>
    </RequireAuth>
  );
}
