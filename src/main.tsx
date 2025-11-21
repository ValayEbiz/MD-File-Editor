import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { AppRoutes } from "./Routes.tsx";
import AppLayout from "./utils/AppLayout.tsx";
import { FileProvider } from "./context/FileContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <FileProvider>
        <AppLayout>
          <AppRoutes />
          <App />
        </AppLayout>
      </FileProvider>
    </BrowserRouter>
  </StrictMode>
);
