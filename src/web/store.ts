import { create } from "zustand";
import type { SendResponse } from "./api/types.js";

interface AppState {
	selectedPath: string | null;
	activeEnv: string;
	activeVersion: string | null;
	sendResult: SendResponse | null;
	sendError: string | null;
	saveError: string | null;
	requestDirty: boolean;
	activeView: "request" | "environments";
	isNewRequestModalOpen: boolean;
	isNewFolderPromptOpen: boolean;
	sidebarCollapsed: boolean;
	responseCollapsed: boolean;
	pendingPath: string | null;

	// Actions
	setSelectedPath: (path: string | null) => void;
	setActiveEnv: (env: string) => void;
	setActiveVersion: (version: string | null) => void;
	setSendResult: (result: SendResponse | null) => void;
	setSendError: (error: string | null) => void;
	setSaveError: (error: string | null) => void;
	setRequestDirty: (dirty: boolean) => void;
	setActiveView: (view: "request" | "environments") => void;
	setIsNewRequestModalOpen: (open: boolean) => void;
	setIsNewFolderPromptOpen: (open: boolean) => void;
	setSidebarCollapsed: (
		collapsed: boolean | ((prev: boolean) => boolean),
	) => void;
	setResponseCollapsed: (
		collapsed: boolean | ((prev: boolean) => boolean),
	) => void;
	setPendingPath: (path: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
	selectedPath: localStorage.getItem("dakiya_selectedPath"),
	activeEnv: localStorage.getItem("dakiya_activeEnv") || "local",
	activeVersion: localStorage.getItem("dakiya_activeVersion"),
	sendResult: null,
	sendError: null,
	saveError: null,
	requestDirty: false,
	activeView: "request",
	isNewRequestModalOpen: false,
	isNewFolderPromptOpen: false,
	sidebarCollapsed: false,
	responseCollapsed: false,
	pendingPath: null,

	setSelectedPath: (path) => {
		if (path) {
			localStorage.setItem("dakiya_selectedPath", path);
		} else {
			localStorage.removeItem("dakiya_selectedPath");
		}
		set({ selectedPath: path });
	},
	setActiveEnv: (env) => {
		localStorage.setItem("dakiya_activeEnv", env);
		set({ activeEnv: env });
	},
	setActiveVersion: (version) => {
		if (version) {
			localStorage.setItem("dakiya_activeVersion", version);
		} else {
			localStorage.removeItem("dakiya_activeVersion");
		}
		set({ activeVersion: version });
	},
	setSendResult: (result) => set({ sendResult: result }),
	setSendError: (error) => set({ sendError: error }),
	setSaveError: (error) => set({ saveError: error }),
	setRequestDirty: (dirty) => set({ requestDirty: dirty }),
	setActiveView: (view) => set({ activeView: view }),
	setIsNewRequestModalOpen: (open) => set({ isNewRequestModalOpen: open }),
	setIsNewFolderPromptOpen: (open) => set({ isNewFolderPromptOpen: open }),
	setSidebarCollapsed: (collapsed) =>
		set((state) => ({
			sidebarCollapsed:
				typeof collapsed === "function"
					? collapsed(state.sidebarCollapsed)
					: collapsed,
		})),
	setResponseCollapsed: (collapsed) =>
		set((state) => ({
			responseCollapsed:
				typeof collapsed === "function"
					? collapsed(state.responseCollapsed)
					: collapsed,
		})),
	setPendingPath: (path) => set({ pendingPath: path }),
}));
