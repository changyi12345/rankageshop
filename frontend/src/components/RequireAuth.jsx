import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="site-container py-20 text-center text-slate-400">
        Loading…
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children;
}

export function LoginPromptCard({ message = "Sign in to continue." }) {
  const location = useLocation();
  const next = encodeURIComponent(location.pathname + location.search);

  return (
    <div className="glass-panel mx-auto max-w-md p-8 text-center">
      <p className="text-slate-300">{message}</p>
      <Link
        to={`/login?next=${next}`}
        className="btn-primary mt-6 inline-flex"
      >
        Sign in
      </Link>
      <p className="mt-4 text-sm text-slate-500">
        New here?{" "}
        <Link to="/register" className="text-accent-light hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
