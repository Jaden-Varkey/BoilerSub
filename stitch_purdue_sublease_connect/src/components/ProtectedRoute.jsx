import { Navigate, useLocation } from "react-router-dom";

export function ProtectedRoute({ auth, children }) {
  const location = useLocation();

  if (!auth.accessToken || !auth.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
