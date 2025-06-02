# Patreonizer Application Documentation

## 1. Introduction

Patreonizer is a web application designed to help Patreon creators manage and analyze their revenue and patron data across multiple Patreon pages. It provides a centralized dashboard for combined analytics, detailed patron information, and tools for data export and synchronization.

This document provides a comprehensive overview of the frontend and backend architecture, components, and core functionalities of the Patreonizer application, based on its codebase and the initial Product Requirements Document (PRD).

## 2. Core Features (from PRD)

-   **Patreon OAuth Integration**: Securely connect multiple Patreon creator accounts using Patreon's 2.0 API. Data is synced upon connection (initial full sync) and subsequently updated via Patreon Webhooks for near real-time event processing. The PRD's goal of data being "updated in realtime each time the user logs into their account and loads the app/page" is supported by these mechanisms, with on-login/on-load triggered syncs being a potential further enhancement for full reconciliation. A comprehensive set of data is synced, primarily including campaign details, patron information (with addresses), posts, tiers, goals, and benefits. The `patreonApi.ts` module has capabilities to fetch additional data types which can be integrated into the synchronization service as needed.
-   **User Authentication**: Uses Replit Auth 2.0 for user sign-up and login.
-   **Database**: Utilizes Replit databases (presumably PostgreSQL with Drizzle ORM) for storing user and Patreon data.
-   **Dashboard View**:
    -   Combined revenue and patron data. "Traffic stats" and detailed "post performance data" as distinct aggregated dashboard widgets are not currently implemented by the main dashboard metrics endpoint (`/api/dashboard/metrics`) but post-specific data (like counts, comments) is available on the "Posts" page.
    -   Indicators showing 30-day changes for key numbers. More granular "daily, weekly" change indicators would be a future enhancement.
    -   The backend `getDashboardMetrics` endpoint currently provides combined statistics for all of a user's connected pages. Filtering these aggregated dashboard metrics for individual or multiple selected pages would be a frontend implementation detail, potentially utilizing other filterable backend endpoints (like `getRevenueData`) or by enhancing the main metrics endpoint.
-   **Patron Data Page**:
    -   Detailed data for each patron (name, email, membership info, etc.).
    -   Data export functionality.
-   **Sign-up Flow**: Intuitive onboarding guiding users to connect their first Patreon page.
-   **UI/UX**:
    -   Beautiful, simple, intuitive dark mode interface (Shadcn "Rose" theme).
    -   Consistent styling system.
    -   Framer Motion animations and transitions.
-   **Patreon API Deep Dive**: Thorough understanding and utilization of the Patreon API.
-   **Comprehensive Documentation**: This document aims to fulfill this requirement.

## 3. Technology Stack

**Frontend:**

-   **Framework**: React
-   **Language**: TypeScript
-   **Routing**: Wouter
-   **Data Fetching/State Management**: `@tanstack/react-query`
-   **UI Components**: Shadcn/ui (with custom "Rose" theme)
-   **Animations**: Framer Motion
-   **Styling**: Tailwind CSS, `index.css` for global styles
-   **Build Tool**: Vite

**Backend:**

-   **Framework**: Express.js (Node.js)
-   **Language**: TypeScript
-   **Authentication**:
    -   Replit Auth 2.0 (OIDC via `passport` and `openid-client`)
    -   Patreon OAuth 2.0 (via `passport-oauth2`)
-   **Database ORM**: Drizzle ORM
-   **API Client (Patreon)**: Custom `axios`-based client for Patreon API v2
-   **Session Management**: `express-session` with `connect-pg-simple` (PostgreSQL store)

**Shared:**

-   **Schema Definition**: Drizzle schema defined in `@shared/schema` for type safety across frontend and backend.

## 4. Project Structure Overview

