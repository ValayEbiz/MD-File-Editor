import { useParams } from "react-router";
import Sidebar from "../utils/Sidebar";
import { useFiles } from "../context/FileContext";
import { useEffect, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import LoaderOverlay from "../utils/LoaderOverlay";
import type { FileItem } from "../hooks/useFileManager";
import { useDebounce } from "../hooks/useDebounce";

export default function FileEditor() {
  const { id } = useParams();
  const {
    files,
    createFile,
    deleteFile,
    renameFile,
    updateContent,
    loading,
    createFolder,
  } = useFiles();

  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [extension, setExtension] = useState<string | null>(null);
  const debouncedContent = useDebounce(currentFile?.content ?? "", 800);

  useEffect(() => {
    if (!id) return;

    const found = files.find((f) => f.id === id) || null;
    setCurrentFile(found);

    if (found) {
      const ext = found.name.split(".").pop() || null;
      setExtension(ext);
    } else {
      setExtension(null);
    }
  }, [id, files]);

  useEffect(() => {
    if (!currentFile) return;
    updateContent(currentFile.id, debouncedContent);
  }, [debouncedContent]);

  const isLoading = files.length === 0;
  return (
    <>
      {isLoading ? (
        <LoaderOverlay show={loading} text={"Loading File..."} />
      ) : (
        <LoaderOverlay show={loading} text="Saving to Google Drive..." />
      )}

      <div
        className="min-h-screen flex bg-black text-white"
        data-color-mode="dark"
      >
        <Sidebar
          files={files}
          onCreateFile={(type, name, parentId) => {
            if (type === "folder") createFolder(name, parentId || null);
            else createFile(name, type, parentId || null);
          }}
          onDelete={deleteFile}
          onRename={renameFile}
        />
        {!currentFile && (
          <p className="h-screen   flex-1 p-10">File Not Found...</p>
        )}
        {currentFile && (
          <div className="h-screen   flex-1 p-10">
            <h1 className="text-3xl font-bold mb-4">{currentFile.name}</h1>

            <div className="bg-black  h-[95%]  p-3">
              {extension === "md" ? (
                <MDEditor
                  value={currentFile.content}
                  onChange={(val) =>
                    setCurrentFile((f) =>
                      f ? { ...f, content: val ?? "" } : null
                    )
                  }
                  height={window.innerHeight * 0.95 - 100}
                />
              ) : (
                <textarea
                  value={currentFile.content}
                  onChange={(e) =>
                    setCurrentFile((f) =>
                      f ? { ...f, content: e.target.value } : null
                    )
                  }
                  className="w-full h-full bg-black border border-white/20 p-4 rounded-xl text-white outline-none"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
