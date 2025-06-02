import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  uuid
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patreon campaigns connected by users
export const patreonCampaigns = pgTable("patreon_campaigns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patreonCampaignId: varchar("patreon_campaign_id").notNull().unique(),
  creationName: varchar("creation_name").notNull(), // The actual Patreon page name
  title: varchar("title").notNull(), // Campaign title/summary content
  summary: text("summary"),
  imageUrl: varchar("image_url"),
  vanityUrl: varchar("vanity_url"),
  patronCount: integer("patron_count").default(0),
  pledgeSum: decimal("pledge_sum", { precision: 10, scale: 2 }).default("0"),
  currency: varchar("currency").default("USD"),
  isMonthly: boolean("is_monthly").default(true),
  isChargedImmediately: boolean("is_charged_immediately").default(false),
  isNsfw: boolean("is_nsfw").default(false),
  mainVideoEmbed: text("main_video_embed"),
  mainVideoUrl: varchar("main_video_url"),
  oneLiner: text("one_liner"),
  payPerName: varchar("pay_per_name"),
  pledgeUrl: varchar("pledge_url"),
  thanksEmbed: text("thanks_embed"),
  thanksMsg: text("thanks_msg"),
  thanksVideoUrl: varchar("thanks_video_url"),
  hasRss: boolean("has_rss").default(false),
  hasSentRssNotify: boolean("has_sent_rss_notify").default(false),
  rssFeedTitle: varchar("rss_feed_title"),
  rssArtworkUrl: varchar("rss_artwork_url"),
  publishedAt: timestamp("published_at"),
  isActive: boolean("is_active").default(true),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patrons data
export const patrons = pgTable("patrons", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => patreonCampaigns.id, { onDelete: "cascade" }),
  patreonUserId: varchar("patreon_user_id").notNull(),
  patreonMemberId: varchar("patreon_member_id").notNull(),
  email: varchar("email"),
  fullName: varchar("full_name"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  imageUrl: varchar("image_url"),
  thumbUrl: varchar("thumb_url"),
  url: varchar("url"),
  vanity: varchar("vanity"),
  about: text("about"),
  isFollower: boolean("is_follower").default(false),
  isCreator: boolean("is_creator").default(false),
  isEmailVerified: boolean("is_email_verified").default(false),
  canSeeNsfw: boolean("can_see_nsfw").default(false),
  pledgeRelationshipStart: timestamp("pledge_relationship_start"),
  lifetimeSupportCents: integer("lifetime_support_cents").default(0),
  campaignLifetimeSupportCents: integer("campaign_lifetime_support_cents").default(0),
  currentlyEntitledAmountCents: integer("currently_entitled_amount_cents").default(0),
  patronStatus: varchar("patron_status"),
  lastChargeDate: timestamp("last_charge_date"),
  lastChargeStatus: varchar("last_charge_status"),
  willPayAmountCents: integer("will_pay_amount_cents").default(0),
  note: text("note"),
  currentlyEntitledTiers: jsonb("currently_entitled_tiers"),
  address: jsonb("address"),
  patreonCreatedAt: timestamp("patreon_created_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts/content data
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => patreonCampaigns.id, { onDelete: "cascade" }),
  patreonPostId: varchar("patreon_post_id").notNull().unique(),
  title: varchar("title"),
  content: text("content"),
  url: varchar("url"),
  patreonUrl: varchar("patreon_url"),
  embedData: jsonb("embed_data"),
  embedUrl: varchar("embed_url"),
  imageUrl: varchar("image_url"),
  postFile: jsonb("post_file"),
  postMetadata: jsonb("post_metadata"),
  isPublic: boolean("is_public").default(false),
  isPaid: boolean("is_paid").default(false),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  appId: varchar("app_id"),
  appStatus: varchar("app_status"),
  publishedAt: timestamp("published_at"),
  editedAt: timestamp("edited_at"),
  patreonCreatedAt: timestamp("patreon_created_at"),
  patreonUpdatedAt: timestamp("patreon_updated_at"),
  attachments: jsonb("attachments"),
  userDefinedTags: jsonb("user_defined_tags"),
  poll: jsonb("poll"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sync status tracking
export const syncStatus = pgTable("sync_status", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => patreonCampaigns.id, { onDelete: "cascade" }),
  syncType: varchar("sync_type").notNull(), // 'initial', 'incremental', 'full'
  status: varchar("status").notNull(), // 'pending', 'in_progress', 'completed', 'failed'
  progress: integer("progress").default(0), // percentage 0-100
  totalItems: integer("total_items").default(0),
  processedItems: integer("processed_items").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Campaign tiers/reward levels
export const campaignTiers = pgTable("campaign_tiers", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => patreonCampaigns.id, { onDelete: "cascade" }),
  patreonTierId: varchar("patreon_tier_id").notNull().unique(),
  title: varchar("title").notNull(),
  description: text("description"),
  amountCents: integer("amount_cents").default(0),
  imageUrl: varchar("image_url"),
  patronCount: integer("patron_count").default(0),
  remaining: integer("remaining"),
  requiresShipping: boolean("requires_shipping").default(false),
  discordRoleIds: jsonb("discord_role_ids"),
  published: boolean("published").default(true),
  patreonCreatedAt: timestamp("patreon_created_at"),
  editedAt: timestamp("edited_at"),
  publishedAt: timestamp("published_at"),
  unpublishedAt: timestamp("unpublished_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign goals
export const campaignGoals = pgTable("campaign_goals", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => patreonCampaigns.id, { onDelete: "cascade" }),
  patreonGoalId: varchar("patreon_goal_id").notNull().unique(),
  title: varchar("title").notNull(),
  description: text("description"),
  amountCents: integer("amount_cents").default(0),
  completedPercentage: integer("completed_percentage").default(0),
  patreonCreatedAt: timestamp("patreon_created_at"),
  reachedAt: timestamp("reached_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Webhooks for real-time updates
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => patreonCampaigns.id, { onDelete: "cascade" }),
  patreonWebhookId: varchar("patreon_webhook_id").notNull().unique(),
  uri: varchar("uri").notNull(),
  triggers: jsonb("triggers").notNull(),
  secret: varchar("secret"),
  paused: boolean("paused").default(false),
  lastAttemptedAt: timestamp("last_attempted_at"),
  numConsecutiveTimesFailed: integer("num_consecutive_times_failed").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Addresses for patrons who need shipping
export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  patronId: integer("patron_id").notNull().references(() => patrons.id, { onDelete: "cascade" }),
  line1: varchar("line1"),
  line2: varchar("line2"),
  city: varchar("city"),
  state: varchar("state"),
  postalCode: varchar("postal_code"),
  country: varchar("country"),
  phoneNumber: varchar("phone_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Benefits/rewards associated with tiers
export const benefits = pgTable("benefits", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => patreonCampaigns.id, { onDelete: "cascade" }),
  patreonBenefitId: varchar("patreon_benefit_id").notNull().unique(),
  title: varchar("title").notNull(),
  description: text("description"),
  benefitType: varchar("benefit_type"), // custom, physical_good, digital_good
  isDelivered: boolean("is_delivered").default(false),
  isPublished: boolean("is_published").default(true),
  nextDeliverableDue: timestamp("next_deliverable_due"),
  deliveredDeliverables: integer("delivered_deliverables").default(0),
  notDeliveredDeliverables: integer("not_delivered_deliverables").default(0),
  patreonCreatedAt: timestamp("patreon_created_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Revenue tracking (aggregated data)
export const revenueData = pgTable("revenue_data", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => patreonCampaigns.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  patronCount: integer("patron_count").default(0),
  pledgeSum: decimal("pledge_sum", { precision: 10, scale: 2 }).default("0"),
  newPatrons: integer("new_patrons").default(0),
  lostPatrons: integer("lost_patrons").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  campaigns: many(patreonCampaigns),
}));

export const patreonCampaignsRelations = relations(patreonCampaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [patreonCampaigns.userId],
    references: [users.id],
  }),
  patrons: many(patrons),
  posts: many(posts),
  syncStatuses: many(syncStatus),
  revenueData: many(revenueData),
  tiers: many(campaignTiers),
  goals: many(campaignGoals),
  webhooks: many(webhooks),
  benefits: many(benefits),
}));

