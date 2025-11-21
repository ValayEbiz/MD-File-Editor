import { lazy } from "react";
import { Route, Routes } from "react-router";
import ProtectedRoute from "./utils/ProtectedRoute";

const HomePage = lazy(() => import("./pages/Home"));
const LoginPage = lazy(() => import("./pages/Login"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const FileEditorPage = lazy(() => import("./pages/FileEditor"));

export const AppRoutes = () => {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/file/:id"
        element={
          <ProtectedRoute>
            <FileEditorPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
