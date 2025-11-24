import { Clock, LogOut, Cloud, CloudCheck } from "lucide-react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router";
import { useEffect, useState, type ReactNode } from "react";
import { requestDriveAccess } from "../googleDrive";
import { LS_KEY } from "./LocalstorageHelper";

export default function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const authToken = Cookies.get("auth_token");
  const deviceId = Cookies.get("device_id");
  const driveToken = Cookies.get("google_drive_token");
  // const userEmail = Cookies.get("user_email");

  const isLoggedIn = authToken && deviceId;

  const handleLogout = () => {
    Cookies.remove("auth_token");
    Cookies.remove("device_id");
    Cookies.remove("user_email");
    Cookies.remove("google_drive_token");
    localStorage.removeItem(LS_KEY);
    navigate("/");
  };

  const [time, setTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDriveSync = async () => {
    try {
      await requestDriveAccess();
      window.location.reload();
    } catch (err) {
      console.error("Drive sync failed", err);
      alert("Google Drive sync failed. Please try again.");
    }
  };
  return (
    <div className="relative">
      {/* TOP RIGHT BUTTONS */}
      {isLoggedIn && (
        <div className="absolute top-4 right-4 flex items-center gap-6 z-50">
          <div className="text-white flex items-center gap-2 text-lg opacity-80">
            <Clock className="w-5 h-5" />
            <span className="font-mono">{time}</span>
          </div>

          {!driveToken ? (
            <button
              onClick={handleDriveSync}
              className="px-4 py-2 flex items-center gap-2 cursor-pointer rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white transition"
            >
              <Cloud className="w-5 h-5" />
              <span className="text-sm">Sync with Drive</span>
            </button>
          ) : (
            <div
              className="px-4 py-2 flex items-center gap-2 rounded-xl border border-green-400/40 bg-green-500/20 text-green-300 cursor-default"
              title="Google Drive Connected"
            >
              <CloudCheck className="w-5 h-5" />
              <span className="text-sm">Synced</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="p-2 cursor-pointer rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* CHILDREN WRAPPER */}
      <div className="relative">
        {/* Overlay goes ONLY on children */}
        {isLoggedIn && !driveToken && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-40">
            <h2 className="text-xl font-semibold text-white mb-4">
              Google Drive Sync Required
            </h2>
            <p className="text-white/80 text-sm max-w-sm text-center">
              Please sync your Google Drive to continue.
            </p>
          </div>
        )}

        {/* Children (disabled if not synced) */}
        <div className={isLoggedIn && !driveToken ? "pointer-events-none" : ""}>
          {children}
        </div>
      </div>
    </div>
  );
}
