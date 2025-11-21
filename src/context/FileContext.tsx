import { createContext, useContext } from "react";
import useFileManager, { type FileManager } from "../hooks/useFileManager";

const FileContext = createContext<FileManager | null>(null);

export function FileProvider({ children }: { children: React.ReactNode }) {
  const file = useFileManager();
  return <FileContext.Provider value={file}>{children}</FileContext.Provider>;
}

export function useFiles() {
  const ctx = useContext(FileContext);
  if (!ctx) {
    throw new Error("useFiles must be used inside <FileProvider>");
  }
  return ctx;
}
