export default function LoaderOverlay({
  show,
  text = "Loading...",
}: {
  show: boolean;
  text: string;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-9999">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        <p className="text-white text-lg opacity-80">{text}</p>
      </div>
    </div>
  );
}
