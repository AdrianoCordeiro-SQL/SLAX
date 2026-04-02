import { create } from "zustand";

interface UIState {
  isAddUserDialogOpen: boolean;
  openAddUserDialog: () => void;
  closeAddUserDialog: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAddUserDialogOpen: false,
  openAddUserDialog: () => set({ isAddUserDialogOpen: true }),
  closeAddUserDialog: () => set({ isAddUserDialogOpen: false }),
}));
