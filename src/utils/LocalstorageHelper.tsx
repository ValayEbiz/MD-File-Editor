import type { FileItem } from "../hooks/useFileManager";

export const LS_KEY = "md_file_editor_files_v1";

// Load from LocalStorage
export function loadFromLocalStorage(): FileItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Save to LocalStorage
export function saveToLocalStorage(files: FileItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(files));
}
