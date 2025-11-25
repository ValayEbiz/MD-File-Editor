import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  createSubFolder,
  deleteDriveFile,
  fetchAllDriveFiles,
  getOrCreateFolder,
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
  type: "md" | "txt" | "folder";
  content?: string;
  parent?: string | null;
}
export interface FileNode extends FileItem {
  children?: FileNode[];
}

export interface FileManager {
  files: FileItem[];
  activeFile: FileItem | null;
  createFile: (
    name: string,
    type: "md" | "txt",
    parentId: string | null
  ) => void;
  createFolder: (folderName: string, parentId: string | null) => void;
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
      await initGapi();
      initTokenClient();

      const driveFiles = await fetchAllDriveFiles();
      // Create array of FileItem (not promises)
      const mapped = await Promise.all(
        driveFiles.map(
          async (f: {
            driveId: string;
            name: any;
            content: any;
            type: any;
            parent: string;
          }) => ({
            id: await getDeterministicId(f.driveId),
            driveId: f.driveId,
            name: f.name,
            content: f.content,
            type: f.type,
            parent: f.parent,
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
  const createFile = async (
    baseName: string,
    type: "md" | "txt",
    parentDriveId: string | null
  ) => {
    setLoading(true);

    // Unique name handling
    let name = `${baseName}.${type}`;
    let counter = 1;

    while (files.some((f) => f.name === name && f.parent === parentDriveId)) {
      name = `${baseName} (${counter}).${type}`;
      counter++;
    }

    // Upload to Drive with correct parent folder
    const uploaded = await uploadOrUpdateFile(
      null,
      name,
      "",
      parentDriveId // <-- new param
    );

    if (!uploaded?.id) {
      setLoading(false);
      return;
    }

    const deterministicId = await getDeterministicId(uploaded.id);

    const newFile: FileItem = {
      id: deterministicId,
      driveId: uploaded.id,
      name,
      type,
      content: "",
      parent: parentDriveId,
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

    const file = files.find((f) => f.id === id);
    if (!driveId) return;

    await uploadOrUpdateFile(driveId, name, text, file?.parent || null);
  };

  const createFolder = async (
    folderName: string,
    parentDriveId: string | null
  ) => {
    setLoading(true);

    const parent = parentDriveId || (await getOrCreateFolder());
    if (!parent) {
      setLoading(false);
      return;
    }

    const folder = await createSubFolder(folderName, parent);
    const deterministicId = await getDeterministicId(folder.id);

    const newFolder: FileItem = {
      id: deterministicId,
      driveId: folder.id,
      name: folder.name,
      type: "folder",
      parent: parent, // <-- KEY
    };

    setFiles((prev) => [...prev, newFolder]);
    setLoading(false);
  };

  return {
    files,
    activeFile,
    createFile,
    renameFile,
    deleteFile,
    createFolder,
    updateContent,
    setActiveFile,
    loading,
  };
}
