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
  title: varchar("title").notNull(),
  summary: text("summary"),
  imageUrl: varchar("image_url"),
  vanityUrl: varchar("vanity_url"),
  patronCount: integer("patron_count").default(0),
  pledgeSum: decimal("pledge_sum", { precision: 10, scale: 2 }).default("0"),
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
  email: varchar("email"),
  fullName: varchar("full_name"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  imageUrl: varchar("image_url"),
  thumbUrl: varchar("thumb_url"),
  url: varchar("url"),
  isFollower: boolean("is_follower").default(false),
  pledgeRelationshipStart: timestamp("pledge_relationship_start"),
  lifetimeSupportCents: integer("lifetime_support_cents").default(0),
  currentlyEntitledAmountCents: integer("currently_entitled_amount_cents").default(0),
  patronStatus: varchar("patron_status"),
  lastChargeDate: timestamp("last_charge_date"),
  lastChargeStatus: varchar("last_charge_status"),
  willPayAmountCents: integer("will_pay_amount_cents").default(0),
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
  embedData: jsonb("embed_data"),
  embedUrl: varchar("embed_url"),
  imageUrl: varchar("image_url"),
  isPublic: boolean("is_public").default(false),
  isPaid: boolean("is_paid").default(false),
  publishedAt: timestamp("published_at"),
  editedAt: timestamp("edited_at"),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
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
}));

export const patronsRelations = relations(patrons, ({ one }) => ({
  campaign: one(patreonCampaigns, {
    fields: [patrons.campaignId],
    references: [patreonCampaigns.id],
  }),
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
