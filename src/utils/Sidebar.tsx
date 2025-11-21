import { FilePlus, FileText, Trash2, Edit3, Menu } from "lucide-react";
import { useState } from "react";
import type { FileItem } from "../hooks/useFileManager";
import { useNavigate } from "react-router";
import RenameModal from "./RenameModal";
import Modal from "./Modal";

export default function Sidebar({
  files,
  onCreateFile,
  onDelete,
  onRename,
}: {
  files: FileItem[];
  onCreateFile: (ext: "md" | "txt") => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

  return (
    <div
      className={`h-screen bg-black border-r border-white/10 text-white transition-all duration-300 flex flex-col ${
        open ? "w-64" : "w-16 items-center"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button
          onClick={() => setOpen(!open)}
          className="p-2 hover:bg-white/10"
        >
          <Menu className="w-5 h-5" />
        </button>
        {open && (
          <span
            onClick={() => {
              navigate("/dashboard");
            }}
            className="cursor-pointer font-semibold"
          >
            File Manager
          </span>
        )}
      </div>

      {/* New File Buttons */}
      <div className="p-4 flex flex-col gap-2">
        {/* MD Button */}
        <button
          onClick={() => onCreateFile("md")}
          className={`flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 ${
            !open ? "justify-center" : ""
          }`}
        >
          <FilePlus className="w-5 h-5 shrink-0" /> {/* FIX */}
          {open && (
            <span className="whitespace-nowrap">New Markdown (.md)</span>
          )}
        </button>

        {/* TXT Button */}
        <button
          onClick={() => onCreateFile("txt")}
          className={`flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 ${
            !open ? "justify-center" : ""
          }`}
        >
          <FilePlus className="w-5 h-5 shrink-0" /> {/* FIX */}
          {open && <span className="whitespace-nowrap">New Text (.txt)</span>}
        </button>
      </div>

      {/* FILE LIST */}
      <div className="p-3 space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-3 rounded-xl group"
          >
            <div
              className={`flex cursor-pointer items-center gap-3 flex-1 ${
                !open ? "justify-center" : ""
              }`}
              onClick={() => navigate(`/file/${file.id}`)}
            >
              <FileText className="w-5 h-5 shrink-0" />
              {open && file.name}
            </div>

            {open && (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={() => setRenameTarget(file)}>
                  <Edit3 className="w-4 h-4 text-yellow-400" />
                </button>
                <button onClick={() => setDeleteTarget(file)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <RenameModal
        open={!!renameTarget}
        initial={renameTarget?.name ?? ""}
        existingNames={files.map((f) => f.name)}
        onClose={() => setRenameTarget(null)}
        onSave={(newName: string) => {
          onRename(renameTarget!.id, newName);
          setRenameTarget(null);
        }}
      />

      <Modal
        open={!!deleteTarget}
        title="Delete File?"
        onClose={() => setDeleteTarget(null)}
      >
        <p className="opacity-80">
          Are you sure you want to delete {deleteTarget?.name} file?
        </p>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(null);
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
          >
            Cancel
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(deleteTarget!.id);
              setDeleteTarget(null);
            }}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
