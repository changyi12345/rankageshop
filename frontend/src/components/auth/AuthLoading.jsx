export default function AuthLoading({ message = "Loading your session…" }) {
  return (
    <div className="auth-loading">
      <span className="auth-loading__spinner" aria-hidden />
      <p className="auth-loading__text">{message}</p>
    </div>
  );
}