```
Patreonizer/
├── client/               # Frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   │   ├── dashboard/
│   │   │   ├── layout/
│   │   │   ├── modals/
│   │   │   ├── patron/
│   │   │   └── ui/       # Shadcn UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility functions, queryClient
│   │   ├── pages/      # Page-level components
│   │   └── types/      # Frontend-specific TypeScript types
│   ├── App.tsx         # Main React application component, routing
│   ├── main.tsx        # React application entry point
│   └── index.css       # Global styles
├── server/               # Backend application
│   ├── db.ts           # Drizzle ORM database connection setup
│   ├── index.ts        # Express server entry point
│   ├── patreonApi.ts   # Client for Patreon API v2
│   ├── patreonAuth.ts  # Patreon OAuth 2.0 handling
│   ├── replitAuth.ts   # Replit Auth 2.0 handling
│   ├── routes.ts       # API route definitions
│   ├── storage.ts      # Data access layer (Drizzle ORM queries)
│   ├── syncService.ts  # Patreon data synchronization logic
│   └── webhookHandler.ts # Patreon webhook processing
├── shared/               # Shared code (e.g., Drizzle schema)
├── components.json       # Shadcn/ui configuration
├── drizzle.config.ts   # Drizzle ORM configuration
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```

## 5. Frontend Analysis

### 5.1. Entry Point (`client/src/main.tsx`)

-   Standard React application bootstrap.
-   Renders the main `<App />` component into the DOM element with `id="root"`.

### 5.2. Main Application Component (`client/src/App.tsx`)

-   **Providers**:
    -   `QueryClientProvider`: Initializes `@tanstack/react-query` for server state management.
    -   `ThemeProvider`: Manages application themes (defaulting to "dark" with `patreonizer-theme` storage key, likely implementing the Shadcn "Rose" theme).
    -   `TooltipProvider`: Enables tooltip functionality globally.
    -   `Toaster`: Provides system for displaying toast notifications.
-   **Routing (`Router` component with `wouter`)**:
    -   Uses the `useAuth()` hook to determine authentication status.
    -   **Unauthenticated Users**: Redirected to `/` (Landing Page).
    -   **Authenticated Users**: Have access to:
        -   `/`: `Dashboard` page
        -   `/patrons`: `PatronData` page
        -   `/connected-pages`: `ConnectedPages` page
        -   `/posts`: `Posts` page
        -   `/settings`: `Settings` page
    -   A `NotFound` component handles any undefined routes.

### 5.3. Authentication Hook (`client/src/hooks/useAuth.ts`)

-   `useAuth()`:
    -   Uses `useQuery` from `@tanstack/react-query` to fetch user data from the `/api/auth/user` backend endpoint.
    -   `queryKey: ["/api/auth/user"]`
    -   `getQueryFn({ on401: "returnNull" })`: If the API returns a 401 (Unauthorized), the hook treats the user as unauthenticated (returns `null`).
    -   Returns `{ user, isLoading, isAuthenticated }`. `isAuthenticated` is a boolean derived from the presence of `user` data.

### 5.4. Landing Page (`client/src/pages/Landing.tsx`)

-   Serves as the initial entry point for new or unauthenticated users.
-   **UI/UX**:
    -   Features Framer Motion animations for elements.
    -   Responsive design handled by `useScreenSize` hook.
    -   Displays application features using `lucide-react` icons.
-   **Authentication Flow**:
    -   **Unauthenticated State**: Shows "Get Started Free" button, which redirects to `/api/login` (handled by backend Replit Auth).
    -   **Authenticated State (Post-Replit Auth, Pre-Patreon Connect)**: If `isAuthenticated` is true (user logged in via Replit), it prompts the user to connect their first Patreon campaign. This uses the `ConnectPatreonModal`.
-   **Patreon Connection Feedback**:
    -   On component mount (`useEffect`), checks URL parameters (`connected=true` or `error=...`).
    -   Displays success or error toasts based on these parameters, which are set by the backend Patreon OAuth callback redirect.
    -   Cleans the URL parameters after displaying the toast.
-   **`ConnectPatreonModal` Trigger**:
    -   Shown to authenticated users without (presumably) connected campaigns.
    -   Also triggered by a "Learn More" button (this might be intended for a different purpose or also lead to connection).

