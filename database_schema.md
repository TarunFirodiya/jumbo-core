-- 1. USER & AGENT MANAGEMENT
CREATE TYPE user_role AS ENUM (
  'super_admin', 'listing_agent', 'team_lead', 
  'buyer_agent', 'visit_agent', 'dispatch_agent', 'closing_agent'
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  role user_role DEFAULT 'buyer_agent',
  territory_id TEXT, -- For assignment logic
  total_coins INTEGER DEFAULT 0, -- Cached value (source of truth is ledger)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INVENTORY HIERARCHY (Buildings -> Units -> Listings)
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  locality TEXT,
  city TEXT,
  lat_long POINT, -- Geospatial data for Visit Tours
  amenities_json JSONB, -- Pool, Gym, etc.
  water_source TEXT
);

CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id UUID REFERENCES buildings(id),
  unit_number TEXT,
  bhk FLOAT,
  floor_number INTEGER,
  carpet_area FLOAT,
  owner_id UUID REFERENCES profiles(id), -- The Seller
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id),
  status TEXT DEFAULT 'draft', -- draft, inspection_pending, active, inactive, sold
  asking_price NUMERIC,
  external_ids JSONB, -- { "housing_id": "123", "magicbricks_id": "456" }
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CRM & LEAD MANAGEMENT
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id), -- The Buyer
  source TEXT, -- Housing.com, Website, FB
  status TEXT DEFAULT 'new', -- new, contacted, active_visitor, at_risk, closed
  assigned_agent_id UUID REFERENCES profiles(id),
  requirement_json JSONB, -- { "bhk": [2,3], "budget_max": 15000000 }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMMUNICATIONS LOG (WhatsApp & Calls)
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  agent_id UUID REFERENCES profiles(id),
  channel TEXT, -- 'whatsapp', 'call', 'email'
  direction TEXT, -- 'inbound', 'outbound'
  content TEXT, -- Message body or call summary
  recording_url TEXT, -- Link to Exotel recording
  metadata JSONB, -- { "duration": 120, "wa_message_id": "abc" }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. OPERATIONS & LOGISTICS (Tours & Visits)
CREATE TABLE visit_tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispatch_agent_id UUID REFERENCES profiles(id),
  field_agent_id UUID REFERENCES profiles(id),
  tour_date DATE,
  optimized_route JSONB,
  status TEXT DEFAULT 'planned' -- planned, ongoing, completed
);

CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID REFERENCES visit_tours(id),
  lead_id UUID REFERENCES leads(id),
  listing_id UUID REFERENCES listings(id),
  scheduled_at TIMESTAMPTZ,
  otp_code TEXT,
  status TEXT DEFAULT 'pending', -- pending, completed, cancelled, no_show
  feedback_text TEXT,
  feedback_rating INTEGER
);

-- 6. TASK MANAGEMENT
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES profiles(id),
  assignee_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  due_at TIMESTAMPTZ,
  related_lead_id UUID REFERENCES leads(id),
  status TEXT DEFAULT 'open', -- open, in_progress, completed, archived
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PERFORMANCE MANAGEMENT (Jumbo-Coins Ledger)
CREATE TABLE credit_rules (
  action_type TEXT PRIMARY KEY, -- e.g., 'visit_completed', 'new_listing'
  coin_value INTEGER NOT NULL -- e.g., 100 or -50
);

CREATE TABLE credit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  action_type TEXT,
  reference_id UUID, -- ID of the Visit, Lead, or Task that triggered this
  created_at TIMESTAMPTZ DEFAULT NOW()
);