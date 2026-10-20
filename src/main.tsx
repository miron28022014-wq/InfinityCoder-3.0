/**
 * InfinityCoder entry point.
 */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Logo, Icon } from "./icons";
import { Btn, StatusDot, Kbd, Spinner, Empty } from "./ui";
import { TitleBar } from "./components/layout/TitleBar";
import { Explorer } from "./components/explorer/Explorer";
import { EditorPane } from "./components/editor/EditorPane";
import { ChatPanel } from "./components/chat/ChatPanel";
import { SettingsDialog } from "./components/dialogs/SettingsDialog";
import { boot, getState, subscribe, type AppState } from "./store";
import { useStore, shallow } from "./hooks/useStore";

function App() {
  const state = useStore(getState, subscribe);
  useEffect(() => {
    void boot();
  }, []);

  return (
    <div className="app">
      <TitleBar />
      <div className="workspace">
        <Explorer />
        <EditorPane />
        <ChatPanel />
      </div>
      {state.settingsOpen ? <SettingsDialog /> : null}
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
