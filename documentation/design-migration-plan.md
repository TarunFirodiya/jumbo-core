# Design Standards Migration Plan

## Priority 1: Layout & Navigation (User sees these on every page)
- [x] DashboardSidebar
- [x] DashboardHeader  
- [x] PageLayout components
- [x] Layout.tsx

## Priority 2: Shared Components (Used across multiple pages)
- [x] PageHeader
- [x] PageTabs
- [x] PageContentWrapper
- [x] NotesTab (done)
- [ ] TasksTab
- [ ] ActivityTab
- [ ] CommunicationTab
- [ ] DetailLayout
- [ ] StatusBadge

## Priority 3: Main Page Components
- [ ] Buyers list page
- [ ] Buyer detail view
- [ ] Sellers list page
- [ ] Seller detail view
- [ ] Listings list page
- [ ] Listing detail view
- [ ] Visits list page
- [ ] Visit detail view
- [ ] Offers page

## Priority 4: UI Components (shadcn/ui base)
- [ ] Button
- [ ] Card
- [ ] Input
- [ ] Textarea
- [ ] Select
- [ ] Badge
- [ ] Avatar
- [ ] Dialog
- [ ] Dropdown

## Design Standard Rules:
1. Icons: @hugeicons/react + @hugeicons/core-free-icons
2. Colors: Tailwind Neutral palette only
3. Typography: 2 weights (normal 400, medium 500)
4. Radius: 8-12px only (rounded-lg, rounded-xl)
5. Mobile-first responsive design
