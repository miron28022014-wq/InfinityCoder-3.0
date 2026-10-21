/**
 * File tree for the Explorer panel.
 */
import { useState } from "react";
import { Icon, type IconName } from "../../icons";
import { Btn } from "../../ui";
import { useStore, shallowArray } from "../../hooks/useStore";
import { collapseAll, openFolder, openFile, toggleDir } from "../../store";
import type { FsItem } from "../../types";

export function FileTreePanel() {
  const dirCache = useStore((s) => s.dirCache);
  const expanded = useStore((s) => s.expanded, shallowArray);
  const activePath = useStore((s) => s.activePath);
  const root = useStore((s) => s.root);

  if (!root) return null;

  const renderLevel = (dir: string, depth: number): React.ReactNode => {
    const items = dirCache[dir] ?? [];
    return items.map((item: FsItem) => {
      const isOpen = expanded.includes(item.path);
      return (
        <div key={item.path}>
          <button
            type="button"
            className={`tree-row ${activePath === item.path ? "active" : ""}`.trim()}
            style={{ paddingLeft: 8 + depth * 14 }}
            onClick={() => (item.is_dir ? void toggleDir(item.path) : void openFile(item.path))}
          >
            <Icon
              name={item.is_dir ? (isOpen ? "chevronDown" : "chevronRight") : "file"}
              size={12}
              className="tree-caret"
            />
            <Icon name={(item.is_dir ? "folder" : "fileCode") as IconName} size={13} />
            <span className="tree-name">{item.name}</span>
          </button>
          {item.is_dir && isOpen ? renderLevel(item.path, depth + 1) : null}
        </div>
      );
    });
  };

  return <div className="file-tree">{renderLevel(root, 0)}</div>;
}

export function ExplorerActions() {
  const root = useStore((s) => s.root);
  return (
    <div className="explorer-actions">
      <Btn icon="folder" size="sm" variant="subtle" onClick={() => void openFolder()}>
        Открыть
      </Btn>
      <Btn icon="collapseAll" size="sm" variant="subtle" disabled={!root} onClick={() => collapseAll()}>
        Свернуть
      </Btn>
    </div>
  );
}
