# Localhost Authentication Setup

## Supabase Configuration for Localhost

### Step 1: Configure Redirect URLs in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add these URLs to **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   http://127.0.0.1:3000/auth/callback
   ```
   (Replace `3000` with your actual port if different)

4. Set **Site URL** to:
   ```
   http://localhost:3000
   ```

### Step 2: Configure Google OAuth Provider

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. **Authorized redirect URIs** in Google Cloud Console should include:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
   (This is Supabase's callback URL, not your localhost URL)

### Step 3: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. **Authorized redirect URIs**: Add:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
   (Get your project ref from Supabase dashboard URL or project settings)

### Step 4: Environment Variables

Make sure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 5: Test the Flow

1. Start your dev server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Click "Continue with Google"
4. Complete OAuth flow
5. Should redirect back to `http://localhost:3000/auth/callback` then to dashboard

## Troubleshooting

### Issue: Redirect URI mismatch
- **Error**: "redirect_uri_mismatch"
- **Solution**: Double-check that `https://[your-project-ref].supabase.co/auth/v1/callback` is in Google Cloud Console authorized redirect URIs

### Issue: Redirect loop
- **Error**: Infinite redirects between login and callback
- **Solution**: Check that `http://localhost:3000/auth/callback` is in Supabase redirect URLs

### Issue: "Invalid client" error
- **Error**: Google OAuth shows invalid client
- **Solution**: Verify Google OAuth Client ID and Secret in Supabase dashboard match Google Cloud Console

### Issue: Profile not created
- **Error**: User logs in but no profile in database
- **Solution**: Check database connection and verify `syncUserProfile()` is being called in callback route

## Development vs Production

For production deployment, you'll need to:
1. Add your production domain to Supabase redirect URLs
2. Update Google Cloud Console with production redirect URI
3. Update environment variables for production

Example production redirect URLs:
```
https://yourdomain.com/auth/callback
https://www.yourdomain.com/auth/callback
```