### 5.5. Patreon Connection Modal (`client/src/components/dashboard/ConnectPatreonModal.tsx`)

-   **Purpose**: Guides the user to connect their Patreon account.
-   **UI**: A Shadcn `Dialog` component. Displays features and a security notice about Patreon's official OAuth 2.0.
-   **Action**:
    -   The "Connect Patreon Account" button, when clicked:
        -   Sets a loading state (`isConnecting`).
        -   Redirects the browser to `/api/auth/patreon`. This backend endpoint initiates the Patreon OAuth flow.
-   **Control**: `isOpen` prop controls visibility, `onClose` prop handles modal dismissal.

### 5.6. Key Frontend Libraries/Patterns

-   **`@tanstack/react-query`**: For managing server state, caching, and background updates. Critical for fetching dashboard data, patron lists, etc.
-   **Shadcn/ui & Tailwind CSS**: Provides the component library and styling framework, enabling the "Rose" theme and consistent UI.
-   **Framer Motion**: Used for animations and transitions as per PRD.
-   **Wouter**: Lightweight routing solution.
-   **TypeScript**: Ensures type safety throughout the frontend codebase.
-   **Lucide Icons**: For a consistent and modern icon set.

## 6. Backend Analysis

### 6.1. Server Entry Point (`server/index.ts`)

-   **Framework**: Express.js
-   **Middleware**:
    -   `express.json()`, `express.urlencoded()`: For parsing request bodies.
    -   Custom logging middleware: Logs details of API requests (`/api/**`) including method, path, status, duration, and a snippet of the JSON response.
-   **Routing**:
    -   `registerRoutes(app)`: Central function call to set up all application API routes (defined in `server/routes.ts`).
-   **Error Handling**: Global error handler that responds with JSON errors.
-   **Vite Integration**:
    -   **Development**: `setupVite()` likely integrates Vite's dev server for HMR and serving the frontend.
    -   **Production**: `serveStatic()` serves the built static frontend assets.
-   **Server Initialization**: Listens on port 5000.

### 6.2. API Routes (`server/routes.ts`)

-   Initializes and configures authentication and webhook handlers:
    -   `setupAuth(app)`: Sets up Replit Auth middleware.
    -   `setupPatreonAuth(app)`: Configures Patreon OAuth routes.
    -   `setupWebhookHandlers(app)`: Sets up the endpoint for Patreon webhooks.
-   **Protected Routes**: Most routes are protected by the `isAuthenticated` middleware (from `replitAuth.ts`).
-   **Key Endpoint Groups**:
    -   **Auth (`/api/auth/...`)**:
        -   `GET /user`: Returns authenticated Replit user data.
        -   (Patreon OAuth routes are set up in `patreonAuth.ts` but typically include `/patreon` and `/patreon/callback`).
        -   `DELETE /delete-account`: Placeholder for account deletion.
    -   **Dashboard (`/api/dashboard/...`)**:
        -   `GET /metrics`: Fetches aggregated metrics for the dashboard.
        -   `GET /revenue-data`: Provides time-series revenue data.
    -   **Campaigns (`/api/campaigns/...`)**:
        -   `GET /`: Lists user's connected campaigns with enhanced stats.
        -   `DELETE /:campaignId`: Disconnects a campaign.
        -   `GET /:campaignId/tiers`, `/goals`, `/benefits`: Fetches specific campaign sub-resources.
    -   **Patrons (`/api/patrons/...`)**:
        -   `GET /`: Fetches paginated and searchable patron lists.
        -   `GET /export`: Exports patron data as CSV.
    -   **Sync Service (`/api/sync/...`)**:
        -   `POST /start`: Initiates data synchronization for a campaign.
        -   `GET /status/:syncId`: Checks the status of an ongoing sync.
        -   `GET /active`: Lists active syncs for the user.
    -   **Posts (`/api/posts/...`)**:
        -   `GET /`: Fetches paginated and searchable posts.
    -   **Activity (`/api/activity/...`)**:
        -   `GET /recent`: Fetches recent user activity.
    -   **Settings (`/api/settings/...`)**:
        -   `GET /`, `POST /`: Placeholders for fetching/saving user settings.
    -   **Webhooks (`/api/webhooks/...`)**:
        -   `GET /:campaignId`: List webhooks for a campaign.
        -   `POST /:campaignId`: Create a new webhook via Patreon API and store it.
        -   `DELETE /:webhookId`: Delete a webhook from Patreon and local DB.
    -   **Notifications (`/api/notifications/...`)**: Placeholders for notification management.
