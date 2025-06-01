import {
  users,
  patreonAccounts,
  campaigns,
  campaignTiers,
  patrons,
  pledges,
  posts,
  revenueSnapshots,
  syncLogs,
  type User,
  type UpsertUser,
  type PatreonAccount,
  type InsertPatreonAccount,
  type Campaign,
  type InsertCampaign,
  type CampaignTier,
  type Patron,
  type InsertPatron,
  type Pledge,
  type InsertPledge,
  type Post,
  type RevenueSnapshot,
  type SyncLog,
  type InsertSyncLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Patreon account operations
  createPatreonAccount(account: InsertPatreonAccount): Promise<PatreonAccount>;
  getPatreonAccountsByUserId(userId: string): Promise<PatreonAccount[]>;
  getPatreonAccount(id: number): Promise<PatreonAccount | undefined>;
  updatePatreonAccount(id: number, updates: Partial<InsertPatreonAccount>): Promise<PatreonAccount>;
  deletePatreonAccount(id: number): Promise<void>;

  // Campaign operations
  upsertCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getCampaignsByAccountId(accountId: number): Promise<Campaign[]>;
  getCampaignByPatreonId(patreonCampaignId: string): Promise<Campaign | undefined>;

  // Campaign tier operations
  upsertCampaignTier(tier: Omit<CampaignTier, 'id' | 'createdAt' | 'updatedAt'>): Promise<CampaignTier>;
  getTiersByCampaignId(campaignId: number): Promise<CampaignTier[]>;

  // Patron operations
  upsertPatron(patron: InsertPatron): Promise<Patron>;
  getPatronsByAccountId(accountId: number): Promise<Patron[]>;
  getPatronByPatreonId(patreonUserId: string, accountId: number): Promise<Patron | undefined>;

  // Pledge operations
  upsertPledge(pledge: InsertPledge): Promise<Pledge>;
  getPledgesByCampaignId(campaignId: number): Promise<Pledge[]>;
  getActivePledgesByAccountId(accountId: number): Promise<(Pledge & { patron: Patron; campaign: Campaign; tier?: CampaignTier })[]>;

  // Post operations
  upsertPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post>;
  getPostsByCampaignId(campaignId: number): Promise<Post[]>;

  // Revenue snapshot operations
  createRevenueSnapshot(snapshot: Omit<RevenueSnapshot, 'id' | 'createdAt'>): Promise<RevenueSnapshot>;
  getRevenueSnapshots(campaignId: number, startDate?: Date, endDate?: Date): Promise<RevenueSnapshot[]>;

  // Analytics operations
  getDashboardMetrics(userId: string): Promise<{
    totalRevenue: string;
    totalPatrons: number;
    totalCampaigns: number;
    avgPledgeAmount: string;
    revenueGrowth: number;
    patronGrowth: number;
  }>;

  getRecentActivity(userId: string, limit?: number): Promise<{
    type: string;
    description: string;
    timestamp: Date;
    campaignName: string;
    patronName?: string;
    amount?: string;
  }[]>;

  // Sync operations
  createSyncLog(log: InsertSyncLog): Promise<SyncLog>;
  updateSyncLog(id: number, updates: Partial<SyncLog>): Promise<SyncLog>;
  getLatestSyncLogs(accountId: number, limit?: number): Promise<SyncLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Patreon account operations
  async createPatreonAccount(account: InsertPatreonAccount): Promise<PatreonAccount> {
    const [newAccount] = await db
      .insert(patreonAccounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async getPatreonAccountsByUserId(userId: string): Promise<PatreonAccount[]> {
    return await db
      .select()
      .from(patreonAccounts)
      .where(and(eq(patreonAccounts.userId, userId), eq(patreonAccounts.isActive, true)));
  }

  async getPatreonAccount(id: number): Promise<PatreonAccount | undefined> {
    const [account] = await db
      .select()
      .from(patreonAccounts)
      .where(eq(patreonAccounts.id, id));
    return account;
  }

  async updatePatreonAccount(id: number, updates: Partial<InsertPatreonAccount>): Promise<PatreonAccount> {
    const [account] = await db
      .update(patreonAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(patreonAccounts.id, id))
      .returning();
    return account;
  }

  async deletePatreonAccount(id: number): Promise<void> {
    await db
      .update(patreonAccounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(patreonAccounts.id, id));
  }

  // Campaign operations
  async upsertCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [existingCampaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.patreonCampaignId, campaign.patreonCampaignId));

    if (existingCampaign) {
      const [updatedCampaign] = await db
        .update(campaigns)
        .set({ ...campaign, updatedAt: new Date() })
        .where(eq(campaigns.id, existingCampaign.id))
        .returning();
      return updatedCampaign;
    } else {
      const [newCampaign] = await db
        .insert(campaigns)
        .values(campaign)
        .returning();
      return newCampaign;
    }
  }

  async getCampaignsByAccountId(accountId: number): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.patreonAccountId, accountId));
  }

  async getCampaignByPatreonId(patreonCampaignId: string): Promise<Campaign | undefined> {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.patreonCampaignId, patreonCampaignId));
    return campaign;
  }

  // Campaign tier operations
  async upsertCampaignTier(tier: Omit<CampaignTier, 'id' | 'createdAt' | 'updatedAt'>): Promise<CampaignTier> {
    const [existingTier] = await db
      .select()
      .from(campaignTiers)
      .where(eq(campaignTiers.patreonTierId, tier.patreonTierId));

    if (existingTier) {
      const [updatedTier] = await db
        .update(campaignTiers)
        .set({ ...tier, updatedAt: new Date() })
        .where(eq(campaignTiers.id, existingTier.id))
        .returning();
      return updatedTier;
    } else {
      const [newTier] = await db
        .insert(campaignTiers)
        .values(tier)
        .returning();
      return newTier;
    }
  }

  async getTiersByCampaignId(campaignId: number): Promise<CampaignTier[]> {
    return await db
      .select()
      .from(campaignTiers)
      .where(eq(campaignTiers.campaignId, campaignId));
  }

  // Patron operations
  async upsertPatron(patron: InsertPatron): Promise<Patron> {
    const [existingPatron] = await db
      .select()
      .from(patrons)
      .where(
        and(
          eq(patrons.patreonUserId, patron.patreonUserId),
          eq(patrons.patreonAccountId, patron.patreonAccountId)
        )
      );

    if (existingPatron) {
      const [updatedPatron] = await db
        .update(patrons)
        .set({ ...patron, updatedAt: new Date() })
        .where(eq(patrons.id, existingPatron.id))
        .returning();
      return updatedPatron;
    } else {
      const [newPatron] = await db
        .insert(patrons)
        .values(patron)
        .returning();
      return newPatron;
    }
  }

  async getPatronsByAccountId(accountId: number): Promise<Patron[]> {
    return await db
      .select()
      .from(patrons)
      .where(eq(patrons.patreonAccountId, accountId));
  }

  async getPatronByPatreonId(patreonUserId: string, accountId: number): Promise<Patron | undefined> {
    const [patron] = await db
      .select()
      .from(patrons)
      .where(
        and(
          eq(patrons.patreonUserId, patreonUserId),
          eq(patrons.patreonAccountId, accountId)
        )
      );
    return patron;
  }

  // Pledge operations
  async upsertPledge(pledge: InsertPledge): Promise<Pledge> {
    const [existingPledge] = await db
      .select()
      .from(pledges)
      .where(eq(pledges.patreonPledgeId, pledge.patreonPledgeId));

    if (existingPledge) {
      const [updatedPledge] = await db
        .update(pledges)
        .set({ ...pledge, updatedAt: new Date() })
        .where(eq(pledges.id, existingPledge.id))
        .returning();
      return updatedPledge;
    } else {
      const [newPledge] = await db
        .insert(pledges)
        .values(pledge)
        .returning();
      return newPledge;
    }
  }

  async getPledgesByCampaignId(campaignId: number): Promise<Pledge[]> {
    return await db
      .select()
      .from(pledges)
      .where(eq(pledges.campaignId, campaignId));
  }

  async getActivePledgesByAccountId(accountId: number): Promise<(Pledge & { patron: Patron; campaign: Campaign; tier?: CampaignTier })[]> {
    const result = await db
      .select({
        pledge: pledges,
        patron: patrons,
        campaign: campaigns,
        tier: campaignTiers,
      })
      .from(pledges)
      .innerJoin(patrons, eq(pledges.patronId, patrons.id))
      .innerJoin(campaigns, eq(pledges.campaignId, campaigns.id))
      .leftJoin(campaignTiers, eq(pledges.tierId, campaignTiers.id))
      .where(
        and(
          eq(campaigns.patreonAccountId, accountId),
          eq(pledges.status, 'active_patron')
        )
      );

    return result.map(row => ({
      ...row.pledge,
      patron: row.patron,
      campaign: row.campaign,
      tier: row.tier || undefined,
    }));
  }

  // Post operations
  async upsertPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.patreonPostId, post.patreonPostId));

    if (existingPost) {
      const [updatedPost] = await db
        .update(posts)
        .set({ ...post, updatedAt: new Date() })
        .where(eq(posts.id, existingPost.id))
        .returning();
      return updatedPost;
    } else {
      const [newPost] = await db
        .insert(posts)
        .values(post)
        .returning();
      return newPost;
    }
  }

  async getPostsByCampaignId(campaignId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.campaignId, campaignId))
      .orderBy(desc(posts.publishedAt));
  }

  // Revenue snapshot operations
  async createRevenueSnapshot(snapshot: Omit<RevenueSnapshot, 'id' | 'createdAt'>): Promise<RevenueSnapshot> {
    const [newSnapshot] = await db
      .insert(revenueSnapshots)
      .values(snapshot)
      .returning();
    return newSnapshot;
  }

  async getRevenueSnapshots(campaignId: number, startDate?: Date, endDate?: Date): Promise<RevenueSnapshot[]> {
    let query = db
      .select()
      .from(revenueSnapshots)
      .where(eq(revenueSnapshots.campaignId, campaignId));

    if (startDate) {
      query = query.where(gte(revenueSnapshots.snapshotDate, startDate));
    }
    if (endDate) {
      query = query.where(lte(revenueSnapshots.snapshotDate, endDate));
    }

    return await query.orderBy(desc(revenueSnapshots.snapshotDate));
  }

  // Analytics operations
  async getDashboardMetrics(userId: string): Promise<{
    totalRevenue: string;
    totalPatrons: number;
    totalCampaigns: number;
    avgPledgeAmount: string;
    revenueGrowth: number;
    patronGrowth: number;
  }> {
    // Get user's patreon accounts
    const userAccounts = await db
      .select({ id: patreonAccounts.id })
      .from(patreonAccounts)
      .where(and(eq(patreonAccounts.userId, userId), eq(patreonAccounts.isActive, true)));

    const accountIds = userAccounts.map(acc => acc.id);

    if (accountIds.length === 0) {
      return {
        totalRevenue: "0",
        totalPatrons: 0,
        totalCampaigns: 0,
        avgPledgeAmount: "0",
        revenueGrowth: 0,
        patronGrowth: 0,
      };
    }

    // Get current metrics
    const campaignStats = await db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(${campaigns.pledgeSum}), 0)`,
        totalPatrons: sql<number>`COALESCE(SUM(${campaigns.patronCount}), 0)`,
        totalCampaigns: sql<number>`COUNT(${campaigns.id})`,
      })
      .from(campaigns)
      .where(sql`${campaigns.patreonAccountId} IN (${sql.join(accountIds, sql`, `)})`);

    const currentStats = campaignStats[0] || {
      totalRevenue: "0",
      totalPatrons: 0,
      totalCampaigns: 0,
    };

    // Calculate average pledge amount
    const avgPledgeAmount = currentStats.totalPatrons > 0 
      ? (parseFloat(currentStats.totalRevenue) / currentStats.totalPatrons).toFixed(2)
      : "0";

    // Get growth metrics (comparing last 30 days to previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // For now, return placeholder growth values since we need more complex date-based calculations
    return {
      totalRevenue: currentStats.totalRevenue,
      totalPatrons: currentStats.totalPatrons,
      totalCampaigns: currentStats.totalCampaigns,
      avgPledgeAmount,
      revenueGrowth: 0, // TODO: Implement proper growth calculation
      patronGrowth: 0,  // TODO: Implement proper growth calculation
    };
  }

  async getRecentActivity(userId: string, limit: number = 10): Promise<{
    type: string;
    description: string;
    timestamp: Date;
    campaignName: string;
    patronName?: string;
    amount?: string;
  }[]> {
    // Get user's patreon accounts
    const userAccounts = await db
      .select({ id: patreonAccounts.id })
      .from(patreonAccounts)
      .where(and(eq(patreonAccounts.userId, userId), eq(patreonAccounts.isActive, true)));

    const accountIds = userAccounts.map(acc => acc.id);

    if (accountIds.length === 0) {
      return [];
    }

    // Get recent pledges (new patrons, upgrades, etc.)
    const recentPledges = await db
      .select({
        type: sql<string>`'pledge'`,
        timestamp: pledges.createdAt,
        campaignName: campaigns.name,
        patronName: sql<string>`COALESCE(${patrons.fullName}, CONCAT(${patrons.firstName}, ' ', ${patrons.lastName}))`,
        amount: pledges.amount,
        status: pledges.status,
      })
      .from(pledges)
      .innerJoin(campaigns, eq(pledges.campaignId, campaigns.id))
      .innerJoin(patrons, eq(pledges.patronId, patrons.id))
      .where(sql`${campaigns.patreonAccountId} IN (${sql.join(accountIds, sql`, `)})`)
      .orderBy(desc(pledges.createdAt))
      .limit(limit);

    // Get recent posts
    const recentPosts = await db
      .select({
        type: sql<string>`'post'`,
        timestamp: posts.publishedAt,
        campaignName: campaigns.name,
        title: posts.title,
        likeCount: posts.likeCount,
      })
      .from(posts)
      .innerJoin(campaigns, eq(posts.campaignId, campaigns.id))
      .where(sql`${campaigns.patreonAccountId} IN (${sql.join(accountIds, sql`, `)})`)
      .orderBy(desc(posts.publishedAt))
      .limit(limit);

    // Combine and format activities
    const activities: {
      type: string;
      description: string;
      timestamp: Date;
      campaignName: string;
      patronName?: string;
      amount?: string;
    }[] = [];

    // Add pledge activities
    recentPledges.forEach(pledge => {
      if (!pledge.timestamp) return;
      
      let description = "";
      if (pledge.status === "active_patron") {
        description = `${pledge.patronName} became a patron`;
      } else if (pledge.status === "former_patron") {
        description = `${pledge.patronName} cancelled their pledge`;
      } else {
        description = `${pledge.patronName} updated their pledge`;
      }

      activities.push({
        type: "patron",
        description,
        timestamp: pledge.timestamp,
        campaignName: pledge.campaignName,
        patronName: pledge.patronName || undefined,
        amount: pledge.amount ? `$${pledge.amount}` : undefined,
      });
    });

    // Add post activities
    recentPosts.forEach(post => {
      if (!post.timestamp) return;
      
      activities.push({
        type: "post",
        description: `New post published: "${post.title}"`,
        timestamp: post.timestamp,
        campaignName: post.campaignName,
      });
    });

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Sync operations
  async createSyncLog(log: InsertSyncLog): Promise<SyncLog> {
    const [newLog] = await db
      .insert(syncLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async updateSyncLog(id: number, updates: Partial<SyncLog>): Promise<SyncLog> {
    const [updatedLog] = await db
      .update(syncLogs)
      .set(updates)
      .where(eq(syncLogs.id, id))
      .returning();
    return updatedLog;
  }

  async getLatestSyncLogs(accountId: number, limit: number = 5): Promise<SyncLog[]> {
    return await db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.patreonAccountId, accountId))
      .orderBy(desc(syncLogs.startedAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
