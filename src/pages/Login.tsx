import { LogIn } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import Cookies from "js-cookie";

const validEmail = import.meta.env.VITE_VALID_EMAIL;
const validPassword = import.meta.env.VITE_VALID_PASSWORD;

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Generate a unique device ID
  const generateDeviceId = () => {
    return (
      "dev-" +
      Math.random().toString(36).substring(2) +
      "-" +
      Date.now().toString(36)
    );
  };

  // Hash (email + password + deviceId)
  const hashToken = async (data: string) => {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Hardcoded allowed credentials
    if (email !== validEmail || password !== validPassword) {
      setError("Invalid email or password");
      return;
    }

    // Generate device ID
    const deviceId = generateDeviceId();

    // Generate hash token
    const token = await hashToken(email + password + deviceId);

    // Store token + deviceId using js-cookie
    Cookies.set("auth_token", token, {
      expires: 7,
      path: "/",
      secure: true,
    });

    Cookies.set("device_id", deviceId, {
      expires: 7,
      path: "/",
      secure: true,
    });

    Cookies.set("user_email", email, {
      expires: 7,
      path: "/",
      secure: true,
    });

    // Redirect to dashboard
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 p-8 border border-white/20 rounded-2xl shadow-xl bg-white/5 backdrop-blur">
        <h1 className="text-3xl font-bold text-center">Login</h1>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="text-left">
            <label className="block mb-1 text-sm opacity-80">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-black border border-white/20 focus:border-white outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="text-left">
            <label className="block mb-1 text-sm opacity-80">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-black border border-white/20 focus:border-white outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-400 text-center text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full px-4 py-3 rounded-2xl border border-white flex items-center justify-center gap-2 hover:bg-white hover:text-black transition font-medium"
          >
            <LogIn className="w-5 h-5" />
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
