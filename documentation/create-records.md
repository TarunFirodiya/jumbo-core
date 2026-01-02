****Instructions to CREATE database records like leads, seller-leads, listings, buildings, offers, visits****

We want to wire up the actions to CREATE the following records using a form that opens when you click on the + button on the specific tabs: 
- Create Lead
- Create Seller-Lead
- Create Building
- Create Listing
- Create Offer

We will do this one by one, starting with Create Lead workflow. We can create new leads in the system by 2 ways: 
1. Manually creating a lead on the UI using a form. Below are detailed instructions for creating this. 
2. Programmatically create new leads by an API call where external parties like housing.com, facebook ads will create leads by calling our API. We have to ensure the code is written to support both uses without separate maintenance. 

****Use the following shadcn UI components to create different fields in the forms****
**multi-select enum component** 
npx shadcn@latest add @ss-components/select-32
eg: amenities, water_source

**single-select enum component**
npx shadcn@latest add @ss-components/select-16
eg: khata 

**Phone input**
https://shadcn-phone-input.vercel.app/
npx shadcn@latest add input
npx shadcn@latest add button
npx shadcn@latest add command
npx shadcn@latest add toast
npx shadcn@latest add popover
npx shadcn@latest add scroll-area
npm install react-phone-number-input
set India as default country

This is the requirement for each of these forms: 

1. Create Lead
Where: on /buyers tab --> click on + button --> open modal form

//Show these fields on the form & write to Profiles table 
full_name TEXT NOT NULL use Input component with icon
phone TEXT UNIQUE NOT NULL use Phone Input component described above
email TEXT UNIQUE use Input component with icon
secondary_phone TEXT use Phone Input component described above

//Show these fields on the form & write to Leads table 
source TEXT - single-select enum component
status TEXT DEFAULT 'new' - single-select enum component
assigned_agent_id UUID - single-select enum component

//don't show these below fields on on the form but make sure data is captured correctly in Profiles table
user_role DEFAULT 'buyer' 
total_coins - INTEGER DEFAULT0
created_at TIMESTAMP WITH TIME ZONE DEFAULTnow()
deleted_at TIMESTAMP WITH TIME ZONE
created_by_id UUID

////don't show these below fields on on the form but make sure data is captured correctly in Leads table
id UUID PRIMARY KEY DEFAULTgen_random_uuid()
profile_id UUID (same as above created profile_id)
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()

//do nothing about these fields when taking the action of CreateLead, we will use these fields later to nurture the lead 
requirement_json JSONB
drop_reason TEXT
locality TEXT
zone TEXT
pipeline BOOLEAN DEFAULTfalse
referred_by TEXT
test_listing_id TEXT
preference_json JSONB
external_id TEXT
last_contacted_at TIMESTAMP WITH TIME ZONE
deleted_at TIMESTAMP WITH TIME ZONE
lead_id TEXT
secondary_phone TEXT
source_listing_id TEXT
