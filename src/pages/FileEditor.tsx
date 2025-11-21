import { useNavigate, useParams } from "react-router";
import Sidebar from "../utils/Sidebar";
import { useFiles } from "../context/FileContext";
import { useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";

export default function FileEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { files, createFile, deleteFile, renameFile, updateContent } =
    useFiles();

  const file = files.find((f) => f.id === id);
  const fileExtension = file?.name.split(".")[1];

  useEffect(() => {
    if (files.length === 0 || !file) {
      navigate("/dashboard");
    }
  }, [files, file]);

  return (
    <div
      className="min-h-screen flex bg-black text-white"
      data-color-mode="dark"
    >
      <Sidebar
        files={files}
        onCreateFile={(ext) => createFile("untitled", ext)}
        onDelete={deleteFile}
        onRename={renameFile}
      />

      <div className="h-screen   flex-1 p-10">
        {!file ? (
          <p>File not found...</p>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-4">{file.name}</h1>

            <div className="bg-black  h-[95%]  p-3">
              {fileExtension === "md" ? (
                <MDEditor
                  value={file.content}
                  onChange={(val) => updateContent(file.id, val ?? "")}
                  height={window.innerHeight * 0.95 - 100}
                />
              ) : (
                <textarea
                  value={file.content}
                  onChange={(e) => updateContent(file.id, e.target.value)}
                  className="w-full h-full bg-black border border-white/20 p-4 rounded-xl text-white outline-none"
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
