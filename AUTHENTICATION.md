# Authentication Setup Guide

This application uses Docebo OAuth 2.0 for authentication, providing single sign-on (SSO) functionality.

## Prerequisites

- Active Docebo account with admin privileges
- OAuth2 application configured in Docebo

## Step 1: Configure OAuth in Docebo

1. **Log in to Docebo** as an administrator

2. **Navigate to OAuth Settings**:
   - Go to **Admin Menu** → **Settings** → **API & SSO** → **OAuth2 Apps**

3. **Create New OAuth Application**:
   - Click **"Add App"** or **"Create OAuth App"**
   - Fill in the details:
     - **Name**: `Docebo-Certopus Integration` (or any descriptive name)
     - **Redirect URI**: `http://localhost:3000/api/auth/callback/docebo`
       - For production: `https://yourdomain.com/api/auth/callback/docebo`
     - **Scopes**: Select `api` (full API access)
     - **Grant Types**: `Authorization Code`
   
4. **Save and Copy Credentials**:
   - After creating the app, Docebo will provide:
     - **Client ID** (e.g., `certopustest`)
     - **Client Secret** (a long hexadecimal string)
   - **Keep these secure!** You'll need them in the next step

## Step 2: Configure Environment Variables

1. **Copy the example environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Update the `.env` file** with your Docebo OAuth credentials:
   ```env
   # Docebo API Configuration
   DOCEBO_API_URL="https://your-domain.docebosaas.com"
   DOCEBO_DOMAIN="your-domain.docebosaas.com"
   DOCEBO_CLIENT_ID="your_client_id_from_step_1"
   DOCEBO_CLIENT_SECRET="your_client_secret_from_step_1"
   DOCEBO_API_USERNAME="your_api_username"
   DOCEBO_API_PASSWORD="your_api_password"
   
   # Generate a secure secret
   NEXTAUTH_SECRET="run: openssl rand -base64 32"
   NEXTAUTH_URL="http://localhost:3000"
   AUTH_TRUST_HOST="true"
   ```

3. **Generate NextAuth Secret**:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as the value for `NEXTAUTH_SECRET`

## Step 3: Update Database Schema

Run the database migration to add authentication tables:

```bash
npm run db:push
```

## Step 4: Start the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## How Authentication Works

1. **User visits the application** → Redirected to sign-in page
2. **Clicks "Sign in with Docebo"** → Redirected to Docebo OAuth consent screen
3. **User authorizes the app** → Docebo redirects back with authorization code
4. **App exchanges code for access token** → User session created
5. **User is signed in** → Can access all protected routes

## Protected Routes

All routes except the following require authentication:
- `/auth/signin` - Sign in page
- `/auth/error` - Authentication error page
- `/api/auth/*` - NextAuth API routes
- `/api/webhook` - Webhook endpoint (for Docebo callbacks)

## API Protection

All API routes (except webhook) are now protected. Requests without a valid session will receive a 401 Unauthorized response.

## User Management

- Users are automatically created on first sign-in
- User data is stored in the database
- Sessions are JWT-based for performance
- Session expires after 30 days of inactivity

## Troubleshooting

### "Configuration Error"
- Check that all environment variables are set correctly
- Verify `DOCEBO_CLIENT_ID` and `DOCEBO_CLIENT_SECRET` match your OAuth app
- Ensure `DOCEBO_API_URL` and `DOCEBO_DOMAIN` are correct

### "Access Denied"
- Verify the user has appropriate permissions in Docebo
- Check OAuth app scopes include `api`
- Ensure the user account is active

### "Callback Mismatch"
- Verify the redirect URI in Docebo matches exactly:
  - Development: `http://localhost:3000/api/auth/callback/docebo`
  - Production: `https://yourdomain.com/api/auth/callback/docebo`
- Note: HTTP vs HTTPS matters!

### Testing Authentication

1. Open browser in incognito/private mode
2. Navigate to `http://localhost:3000`
3. You should be redirected to `/auth/signin`
4. Click "Sign in with Docebo"
5. Complete Docebo OAuth flow
6. You should be redirected back and signed in

## Security Best Practices

- ✅ Never commit `.env` file to version control
- ✅ Use strong, unique `NEXTAUTH_SECRET` in production
- ✅ Always use HTTPS in production
- ✅ Regularly rotate OAuth credentials
- ✅ Limit OAuth scope to minimum required permissions
- ✅ Monitor authentication logs for suspicious activity

## Production Deployment

When deploying to production:

1. Update `NEXTAUTH_URL` to your production domain
2. Update Docebo OAuth redirect URI to production URL
3. Use environment-specific credentials
4. Enable HTTPS (required for OAuth)
5. Set `NODE_ENV=production`

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Docebo API Documentation](https://www.docebo.com/platform/extend/api/)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
