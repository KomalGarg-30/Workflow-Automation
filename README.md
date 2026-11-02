## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Install dependencies:

   ```powershell
   npm install --legacy-peer-deps
   ```

3. Apply the Prisma schema to the configured PostgreSQL database:

   ```powershell
   npx prisma db push
   ```

4. Start the development server:

   ```powershell
   npm run dev
   ```

The development server uses HTTPS; open `https://localhost:3000` and trust the local certificate if prompted. Create an account at `/sign-up`.

Authentication is handled by the app using password hashes and server-side sessions; no Clerk account or keys are required. To use Google Drive, configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_OAUTH_REDIRECT_URI`. Add `https://localhost:3000/api/auth/callback/google` as an authorized redirect URI in Google Cloud. Register `https://localhost:3000/api/auth/callback/discord`, `https://localhost:3000/api/auth/callback/notion`, and `https://localhost:3000/api/auth/callback/slack` with their providers if you enable those integrations. Google Drive change notifications also require a reachable `NGROK_URI`.

Existing records previously associated with Clerk IDs are preserved in the database, but those accounts do not have local password hashes. They cannot sign in until a secure account-migration process is completed.

## Deployment

Set `NEXT_PUBLIC_URL` and every OAuth callback URL to the deployed HTTPS origin, then apply the Prisma schema to the production database before deploying.
