jumbo-web/
├── drizzle.config.ts           # Drizzle ORM configuration
├── components.json             # Shadcn UI configuration
├── package.json                # Updated with db:* scripts
├── .env.example                # Environment variables template
└── src/
    ├── middleware.ts           # Auth & RBAC middleware
    ├── app/
    │   └── api/v1/
    │       ├── leads/route.ts          # Lead ingestion API
    │       └── listings/active/route.ts # Public listings API
    ├── hooks/
    │   └── use-supabase.ts     # Client-side Supabase hook
    ├── lib/
    │   ├── db/
    │   │   ├── schema.ts       # Full Drizzle schema with relations
    │   │   └── index.ts        # DB client export
    │   ├── supabase/
    │   │   ├── client.ts       # Browser client
    │   │   ├── server.ts       # SSR client
    │   │   └── middleware.ts   # Session management
    │   ├── services/mock/
    │   │   ├── housing.ts      # Housing.com mock
    │   │   ├── exotel.ts       # Exotel telephony mock
    │   │   └── whatsapp.ts     # WhatsApp Business mock
    │   ├── validations/
    │   │   ├── lead.ts         # Lead API Zod schemas
    │   │   └── listing.ts      # Listing API Zod schemas
    │   └── utils.ts            # cn() helper + formatINR, formatDate
    └── types/
        └── index.ts            # Re-exported types