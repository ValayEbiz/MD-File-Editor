import type { ReactNode } from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-black border border-white/20 text-white p-6 rounded-2xl w-96 shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close (X) Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">{title}</h2>

        {children}
      </div>
    </div>
  );
}
