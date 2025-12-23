
export interface Seller {
  id: string;
  name: string;
  email: string;
  properties: number;
  status: "Active" | "Pending" | "Inactive" | "New";
  lastContact: string;
  assignedAgent: {
    name: string;
    initials: string;
  };
}

const names = [
  "Vikram Malhotra", "Anita Desai", "Robert Wilson", "Mei Chen", 
  "Carlos Rodriguez", "Priya Kapoor", "David Miller", "Sarah Johnson",
  "Amit Patel", "Jennifer Wu", "Michael Brown", "Lisa Wang",
  "Rajesh Gupta", "Emily Davis", "Kevin White"
];

const agents = [
  { name: "Sarah Lee", initials: "SL" },
  { name: "Alex Ray", initials: "AR" },
  { name: "Mina Swan", initials: "MS" },
  { name: "John Kim", initials: "JK" },
];

function getRandomItem<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export const sellers: Seller[] = names.map((name, index) => {
  const agent = getRandomItem(agents, index);
  
  return {
    id: (index + 1).toString(),
    name,
    email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
    properties: (index % 5) + 1,
    status: ["Active", "Pending", "Active", "Inactive"][index % 4] as any,
    lastContact: `${(index % 7) + 1} days ago`,
    assignedAgent: {
      name: agent.name,
      initials: agent.initials
    }
  };
});

export function getSellerById(id: string): Seller | undefined {
  return sellers.find(s => s.id === id);
}

