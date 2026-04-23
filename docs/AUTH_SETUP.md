# Supabase Auth Configuration Guide

## Required Supabase Dashboard Settings

### 1. Site URL

**Location:** Supabase Dashboard → Authentication → URL Configuration → Site URL

**Set to your production URL:**
```
https://your-cloudflare-workers-domain.workers.dev
```

Or if using a custom domain:
```
https://your-custom-domain.com
```

**Important:** This is the base URL that Supabase will use for all auth email links.

---

### 2. Redirect URLs

**Location:** Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

**Add ALL of these redirect URLs:**

#### Local Development
```
http://localhost:3000/auth/callback/
```

#### Cloudflare Workers Production
```
https://your-cloudflare-workers-domain.workers.dev/auth/callback/
```

#### Custom Domain (if applicable)
```
https://your-custom-domain.com/auth/callback/
```

#### Preview Deployments (if using Cloudflare Pages preview URLs)
```
https://<commit-hash>-your-project-name.workers.dev/auth/callback/
```

**Note:** Each environment needs its own exact callback URL registered. Supabase will only redirect to URLs that match the patterns you configure here.

---

### 3. Email Templates

**Location:** Supabase Dashboard → Authentication → Email Templates

#### Confirm Signup Email
The confirmation link will automatically use your Site URL + `/auth/callback/` with the appropriate query parameters.

#### Reset Password Email
The password reset link will automatically use your Site URL + `/auth/callback/` with the appropriate query parameters.

**Customize these templates to match your brand:**
- Add your logo
- Update email subject lines
- Customize email body text
- Keep the `{{ .ConfirmationURL }}` or `{{ .ResetURL }}` placeholder in the templates

---

## Environment Variables

### Local Development (`.env.local`)

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# OR (legacy fallback)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Cloudflare Production

**Set these in Cloudflare Dashboard → Workers & Pages → Your Project → Settings → Environment Variables**

| Variable | Value | Scope |
|----------|-------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://your-cloudflare-workers-domain.workers.dev` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Production |

**For preview deployments:** Set `NEXT_PUBLIC_SITE_URL` to the preview-specific URL.

---

## Auth Flow Summary

### Sign-Up Flow
1. User submits sign-up form with email + password
2. App calls `supabase.auth.signUp()` with `emailRedirectTo: getAuthCallbackUrl(safeNext)`
3. Supabase sends confirmation email with link to `NEXT_PUBLIC_SITE_URL/auth/callback/?code=...&next=...`
4. User clicks email link
5. Callback page exchanges code for session
6. User redirected to dashboard

### Sign-In Flow
1. User submits login form with email + password
2. App calls `supabase.auth.signInWithPassword()`
3. On success, user redirected to dashboard
4. Session cookies set automatically

### Password Reset Flow
1. User clicks "Forgot password?" on login page
2. User submits email on reset password page
3. App calls `supabase.auth.resetPasswordForEmail()` with `redirectTo: getAuthCallbackUrl("/dashboard")`
4. Supabase sends reset email with link to `NEXT_PUBLIC_SITE_URL/auth/callback/?code=...&type=recovery`
5. User clicks email link
6. Callback page exchanges code for session
7. User can now set new password (implement password update UI if needed)

---

## Testing Checklist

### Local Development
- [ ] Sign up with test email
- [ ] Receive confirmation email with correct localhost callback URL
- [ ] Click confirmation link and complete sign-up
- [ ] Sign in with credentials
- [ ] Request password reset
- [ ] Receive reset email with correct localhost callback URL
- [ ] Click reset link and set new password

### Production (Cloudflare)
- [ ] Set `NEXT_PUBLIC_SITE_URL` to production URL in Cloudflare
- [ ] Add production callback URL to Supabase Redirect URLs
- [ ] Deploy to Cloudflare
- [ ] Sign up with test email
- [ ] Receive confirmation email with correct production callback URL
- [ ] Click confirmation link and complete sign-up
- [ ] Sign in with credentials
- [ ] Request password reset
- [ ] Receive reset email with correct production callback URL
- [ ] Click reset link

---

## Common Issues & Solutions

### Issue: Auth emails contain localhost URLs in production

**Cause:** `NEXT_PUBLIC_SITE_URL` not set correctly in Cloudflare environment

**Solution:** Set `NEXT_PUBLIC_SITE_URL` to your production URL in Cloudflare dashboard

---

### Issue: "Invalid redirect URI" error

**Cause:** Callback URL not registered in Supabase Redirect URLs

**Solution:** Add the exact callback URL (including protocol and trailing slash) to Supabase Redirect URLs

---

### Issue: Email confirmation doesn't redirect after clicking link

**Cause:** Missing or incorrect `redirectTo`/`emailRedirectTo` parameter in auth calls

**Solution:** Ensure all auth calls use `getAuthCallbackUrl()` helper which correctly builds URLs from `NEXT_PUBLIC_SITE_URL`

---

### Issue: Password reset link doesn't work

**Cause:** Missing `redirectTo` parameter in `resetPasswordForEmail()` call

**Solution:** Always pass `redirectTo: getAuthCallbackUrl("/dashboard")` when calling `resetPasswordForEmail()`

---

## Security Notes

- Never commit `.env.local` to git
- Use separate Supabase projects for development and production if possible
- Rotate publishable/anon keys periodically
- Keep JWT expiry short for sensitive applications
- Enable RLS policies on all tables
- Use `app_metadata` for authorization claims, not `user_metadata`
