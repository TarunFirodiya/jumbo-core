export type ListingStatus = "draft" | "inspection_pending" | "active" | "inactive" | "sold";

export interface MockListing {
  id: string;
  unitNumber: string;
  buildingName: string;
  locality: string;
  bhk: number;
  carpetArea: number;
  floorNumber: number;
  askingPrice: number;
  status: ListingStatus;
  isVerified: boolean;
  ownerName: string;
  ownerPhone: string;
  listingAgentName: string;
  listingAgentInitials: string;
  images: string[];
  amenities: string[];
  createdAt: string;
}

const buildings = [
  { name: "Prestige Lakeside Habitat", locality: "Whitefield" },
  { name: "Brigade Gateway", locality: "Rajajinagar" },
  { name: "Sobha Dream Acres", locality: "Balagere" },
  { name: "Embassy Springs", locality: "Devanahalli" },
  { name: "Godrej Splendour", locality: "Whitefield" },
  { name: "Salarpuria Sattva", locality: "Electronic City" },
  { name: "Purva Westend", locality: "Kudlu Gate" },
  { name: "Total Environment", locality: "Yelahanka" },
  { name: "Mantri Espana", locality: "Bellandur" },
  { name: "Phoenix One", locality: "Rajaji Nagar" },
  { name: "Shriram Greenfield", locality: "Budigere" },
  { name: "Raheja Mistral", locality: "Koramangala" },
  { name: "Adarsh Palm Retreat", locality: "Sarjapur Road" },
  { name: "Vajram Tiara", locality: "Yelahanka" },
  { name: "Kolte Patil Life Republic", locality: "Hinjewadi" },
];

const owners = [
  { name: "Rajesh Sharma", phone: "+91 98765 43210" },
  { name: "Priya Menon", phone: "+91 87654 32109" },
  { name: "Amit Patel", phone: "+91 76543 21098" },
  { name: "Sunita Reddy", phone: "+91 65432 10987" },
  { name: "Vikram Singh", phone: "+91 54321 09876" },
  { name: "Kavita Iyer", phone: "+91 43210 98765" },
  { name: "Deepak Gupta", phone: "+91 32109 87654" },
  { name: "Anita Nair", phone: "+91 21098 76543" },
];

const agents = [
  { name: "Arun Kumar", initials: "AK" },
  { name: "Meera Shah", initials: "MS" },
  { name: "Ravi Verma", initials: "RV" },
  { name: "Sneha Joshi", initials: "SJ" },
];

const statuses: ListingStatus[] = ["draft", "inspection_pending", "active", "inactive", "sold"];

const amenities = [
  "Swimming Pool",
  "Gym",
  "Club House",
  "Children's Play Area",
  "24/7 Security",
  "Power Backup",
  "Covered Parking",
  "Landscaped Gardens",
  "Jogging Track",
  "Tennis Court",
];

function getDeterministicRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function getRandomDate(seed: number): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const randomMonth = getDeterministicRandom(seed);
  const randomDay = getDeterministicRandom(seed + 1);
  
  const month = Math.floor(randomMonth * 12);
  const day = Math.floor(randomDay * 28) + 1;
  return `${months[month]} ${day.toString().padStart(2, "0")}, 2025`;
}

function getRandomAmenities(seed: number): string[] {
  const count = Math.floor(getDeterministicRandom(seed) * 5) + 3;
  const shuffled = [...amenities].sort((a, b) => {
    return getDeterministicRandom(seed + amenities.indexOf(a)) - getDeterministicRandom(seed + amenities.indexOf(b));
  });
  return shuffled.slice(0, count);
}

export const mockListings: MockListing[] = Array.from({ length: 50 }, (_, index) => {
  const building = buildings[index % buildings.length];
  const owner = owners[index % owners.length];
  const agent = agents[index % agents.length];
  const status = statuses[index % statuses.length];
  
  const bhkOptions = [1, 2, 2.5, 3, 4];
  const bhk = bhkOptions[Math.floor(getDeterministicRandom(index + 10) * bhkOptions.length)];
  const carpetArea = Math.floor(getDeterministicRandom(index + 20) * 1500) + 500;
  const floor = Math.floor(getDeterministicRandom(index + 30) * 25) + 1;
  const basePrice = bhk * 3500000;
  const priceVariation = getDeterministicRandom(index + 40) * 2000000;
  const askingPrice = Math.round((basePrice + priceVariation) / 100000) * 100000;
  
  const isVerified = status === "active" || (status === "inspection_pending" && getDeterministicRandom(index + 50) > 0.5);

  return {
    id: `LST-${String(index + 1).padStart(4, "0")}`,
    unitNumber: `${String.fromCharCode(65 + (index % 8))}-${101 + Math.floor(index / 8)}`,
    buildingName: building.name,
    locality: building.locality,
    bhk,
    carpetArea,
    floorNumber: floor,
    askingPrice,
    status,
    isVerified,
    ownerName: owner.name,
    ownerPhone: owner.phone,
    listingAgentName: agent.name,
    listingAgentInitials: agent.initials,
    images: [`https://picsum.photos/seed/${index + 1}/400/300`],
    amenities: getRandomAmenities(index),
    createdAt: getRandomDate(index),
  };
});

export function getListingById(id: string): MockListing | undefined {
  return mockListings.find(l => l.id === id);
}

export function formatINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export const statusColors: Record<ListingStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
  inspection_pending: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  active: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  inactive: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
  sold: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
};

export const statusLabels: Record<ListingStatus, string> = {
  draft: "Draft",
  inspection_pending: "Inspection Pending",
  active: "Active",
  inactive: "Inactive",
  sold: "Sold",
};
