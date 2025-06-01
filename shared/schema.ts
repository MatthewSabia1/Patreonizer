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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patreon connected accounts
export const patreonAccounts = pgTable("patreon_accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patreonUserId: varchar("patreon_user_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  accountName: varchar("account_name").notNull(),
  accountUrl: varchar("account_url"),
  accountImageUrl: varchar("account_image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patreon campaigns
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  patreonAccountId: integer("patreon_account_id").notNull().references(() => patreonAccounts.id, { onDelete: "cascade" }),
  patreonCampaignId: varchar("patreon_campaign_id").notNull(),
  name: varchar("name").notNull(),
  summary: text("summary"),
  creationName: varchar("creation_name"),
  vanityUrl: varchar("vanity_url"),
  imageUrl: varchar("image_url"),
  isNsfw: boolean("is_nsfw").default(false),
  isMonthly: boolean("is_monthly").default(true),
  patronCount: integer("patron_count").default(0),
  pledgeSum: decimal("pledge_sum", { precision: 10, scale: 2 }).default("0"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign tiers/reward levels
export const campaignTiers = pgTable("campaign_tiers", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  patreonTierId: varchar("patreon_tier_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  patronCount: integer("patron_count").default(0),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patrons
export const patrons = pgTable("patrons", {
  id: serial("id").primaryKey(),
  patreonAccountId: integer("patreon_account_id").notNull().references(() => patreonAccounts.id, { onDelete: "cascade" }),
  patreonUserId: varchar("patreon_user_id").notNull(),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  fullName: varchar("full_name"),
  imageUrl: varchar("image_url"),
  isEmailVerified: boolean("is_email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Patron pledges/memberships
export const pledges = pgTable("pledges", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  patronId: integer("patron_id").notNull().references(() => patrons.id, { onDelete: "cascade" }),
  tierId: integer("tier_id").references(() => campaignTiers.id),
  patreonPledgeId: varchar("patreon_pledge_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  status: varchar("status").notNull(), // active_patron, former_patron, declined_patron
  pledgeCapReached: boolean("pledge_cap_reached").default(false),
  patronPaysFees: boolean("patron_pays_fees").default(false),
  declineCount: integer("decline_count").default(0),
  totalHistoricalAmount: decimal("total_historical_amount", { precision: 10, scale: 2 }).default("0"),
  pledgeStartDate: timestamp("pledge_start_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign posts
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  patreonPostId: varchar("patreon_post_id").notNull(),
  title: varchar("title"),
  content: text("content"),
  isPublic: boolean("is_public").default(false),
  isPaid: boolean("is_paid").default(false),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Revenue snapshots for analytics
export const revenueSnapshots = pgTable("revenue_snapshots", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  snapshotDate: timestamp("snapshot_date").notNull(),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).notNull(),
  patronCount: integer("patron_count").notNull(),
  newPatrons: integer("new_patrons").default(0),
  lostPatrons: integer("lost_patrons").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Data sync logs
export const syncLogs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  patreonAccountId: integer("patreon_account_id").notNull().references(() => patreonAccounts.id, { onDelete: "cascade" }),
  syncType: varchar("sync_type").notNull(), // full, incremental
  status: varchar("status").notNull(), // pending, in_progress, completed, failed
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  recordsProcessed: integer("records_processed").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  patreonAccounts: many(patreonAccounts),
}));

export const patreonAccountsRelations = relations(patreonAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [patreonAccounts.userId],
    references: [users.id],
  }),
  campaigns: many(campaigns),
  patrons: many(patrons),
  syncLogs: many(syncLogs),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  patreonAccount: one(patreonAccounts, {
    fields: [campaigns.patreonAccountId],
    references: [patreonAccounts.id],
  }),
  tiers: many(campaignTiers),
  pledges: many(pledges),
  posts: many(posts),
  revenueSnapshots: many(revenueSnapshots),
}));

export const campaignTiersRelations = relations(campaignTiers, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [campaignTiers.campaignId],
    references: [campaigns.id],
  }),
  pledges: many(pledges),
}));

export const patronsRelations = relations(patrons, ({ one, many }) => ({
  patreonAccount: one(patreonAccounts, {
    fields: [patrons.patreonAccountId],
    references: [patreonAccounts.id],
  }),
  pledges: many(pledges),
}));

export const pledgesRelations = relations(pledges, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [pledges.campaignId],
    references: [campaigns.id],
  }),
  patron: one(patrons, {
    fields: [pledges.patronId],
    references: [patrons.id],
  }),
  tier: one(campaignTiers, {
    fields: [pledges.tierId],
    references: [campaignTiers.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [posts.campaignId],
    references: [campaigns.id],
  }),
}));

export const revenueSnapshotsRelations = relations(revenueSnapshots, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [revenueSnapshots.campaignId],
    references: [campaigns.id],
  }),
}));

export const syncLogsRelations = relations(syncLogs, ({ one }) => ({
  patreonAccount: one(patreonAccounts, {
    fields: [syncLogs.patreonAccountId],
    references: [patreonAccounts.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertPatreonAccountSchema = createInsertSchema(patreonAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatronSchema = createInsertSchema(patrons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPledgeSchema = createInsertSchema(pledges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSyncLogSchema = createInsertSchema(syncLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPatreonAccount = z.infer<typeof insertPatreonAccountSchema>;
export type PatreonAccount = typeof patreonAccounts.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type CampaignTier = typeof campaignTiers.$inferSelect;
export type InsertPatron = z.infer<typeof insertPatronSchema>;
export type Patron = typeof patrons.$inferSelect;
export type InsertPledge = z.infer<typeof insertPledgeSchema>;
export type Pledge = typeof pledges.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type RevenueSnapshot = typeof revenueSnapshots.$inferSelect;
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;
export type SyncLog = typeof syncLogs.$inferSelect;
