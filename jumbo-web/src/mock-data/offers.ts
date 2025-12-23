
export interface Offer {
  id: string;
  property: string;
  buyer: string;
  amount: number;
  status: "Pending" | "Accepted" | "Rejected" | "Countered";
  date: string;
  agent: string;
  agentInitials: string;
}

const properties = [
  "12 Maple Street", "88 Park Avenue", "Villa #402", "55 Pine Lane", "15 Ocean Drive",
  "Sunset Boulevard Apt", "Greenfield Plot 4", "Skyline Penthouse", "Lakeside Cottage"
];

const buyers = [
  "John Buyer", "Alice Smith", "Bob Jones", "Emily Davis", "Tom Wilson",
  "Michael Brown", "Sarah Wilson", "James Taylor", "Linda Anderson"
];

const agents = [
  { name: "Sarah Connor", initials: "SC" },
  { name: "Mike Ross", initials: "MR" },
  { name: "John Doe", initials: "JD" },
];

function getRandomItem<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export const offers: Offer[] = Array.from({ length: 20 }, (_, index) => {
  const property = getRandomItem(properties, index);
  const buyer = getRandomItem(buyers, index);
  const agent = getRandomItem(agents, index);
  const status = ["Pending", "Accepted", "Rejected", "Countered"][index % 4] as any;
  const amount = 500000 + (index * 50000);
  
  return {
    id: (index + 1).toString(),
    property,
    buyer,
    amount,
    status,
    date: `Oct ${20 + (index % 10)}, 2023`,
    agent: agent.name,
    agentInitials: agent.initials
  };
});