-   **Data Layer**: Most route handlers delegate data operations to the `storage` object (instance of `DatabaseStorage` from `storage.ts`).

### 6.3. Replit Authentication (`server/replitAuth.ts`)

-   **OIDC Integration**: Implements Replit Auth 2.0 using `openid-client` and `passport`.
-   **Configuration**:
    -   Reads `ISSUER_URL`, `REPL_ID`, `REPLIT_DOMAINS`, `SESSION_SECRET`, `DATABASE_URL` from environment variables.
    -   `getOidcConfig()`: Fetches OIDC discovery document, memoized.
-   **Session Management**:
    -   `getSession()`: Configures `express-session` using `connect-pg-simple` to store sessions in PostgreSQL. Sessions last 1 week.
-   **Passport Strategy**:
    -   `openid-client/passport` strategy configured for each domain in `REPLIT_DOMAINS`.
    -   Requests `openid email profile offline_access` scopes.
    -   **Verify Function**:
        -   On successful authentication with Replit, receives tokens.
        -   Stores claims, access token, refresh token, and expiry in the user's session.
        -   Calls `storage.upsertUser()` to save/update user details (ID, email, name, profile image) in the application database.
-   **Auth Routes**:
    -   `GET /api/login`: Initiates OIDC flow with Replit.
    -   `GET /api/callback`: Handles OIDC callback from Replit. On success, redirects to `/`.
    -   `GET /api/logout`: Clears session and redirects to Replit's end session endpoint.
-   **`isAuthenticated` Middleware**:
    -   Checks if `req.isAuthenticated()` is true and the access token in session (`req.user.expires_at`) is not expired.
    -   If token is expired but a `refresh_token` exists, it attempts to refresh the token with Replit using `client.refreshTokenGrant()`.
    -   If refresh succeeds, updates session tokens. Otherwise, denies access (401).

### 6.4. Patreon OAuth Handling (`server/patreonAuth.ts`)

-   **OAuth 2.0 Integration**: Implements Patreon OAuth 2.0 using `passport-oauth2`.
-   **Configuration**:
    -   Reads `PATREON_CLIENT_ID`, `PATREON_CLIENT_SECRET` from environment variables.
    -   Authorization URL: `https://www.patreon.com/oauth2/authorize`
    -   Token URL: `https://www.patreon.com/api/oauth2/token`
    -   Callback URL: Dynamically constructed based on `REPLIT_DOMAINS` (e.g., `https://<domain>/api/auth/patreon/callback`).
    -   **Scopes**: `identity campaigns campaigns.members campaigns.posts w:campaigns.webhook`. These are crucial for accessing all necessary Patreon data and managing webhooks.
-   **Passport Strategy Callback**:
    -   Receives `accessToken`, `refreshToken`, `expires_in` from Patreon.
    -   Calculates `expiresAt` and passes these credentials to the route handler.
