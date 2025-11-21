import { useState, useEffect } from "react";

export interface FileItem {
    id: string;
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
}

export default function useFileManager() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [activeFile, setActiveFile] = useState<FileItem | null>(null);

    // Load from LS
    useEffect(() => {
        const saved = localStorage.getItem("files");
        if (saved) setFiles(JSON.parse(saved));
    }, []);

    // Save to LS
    const persist = (updated: FileItem[]) => {
        setFiles(updated);
        localStorage.setItem("files", JSON.stringify(updated));
    };

    // Create file
    const createFile = (name: string, type: "md" | "txt") => {
        let base = name;
        let finalName = `${base}.${type}`;
        let counter = 1;

        while (files.some((f) => f.name === finalName)) {
            finalName = `${base} (${counter}).${type}`;
            counter++;
        }

        const newFile: FileItem = {
            id: crypto.randomUUID(),
            name: finalName,
            type,
            content: "",
        };

        const updated = [...files, newFile];
        persist(updated);
    };



    // Rename
    const renameFile = (id: string, newName: string) => {
        const target = files.find(f => f.id === id);
        if (!target) return;

        // Prevent duplicate names
        if (files.some(f => f.name === newName && f.id !== id)) {
            console.warn("Duplicate filename blocked:", newName);
            return;
        }

        const updated = files.map(f =>
            f.id === id ? { ...f, name: newName } : f
        );

        persist(updated);
    };

    // Delete
    const deleteFile = (id: string) => {
        const updated = files.filter(f => f.id !== id);
        persist(updated);

        if (activeFile?.id === id) setActiveFile(null);
    };

    // Update content
    const updateContent = (id: string, text: string) => {
        const updated = files.map(f =>
            f.id === id ? { ...f, content: text } : f
        );
        persist(updated);
    };

    return {
        files,
        activeFile,
        createFile,
        renameFile,
        deleteFile,
        updateContent,
        setActiveFile,
    };
}
