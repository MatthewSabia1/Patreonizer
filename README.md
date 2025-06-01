# Patreonizer

A comprehensive analytics platform for Patreon creators to manage multiple campaigns, track revenue growth, and understand their audience better.

## Features

### Core Functionality
- **Multi-Account Management**: Connect and manage multiple Patreon creator accounts from one dashboard
- **Real-time Data Sync**: Automatic synchronization with Patreon API 2.0 for up-to-date analytics
- **Comprehensive Analytics**: Track revenue, patron growth, engagement metrics, and campaign performance
- **Patron Management**: Detailed patron information with search, filtering, and export capabilities
- **Revenue Tracking**: Monitor monthly revenue trends with historical data and growth indicators

### Technical Features
- **Secure Authentication**: Replit Auth 2.0 integration with automatic session management
- **OAuth Integration**: Secure Patreon OAuth 2.0 flow for account connection
- **Database Storage**: PostgreSQL with Drizzle ORM for efficient data management
- **Real-time Updates**: Background sync processes with progress tracking
- **Data Export**: CSV export functionality for external analysis
- **Responsive Design**: Mobile-friendly interface with dark mode support

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **TanStack Query** for data fetching and caching
- **Shadcn/ui** components with Orange theme
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for data visualization

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** with PostgreSQL
- **Passport.js** for authentication
- **OpenID Connect** for Replit Auth
- **Patreon API 2.0** integration
- **Background sync services**

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Replit Auth configuration
- Patreon OAuth app credentials

### Environment Variables
```env
DATABASE_URL=postgresql://...
SESSION_SECRET=your-session-secret
REPLIT_DOMAINS=your-domain.com
PATREON_CLIENT_ID=your-patreon-client-id
PATREON_CLIENT_SECRET=your-patreon-client-secret
