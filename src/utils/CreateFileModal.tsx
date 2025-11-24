import { useState } from "react";
import Modal from "./Modal";

export default function CreateFileModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");

  return (
    <Modal open={open} title="Create New File" onClose={onClose}>
      <div className="space-y-4">
        <input
          type="text"
          value={name}
          placeholder="Enter file name (without extension)"
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-white/10 rounded-xl outline-none border border-white/20"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (!name.trim()) return;
              onCreate(name.trim());
              setName("");
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>
    </Modal>
  );
}
