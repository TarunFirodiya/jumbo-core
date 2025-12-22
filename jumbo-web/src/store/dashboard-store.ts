import { create } from "zustand";

interface DashboardState {
  activeTab: string;
  searchQuery: string;
  stageFilter: string;
  ownerFilter: string;
  valueFilter: string;
  setActiveTab: (tab: string) => void;
  setSearchQuery: (query: string) => void;
  setStageFilter: (filter: string) => void;
  setOwnerFilter: (filter: string) => void;
  setValueFilter: (filter: string) => void;
  clearFilters: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: "Dashboard",
  searchQuery: "",
  stageFilter: "all",
  ownerFilter: "all",
  valueFilter: "all",
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStageFilter: (filter) => set({ stageFilter: filter }),
  setOwnerFilter: (filter) => set({ ownerFilter: filter }),
  setValueFilter: (filter) => set({ valueFilter: filter }),
  clearFilters: () =>
    set({
      searchQuery: "",
      stageFilter: "all",
      ownerFilter: "all",
      valueFilter: "all",
    }),
}));