-   **Patreon OAuth Routes**:
    -   `GET /api/auth/patreon`:
        -   Requires Replit authentication.
        -   Stores Replit `userId` in session (`req.session.connectingUserId`) to link the Patreon account later.
        -   Redirects user to Patreon for authorization.
    -   `GET /api/auth/patreon/callback`:
        -   Handles redirect from Patreon.
        -   Passport exchanges authorization code for tokens.
        -   Retrieves `userId` from session.
        -   **Scope Verification**: Ensures necessary scopes (`identity`, `campaigns`, `campaigns.members`) were granted.
        -   Fetches Patreon user campaigns using `patreonApi.getUserCampaigns()`.
        -   For each campaign:
            -   Calls `storage.createCampaign()` to save campaign details (including tokens) to the database, associated with the Replit user.
            -   Initiates an initial full data sync for the new campaign using `syncService.startSync(userId, campaign.id, 'initial')`.
        -   Redirects to `/` with `connected=true` or `error=...` query parameters.
    -   `POST /api/auth/patreon/disconnect`: Allows disconnecting campaigns by deleting them from `storage`.

### 6.5. Patreon API Client (`server/patreonApi.ts`)

-   A class `PatreonAPI` encapsulating all interactions with Patreon API v2 (`https://www.patreon.com/api/oauth2/v2`).
-   **Core Request Logic**:
    -   `makeRequest()`: Private `axios`-based GET request helper with standard headers and error handling (401, 403, 429, 500s, timeout).
    -   `makeRequestWithTokenRefresh()`: Public method that wraps `makeRequest()`. If a 401 error occurs (token expired), it attempts to use a provided `refreshToken` and an `onTokenRefresh` callback (which would update storage) to get new tokens and retry the request.
-   **Endpoint Methods**: Provides methods for numerous Patreon API endpoints:
    -   `getCurrentUser`, `getUserCampaigns`, `getCampaignMembers`, `getCampaignPosts`, `getCampaignTiers`, `getCampaignBenefits`, `getCampaignGoals`, `getCampaign`, `getMember`.
    -   These methods extensively use Patreon's `fields[...]` and `include` query parameters for efficient data fetching (JSON:API compliance).
    -   Handle pagination using `page[cursor]`.
    -   `getAllPages()`: Helper for fetching all data from paginated endpoints.
-   **Webhook Management**: `getWebhooks`, `createWebhook`, `updateWebhook`, `deleteWebhook`.
-   **Token Refresh**: `refreshAccessToken()`: Implements the OAuth refresh token grant flow.
-   **Utilities**: `validateConnection` (checks token validity), `validateWebhookSignature` (HMAC SHA256).

### 6.6. Data Synchronization Service (`server/syncService.ts`)

-   `SyncService` class manages fetching data from Patreon and storing it locally.
-   **`activeSyncs` Map**: Prevents concurrent syncs for the same campaign.
-   **`startSync(userId, campaignId?, syncType)`**:
    -   Public method to trigger a sync (`initial`, `incremental`, `full`).
    -   Creates a `syncStatus` record in `storage`.
    -   Asynchronously calls `performSync()` in the background.
-   **`performSync(campaign, syncId, syncType)` (Private)**:
    -   The main sync orchestration logic.
    -   Updates `syncStatus` (in_progress, completed, failed).
    -   **Token Refresh**: Automatically refreshes Patreon access token if expired before syncing.
    -   **Sync Order**:
        1.  `syncCampaignDetails`: Updates detailed campaign information.
        2.  `syncPatrons`: Fetches and upserts all patrons for the campaign. Handles pagination. Updates progress.
        3.  `syncPosts`: Fetches and upserts all posts. Handles pagination. Updates progress.
        4.  `syncCampaignTiers`, `syncCampaignGoals`, `syncCampaignBenefits`: Syncs additional campaign metadata (errors are warnings).
        5.  `updateCampaignStats`: Recalculates and stores aggregate stats (patron count, pledge sum) on the campaign record.
        6.  `createRevenueSnapshot`: Saves a daily snapshot of revenue and patron count.
    -   Updates campaign's `lastSyncAt`.
-   **Helper Sync Methods**: Private methods for syncing specific data types (`syncPatrons`, `syncPosts`, etc.), each calling appropriate `patreonApi` methods and `storage` upsert methods.

### 6.7. Patreon Webhook Handler (`server/webhookHandler.ts`)

