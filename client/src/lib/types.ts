// Common types for the Patreonizer application
export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatreonCampaign {
  id: number;
  userId: string;
  patreonCampaignId: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  vanityUrl: string | null;
  patronCount: number;
  pledgeSum: string;
  actualMonthlyRevenue?: number;
  actualPatronCount?: number;
  isActive: boolean;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Patron {
  id: number;
  campaignId: number;
  patreonUserId: string;
  email: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  thumbUrl: string | null;
  url: string | null;
  isFollower: boolean;
  pledgeRelationshipStart: string | null;
  lifetimeSupportCents: number;
  currentlyEntitledAmountCents: number;
  patronStatus: string | null;
  lastChargeDate: string | null;
  lastChargeStatus: string | null;
  willPayAmountCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: number;
  campaignId: number;
  patreonPostId: string;
  title: string | null;
  content: string | null;
  url: string | null;
  embedData: any;
  embedUrl: string | null;
  imageUrl: string | null;
  isPublic: boolean;
  isPaid: boolean;
  publishedAt: string | null;
  editedAt: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncStatus {
  id: number;
  campaignId: number;
  syncType: string;
  status: string;
  progress: number;
  totalItems: number;
  processedItems: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface RevenueData {
  id: number;
  campaignId: number;
  date: string;
  patronCount: number;
  pledgeSum: string;
  newPatrons: number;
  lostPatrons: number;
  createdAt: string;
}

export interface DashboardMetrics {
  monthlyRevenue: number;
  revenueChange: number;
  totalPatrons: number;
  patronChange: number;
  avgPerPatron: number;
  avgChange: number;
  newPatrons: number;
  newPatronChange: number;
}

export interface ActivityItem {
  id: string;
  type: 'new_patron' | 'tier_upgrade' | 'new_post' | 'new_comments' | 'patron_left';
  title: string;
  description: string;
  timestamp: string;
  campaignId?: number;
  patronId?: number;
  postId?: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PatronsResponse {
  patrons: Patron[];
  total: number;
}

export interface PostsResponse {
  posts: Post[];
  total: number;
}

// Form types
export interface ConnectPatreonForm {
  campaignId?: string;
}

export interface ExportDataForm {
  campaignId?: string;
  format: 'csv' | 'json';
  dateRange?: {
    start: string;
    end: string;
  };
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  revenue: number;
  patrons: number;
  newPatrons?: number;
  lostPatrons?: number;
}

export interface CampaignPerformance {
  campaignId: number;
  title: string;
  revenue: number;
  patrons: number;
  revenueGrowth: number;
  patronGrowth: number;
  avgPerPatron: number;
}

// Filter types
export interface PatronFilters {
  campaignId?: string;
  status?: string;
  search?: string;
  tier?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface PostFilters {
  campaignId?: string;
  isPublic?: boolean;
  isPaid?: boolean;
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Navigation types
export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

// Error types
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

export interface FormError {
  field: string;
  message: string;
}

// Patreon API types (simplified)
export interface PatreonUser {
  id: string;
  attributes: {
    email?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    image_url?: string;
    thumb_url?: string;
    url?: string;
    is_follower?: boolean;
  };
}

export interface PatreonCampaignData {
  id: string;
  attributes: {
    creation_name?: string;
    summary?: string;
    image_url?: string;
    vanity?: string;
    patron_count?: number;
    pledge_sum?: number;
    published_at?: string;
    is_monthly?: boolean;
    is_charged_immediately?: boolean;
  };
}

export interface PatreonMember {
  id: string;
  attributes: {
    full_name?: string;
    email?: string;
    patron_status?: string;
    pledge_relationship_start?: string;
    lifetime_support_cents?: number;
    currently_entitled_amount_cents?: number;
    last_charge_date?: string;
    last_charge_status?: string;
    will_pay_amount_cents?: number;
  };
  relationships?: {
    user?: {
      data?: {
        id: string;
      };
    };
  };
}

export interface PatreonPost {
  id: string;
  attributes: {
    title?: string;
    content?: string;
    url?: string;
    embed_data?: any;
    embed_url?: string;
    image?: {
      url?: string;
      large_url?: string;
    };
    is_public?: boolean;
    is_paid?: boolean;
    published_at?: string;
    edited_at?: string;
    like_count?: number;
    comment_count?: number;
  };
}
