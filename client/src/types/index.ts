export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatreonAccount {
  id: number;
  userId: string;
  patreonUserId: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  accountName: string;
  accountUrl: string | null;
  accountImageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: number;
  patreonAccountId: number;
  patreonCampaignId: string;
  name: string;
  summary: string | null;
  creationName: string | null;
  vanityUrl: string | null;
  imageUrl: string | null;
  isNsfw: boolean;
  isMonthly: boolean;
  patronCount: number;
  pledgeSum: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  accountName?: string;
}

export interface CampaignTier {
  id: number;
  campaignId: number;
  patreonTierId: string;
  title: string;
  description: string | null;
  amount: string;
  currency: string;
  patronCount: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patron {
  id: number;
  patreonAccountId: number;
  patreonUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pledge {
  id: number;
  campaignId: number;
  patronId: number;
  tierId: number | null;
  patreonPledgeId: string;
  amount: string;
  currency: string;
  status: string;
  pledgeCapReached: boolean;
  patronPaysFees: boolean;
  declineCount: number;
  totalHistoricalAmount: string;
  pledgeStartDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: number;
  campaignId: number;
  patreonPostId: string;
  title: string | null;
  content: string | null;
  isPublic: boolean;
  isPaid: boolean;
  likeCount: number;
  commentCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RevenueSnapshot {
  id: number;
  campaignId: number;
  snapshotDate: Date;
  totalRevenue: string;
  patronCount: number;
  newPatrons: number;
  lostPatrons: number;
  createdAt: Date;
}

export interface SyncLog {
  id: number;
  patreonAccountId: number;
  syncType: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
  recordsProcessed: number;
  createdAt: Date;
}

export interface DashboardMetrics {
  totalRevenue: string;
  totalPatrons: number;
  totalCampaigns: number;
  avgPledgeAmount: string;
  revenueGrowth: number;
  patronGrowth: number;
}

export interface RecentActivity {
  type: string;
  description: string;
  timestamp: Date;
  campaignName: string;
  patronName?: string;
  amount?: string;
}

export interface PatronData {
  id: number;
  name: string;
  email: string | null;
  imageUrl: string | null;
  campaignName: string;
  campaignId: number;
  tierName: string;
  amount: string;
  currency: string;
  status: string;
  pledgeStartDate: Date | null;
  totalHistoricalAmount: string;
}

export interface PatronDataResponse {
  data: PatronData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SyncStatus {
  accountId: number;
  accountName: string;
  status: string;
  lastSync: Date | null;
  recordsProcessed: number;
  errorMessage: string | null;
}
