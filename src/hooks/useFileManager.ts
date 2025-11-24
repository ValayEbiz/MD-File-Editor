import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  deleteDriveFile,
  fetchAllDriveFiles,
  initGapi,
  initTokenClient,
  renameDriveFile,
  uploadOrUpdateFile,
} from "../googleDrive";
import { saveToLocalStorage } from "../utils/LocalstorageHelper";

export interface FileItem {
  id: string;
  driveId: string;
  name: string;
  type: "md" | "txt";
  content: string;
}

export interface FileManager {
  files: FileItem[];
  activeFile: FileItem | null;
  createFile: (name: string, type: "md" | "txt") => void;
  renameFile: (id: string, newName: string) => void;
  deleteFile: (id: string) => void;
  updateContent: (id: string, text: string) => void;
  setActiveFile: React.Dispatch<React.SetStateAction<FileItem | null>>;
  loading: boolean;
}

async function getDeterministicId(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32); // like UUID length
}

export default function useFileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const token = Cookies.get("google_drive_token") || null;

  useEffect(() => {
    saveToLocalStorage(files);
  }, [files]);

  // ✔️ Sync Google Drive → Merge with LocalStorage
  useEffect(() => {
    (async () => {
      initTokenClient();
      await initGapi();
      const driveFiles = await fetchAllDriveFiles();

      // Create array of FileItem (not promises)
      const mapped = await Promise.all(
        driveFiles.map(
          async (f: {
            driveId: string;
            name: any;
            content: any;
            type: any;
          }) => ({
            id: await getDeterministicId(f.driveId),
            driveId: f.driveId,
            name: f.name,
            content: f.content,
            type: f.type,
          })
        )
      );

      // Merge: local wins, add remote only if name not present
      setFiles((local) => {
        const final = [...local];

        for (const df of mapped) {
          if (!local.some((lf) => lf.name === df.name)) {
            final.push(df);
          }
        }

        return final;
      });

      setLoading(false);
    })();
  }, [token]);

  // Create file
  // Create file
  const createFile = async (baseName: string, type: "md" | "txt") => {
    setLoading(true);

    // Ensure unique name
    let name = `${baseName}.${type}`;
    let counter = 1;

    while (files.some((f) => f.name === name)) {
      name = `${baseName} (${counter}).${type}`;
      counter++;
    }

    // 1️⃣ Create in Google Drive first
    const uploaded = await uploadOrUpdateFile(null, name, "");
    if (!uploaded?.id) {
      setLoading(false);
      return;
    }

    const driveId = uploaded.id;

    // 2️⃣ Create deterministic local ID from driveId
    const deterministicId = await getDeterministicId(driveId);

    // 3️⃣ Add locally
    const newFile: FileItem = {
      id: deterministicId,
      driveId,
      name,
      type,
      content: "",
    };

    setFiles((prev) => [...prev, newFile]);

    setLoading(false);
  };

  // Rename
  const renameFile = async (id: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: newName } : f))
    );

    const target = files.find((f) => f.id === id);
    if (!target || !target.driveId) return;

    await renameDriveFile(target.driveId, newName);
  };

  // Delete
  const deleteFile = async (id: string) => {
    const target = files.find((f) => f.id === id);
    if (!target) return;

    setFiles((prev) => prev.filter((f) => f.id !== id));

    if (activeFile?.id === id) setActiveFile(null);

    if (target.driveId) {
      await deleteDriveFile(target.driveId);
    }
  };

  // Update content
  const updateContent = async (id: string, text: string) => {
    let driveId = "";
    let name = "";

    // Update local state AND capture correct metadata
    setFiles((prev) => {
      const updated = prev.map((f) => {
        if (f.id === id) {
          driveId = f.driveId; // capture BEFORE replacing
          name = f.name;
          return { ...f, content: text };
        }
        return f;
      });
      return updated;
    });

    // Upload correct content
    if (!driveId) return;
    await uploadOrUpdateFile(driveId, name, text);
  };

  return {
    files,
    activeFile,
    createFile,
    renameFile,
    deleteFile,
    updateContent,
    setActiveFile,
    loading,
  };
}
