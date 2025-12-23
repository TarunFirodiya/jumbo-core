
export interface Visit {
  id: number;
  property: {
    name: string;
    address: string;
    image: string;
  };
  dateTime: {
    date: string;
    time: string;
  };
  agent: {
    name: string;
    image: string;
  };
  client: {
    name: string;
    type: string;
  };
  status: "Scheduled" | "Pending" | "Completed" | "Cancelled";
}

export const visits: Visit[] = [
  {
    id: 1,
    property: {
      name: "12 Maple Street",
      address: "Downtown, Apt 4B",
      image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    dateTime: {
      date: "Oct 24, 2023",
      time: "10:00 AM - 10:45 AM",
    },
    agent: {
      name: "Sarah Connor",
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
    },
    client: {
      name: "John Buyer",
      type: "Warm Lead",
    },
    status: "Scheduled",
  },
  {
    id: 2,
    property: {
      name: "88 Park Avenue",
      address: "Uptown, Villa 12",
      image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    dateTime: {
      date: "Oct 24, 2023",
      time: "02:00 PM - 03:00 PM",
    },
    agent: {
      name: "Mike Ross",
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Mike",
    },
    client: {
      name: "Alice Smith",
      type: "New Lead",
    },
    status: "Pending",
  },
  {
    id: 3,
    property: {
      name: "Villa #402",
      address: "Ocean View Complex",
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    dateTime: {
      date: "Oct 23, 2023",
      time: "11:00 AM",
    },
    agent: {
      name: "Sarah Connor",
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
    },
    client: {
      name: "Bob Jones",
      type: "Returning",
    },
    status: "Completed",
  },
  {
    id: 4,
    property: {
      name: "55 Pine Lane",
      address: "Suburbia, House 5",
      image: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    dateTime: {
      date: "Oct 25, 2023",
      time: "04:00 PM - 05:00 PM",
    },
    agent: {
      name: "Mike Ross",
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=Mike",
    },
    client: {
      name: "Emily Davis",
      type: "Investor",
    },
    status: "Scheduled",
  },
  {
    id: 5,
    property: {
      name: "15 Ocean Drive",
      address: "Waterfront, Condo 9",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    },
    dateTime: {
      date: "Oct 22, 2023",
      time: "",
    },
    agent: {
      name: "John Doe",
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=John",
    },
    client: {
      name: "Tom Wilson",
      type: "Cold Lead",
    },
    status: "Cancelled",
  },
];

