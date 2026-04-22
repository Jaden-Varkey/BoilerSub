import { Link, NavLink, useNavigate } from "react-router-dom";

export function AppShell({ auth, onLogout, children }) {
  const navigate = useNavigate();

  return (
    <div className="page-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          BoilerSub
        </Link>
        <nav className="nav-links">
          <NavLink to="/listings">Browse</NavLink>
          <NavLink to="/listings/new">List Your Sublease</NavLink>
          {auth.user ? <NavLink to="/profile">Profile</NavLink> : null}
        </nav>
        <div className="nav-actions">
          {auth.user ? (
            <>
              <button className="ghost-button" onClick={() => navigate("/profile/listings")}>
                My Listings
              </button>
              <button className="primary-button small" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="ghost-button link-button" to="/login">
                Login
              </Link>
              <Link className="primary-button small link-button" to="/signup">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="content-shell">{children}</main>
    </div>
  );
}
