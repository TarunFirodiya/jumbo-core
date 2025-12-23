
import { 
  Phone, 
  Eye,
  Mail, 
  UserPlus,
} from "lucide-react";

export interface Buyer {
  id: string;
  name: string;
  location: string;
  addedDate: string;
  status: "Active" | "New" | "Contacted" | "Qualified" | "Lost";
  assignedAgent: {
    name: string;
    avatar?: string;
    initials: string;
  };
  lastContact: string;
  nextFollowUp: string;
  source: string;
  contact: {
    whatsapp: string;
    mobile: string;
    email: string;
  };
  preferences: {
    budget: string;
    type: string;
    timeline: string;
  };
  budget: number; // Numeric for sorting/filtering
  activityLog: Activity[];
}

export interface Activity {
  type: "call" | "view" | "email" | "lead";
  title: string;
  date: string;
  description?: string;
  details?: {
    price: string;
    specs: string;
    image: string;
  };
  badges?: string[];
  icon?: any; // Lucide icon
}

const names = [
  "Ananya Sharma", "Rajesh Kumar", "Priya Patel", "Vikram Singh", 
  "Sneha Gupta", "Amit Shah", "Neha Verma", "Rahul Malhotra", 
  "Kavita Reddy", "Suresh Nair", "Pooja Joshi", "Arun Das", 
  "Meera Iyer", "Sanjay Menon", "Divya Rao"
];

const locations = [
  "Bangalore, India", "Mumbai, India", "Delhi, India", "Hyderabad, India", 
  "Pune, India", "Chennai, India", "Gurgaon, India", "Noida, India"
];

const sources = [
  "MagicBricks Lead", "99Acres", "Direct Website", "Referral", "Walk-in", "Facebook Ad"
];

const propertyTypes = ["Apartment", "Villa", "Plot", "Penthouse", "Studio"];

const agents = [
  { name: "Imran", initials: "IK" },
  { name: "Chethan", initials: "CH" },
  { name: "Roushan", initials: "RS" },
  { name: "Harish", initials: "HS" },
];

function getRandomItem<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function getDeterministicRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export const buyers: Buyer[] = names.map((name, index) => {
  const agent = getRandomItem(agents, index);
  const location = getRandomItem(locations, index);
  const source = getRandomItem(sources, index);
  const type = getRandomItem(propertyTypes, index);
  
  const budgetMin = 50 + (index % 10) * 10; // Lakhs or Crores logic
  const budgetMax = budgetMin + 20 + (index % 5) * 10;
  const budgetStr = `₹${(budgetMin/100).toFixed(1)}Cr - ₹${(budgetMax/100).toFixed(1)}Cr`;
  const numericBudget = (budgetMin + budgetMax) / 2 * 100000; // Average

  return {
    id: (index + 1).toString(),
    name,
    location,
    addedDate: `Oct ${10 + (index % 20)}, 2023`,
    status: ["Active", "Contacted", "New", "Qualified"][index % 4] as any,
    assignedAgent: {
      name: agent.name,
      initials: agent.initials,
      avatar: `/avatars/${agent.name.split(" ")[0].toLowerCase()}.jpg`
    },
    lastContact: `${(index % 5) + 1} days ago`,
    nextFollowUp: `Oct ${25 + (index % 5)}, 2023`,
    source,
    contact: {
      whatsapp: `+91 98765 ${10000 + index}`,
      mobile: `+91 98765 ${10000 + index}`,
      email: `${name.toLowerCase().replace(" ", ".")}@example.com`
    },
    preferences: {
      budget: budgetStr,
      type,
      timeline: `${2 + (index % 4)} Months`
    },
    budget: numericBudget,
    activityLog: [
      {
        type: "call",
        title: `Phone Call with ${agent.name}`,
        date: `Oct ${24 + (index % 3)}, 2023 at 2:30 PM`,
        description: "Discussed requirements and potential listings.",
        icon: Phone
      },
      {
        type: "lead",
        title: "Lead Created",
        date: `Oct ${20 + (index % 3)}, 2023 at 9:00 AM`,
        description: `Imported from ${source}.`,
        icon: UserPlus
      }
    ]
  };
});

export function getBuyerById(id: string): Buyer | undefined {
  return buyers.find(b => b.id === id);
}