-   `setupWebhookHandlers(app)`: Defines `POST /api/webhooks/patreon`.
-   **Webhook Processing**:
    -   Validates `x-patreon-signature` and `x-patreon-event` headers.
    -   Extracts `campaignId` from the payload.
    -   Retrieves the campaign and its webhook configuration (including the `secret`) from `storage` based on the `campaignId` and the `event` type.
    -   Validates the signature using `patreonApi.validateWebhookSignature()`.
    -   Calls `processWebhookEvent()` on successful validation.
-   **`processWebhookEvent(event, payload, campaign)`**:
    -   Uses a `switch` statement to delegate to specific handlers based on `event` type (e.g., `members:create`, `members:pledge:update`, `posts:publish`).
    -   **Event Handlers (`processMemberEvent`, `processPostEvent`, etc.)**:
        -   Parse the webhook payload.
        -   Call `storage.upsertPatron()` or `storage.upsertPost()` to update the local database in near real-time.
        -   Update aggregate campaign stats using `updateCampaignStatsFromWebhook()`.
        -   Deletion events (`members:pledge:delete`, `posts:delete`) are currently logged, with a note to consider soft deletes.

### 6.8. Data Storage (`server/storage.ts`)

-   `DatabaseStorage` class implementing `IStorage` interface. This is the Data Access Layer (DAL).
-   **ORM**: Uses Drizzle ORM for all database interactions (presumably PostgreSQL).
-   **Schema**: Imports table definitions and types from `@shared/schema`.
-   **Core Responsibilities**:
    -   Provides CRUD (Create, Read, Update, Delete) operations for all entities: `User`, `PatreonCampaign`, `Patron`, `Post`, `SyncStatus`, `RevenueData`, `CampaignTier`, `CampaignGoal`, `Benefit`, `Address`, `Webhook`.
    -   Most `upsert` methods check for existing records before deciding to insert or update, typically using Patreon-specific IDs (e.g., `patreonCampaignId`, `patreonUserId`, `patreonPostId`) as unique keys for upsert logic.
-   **Key Methods & Logic**:
    -   `getUser()`, `upsertUser()`: Basic user management for Replit Auth.
    -   `getCampaignStats()`: Calculates aggregate patron count and pledge sum for a campaign.
    -   `getPatrons()`, `getPosts()`: Implement filtering, pagination, and searching. `getPosts` joins with campaigns to include `campaignTitle`.
    -   `exportPatronsCSV()`: Generates CSV data for patron export.
    -   `getDashboardMetrics()`: Complex queries to aggregate data from `patrons` and `revenueData` tables to provide current values and percentage changes for key dashboard indicators.
    -   `getRecentActivity()`: Fetches recent new patrons and posts.
    -   All methods use Drizzle's query builder for type-safe database access.

## 7. Data Flow Examples

### 7.1. User Sign-up & First Patreon Connection

1.  **FE**: User visits Landing Page, clicks "Get Started Free".
2.  **FE**: Redirects to `GET /api/login`.
3.  **BE (`replitAuth.ts`)**: Initiates Replit OIDC flow. User authenticates with Replit.
4.  **BE**: Replit redirects to `GET /api/callback`. `replitAuth.ts` verifies tokens, upserts user info into `storage.upsertUser()`, creates a session. Redirects to `/` (Landing Page, now authenticated).
5.  **FE (`Landing.tsx`)**: `useAuth()` hook now reports authenticated. UI prompts to "Connect Patreon Account". User clicks.
6.  **FE (`ConnectPatreonModal.tsx`)**: Modal opens. User clicks "Connect Patreon Account".
7.  **FE**: Redirects to `GET /api/auth/patreon`.
8.  **BE (`patreonAuth.ts`)**: Verifies Replit auth, stores Replit `userId` in session, redirects to Patreon OAuth.
9.  **Patreon**: User authorizes app. Patreon redirects to `GET /api/auth/patreon/callback`.
10. **BE (`patreonAuth.ts`)**:
    -   Exchanges code for Patreon tokens.
    -   Retrieves Replit `userId` from session.
    -   Fetches campaigns via `patreonApi.getUserCampaigns()`.
    -   For each campaign:
        -   `storage.createCampaign()` saves campaign data and tokens.
        -   `syncService.startSync(userId, newCampaign.id, 'initial')` is called (runs in background).
    -   Redirects to `/` with `connected=true`.
