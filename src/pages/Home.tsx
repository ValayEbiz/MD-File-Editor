import { LogIn } from "lucide-react";
import { Link } from "react-router";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to MD Editor
        </h1>
        <p className="text-lg opacity-80">
          A minimal, fast, and distraction‑free editing experience.
        </p>

        <Link
          to={"/login"}
          className="px-6 py-3 w-28 rounded-2xl border border-white flex items-center gap-2 mx-auto hover:bg-white hover:text-black transition font-medium"
        >
          <LogIn className="w-5 h-5" />
          Login
        </Link>
      </div>
    </div>
  );
}
