import { create } from "zustand";
import type { ListingStatus } from "@/mock-data/listings";

interface ListingsStore {
  // Search & Filters
  searchQuery: string;
  statusFilter: ListingStatus | "all";
  localityFilter: string;
  priceRange: { min: number | null; max: number | null };
  bhkFilter: number | "all";
  
  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: ListingStatus | "all") => void;
  setLocalityFilter: (locality: string) => void;
  setPriceRange: (range: { min: number | null; max: number | null }) => void;
  setBhkFilter: (bhk: number | "all") => void;
  clearFilters: () => void;
}

export const useListingsStore = create<ListingsStore>((set) => ({
  // Initial state
  searchQuery: "",
  statusFilter: "all",
  localityFilter: "all",
  priceRange: { min: null, max: null },
  bhkFilter: "all",
  
  // Actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setLocalityFilter: (locality) => set({ localityFilter: locality }),
  setPriceRange: (range) => set({ priceRange: range }),
  setBhkFilter: (bhk) => set({ bhkFilter: bhk }),
  clearFilters: () =>
    set({
      searchQuery: "",
      statusFilter: "all",
      localityFilter: "all",
      priceRange: { min: null, max: null },
      bhkFilter: "all",
    }),
}));

