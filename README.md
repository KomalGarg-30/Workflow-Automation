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

Authentication is handled by the app using password hashes and server-side sessions; no Clerk account or keys are required. The supported messaging integrations are Discord, Slack, and Telegram. Configure the Discord and Slack OAuth values in `.env`, and register their callback URLs with each provider.

Existing records previously associated with Clerk IDs are preserved in the database, but those accounts do not have local password hashes. They cannot sign in until a secure account-migration process is completed.

To connect Telegram, create a bot with [BotFather](https://t.me/BotFather), add it to the destination chat (or start the bot in a private chat), then enter its token and the destination chat ID on the Connections page. For a channel, the bot must be an administrator and the chat ID can be its `@username`.

Workflows currently send messages manually from their editor. Automated triggers and other integrations can be added later.

## Deployment

Set `NEXT_PUBLIC_URL` and every OAuth callback URL to the deployed HTTPS origin, then apply the Prisma schema to the production database before deploying.
