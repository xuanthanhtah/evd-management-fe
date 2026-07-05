import { create } from 'zustand';
import type { UpdateEvdDto } from '../types/evd.types';

interface EvdUiState {
  // Modal state
  isCreateModalOpen: boolean;
  isImportModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openImportModal: () => void;
  closeImportModal: () => void;

  // Inline edit state
  editingRowId: string | null;
  setEditingRowId: (id: string | null) => void;

  // Mục đích: Theo dõi các thay đổi dirty của từng dòng để tránh re-render toàn bộ bảng
  dirtyRows: Record<string, Partial<UpdateEvdDto>>;
  setDirtyRow: (id: string, patch: Partial<UpdateEvdDto>) => void;
  clearDirtyRow: (id: string) => void;
}

export const useEvdUiStore = create<EvdUiState>((set) => ({
  isCreateModalOpen: false,
  isImportModalOpen: false,
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  openImportModal: () => set({ isImportModalOpen: true }),
  closeImportModal: () => set({ isImportModalOpen: false }),

  editingRowId: null,
  setEditingRowId: (id) => set({ editingRowId: id }),

  dirtyRows: {},
  setDirtyRow: (id, patch) =>
    set((state) => ({
      dirtyRows: {
        ...state.dirtyRows,
        [id]: { ...state.dirtyRows[id], ...patch },
      },
    })),
  clearDirtyRow: (id) =>
    set((state) => {
      const next = { ...state.dirtyRows };
      delete next[id];
      return { dirtyRows: next };
    }),
}));
