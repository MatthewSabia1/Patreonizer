import {
  users,
  patreonCampaigns,
  patrons,
  posts,
  syncStatus,
  revenueData,
  campaignTiers,
  campaignGoals,
  benefits,
  addresses,
  webhooks,
  type User,
  type UpsertUser,
  type InsertPatreonCampaign,
  type PatreonCampaign,
  type InsertPatron,
  type Patron,
  type InsertPost,
  type Post,
  type InsertSyncStatus,
  type SyncStatus,
  type InsertRevenueData,
  type RevenueData,
  type InsertCampaignTier,
  type CampaignTier,
  type InsertCampaignGoal,
  type CampaignGoal,
  type InsertBenefit,
  type Benefit,
  type InsertAddress,
  type Address,
  type InsertWebhook,
  type Webhook,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte, like, or, inArray, type SQL } from "drizzle-orm";
import { format } from "date-fns";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Campaign operations
  getUserCampaigns(userId: string): Promise<PatreonCampaign[]>;
  getCampaignById(campaignId: number): Promise<PatreonCampaign | undefined>;
  getCampaignByPatreonId(patreonCampaignId: string): Promise<PatreonCampaign | undefined>;
  createCampaign(campaign: InsertPatreonCampaign): Promise<PatreonCampaign>;
  updateCampaign(campaignId: number, updates: Partial<InsertPatreonCampaign>): Promise<void>;
  deleteCampaign(campaignId: number): Promise<void>;
  getCampaignStats(campaignId: number): Promise<{ patronCount: number; totalPledgeSum: number }>;

  // Patron operations
  getPatrons(userId: string, campaignId?: string, page?: number, limit?: number, search?: string): Promise<{ patrons: Patron[]; total: number }>;
  upsertPatron(patron: InsertPatron): Promise<Patron>;
  exportPatronsCSV(userId: string, campaignId?: string): Promise<string>;

  // Post operations
  getPosts(userId: string, campaignId?: string, page?: number, limit?: number, search?: string, postType?: string): Promise<{ posts: any[]; total: number }>;
  upsertPost(post: InsertPost): Promise<Post>;

  // Sync operations
  createSyncStatus(sync: InsertSyncStatus): Promise<SyncStatus>;
  updateSyncStatus(syncId: number, updates: Partial<InsertSyncStatus>): Promise<void>;
  getSyncStatus(syncId: number): Promise<SyncStatus | undefined>;
  getActiveSyncs(userId: string): Promise<SyncStatus[]>;

  // Revenue data operations
  upsertRevenueData(revenue: InsertRevenueData): Promise<RevenueData>;
  getRevenueData(userId: string, days: number, campaignId?: string): Promise<RevenueData[]>;

  // Campaign tier operations
  upsertCampaignTier(tier: InsertCampaignTier): Promise<CampaignTier>;
  getCampaignTiers(campaignId: number): Promise<CampaignTier[]>;

  // Campaign goal operations
  upsertCampaignGoal(goal: InsertCampaignGoal): Promise<CampaignGoal>;
  getCampaignGoals(campaignId: number): Promise<CampaignGoal[]>;

  // Benefit operations
  upsertBenefit(benefit: InsertBenefit): Promise<Benefit>;
  getCampaignBenefits(campaignId: number): Promise<Benefit[]>;

  // Address operations
  upsertAddress(address: InsertAddress): Promise<Address>;
  getPatronAddresses(patronId: number): Promise<Address[]>;

  // Webhook operations
  upsertWebhook(webhook: InsertWebhook): Promise<Webhook>;
  getCampaignWebhooks(campaignId: number): Promise<Webhook[]>;
  getWebhookById(webhookId: number): Promise<Webhook | undefined>;
  deleteWebhook(webhookId: number): Promise<void>;

  // Dashboard operations
  getDashboardMetrics(userId: string): Promise<{
    monthlyRevenue: number;
    revenueChange: number;
    totalPatrons: number;
    patronChange: number;
    avgPerPatron: number;
    avgChange: number;
    newPatrons: number;
    newPatronChange: number;
  }>;
  getRecentActivity(userId: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
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

  // Campaign operations
  async getUserCampaigns(userId: string): Promise<PatreonCampaign[]> {
    return await db
      .select()
      .from(patreonCampaigns)
      .where(eq(patreonCampaigns.userId, userId))
      .orderBy(desc(patreonCampaigns.createdAt));
  }

  async getCampaignById(campaignId: number): Promise<PatreonCampaign | undefined> {
    const [campaign] = await db
      .select()
      .from(patreonCampaigns)
      .where(eq(patreonCampaigns.id, campaignId));
    return campaign;
  }

  async getCampaignByPatreonId(patreonCampaignId: string): Promise<PatreonCampaign | undefined> {
    const [campaign] = await db
      .select()
      .from(patreonCampaigns)
      .where(eq(patreonCampaigns.patreonCampaignId, patreonCampaignId));
    return campaign;
  }

  async createCampaign(campaign: InsertPatreonCampaign): Promise<PatreonCampaign> {
    const [newCampaign] = await db
      .insert(patreonCampaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateCampaign(campaignId: number, updates: Partial<InsertPatreonCampaign>): Promise<void> {
    await db
      .update(patreonCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(patreonCampaigns.id, campaignId));
  }

  async deleteCampaign(campaignId: number): Promise<void> {
    await db.delete(patreonCampaigns).where(eq(patreonCampaigns.id, campaignId));
  }

  async getCampaignStats(campaignId: number): Promise<{ patronCount: number; totalPledgeSum: number }> {
    const [stats] = await db
      .select({
        patronCount: sql<number>`count(case when ${patrons.patronStatus} = 'active_patron' then 1 end)`,
        totalPledgeSum: sql<number>`sum(case when ${patrons.patronStatus} = 'active_patron' then ${patrons.currentlyEntitledAmountCents} else 0 end) / 100`,
      })
      .from(patrons)
      .where(eq(patrons.campaignId, campaignId));

    return {
      patronCount: stats?.patronCount || 0,
      totalPledgeSum: stats?.totalPledgeSum || 0,
    };
  }

  // Patron operations
  async getPatrons(
    userId: string,
    campaignId?: string,
    page: number = 1,
    limit: number = 50,
    search: string = ""
  ): Promise<{ patrons: Patron[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get user's campaign IDs
    const userCampaigns = await db
      .select({ id: patreonCampaigns.id })
      .from(patreonCampaigns)
      .where(eq(patreonCampaigns.userId, userId));

    const campaignIds = userCampaigns.map(c => c.id);

    if (campaignIds.length === 0) {
      return { patrons: [], total: 0 };
    }

    let whereConditions: SQL<unknown> = inArray(patrons.campaignId, campaignIds);

    if (campaignId && campaignId !== "all") {
      const additionalCondition = eq(patrons.campaignId, parseInt(campaignId));
      const result = and(whereConditions, additionalCondition);
      if (result) whereConditions = result;
    }

    if (search) {
      const searchCondition = or(
        like(patrons.fullName, `%${search}%`),
        like(patrons.email, `%${search}%`)
      );
      const result = and(whereConditions, searchCondition);
      if (result) whereConditions = result;
    }

    const [patronsList, [{ total }]] = await Promise.all([
      db
        .select()
        .from(patrons)
        .where(whereConditions)
        .orderBy(desc(patrons.pledgeRelationshipStart))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)` })
        .from(patrons)
        .where(whereConditions),
    ]);

    return {
      patrons: patronsList,
      total: total || 0,
    };
  }

  async upsertPatron(patron: InsertPatron): Promise<Patron> {
    const [existingPatron] = await db
      .select()
      .from(patrons)
      .where(
        and(
          eq(patrons.campaignId, patron.campaignId),
          eq(patrons.patreonUserId, patron.patreonUserId)
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
      const [newPatron] = await db.insert(patrons).values(patron).returning();
      return newPatron;
    }
  }

  async exportPatronsCSV(userId: string, campaignId?: string): Promise<string> {
    const { patrons: patronsList } = await this.getPatrons(userId, campaignId, 1, 10000);

    const headers = [
      "Full Name",
      "Email", 
      "Patron Status",
      "Currently Entitled Amount",
      "Lifetime Support",
      "Pledge Start Date",
      "Last Charge Date",
      "Last Charge Status"
    ];

    const rows = patronsList.map(patron => [
      patron.fullName || "",
      patron.email || "",
      patron.patronStatus || "",
      `$${((patron.currentlyEntitledAmountCents || 0) / 100).toFixed(2)}`,
      `$${((patron.lifetimeSupportCents || 0) / 100).toFixed(2)}`,
      patron.pledgeRelationshipStart ? format(patron.pledgeRelationshipStart, "yyyy-MM-dd") : "",
      patron.lastChargeDate ? format(patron.lastChargeDate, "yyyy-MM-dd") : "",
      patron.lastChargeStatus || ""
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return csvContent;
  }

  // Post operations
  async getPosts(
    userId: string,
    campaignId?: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    postType?: string
  ): Promise<{ posts: Post[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get user's campaign IDs
    const userCampaigns = await db
      .select({ id: patreonCampaigns.id })
      .from(patreonCampaigns)
      .where(eq(patreonCampaigns.userId, userId));

    const campaignIds = userCampaigns.map(c => c.id);

    if (campaignIds.length === 0) {
      return { posts: [], total: 0 };
    }

    let whereConditions: SQL<unknown> = inArray(posts.campaignId, campaignIds);

    // Filter by specific campaign
    if (campaignId && campaignId !== "all") {
      const additionalCondition = eq(posts.campaignId, parseInt(campaignId));
      const result = and(whereConditions, additionalCondition);
      if (result) whereConditions = result;
    }

    // Filter by search query
    if (search && search.trim()) {
      const searchCondition = or(
        like(posts.title, `%${search}%`),
        like(posts.content, `%${search}%`)
      );
      const result = and(whereConditions, searchCondition);
      if (result) whereConditions = result;
    }

    // Filter by post type
    if (postType && postType !== "all") {
      let typeCondition;
      if (postType === "public") {
        typeCondition = eq(posts.isPublic, true);
      } else if (postType === "paid") {
        typeCondition = eq(posts.isPaid, true);
      } else if (postType === "patron") {
        typeCondition = and(eq(posts.isPublic, false), eq(posts.isPaid, false));
      }
      
      if (typeCondition) {
        const result = and(whereConditions, typeCondition);
        if (result) whereConditions = result;
      }
    }

    // Get posts with campaign information
    const [postsList, [{ total }]] = await Promise.all([
      db
        .select({
          id: posts.id,
          campaignId: posts.campaignId,
          patreonPostId: posts.patreonPostId,
          title: posts.title,
          content: posts.content,
          url: posts.url,
          patreonUrl: posts.patreonUrl,
          embedData: posts.embedData,
          embedUrl: posts.embedUrl,
          imageUrl: posts.imageUrl,
          postFile: posts.postFile,
          postMetadata: posts.postMetadata,
          isPublic: posts.isPublic,
          isPaid: posts.isPaid,
          likeCount: posts.likeCount,
          commentCount: posts.commentCount,
          appId: posts.appId,
          appStatus: posts.appStatus,
          publishedAt: posts.publishedAt,
          editedAt: posts.editedAt,
          patreonCreatedAt: posts.patreonCreatedAt,
          patreonUpdatedAt: posts.patreonUpdatedAt,
          attachments: posts.attachments,
          userDefinedTags: posts.userDefinedTags,
          poll: posts.poll,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          campaignTitle: patreonCampaigns.title,
        })
        .from(posts)
        .leftJoin(patreonCampaigns, eq(posts.campaignId, patreonCampaigns.id))
        .where(whereConditions)
        .orderBy(desc(posts.publishedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)` })
        .from(posts)
        .leftJoin(patreonCampaigns, eq(posts.campaignId, patreonCampaigns.id))
        .where(whereConditions),
    ]);

    return {
      posts: postsList,
      total: total || 0,
    };
  }

  async upsertPost(post: InsertPost): Promise<Post> {
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
      const [newPost] = await db.insert(posts).values(post).returning();
      return newPost;
    }
  }

  // Sync operations
  async createSyncStatus(sync: InsertSyncStatus): Promise<SyncStatus> {
    const [newSync] = await db.insert(syncStatus).values(sync).returning();
    return newSync;
  }

  async updateSyncStatus(syncId: number, updates: Partial<InsertSyncStatus>): Promise<void> {
    await db
      .update(syncStatus)
      .set(updates)
      .where(eq(syncStatus.id, syncId));
  }

  async getSyncStatus(syncId: number): Promise<SyncStatus | undefined> {
    const [sync] = await db
      .select()
      .from(syncStatus)
      .where(eq(syncStatus.id, syncId));
    return sync;
  }

  async getActiveSyncs(userId: string): Promise<SyncStatus[]> {
    return await db
      .select({
        id: syncStatus.id,
        campaignId: syncStatus.campaignId,
        syncType: syncStatus.syncType,
        status: syncStatus.status,
        progress: syncStatus.progress,
        totalItems: syncStatus.totalItems,
        processedItems: syncStatus.processedItems,
        errorMessage: syncStatus.errorMessage,
        startedAt: syncStatus.startedAt,
        completedAt: syncStatus.completedAt,
        createdAt: syncStatus.createdAt,
      })
      .from(syncStatus)
      .innerJoin(patreonCampaigns, eq(syncStatus.campaignId, patreonCampaigns.id))
      .where(
        and(
          eq(patreonCampaigns.userId, userId),
          or(
            eq(syncStatus.status, "pending"),
            eq(syncStatus.status, "in_progress")
          )
        )
      )
      .orderBy(desc(syncStatus.createdAt));
  }

  // Revenue data operations
  async upsertRevenueData(revenue: InsertRevenueData): Promise<RevenueData> {
    const [existingRevenue] = await db
      .select()
      .from(revenueData)
      .where(
        and(
          eq(revenueData.campaignId, revenue.campaignId),
          eq(revenueData.date, revenue.date)
        )
      );

    if (existingRevenue) {
      const [updatedRevenue] = await db
        .update(revenueData)
        .set(revenue)
        .where(eq(revenueData.id, existingRevenue.id))
        .returning();
      return updatedRevenue;
    } else {
      const [newRevenue] = await db.insert(revenueData).values(revenue).returning();
      return newRevenue;
    }
  }

  async getRevenueData(userId: string, days: number, campaignId?: string): Promise<RevenueData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user's campaign IDs
    const userCampaigns = await db
      .select({ id: patreonCampaigns.id })
      .from(patreonCampaigns)
      .where(eq(patreonCampaigns.userId, userId));

    const campaignIds = userCampaigns.map(c => c.id);

    if (campaignIds.length === 0) {
      return [];
    }

    let whereConditions = and(
      sql`${revenueData.campaignId} IN ${campaignIds}`,
      gte(revenueData.date, startDate),
      lte(revenueData.date, endDate)
    );

    if (campaignId && campaignId !== "all") {
      whereConditions = and(
        whereConditions,
        eq(revenueData.campaignId, parseInt(campaignId))
      );
    }

    return await db
      .select()
      .from(revenueData)
      .where(whereConditions)
      .orderBy(revenueData.date);
  }

  // Dashboard operations
  async getDashboardMetrics(userId: string): Promise<{
    monthlyRevenue: number;
    revenueChange: number;
    totalPatrons: number;
    patronChange: number;
    avgPerPatron: number;
    avgChange: number;
    newPatrons: number;
    newPatronChange: number;
  }> {
    // Get user's campaigns
    const userCampaigns = await db
      .select()
      .from(patreonCampaigns)
      .where(eq(patreonCampaigns.userId, userId));

    if (userCampaigns.length === 0) {
      return {
        monthlyRevenue: 0,
        revenueChange: 0,
        totalPatrons: 0,
        patronChange: 0,
        avgPerPatron: 0,
        avgChange: 0,
        newPatrons: 0,
        newPatronChange: 0,
      };
    }

    const campaignIds = userCampaigns.map(c => c.id);

    // Calculate current metrics from actual patron data
    const actualMetrics = await db
      .select({
        monthlyRevenue: sql<number>`sum(case when ${patrons.patronStatus} = 'active_patron' then ${patrons.currentlyEntitledAmountCents} else 0 end) / 100.0`,
        activePatrons: sql<number>`count(case when ${patrons.patronStatus} = 'active_patron' then 1 end)`,
      })
      .from(patrons)
      .where(sql`${patrons.campaignId} IN ${campaignIds}`);

    const currentRevenue = actualMetrics[0]?.monthlyRevenue || 0;
    const currentPatrons = actualMetrics[0]?.activePatrons || 0;

    // Get revenue data for last 60 days to calculate changes
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentRevenue, previousRevenue] = await Promise.all([
      db
        .select({
          revenue: sql<number>`sum(${revenueData.pledgeSum})`,
          patrons: sql<number>`sum(${revenueData.patronCount})`,
        })
        .from(revenueData)
        .where(
          and(
            sql`${revenueData.campaignId} IN ${campaignIds}`,
            gte(revenueData.date, thirtyDaysAgo)
          )
        ),
      db
        .select({
          revenue: sql<number>`sum(${revenueData.pledgeSum})`,
          patrons: sql<number>`sum(${revenueData.patronCount})`,
        })
        .from(revenueData)
        .where(
          and(
            sql`${revenueData.campaignId} IN ${campaignIds}`,
            gte(revenueData.date, sixtyDaysAgo),
            lte(revenueData.date, thirtyDaysAgo)
          )
        ),
    ]);

    // Calculate changes
    const revenueChange = previousRevenue[0]?.revenue
      ? ((currentRevenue - previousRevenue[0].revenue) / previousRevenue[0].revenue) * 100
      : 0;

    const patronChange = previousRevenue[0]?.patrons
      ? ((currentPatrons - previousRevenue[0].patrons) / previousRevenue[0].patrons) * 100
      : 0;

    const avgPerPatron = currentPatrons > 0 ? currentRevenue / currentPatrons : 0;
    const prevAvgPerPatron = previousRevenue[0]?.patrons > 0 
      ? previousRevenue[0].revenue / previousRevenue[0].patrons 
      : 0;
    const avgChange = prevAvgPerPatron > 0 
      ? ((avgPerPatron - prevAvgPerPatron) / prevAvgPerPatron) * 100 
      : 0;

    // Count new patrons in last 30 days
    const [newPatronsResult] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(patrons)
      .where(
        and(
          sql`${patrons.campaignId} IN ${campaignIds}`,
          gte(patrons.pledgeRelationshipStart, thirtyDaysAgo)
        )
      );

    const newPatrons = newPatronsResult?.count || 0;

    return {
      monthlyRevenue: currentRevenue,
      revenueChange,
      totalPatrons: currentPatrons,
      patronChange,
      avgPerPatron,
      avgChange,
      newPatrons,
      newPatronChange: 0, // Would need historical tracking
    };
  }

  async getRecentActivity(userId: string): Promise<any[]> {
    // Get user's campaigns
    const userCampaigns = await db
      .select({ id: patreonCampaigns.id })
      .from(patreonCampaigns)
      .where(eq(patreonCampaigns.userId, userId));

    const campaignIds = userCampaigns.map(c => c.id);

    if (campaignIds.length === 0) {
      return [];
    }

    // Get recent patrons and posts as activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentPatrons, recentPosts] = await Promise.all([
      db
        .select()
        .from(patrons)
        .where(
          and(
            sql`${patrons.campaignId} IN ${campaignIds}`,
            gte(patrons.pledgeRelationshipStart, sevenDaysAgo)
          )
        )
        .orderBy(desc(patrons.pledgeRelationshipStart))
        .limit(5),
      db
        .select()
        .from(posts)
        .where(
          and(
            sql`${posts.campaignId} IN ${campaignIds}`,
            gte(posts.publishedAt, sevenDaysAgo)
          )
        )
        .orderBy(desc(posts.publishedAt))
        .limit(5),
    ]);

    const activities: any[] = [];

    // Add patron activities
    recentPatrons.forEach(patron => {
      activities.push({
        id: `patron-${patron.id}`,
        type: 'new_patron',
        title: `${patron.fullName || 'Unknown'} became a patron`,
        description: `$${((patron.currentlyEntitledAmountCents || 0) / 100).toFixed(2)}/month`,
        timestamp: patron.pledgeRelationshipStart,
      });
    });

    // Add post activities
    recentPosts.forEach(post => {
      activities.push({
        id: `post-${post.id}`,
        type: 'new_post',
        title: 'New post published',
        description: post.title || 'Untitled post',
        timestamp: post.publishedAt,
      });
    });

    // Sort by timestamp and return latest
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  // Campaign tier operations
  async upsertCampaignTier(tier: InsertCampaignTier): Promise<CampaignTier> {
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
      const [newTier] = await db.insert(campaignTiers).values(tier).returning();
      return newTier;
    }
  }

  async getCampaignTiers(campaignId: number): Promise<CampaignTier[]> {
    return db
      .select()
      .from(campaignTiers)
      .where(eq(campaignTiers.campaignId, campaignId))
      .orderBy(campaignTiers.amountCents);
  }

  // Campaign goal operations
  async upsertCampaignGoal(goal: InsertCampaignGoal): Promise<CampaignGoal> {
    const [existingGoal] = await db
      .select()
      .from(campaignGoals)
      .where(eq(campaignGoals.patreonGoalId, goal.patreonGoalId));

    if (existingGoal) {
      const [updatedGoal] = await db
        .update(campaignGoals)
        .set({ ...goal, updatedAt: new Date() })
        .where(eq(campaignGoals.id, existingGoal.id))
        .returning();
      return updatedGoal;
    } else {
      const [newGoal] = await db.insert(campaignGoals).values(goal).returning();
      return newGoal;
    }
  }

  async getCampaignGoals(campaignId: number): Promise<CampaignGoal[]> {
    return db
      .select()
      .from(campaignGoals)
      .where(eq(campaignGoals.campaignId, campaignId))
      .orderBy(campaignGoals.amountCents);
  }

  // Benefit operations
  async upsertBenefit(benefit: InsertBenefit): Promise<Benefit> {
    const [existingBenefit] = await db
      .select()
      .from(benefits)
      .where(eq(benefits.patreonBenefitId, benefit.patreonBenefitId));

    if (existingBenefit) {
      const [updatedBenefit] = await db
        .update(benefits)
        .set({ ...benefit, updatedAt: new Date() })
        .where(eq(benefits.id, existingBenefit.id))
        .returning();
      return updatedBenefit;
    } else {
      const [newBenefit] = await db.insert(benefits).values(benefit).returning();
      return newBenefit;
    }
  }

  async getCampaignBenefits(campaignId: number): Promise<Benefit[]> {
    return db
      .select()
      .from(benefits)
      .where(eq(benefits.campaignId, campaignId))
      .orderBy(benefits.patreonCreatedAt);
  }

  // Address operations
  async upsertAddress(address: InsertAddress): Promise<Address> {
    const [existingAddress] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.patronId, address.patronId));

    if (existingAddress) {
      const [updatedAddress] = await db
        .update(addresses)
        .set({ ...address, updatedAt: new Date() })
        .where(eq(addresses.id, existingAddress.id))
        .returning();
      return updatedAddress;
    } else {
      const [newAddress] = await db.insert(addresses).values(address).returning();
      return newAddress;
    }
  }

  async getPatronAddresses(patronId: number): Promise<Address[]> {
    return db
      .select()
      .from(addresses)
      .where(eq(addresses.patronId, patronId));
  }

  // Webhook operations
  async upsertWebhook(webhook: InsertWebhook): Promise<Webhook> {
    const [existingWebhook] = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.patreonWebhookId, webhook.patreonWebhookId));

    if (existingWebhook) {
      const [updatedWebhook] = await db
        .update(webhooks)
        .set({ ...webhook, updatedAt: new Date() })
        .where(eq(webhooks.id, existingWebhook.id))
        .returning();
      return updatedWebhook;
    } else {
      const [newWebhook] = await db.insert(webhooks).values(webhook).returning();
      return newWebhook;
    }
  }

  async getCampaignWebhooks(campaignId: number): Promise<Webhook[]> {
    return db
      .select()
      .from(webhooks)
      .where(eq(webhooks.campaignId, campaignId))
      .orderBy(webhooks.createdAt);
  }

  async getWebhookById(webhookId: number): Promise<Webhook | undefined> {
    const [webhook] = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.id, webhookId));
    return webhook;
  }

  async deleteWebhook(webhookId: number): Promise<void> {
    await db.delete(webhooks).where(eq(webhooks.id, webhookId));
  }
}

export const storage = new DatabaseStorage();
