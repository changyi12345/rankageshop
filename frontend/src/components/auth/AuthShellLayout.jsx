import { Link, Outlet } from "react-router-dom";
import BrandLogo from "../BrandLogo";

export default function AuthShellLayout() {
  return (
    <div className="auth-shell">
      <header className="auth-shell__bar">
        <BrandLogo size="sm" showWordmark />
        <Link to="/" className="auth-shell__home">
          ← Back to store
        </Link>
      </header>
      <main className="auth-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
