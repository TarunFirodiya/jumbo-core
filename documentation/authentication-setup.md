# Authentication & RBAC Setup Guide

This document describes the authentication and Role-Based Access Control (RBAC) system that has been implemented in the Jumbo CRM application.

## Overview

The application now includes:
- **Google OAuth Authentication** via Supabase
- **Role-Based Access Control (RBAC)** with granular permissions
- **Protected routes** (middleware-level protection)
- **Protected API endpoints** (route-level protection)
- **Protected server actions** (action-level protection)

## Components

### 1. Authentication System

#### Login Page (`/login`)
- Located at: `src/app/login/page.tsx`
- Provides Google OAuth sign-in
- Redirects to original destination after login

#### Auth Callback (`/auth/callback`)
- Located at: `src/app/auth/callback/route.ts`
- Handles OAuth callback from Google
- Syncs user profile to database
- Redirects to dashboard or original destination

#### Profile Sync
- Automatically creates/updates user profile in `profiles` table when user logs in
- Links Supabase user ID to profile record
- Default role: `buyer_agent`

### 2. RBAC System

#### Permission Definitions (`src/lib/rbac.ts`)
The system defines granular permissions for each action:
- `leads:read`, `leads:create`, `leads:update`, `leads:assign`, `leads:delete`
- `seller_leads:read`, `seller_leads:create`, `seller_leads:update`, `seller_leads:assign`, `seller_leads:delete`
- `listings:read`, `listings:create`, `listings:update`, `listings:delete`, `listings:publish`, `listings:verify`
- `visits:read`, `visits:create`, `visits:update`, `visits:complete`
- `tours:read`, `tours:create`, `tours:update`, `tours:dispatch`
- `sellers:read`, `sellers:create`, `sellers:update`, `sellers:delete`
- `buildings:read`, `buildings:create`, `buildings:update`, `buildings:delete`
- `units:read`, `units:create`, `units:update`, `units:delete`
- `communications:read`, `communications:create`
- `audit_logs:read`
- `users:read`, `users:create`, `users:update`, `users:delete`
- `settings:read`, `settings:update`

#### Role Definitions
The following roles are defined in the database schema:
- `super_admin` - Full access to all features
- `team_lead` - Management access to most features
- `listing_agent` - Can manage listings and sellers
- `buyer_agent` - Can manage buyer leads and visits
- `visit_agent` - Can manage visits
- `dispatch_agent` - Can manage tours and dispatch
- `closing_agent` - Can manage closing processes
- `seller_agent` - Can manage seller leads

### 3. Route Protection

#### Middleware (`src/middleware.ts`)
- Protects all dashboard routes (`/buyers`, `/sellers`, `/listings`, `/visits`, `/offers`, `/settings`)
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from auth routes
- Enforces role-based access for specific routes

#### Protected Routes
- All dashboard routes require authentication
- Specific routes have role requirements:
  - `/settings/admin` - `super_admin` only
  - `/settings/team` - `super_admin`, `team_lead`
  - `/listings/new` - `super_admin`, `listing_agent`, `team_lead`
  - `/sellers/new` - `super_admin`, `seller_agent`, `team_lead`

### 4. API Route Protection

#### API Helper (`src/lib/api-helpers.ts`)
- `withAuth()` wrapper function protects API routes
- Automatically checks authentication
- Optionally checks permissions
- Returns appropriate error responses

#### Protected API Routes
All API routes under `/api/v1/*` are protected:
- `/api/v1/leads` - Requires `leads:read` or `leads:create`
- `/api/v1/sellers` - Requires `sellers:read` or `sellers:create`
- `/api/v1/seller-leads` - Requires `seller_leads:read` or `seller_leads:create`
- `/api/v1/visits` - Requires `visits:read` or `visits:create`
- `/api/v1/audit-logs` - Requires `audit_logs:read`
- `/api/v1/profile` - Requires authentication (no specific permission)

### 5. Server Action Protection

