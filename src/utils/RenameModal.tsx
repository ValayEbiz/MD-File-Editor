import { useState, useEffect, useMemo } from "react";
import Modal from "./Modal";

export default function RenameModal({
  open,
  initial,
  modalType,
  existingNames,
  onClose,
  onSave,
}: any) {
  // Extract name + extension
  const { baseName, extension } = useMemo(() => {
    const lastDotIndex = initial.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return { baseName: initial, extension: "" };
    }
    return {
      baseName: initial.slice(0, lastDotIndex),
      extension: initial.slice(lastDotIndex), // includes "."
    };
  }, [initial]);

  const [name, setName] = useState(baseName);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(baseName);
  }, [baseName]);

  // validation
  useEffect(() => {
    const finalName = name + extension;

    if (name.trim() === "") {
      setError("Name cannot be empty.");
    } else if (finalName !== initial && existingNames.includes(finalName)) {
      setError(`"${finalName}" already exists.`);
    } else {
      setError("");
    }
  }, [name, extension, initial, existingNames]);

  const handleSave = () => {
    if (!error) onSave(name + extension);
  };

  return (
    <Modal
      open={open}
      title={`Rename ${modalType === "folder" ? "folder" : "file"}`}
      onClose={onClose}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 rounded bg-black border border-white/30 text-white outline-none"
      />

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
        >
          Cancel
        </button>

        <button
          disabled={!!error}
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          className={`px-4 py-2 rounded-xl transition ${
            error
              ? "bg-white/5 text-white/40 cursor-not-allowed"
              : "bg-white/20 hover:bg-white/30"
          }`}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