export const patronsRelations = relations(patrons, ({ one, many }) => ({
  campaign: one(patreonCampaigns, {
    fields: [patrons.campaignId],
    references: [patreonCampaigns.id],
  }),
  addresses: many(addresses),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  campaign: one(patreonCampaigns, {
    fields: [posts.campaignId],
    references: [patreonCampaigns.id],
  }),
}));

export const syncStatusRelations = relations(syncStatus, ({ one }) => ({
  campaign: one(patreonCampaigns, {
    fields: [syncStatus.campaignId],
    references: [patreonCampaigns.id],
  }),
}));

export const revenueDataRelations = relations(revenueData, ({ one }) => ({
  campaign: one(patreonCampaigns, {
    fields: [revenueData.campaignId],
    references: [patreonCampaigns.id],
  }),
}));

export const campaignTiersRelations = relations(campaignTiers, ({ one }) => ({
  campaign: one(patreonCampaigns, {
    fields: [campaignTiers.campaignId],
    references: [patreonCampaigns.id],
  }),
}));

export const campaignGoalsRelations = relations(campaignGoals, ({ one }) => ({
  campaign: one(patreonCampaigns, {
    fields: [campaignGoals.campaignId],
    references: [patreonCampaigns.id],
  }),
}));

export const webhooksRelations = relations(webhooks, ({ one }) => ({
  campaign: one(patreonCampaigns, {
    fields: [webhooks.campaignId],
    references: [patreonCampaigns.id],
  }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  patron: one(patrons, {
    fields: [addresses.patronId],
    references: [patrons.id],
  }),
}));

export const benefitsRelations = relations(benefits, ({ one }) => ({
  campaign: one(patreonCampaigns, {
    fields: [benefits.campaignId],
    references: [patreonCampaigns.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertPatreonCampaignSchema = createInsertSchema(patreonCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatronSchema = createInsertSchema(patrons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSyncStatusSchema = createInsertSchema(syncStatus).omit({
  id: true,
  createdAt: true,
});

export const insertRevenueDataSchema = createInsertSchema(revenueData).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignTierSchema = createInsertSchema(campaignTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignGoalSchema = createInsertSchema(campaignGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAddressSchema = createInsertSchema(addresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBenefitSchema = createInsertSchema(benefits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPatreonCampaign = z.infer<typeof insertPatreonCampaignSchema>;
export type PatreonCampaign = typeof patreonCampaigns.$inferSelect;
export type InsertPatron = z.infer<typeof insertPatronSchema>;
export type Patron = typeof patrons.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertSyncStatus = z.infer<typeof insertSyncStatusSchema>;
export type SyncStatus = typeof syncStatus.$inferSelect;
export type InsertRevenueData = z.infer<typeof insertRevenueDataSchema>;
export type RevenueData = typeof revenueData.$inferSelect;
export type InsertCampaignTier = z.infer<typeof insertCampaignTierSchema>;
export type CampaignTier = typeof campaignTiers.$inferSelect;
export type InsertCampaignGoal = z.infer<typeof insertCampaignGoalSchema>;
export type CampaignGoal = typeof campaignGoals.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addresses.$inferSelect;
export type InsertBenefit = z.infer<typeof insertBenefitSchema>;
export type Benefit = typeof benefits.$inferSelect;
