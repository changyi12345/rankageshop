export function AuthDivider({ label = "or continue with email" }) {
  return (
    <div className="auth-divider" role="separator">
      <span>{label}</span>
    </div>
  );
}
