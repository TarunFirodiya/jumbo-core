import { create } from "zustand";

export interface BuildingFormData {
  id?: string;
  name: string;
  locality: string;
  city: string;
  latitude?: number;
  longitude?: number;
  isNew: boolean;
}

export interface UnitFormData {
  unitNumber: string;
  bhk: number;
  floorNumber: number;
  carpetArea: number;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
}

export interface ListingFormData {
  askingPrice: number;
  images: File[];
  imageUrls: string[]; // For preview
  amenities: string[];
  description?: string;
}

interface ListingWizardStore {
  // Current step (1-3)
  currentStep: number;
  
  // Form data for each step
  building: BuildingFormData | null;
  unit: UnitFormData | null;
  listing: ListingFormData | null;
  
  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  setBuilding: (data: BuildingFormData) => void;
  setUnit: (data: UnitFormData) => void;
  setListing: (data: ListingFormData) => void;
  
  resetWizard: () => void;
}

const initialState = {
  currentStep: 1,
  building: null,
  unit: null,
  listing: null,
};

export const useListingWizardStore = create<ListingWizardStore>((set) => ({
  ...initialState,
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 3),
    })),
    
  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),
    
  setBuilding: (data) => set({ building: data }),
  setUnit: (data) => set({ unit: data }),
  setListing: (data) => set({ listing: data }),
  
  resetWizard: () => set(initialState),
}));

// Available amenities for the listing form
export const availableAmenities = [
  "Swimming Pool",
  "Gym / Fitness Center",
  "Club House",
  "Children's Play Area",
  "24/7 Security",
  "Power Backup",
  "Covered Parking",
  "Open Parking",
  "Landscaped Gardens",
  "Jogging Track",
  "Tennis Court",
  "Basketball Court",
  "Indoor Games Room",
  "Library",
  "Yoga / Meditation Room",
  "Party Hall",
  "Guest Rooms",
  "Co-working Space",
  "Mini Theatre",
  "Rooftop Terrace",
  "Rainwater Harvesting",
  "EV Charging Station",
  "Pet-Friendly Areas",
  "Senior Citizen Area",
];


