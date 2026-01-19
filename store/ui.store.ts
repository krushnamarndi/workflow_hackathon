import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface UIState {
  // Sidebar
  isSidebarCollapsed: boolean;
  sidebarWidth: number;

  // Modals
  isWorkflowSettingsOpen: boolean;
  isNodeSettingsOpen: boolean;
  selectedNodeId: string | null;

  // Notifications
  notifications: Array<{
    id: string;
    type: "success" | "error" | "info" | "warning";
    message: string;
    timestamp: number;
  }>;

  // Loading states
  isLoadingWorkflow: boolean;

  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;

  // Actions - Modals
  openWorkflowSettings: () => void;
  closeWorkflowSettings: () => void;
  openNodeSettings: (nodeId: string) => void;
  closeNodeSettings: () => void;

  // Actions - Notifications
  addNotification: (
    type: "success" | "error" | "info" | "warning",
    message: string
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Actions - Loading
  setLoadingWorkflow: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools((set) => ({
    // Initial state
    isSidebarCollapsed: false,
    sidebarWidth: 280,
    isWorkflowSettingsOpen: false,
    isNodeSettingsOpen: false,
    selectedNodeId: null,
    notifications: [],
    isLoadingWorkflow: false,

    // Sidebar actions
    toggleSidebar: () =>
      set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
    setSidebarWidth: (width) => set({ sidebarWidth: width }),

    // Modal actions
    openWorkflowSettings: () => set({ isWorkflowSettingsOpen: true }),
    closeWorkflowSettings: () => set({ isWorkflowSettingsOpen: false }),
    openNodeSettings: (nodeId) =>
      set({ isNodeSettingsOpen: true, selectedNodeId: nodeId }),
    closeNodeSettings: () =>
      set({ isNodeSettingsOpen: false, selectedNodeId: null }),

    // Notification actions
    addNotification: (type, message) =>
      set((state) => ({
        notifications: [
          ...state.notifications,
          {
            id: crypto.randomUUID(),
            type,
            message,
            timestamp: Date.now(),
          },
        ],
      })),

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),

    clearNotifications: () => set({ notifications: [] }),

    // Loading actions
    setLoadingWorkflow: (loading) => set({ isLoadingWorkflow: loading }),
  }))
);