#### Auth Utilities (`src/lib/auth.ts`)
- `requireAuth()` - Ensures user is authenticated
- `requirePermission()` - Ensures user has specific permission
- `checkPermission()` - Checks permission without throwing

#### Protected Actions
Key server actions are protected:
- `createBuilding()` - Requires `buildings:create`
- `createUnit()` - Requires `units:create`
- `upsertListing()` - Requires `listings:create`
- `updateListingStatus()` - Requires `listings:update`
- `createLead()` - Requires `leads:create`
- `updateLeadStatus()` - Requires `leads:update`
- `assignLead()` - Requires `leads:assign`
- `createVisit()` - Requires `visits:create`
- `createSellerLead()` - Requires `seller_leads:create`

### 6. Client-Side Auth

#### Auth Context (`src/contexts/auth-context.tsx`)
- Provides `useAuth()` hook for client components
- Tracks user and profile state
- Provides `signOut()` function
- Automatically syncs with Supabase auth state

#### Usage in Components
```tsx
import { useAuth } from "@/contexts/auth-context";

function MyComponent() {
  const { user, profile, loading, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;
  
  return <div>Welcome, {profile?.fullName}</div>;
}
```

## Setup Instructions

### 1. Supabase Configuration

1. **Enable Google OAuth in Supabase:**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Google provider
   - Add your Google OAuth credentials:
     - Client ID
     - Client Secret
   - Add redirect URL: `https://your-domain.com/auth/callback`

2. **Environment Variables:**
   Ensure these are set in your `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 2. Database Setup

The `profiles` table should already exist with the following structure:
- `id` (UUID, primary key) - Links to Supabase auth user ID
- `fullName` (text)
- `phone` (text, unique)
- `email` (text, unique)
- `role` (enum) - One of the defined roles
- `createdAt`, `deletedAt` (timestamps)

### 3. Initial User Setup

1. First user to log in will be created with default role `buyer_agent`
2. To assign roles:
   - Update the `role` field in the `profiles` table
   - Or create an admin interface to manage roles

### 4. Testing

1. **Test Login:**
   - Navigate to `/login`
   - Click "Continue with Google"
   - Complete OAuth flow
   - Should redirect to dashboard

2. **Test Route Protection:**
   - Try accessing `/buyers` without logging in
   - Should redirect to `/login`
   - After login, should access dashboard

3. **Test RBAC:**
   - Login as different roles
   - Try accessing restricted routes
   - Should see appropriate access or error messages

## Security Considerations

1. **API Key for Webhooks:**
   - The `/api/v1/leads` POST endpoint accepts API key authentication for external webhooks
   - Set `LEADS_API_SECRET` environment variable
   - External services should send `x-api-key` header

2. **Role Assignment:**
   - Only `super_admin` and `team_lead` can assign leads
   - Users can only see their own assigned resources (unless admin/team lead)

3. **Audit Logging:**
   - All create/update/delete actions are logged
   - Includes user ID who performed the action
   - Accessible via `/api/v1/audit-logs`

## Troubleshooting

### User can't log in
- Check Supabase Google OAuth configuration
- Verify redirect URL matches Supabase settings
- Check browser console for errors

### User has no profile
- Profile is auto-created on first login
- Check `syncUserProfile()` function in `src/lib/auth.ts`
- Verify database connection

### Permission denied errors
- Check user's role in `profiles` table
- Verify role has required permission in `src/lib/rbac.ts`
- Check server logs for specific permission being checked

### API routes returning 401/403
- Verify user is authenticated (check session)
- Check user's role and permissions
- Review `withAuth()` wrapper usage in API route

## Next Steps

1. **Admin Interface:**
   - Create UI for managing user roles
   - Add role assignment functionality

2. **Permission Refinement:**
   - Review and adjust permissions per role as needed
   - Add more granular permissions if required

3. **User Management:**
   - Add user profile editing
   - Add user invitation system
   - Add user deactivation

4. **Audit & Monitoring:**
   - Create audit log viewer
   - Add security monitoring alerts