11. **FE (`Landing.tsx`)**: Sees `?connected=true`, shows success toast. `useAuth()` is still true. Router now directs to `Dashboard`.
12. **BE (`syncService.ts` - background)**: `performSync` fetches all data (patrons, posts, etc.) for the new campaign from Patreon via `patreonApi` and stores it via `storage` methods.

### 7.2. Displaying Dashboard Metrics

1.  **FE (`Dashboard.tsx`)**: Mounts, uses a `useQuery` hook (e.g., `useDashboardMetrics`) to fetch data from `GET /api/dashboard/metrics`.
2.  **BE (`routes.ts`)**: `GET /api/dashboard/metrics` endpoint is hit.
3.  **BE (`storage.ts`)**: `getDashboardMetrics(userId)` executes:
    -   Fetches user's campaigns.
    -   Queries `patrons` table for current active patron count and sum of `currentlyEntitledAmountCents`.
    -   Queries `revenueData` table for historical patron counts and pledge sums (last 30 days vs. 30-60 days ago) to calculate percentage changes.
    -   Counts new patrons from `patrons` table (pledge start in last 30 days).
    -   Returns the aggregated metrics.
4.  **BE**: Sends metrics as JSON response.
5.  **FE**: `useQuery` receives data, component re-renders to display metrics.

### 7.3. Patreon Webhook: New Pledge

1.  **Patreon**: A user pledges to a connected campaign. Patreon sends a webhook (e.g., `members:pledge:create`) to `POST /api/webhooks/patreon`.
2.  **BE (`webhookHandler.ts`)**:
    -   Receives the webhook.
    -   Validates signature using the campaign's stored webhook secret (fetched from `storage`).
    -   Calls `processWebhookEvent()`, which routes to `processMemberEvent()`.
3.  **BE (`webhookHandler.ts` - `processMemberEvent`)**:
    -   Parses payload for member and user data.
    -   Calls `storage.upsertPatron()` to add/update the patron in the local database.
    -   Calls `updateCampaignStatsFromWebhook()` which calls `storage.getCampaignStats()` and then `storage.updateCampaign()` to refresh aggregate counts on the campaign.
4.  **FE**: (If dashboard is open and polls for data or uses a real-time update mechanism like websockets - not explicitly shown but possible extension) data would refresh. Otherwise, next load of dashboard/patron data reflects the change.

## 8. Adherence to PRD - Important Notes

-   **Beautiful Dark Mode Interface (Shadcn "Rose" theme)**: Implemented with `ThemeProvider` and Shadcn components.
-   **Consistent Styling**: Tailwind CSS and Shadcn promote consistency.
-   **Framer Motion Animations**: Used in `Landing.tsx` and `ConnectPatreonModal.tsx`. Likely used elsewhere.
-   **Patreon API Deep Dive**: `patreonApi.ts` demonstrates extensive use of Patreon API v2, including field selection, includes, pagination, and token refresh.
-   **Real-time Data**: Achieved through a combination of:
    -   Initial full sync upon campaign connection (`syncService.ts`).
    -   Webhook processing for immediate updates on supported Patreon events (`webhookHandler.ts`).
    -   The PRD's desire for updates "each time the user logs into their account and loads the app/page" is supported by these, with explicit on-load/login syncs being a straightforward enhancement if deemed necessary for full reconciliation beyond webhook events.
    -   **Documentation**: This document itself.

## 9. Potential Areas for Further Development/Clarification

The following areas were identified for potential future enhancements or closer review. Several of these have been addressed or significantly improved:

