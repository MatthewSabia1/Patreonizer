# Patreonizer

A comprehensive Patreon creator analytics platform that helps creators who own and manage multiple Patreon pages view, track, and sync revenue and patron analytics across all their campaigns.

## Features

- **Multi-Campaign Management**: Connect and manage multiple Patreon campaigns from a single dashboard
- **Real-time Data Sync**: Automatic synchronization with Patreon API 2.0 to keep data up-to-date
- **Revenue Analytics**: Track monthly revenue, patron growth, and performance trends
- **Patron Management**: Detailed patron information with export capabilities
- **Dashboard Overview**: Beautiful visualizations of key metrics and performance indicators
- **Secure Authentication**: OAuth 2.0 integration with both Replit Auth and Patreon
- **Data Export**: CSV export functionality for patron and revenue data
- **Dark Mode Interface**: Orange-themed dark mode design with smooth animations

## Tech Stack

### Frontend
- **React** with TypeScript
- **Shadcn UI** components with Orange theme
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for data fetching
- **Wouter** for routing
- **Recharts** for data visualization

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database with Drizzle ORM
- **Passport.js** for authentication
- **Patreon API 2.0** integration
- **Node.js** with modern ES modules

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Patreon OAuth application credentials
- Replit environment (recommended)

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Replit Auth (automatically provided in Replit)
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.replit.dev
SESSION_SECRET=your-session-secret

# Patreon OAuth
PATREON_CLIENT_ID=your-patreon-client-id
PATREON_CLIENT_SECRET=your-patreon-client-secret
