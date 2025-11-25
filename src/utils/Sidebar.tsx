import {
  FilePlus,
  FileText,
  Trash2,
  Edit3,
  Menu,
  FolderPlus,
  FileSpreadsheet,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { FileItem, FileNode } from "../hooks/useFileManager";
import { useNavigate } from "react-router";
import RenameModal from "./RenameModal";
import Modal from "./Modal";
import CreateFileModal from "./CreateFileModal";

export default function Sidebar({
  files,
  onCreateFile,
  onDelete,
  onRename,
}: {
  files: FileItem[];
  onCreateFile: (
    type: "md" | "txt" | "folder",
    name: string,
    parentId?: string | null
  ) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [createModalType, setCreateModalType] = useState<
    "md" | "txt" | "folder" | null
  >(null);
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [sidebarWidth, setSidebarWidth] = useState(300); // default 256px like w-64
  const [isResizing, setIsResizing] = useState(false);
  const [tree, setTree] = useState<FileNode[]>([]);

  const toggleFolder = (id: string) => {
    const newSet = new Set(expandedFolders);
    if (expandedFolders.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedFolders(newSet);
  };

  const startResizing = () => {
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX; // distance from left
      if (newWidth > 140 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  };

  function sortNodes(nodes: FileNode[]) {
    nodes.sort((a, b) => {
      // folders first
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;

      // alphabetical, case insensitive
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    // recursively sort children
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children);
      }
    });

    return nodes;
  }

  function buildFileTree(files: FileItem[]): FileNode[] {
    const idMap = new Map<string, FileNode>();
    const driveIdMap = new Map<string, FileNode>();

    // Create nodes and populate both maps (by id and by driveId)
    files.forEach((f) => {
      const node: FileNode = { ...f, children: [] };
      if (f.id) idMap.set(f.id, node);
      if (f.driveId) driveIdMap.set(f.driveId, node);
    });

    // Link children: parent may be either an id or a driveId
    files.forEach((f) => {
      const node = idMap.get(f.id);
      if (!node) return;
      if (f.parent) {
        // parent might be an id or a driveId — try both
        const parentById = idMap.get(f.parent);
        const parentByDriveId = driveIdMap.get(f.parent);
        const parentNode = parentById ?? parentByDriveId;
        if (parentNode) {
          parentNode.children!.push(node);
        }
      }
    });

    // If there's a fixed root folder named "MD File Editor", hide it and return its children
    const rootFolder = files.find(
      (f) => f.type === "folder" && f.name === "MD File Editor"
    );
    if (rootFolder) {
      // find node either by id or driveId
      setRootFolderId(rootFolder.driveId);
      const rootNode =
        idMap.get(rootFolder.id) ?? driveIdMap.get(rootFolder.driveId ?? "");
      return sortNodes(rootNode?.children ?? []);
    }

    // otherwise return nodes which do not have a parent reference in our maps
    const roots: FileNode[] = [];
    idMap.forEach((node) => {
      const parentRef = node.parent;
      const parentExists =
        parentRef && (idMap.has(parentRef) || driveIdMap.has(parentRef));
      if (!parentRef || !parentExists) roots.push(node);
    });

    return sortNodes(roots);
  }

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  });

  useEffect(() => {
    const built = buildFileTree(files);
    setTree(built);
  }, [files]);

  function SidebarItem({
    item,
    open,
    expandedFolders,
    toggleFolder,
    navigate,
    setRenameTarget,
    setDeleteTarget,
    setParentFolderId,
    setCreateModalType,
  }: any) {
    const isFolder = item.type === "folder";

    if (!isFolder) {
      return (
        <div
          className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-3 rounded-xl group"
          onClick={() => navigate(`/file/${item.id}`)}
        >
          <div className="flex items-center gap-3 min-w-0">
            {item.name.endsWith(".md") ? (
              <FileSpreadsheet className="w-5 h-5" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
            {open && (
              <span
                className="max-w-[120px] block overflow-hidden text-ellipsis whitespace-nowrap"
                title={item.name}
              >
                {item.name}
              </span>
            )}
          </div>

          {open && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameTarget(item);
                }}
              >
                <Edit3 className="w-4 h-4 text-yellow-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(item);
                }}
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}
        </div>
      );
    }

    // Folder UI
    return (
      <div className="flex flex-col bg-white/5 hover:bg-white/10 p-3 rounded-xl group">
        <div
          className="flex cursor-pointer items-center justify-between"
          onClick={() => {
            if (!open) {
              // Sidebar is closed → open sidebar AND expand this folder
              setOpen(true);

              setExpandedFolders((prev) => {
                const newSet = new Set(prev);
                newSet.add(item.id); // expand clicked folder
                return newSet;
              });
            } else {
              // Normal toggle behavior when sidebar open
              toggleFolder(item.id);
            }
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {expandedFolders.has(item.id) ? (
              <FolderOpen className="w-5 h-5" />
            ) : (
              <Folder className="w-5 h-5" />
            )}
            {open && (
              <span
                className="max-w-[120px] block overflow-hidden text-ellipsis whitespace-nowrap"
                title={item.name}
              >
                {item.name}
              </span>
            )}
          </div>

          {open && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameTarget(item);
                }}
              >
                <Edit3 className="w-3 h-3 text-yellow-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(item);
                }}
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setParentFolderId(item.driveId);
                  setCreateModalType("md");
                }}
              >
                <FilePlus className="w-3 h-3 text-green-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setParentFolderId(item.driveId);
                  setCreateModalType("txt");
                }}
              >
                <FileText className="w-3 h-3 text-blue-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setParentFolderId(item.driveId);
                  setCreateModalType("folder");
                }}
              >
                <FolderPlus className="w-3 h-3 text-purple-400" />
              </button>
            </div>
          )}
        </div>

        {expandedFolders.has(item.id) && item.children?.length > 0 && (
          <div className="mt-2 space-y-2">
            {item.children.map((child: { id: any }) => (
              <SidebarItem
                key={child.id}
                item={child}
                open={open}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                navigate={navigate}
                setRenameTarget={setRenameTarget}
                setDeleteTarget={setDeleteTarget}
                setParentFolderId={setParentFolderId}
                setCreateModalType={setCreateModalType}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ width: open ? sidebarWidth : 64 }}
      className="h-screen bg-black border-r border-white/10 text-white flex flex-col relative select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button
          onClick={() => {
            if (open) {
              // closing → collapse all folders
              setExpandedFolders(new Set());
            }
            setOpen(!open);
          }}
          className="p-2 hover:bg-white/10"
        >
          <Menu className="w-5 h-5" />
        </button>

        {open && (
          <span
            onClick={() => {
              navigate("/dashboard");
            }}
            className="cursor-pointer font-semibold"
          >
            File Manager
          </span>
        )}
      </div>
      {/* New File Buttons */}
      <div className="p-4 flex flex-col gap-2">
        {/* MD Button */}
        <button
          onClick={() => setCreateModalType("md")}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20"
        >
          <FilePlus className="w-5 h-5" />
          {open && <span>New Markdown (.md)</span>}
        </button>

        {/* TXT Button */}
        <button
          onClick={() => setCreateModalType("txt")}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20"
        >
          <FileText className="w-5 h-5" />
          {open && <span>New Text (.txt)</span>}
        </button>
        <button
          onClick={() => setCreateModalType("folder")}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20"
        >
          <FolderPlus className="w-5 h-5" />
          {open && <span>New Folder</span>}
        </button>
      </div>
      {/* FILE LIST */}
      <div className="p-3 space-y-2">
        {tree.map((item) => {
          if (item.type === "folder") {
            return (
              <div
                key={item.id}
                className="flex flex-col bg-white/5 hover:bg-white/10 p-3 rounded-xl group"
              >
                {/* Folder Header */}
                <div
                  className={`flex cursor-pointer items-center gap-3 justify-between flex-1`}
                  onClick={() => {
                    if (!open) {
                      // Sidebar is closed → open sidebar AND expand this folder
                      setOpen(true);

                      setExpandedFolders((prev) => {
                        const newSet = new Set(prev);
                        newSet.add(item.id); // expand clicked folder
                        return newSet;
                      });
                    } else {
                      // Normal toggle behavior when sidebar open
                      toggleFolder(item.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    {expandedFolders.has(item.id) ? (
                      <FolderOpen className="w-5 h-5 shrink-0" />
                    ) : (
                      <Folder className="w-5 h-5 shrink-0" />
                    )}
                    {open && (
                      <span
                        className="max-w-[120px] block overflow-hidden text-ellipsis whitespace-nowrap"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                    )}
                  </div>

                  {open && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                      <button onClick={() => setRenameTarget(item)}>
                        <Edit3 className="w-3 h-3 text-yellow-400" />
                      </button>
                      <button onClick={() => setDeleteTarget(item)}>
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>

                      {/* Open modal for creation */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setParentFolderId(item.driveId);
                          setCreateModalType("md");
                        }}
                      >
                        <FilePlus className="w-3 h-3 text-green-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setParentFolderId(item.driveId);
                          setCreateModalType("txt");
                        }}
                      >
                        <FileText className="w-3 h-3 text-blue-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setParentFolderId(item.driveId);
                          setCreateModalType("folder");
                        }}
                      >
                        <FolderPlus className="w-3 h-3 text-purple-400" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Folder Content (Accordion) */}
                {expandedFolders.has(item.id) && (
                  <div className="mt-2 space-y-2">
                    {item.children && item.children.length > 0 ? (
                      item.children.map((child) => (
                        <SidebarItem
                          key={child.id}
                          item={child}
                          open={open}
                          expandedFolders={expandedFolders}
                          toggleFolder={toggleFolder}
                          navigate={navigate}
                          setRenameTarget={setRenameTarget}
                          setDeleteTarget={setDeleteTarget}
                          setParentFolderId={setParentFolderId}
                          setCreateModalType={setCreateModalType}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-white/50 italic">No items</p>
                    )}
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-3 rounded-xl group"
              >
                <div
                  className={`flex cursor-pointer items-center gap-3 flex-1 min-w-0 ${
                    !open ? "justify-center" : ""
                  }`}
                  onClick={() => {
                    navigate(`/file/${item.id}`);
                  }}
                >
                  {item.name.split(".")[1] === "md" ? (
                    <FileSpreadsheet className="w-5 h-5 shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 shrink-0" />
                  )}
                  {open && (
                    <span
                      className="max-w-[120px] block overflow-hidden text-ellipsis whitespace-nowrap"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                  )}
                </div>

                {open && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                    <button onClick={() => setRenameTarget(item)}>
                      <Edit3 className="w-4 h-4 text-yellow-400" />
                    </button>
                    <button onClick={() => setDeleteTarget(item)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            );
          }
        })}
      </div>
      <CreateFileModal
        open={!!createModalType}
        modalType={createModalType}
        onClose={() => setCreateModalType(null)}
        onCreate={(userName: string) => {
          if (parentFolderId) {
            onCreateFile(createModalType!, userName, parentFolderId);
          } else {
            onCreateFile(createModalType!, userName, rootFolderId);
          }
          setParentFolderId(null);
          setCreateModalType(null);
        }}
      />

      <RenameModal
        open={!!renameTarget}
        initial={renameTarget?.name ?? ""}
        modalType={renameTarget?.type}
        existingNames={files.map((f) => f.name)}
        onClose={() => setRenameTarget(null)}
        onSave={(newName: string) => {
          onRename(renameTarget!.id, newName);
          setRenameTarget(null);
        }}
      />
      <Modal
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === "folder" ? "folder" : "file"}`}
        onClose={() => setDeleteTarget(null)}
      >
        <p className="opacity-80">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{deleteTarget?.name}</span>{" "}
          {deleteTarget?.type === "folder" ? "folder?" : "file?"}
        </p>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(null);
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
          >
            Cancel
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(deleteTarget!.id);
              setDeleteTarget(null);
            }}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </Modal>
      <div
        onMouseDown={startResizing}
        className="absolute top-0 right-0 w-1 h-full cursor-ew-resize bg-transparent hover:bg-white/20"
      ></div>
    </div>
  );
}
