import { Sparkles } from "lucide-react";
import Cookies from "js-cookie";
import Sidebar from "../utils/Sidebar";
import useFileManager from "../hooks/useFileManager";

export default function Dashboard() {
  const deviceId = Cookies.get("device_id");
  const userEmail = Cookies.get("user_email");

  const {
    files,
    activeFile,
    createFile,
    deleteFile,
    renameFile,
    updateContent,
  } = useFileManager();

  const quotes = [
    "Code is like humor. When you have to explain it, it’s bad.",
    "Make it work, make it right, make it fast.",
    "Success is the sum of small efforts repeated daily.",
    "Every expert was once a beginner.",
    "Dream big. Start small. Act now.",
  ];

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning 🌅";
    if (hour < 17) return "Good Afternoon ☀️";
    if (hour < 20) return "Good Evening 🌇";
    return "Good Night 🌙";
  })();

  return (
    <div className="min-h-screen flex bg-black text-white">
      {/* SIDEBAR */}
      <Sidebar
        files={files}
        onCreateFile={(ext) => createFile(`untitled`, ext)}
        // onOpen={setActiveFile}
        onDelete={deleteFile}
        onRename={renameFile}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 p-10 space-y-6">
        <h1 className="text-4xl font-bold mb-4">Dashboard</h1>

        {/* User Card */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <p className="text-lg opacity-80">{greeting}</p>
          <p className="text-xl font-semibold">{userEmail}</p>
          <p className="text-sm opacity-60 font-mono">Device ID: {deviceId}</p>
          {/* <p className="text-lg mt-2">⏰ {clock}</p> */}
        </div>

        {/* Quote */}
        <div className="p-6 rounded-2xl bg-white/10 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <h2 className="text-2xl font-semibold">Stay Inspired</h2>
          </div>
          <p className="text-lg italic">
            "{quotes[Math.floor(Math.random() * quotes.length)]}"
          </p>
        </div>

        {/* FILE EDITOR */}
        {activeFile ? (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-2xl mb-2">{activeFile.name}</h2>

            <textarea
              value={activeFile.content}
              onChange={(e) => updateContent(activeFile.id, e.target.value)}
              className="w-full h-[400px] bg-black border border-white/20 p-4 rounded-xl text-white outline-none"
            />
          </div>
        ) : (
          <p className="opacity-50">
            Select a file or create new to start editing.
          </p>
        )}
      </div>
    </div>
  );
}
