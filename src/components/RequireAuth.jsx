import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const RequireAuth = ({ allowedRole, children }) => {
  const { auth } = useAuth();
  const location = useLocation();

  if (auth?.role === allowedRole) {
    return children;
  } else if (auth?.role) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  } else {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
};

export default RequireAuth;