-   **Incremental Sync Logic**: The `syncService` mentions `incremental` sync type. While webhooks provide incremental updates for specific events, the current `performSync` logic for `incremental` or `full` syncs of paged collections (like members, posts) may still perform a full refresh of those collections rather than fetching only new/changed records since a specific timestamp via dedicated API parameters (if available). True delta-based incremental syncs for all data types would be a significant optimization.
-   **Error Handling and Resilience**: While basic error handling is present, comprehensive strategies for API rate limits (beyond initial detection in `patreonApi.ts`), failed sync retries with backoff, and user notifications for persistent data issues would be important for production robustness.
-   **Security Specifics**:
    -   CSRF protection for POST/PUT/DELETE routes should be reviewed, especially if session cookies are the primary mechanism for API authentication by the frontend.
    -   **Input Validation**: **(Partially Addressed)** `Zod` is imported in `server/routes.ts`. A validation middleware (`validateRequest`) has been implemented and applied to several key API endpoints (e.g., `/api/sync/start`, `/api/patrons`, `/api/webhooks/:campaignId`, `/api/dashboard/metrics`, `/api/dashboard/revenue-data`, `/api/posts`, `/api/campaigns/:campaignId`, `/api/sync/status/:syncId`) for their request bodies, query parameters, and route parameters. This is a critical security and data integrity measure that should be systematically extended to all remaining API endpoints.
-   **Scalability**: For many users and campaigns, background job processing for `syncService` might need a more robust queueing system (e.g., Redis-based like BullMQ) than the current in-memory `activeSyncs` map, especially if the server can restart.
-   **Patreon API Token Refresh**: **(Addressed)** The concern that most individual data-fetching methods in `patreonApi.ts` did not automatically refresh tokens has been resolved. The `PatreonAPI` class in `server/patreonApi.ts` was refactored to ensure all public data-fetching methods utilize a centralized `makeRequestWithTokenRefresh` method. This method, when provided with a `refreshToken` and an `onTokenRefresh` callback, automatically handles token expiration and retries the request with a new token. The `syncService.ts` and `patreonAuth.ts` (during initial OAuth callback) have been updated to leverage this, passing the necessary refresh tokens and callbacks to ensure robust token handling across API interactions.
-   **Dashboard Metrics Granularity & Scope**: **(Partially Addressed)**
    -   Implementing "Traffic stats" and aggregated "post performance data" as distinct dashboard widgets if these are desired beyond the current revenue/patron metrics remains a potential enhancement.
    -   Adding "daily" and "weekly" change indicators for dashboard metrics would require more frequent `revenueData` snapshots and adjusted calculation logic.
    -   The `getDashboardMetrics` method in `server/storage.ts` (and its corresponding API route `GET /api/dashboard/metrics`) has been updated to accept an optional `campaignId`. This allows fetching metrics for a specific campaign, rather than only combined aggregates. The calculation for `newPatronChange` has also been implemented. The `IStorage` interface requires manual updating to reflect the signature change in `getDashboardMetrics`.
-   **Syncing More Patreon Data Types**: The `syncService.ts` currently syncs core entities (campaign details, patrons, posts, tiers, goals, benefits). It could be expanded to include other data types that `patreonApi.ts` can fetch (e.g., deliverables, detailed pledge history for members) if these become necessary for new features.
-   **"Settings" page functionality**: Currently placeholders in `routes.ts`.
-   **"Connected Pages" page functionality**: Routes and storage exist, UI would use them.
-   **Real-time frontend updates**: While the backend processes webhooks for near real-time data updates in the database, the frontend might still rely on polling or re-fetching on navigation/interaction to display the absolute latest data. For a more seamless real-time experience on the UI itself (e.g., dashboard numbers changing live without a refresh), integrating WebSockets could be considered.

## 10. Conclusion

The Patreonizer application demonstrates a well-structured and robust architecture for meeting the core requirements of the PRD. It effectively uses modern technologies and best practices for both frontend and backend development. The data model and synchronization mechanisms are comprehensive, providing a solid foundation for the application's features. The clear separation of concerns (API interaction, data storage, authentication, business logic) will aid in future maintenance and development. Addressing the areas noted for further development will enhance its security, resilience, and feature completeness. 