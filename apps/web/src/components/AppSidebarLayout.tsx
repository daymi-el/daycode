import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useSettings } from "~/hooks/useSettings";
import ThreadSidebar from "./Sidebar";
import { Sidebar, SidebarProvider, SidebarRail } from "./ui/sidebar";
import {
  clearShortcutModifierState,
  syncShortcutModifierStateFromKeyboardEvent,
} from "../shortcutModifierState";

const THREAD_SIDEBAR_WIDTH_STORAGE_KEY = "chat_thread_sidebar_width";
const THREAD_SIDEBAR_MIN_WIDTH = 13 * 16;
const THREAD_MAIN_CONTENT_MIN_WIDTH = 40 * 16;
export function AppSidebarLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const sidebarSide = useSettings((settings) => settings.sidebarSide);

  useEffect(() => {
    const onWindowKeyDown = (event: KeyboardEvent) => {
      syncShortcutModifierStateFromKeyboardEvent(event);
    };
    const onWindowKeyUp = (event: KeyboardEvent) => {
      syncShortcutModifierStateFromKeyboardEvent(event);
    };
    const onWindowBlur = () => {
      clearShortcutModifierState();
    };

    window.addEventListener("keydown", onWindowKeyDown, true);
    window.addEventListener("keyup", onWindowKeyUp, true);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      window.removeEventListener("keydown", onWindowKeyDown, true);
      window.removeEventListener("keyup", onWindowKeyUp, true);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, []);

  useEffect(() => {
    const onMenuAction = window.desktopBridge?.onMenuAction;
    if (typeof onMenuAction !== "function") {
      return;
    }

    const unsubscribe = onMenuAction((action) => {
      if (action === "open-settings") {
        void navigate({ to: "/settings" });
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [navigate]);

  const sidebar = (
    <Sidebar
      side={sidebarSide}
      collapsible="offcanvas"
      className={`${
        sidebarSide === "right" ? "border-l" : "border-r"
      } border-border bg-card text-foreground`}
      resizable={{
        minWidth: THREAD_SIDEBAR_MIN_WIDTH,
        shouldAcceptWidth: ({ nextWidth, wrapper }) =>
          wrapper.clientWidth - nextWidth >= THREAD_MAIN_CONTENT_MIN_WIDTH,
        storageKey: THREAD_SIDEBAR_WIDTH_STORAGE_KEY,
      }}
    >
      <ThreadSidebar />
      <SidebarRail />
    </Sidebar>
  );

  return (
    <SidebarProvider defaultOpen>
      {sidebarSide === "right" ? children : sidebar}
      {sidebarSide === "right" ? sidebar : children}
    </SidebarProvider>
  );
}
