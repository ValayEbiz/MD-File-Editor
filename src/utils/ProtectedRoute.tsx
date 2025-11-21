import { Navigate } from "react-router";
import Cookies from "js-cookie";
import type { JSX } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const token = Cookies.get("auth_token");
  const deviceId = Cookies.get("device_id");

  const isLoggedIn = token && deviceId;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
