- change the table "profiles" to "team"
- we need logs of all changes in all tables to be stored. created_by, created_at, updated_by, updated_at, etc. So we can keep track of all interactions & changes with different entities (people, listings, visits, offers etc) 
- in contacts model, we can keep fields for KYC where we could store aadhar, kyc, bank details, etc. for some of the contacts who end up doing a transaction. This is optional right now so we can even keep this in a Phase 2 DB bucket for a later sprint
- again with profiles /team model we will want to keep track of changes in the user's role .i.e. Imran can be a Buyer Agent in jan, but a Seller_Agent in Feb. We still need to know he was in that role in Jan & was serving some customers. 
- in buyer leads.... move secondary_phone text into contacts.metadata instead)
- in seller leads... no extra seller name columns; just use contacts.name

