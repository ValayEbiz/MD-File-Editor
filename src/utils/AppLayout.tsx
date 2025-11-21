import { Clock, LogOut } from "lucide-react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router";
import { useEffect, useState, type ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const isLoggedIn = Cookies.get("auth_token") && Cookies.get("device_id");

  const handleLogout = () => {
    Cookies.remove("auth_token");
    Cookies.remove("device_id");
    Cookies.remove("user_email");

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

  return (
    <div className="relative">
      {/* TOP RIGHT LOGOUT BUTTON */}
      {isLoggedIn && (
        <div className="absolute top-4 right-4 flex items-center gap-6">
          {/* Clock */}
          <div className="text-white flex items-center gap-2 text-lg opacity-80">
            <Clock className="w-5 h-5" />
            <span className="font-mono">{time}</span>
          </div>

          {/* Logout Icon Button */}
          <button
            onClick={handleLogout}
            className="p-2 cursor-pointer rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      )}

      {children}
    </div>
  );
}
