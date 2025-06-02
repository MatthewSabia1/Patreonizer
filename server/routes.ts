import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupPatreonAuth } from "./patreonAuth";
import { setupWebhookHandlers } from "./webhookHandler";
import { patreonApi, type PatreonApiResponse } from "./patreonApi";
import { syncService } from "./syncService";
import { z, ZodError } from "zod";
import type { Request, Response, NextFunction } from 'express';

// Validation Middleware
const validateRequest = (schema: z.ZodSchema<any>) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedRequest = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Store validated data on req object for handlers to use
      if (parsedRequest.body) {
        req.validatedBody = parsedRequest.body;
      }
      if (parsedRequest.query) {
        req.validatedQuery = parsedRequest.query;
      }
      if (parsedRequest.params) {
        req.validatedParams = parsedRequest.params;
      }

      next();
    } catch (error: any) { // Specify type for error
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Input validation failed",
          errors: error.errors,
        });
      }
      console.error("Unhandled validation error:", error);
      res.status(500).json({ message: "Internal server error during validation" });
    }
  };

// Zod Schemas
const syncStartSchema = z.object({
  body: z.object({
    campaignId: z.number().int().positive().optional(),
    syncType: z.enum(['initial', 'incremental', 'full']).optional(),
  }),
  query: z.object({}).optional(), // Allow other query params, or define if needed
  params: z.object({}).optional(), // Allow other params, or define if needed
});

const getPatronsSchema = z.object({
  query: z.object({
    campaignId: z.string().optional(),
    page: z.string().optional().default('1').transform((val: string) => parseInt(val, 10)),
    limit: z.string().optional().default('50').transform((val: string) => parseInt(val, 10)),
    search: z.string().optional().default(''),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

const postWebhookSchema = z.object({
  params: z.object({
    campaignId: z.string().transform((val: string) => parseInt(val, 10)),
  }),
  body: z.object({
    uri: z.string().url(),
    triggers: z.array(z.string()).min(1),
    secret: z.string().optional(),
  }),
  query: z.object({}).optional(),
});

const getDashboardMetricsSchema = z.object({
  query: z.object({
    campaignId: z.string().optional().transform((val?: string) => val ? parseInt(val, 10) : undefined),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

const getRevenueDataSchema = z.object({
  query: z.object({
    days: z.string().optional().default('30').transform((val: string) => parseInt(val, 10)),
    campaignId: z.string().optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

const deleteCampaignSchema = z.object({
  params: z.object({
    campaignId: z.string().transform((val: string) => parseInt(val, 10)),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

const getSyncStatusSchema = z.object({
  params: z.object({
    syncId: z.string().transform((val: string) => parseInt(val, 10)),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

const getPostsSchema = z.object({
  query: z.object({
    campaignId: z.string().optional().transform((val?: string) => val === 'all' ? undefined : val),
    page: z.string().optional().default('1').transform((val: string) => parseInt(val, 10)),
    limit: z.string().optional().default('20').transform((val: string) => parseInt(val, 10)),
    search: z.string().optional(),
    postType: z.string().optional(), // Could be enum: ['public', 'paid', 'patron'] if strictly enforced
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

const getCampaignsSchema = z.object({
  query: z.object({}).optional(),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

const campaignParamSchema = z.object({
  params: z.object({
    campaignId: z.string().transform((val: string) => parseInt(val, 10)),
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

const getPatronsExportSchema = z.object({
  query: z.object({
    campaignId: z.string().optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

const getActiveSyncsSchema = z.object({
  query: z.object({}).optional(),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

const deleteWebhookSchema = z.object({
  params: z.object({
    webhookId: z.string().transform((val: string) => parseInt(val, 10)),
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

const getRecentActivitySchema = z.object({
  query: z.object({}).optional(),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

const postSettingsSchema = z.object({
  body: z.object({
    theme: z.string().optional(),
    notifications: z.object({
        email: z.boolean().optional(),
        sync: z.boolean().optional(),
        revenue: z.boolean().optional(),
        newPatrons: z.boolean().optional(),
    }).optional(),
    privacy: z.object({
        dataSharing: z.boolean().optional(),
        analytics: z.boolean().optional(),
    }).optional(),
    sync: z.object({
        autoSync: z.boolean().optional(),
        syncFrequency: z.string().optional(), // Consider enum if specific values
    }).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

const getSettingsSchema = z.object({
  query: z.object({}).optional(),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

const postExportCompleteSchema = z.object({
  body: z.object({ // Define based on expected exportOptions structure
    // Example: exportAll: z.boolean().optional(), campaigns: z.array(z.string()).optional(), etc.
  }).passthrough(), // Allows unspecified options for now, refine later if needed
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

const emptySchema = z.object({
  query: z.object({}).optional(),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

const notificationParamSchema = z.object({
  params: z.object({
    notificationId: z.string(), // Assuming notificationId is a string, adjust if different
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

// Extend Express Request type to include validated data
declare global {
  namespace Express {
    interface Request {
      validatedBody?: any;
      validatedQuery?: any;
      validatedParams?: any;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Patreon OAuth setup
  setupPatreonAuth(app);
  
  // Webhook handlers
  setupWebhookHandlers(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, validateRequest(emptySchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard data routes
  app.get('/api/dashboard/metrics', isAuthenticated, validateRequest(getDashboardMetricsSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.validatedQuery; // Use validated campaignId
      const metrics = await storage.getDashboardMetrics(userId, campaignId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get('/api/dashboard/revenue-data', isAuthenticated, validateRequest(getRevenueDataSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { days, campaignId } = req.validatedQuery; // Use validated data
      const revenueData = await storage.getRevenueData(userId, days, campaignId);
      res.json(revenueData);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  // Campaign routes
  app.get('/api/campaigns', isAuthenticated, validateRequest(getCampaignsSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getUserCampaigns(userId);
      
      // Enhance campaigns with accurate revenue calculations
      const enhancedCampaigns = await Promise.all(
        campaigns.map(async (campaign) => {
          const stats = await storage.getCampaignStats(campaign.id);
          return {
            ...campaign,
            actualMonthlyRevenue: stats.totalPledgeSum,
            actualPatronCount: stats.patronCount
          };
        })
      );
      
      res.json(enhancedCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.delete('/api/campaigns/:campaignId', isAuthenticated, validateRequest(deleteCampaignSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.validatedParams; // Use validated data
      
      // Verify user owns this campaign
      const campaign = await storage.getCampaignById(campaignId);
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteCampaign(campaignId);
      res.json({ message: "Campaign disconnected successfully" });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to disconnect campaign" });
    }
  });

  // Patron data routes
  app.get('/api/patrons', isAuthenticated, validateRequest(getPatronsSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId, page, limit, search } = req.validatedQuery; // Use validated data
      
      const patrons = await storage.getPatrons(
        userId,
        campaignId,
        page,
        limit,
        search
      );
      res.json(patrons);
    } catch (error) {
      console.error("Error fetching patrons:", error);
      res.status(500).json({ message: "Failed to fetch patrons" });
    }
  });

  app.get('/api/patrons/export', isAuthenticated, validateRequest(getPatronsExportSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.validatedQuery; // Use validated data
      
      const csv = await storage.exportPatronsCSV(userId, campaignId as string | undefined);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="patrons.csv"');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting patrons:", error);
      res.status(500).json({ message: "Failed to export patron data" });
    }
  });

  // Sync routes
  app.post('/api/sync/start', isAuthenticated, validateRequest(syncStartSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId, syncType = 'incremental' } = req.validatedBody; // Use validated data
      
      const syncId = await syncService.startSync(userId, campaignId, syncType);
      res.json({ syncId, message: "Sync started successfully" });
    } catch (error) {
      console.error("Error starting sync:", error);
      res.status(500).json({ message: "Failed to start sync" });
    }
  });

  app.get('/api/sync/status/:syncId', isAuthenticated, validateRequest(getSyncStatusSchema), async (req: any, res) => {
    try {
      const { syncId } = req.validatedParams; // Use validated data
      const status = await storage.getSyncStatus(syncId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching sync status:", error);
      res.status(500).json({ message: "Failed to fetch sync status" });
    }
  });

  app.get('/api/sync/active', isAuthenticated, validateRequest(getActiveSyncsSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activeSyncs = await storage.getActiveSyncs(userId);
      res.json(activeSyncs);
    } catch (error) {
      console.error("Error fetching active syncs:", error);
      res.status(500).json({ message: "Failed to fetch active syncs" });
    }
  });

  // Posts routes
  app.get('/api/posts', isAuthenticated, validateRequest(getPostsSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId, page, limit, search, postType } = req.validatedQuery; // Use validated data
      
      const posts = await storage.getPosts(
        userId,
        campaignId,
        page,
        limit,
        search,
        postType
      );
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Recent activity route
  app.get('/api/activity/recent', isAuthenticated, validateRequest(getRecentActivitySchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activity = await storage.getRecentActivity(userId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Settings routes
  app.post('/api/settings', isAuthenticated, validateRequest(postSettingsSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settingsToUpdate = req.validatedBody; // Use validated data
      
      const updatedSettings = await storage.updateUserSettings(userId, settingsToUpdate);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
      if (error instanceof ZodError) { // Handle Zod errors from storage potentially
        return res.status(400).json({
          message: "Settings validation failed",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  app.get('/api/settings', isAuthenticated, validateRequest(getSettingsSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userSettings = await storage.getUserSettings(userId);
      res.json(userSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Export routes
  app.post('/api/export/complete', isAuthenticated, validateRequest(postExportCompleteSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exportOptions = req.validatedBody; // Use validated data
      
      // In a real implementation, you would generate a ZIP file with the selected data
      // For now, create a simple CSV export
      const csvData = await storage.exportPatronsCSV(userId);
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="patreon-data-export.zip"');
      res.send(csvData);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Webhook management routes
  app.get('/api/webhooks/:campaignId', isAuthenticated, validateRequest(campaignParamSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.validatedParams; // Use validated data
      
      // Verify user owns this campaign
      const campaign = await storage.getCampaignById(campaignId);
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const webhooks = await storage.getCampaignWebhooks(campaignId);
      res.json(webhooks);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      res.status(500).json({ message: "Failed to fetch webhooks" });
    }
  });

  app.post('/api/webhooks/:campaignId', isAuthenticated, validateRequest(postWebhookSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.validatedParams; // Use validated data
      const { uri, triggers, secret } = req.validatedBody; // Use validated data
      
      // Verify user owns this campaign
      const campaign = await storage.getCampaignById(campaignId);
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (!campaign.accessToken) {
        return res.status(400).json({ message: "Campaign is not properly connected, missing access token." });
      }
      
      // Create webhook via Patreon API
      const webhookDataResponse = await patreonApi.createWebhook(
        campaign.accessToken,
        uri,
        triggers,
        campaign.refreshToken, // Pass refreshToken
        async (newTokens) => { // Pass onTokenRefresh callback
          await storage.updateCampaign(campaign.id, { 
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            tokenExpiresAt: newTokens.expiresAt,
          });
        },
        secret
      );

      // Ensure webhookDataResponse is not void and has data
      const webhookData = webhookDataResponse as PatreonApiResponse | undefined;

      if (!webhookData || !webhookData.data) {
        throw new Error("Failed to create webhook on Patreon, no data returned or unexpected response structure.");
      }
      
      // Store webhook in our database
      const webhook = await storage.upsertWebhook({
        campaignId: campaignId, 
        patreonWebhookId: webhookData.data.id,
        uri: webhookData.data.attributes.uri,
        triggers: webhookData.data.attributes.triggers,
        secret: webhookData.data.attributes.secret || null,
        paused: webhookData.data.attributes.paused || false,
      });
      
      res.json(webhook);
    } catch (error) {
      console.error("Error creating webhook:", error);
      res.status(500).json({ message: "Failed to create webhook" });
    }
  });

  app.delete('/api/webhooks/:webhookId', isAuthenticated, validateRequest(deleteWebhookSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { webhookId } = req.validatedParams; // Use validated data
      
      // Get webhook to verify ownership
      const webhook = await storage.getWebhookById(webhookId);
      if (!webhook) {
        return res.status(404).json({ message: "Webhook not found" });
      }
      
      const campaign = await storage.getCampaignById(webhook.campaignId);
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (!campaign.accessToken) {
        return res.status(400).json({ message: "Campaign is not properly connected, missing access token for webhook deletion." });
      }
      
      // Delete from Patreon API
      await patreonApi.deleteWebhook(
        campaign.accessToken,
        webhook.patreonWebhookId,
        campaign.refreshToken, // Pass refreshToken
        async (newTokens) => { // Pass onTokenRefresh callback
          await storage.updateCampaign(campaign.id, { 
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            tokenExpiresAt: newTokens.expiresAt,
          });
        }
      );
      
      // Delete from our database
      await storage.deleteWebhook(webhookId);
      
      res.json({ message: "Webhook deleted successfully" });
    } catch (error) {
      console.error("Error deleting webhook:", error);
      res.status(500).json({ message: "Failed to delete webhook" });
    }
  });

  // Campaign tier routes
  app.get('/api/campaigns/:campaignId/tiers', isAuthenticated, validateRequest(campaignParamSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.validatedParams; // Use validated data
      
      // Verify user owns this campaign
      const campaign = await storage.getCampaignById(campaignId);
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const tiers = await storage.getCampaignTiers(campaignId);
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching campaign tiers:", error);
      res.status(500).json({ message: "Failed to fetch campaign tiers" });
    }
  });

  // Campaign goals routes
  app.get('/api/campaigns/:campaignId/goals', isAuthenticated, validateRequest(campaignParamSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.validatedParams; // Use validated data
      
      // Verify user owns this campaign
      const campaign = await storage.getCampaignById(campaignId);
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const goals = await storage.getCampaignGoals(campaignId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching campaign goals:", error);
      res.status(500).json({ message: "Failed to fetch campaign goals" });
    }
  });

  // Campaign benefits routes
  app.get('/api/campaigns/:campaignId/benefits', isAuthenticated, validateRequest(campaignParamSchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.validatedParams; // Use validated data
      
      // Verify user owns this campaign
      const campaign = await storage.getCampaignById(campaignId);
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const benefits = await storage.getCampaignBenefits(campaignId);
      res.json(benefits);
    } catch (error) {
      console.error("Error fetching campaign benefits:", error);
      res.status(500).json({ message: "Failed to fetch campaign benefits" });
    }
  });

  // Account deletion route
  app.delete('/api/auth/delete-account', isAuthenticated, validateRequest(emptySchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // In a real implementation, you would:
      // 1. Delete all user campaigns
      // 2. Delete all patron data
      // 3. Delete all posts
      // 4. Delete the user account
      // For now, just return success
      
      res.json({ message: "Account deletion initiated" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, validateRequest(emptySchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // In a real implementation, you would fetch notifications from database
      // For now, return sample notifications based on user activity
      const sampleNotifications = [
        {
          id: '1',
          type: 'sync',
          title: 'Sync Completed',
          message: 'Your campaign data has been successfully synchronized.',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          isRead: false,
        },
        {
          id: '2',
          type: 'revenue',
          title: 'Revenue Milestone',
          message: 'Congratulations! You\'ve reached $1,000 in monthly revenue.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: false,
        },
        {
          id: '3',
          type: 'patron',
          title: 'New Patron',
          message: 'You have 3 new patrons this week.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
        }
      ];
      
      res.json(sampleNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications/:notificationId/read', isAuthenticated, validateRequest(notificationParamSchema), async (req: any, res) => {
    try {
      const { notificationId } = req.validatedParams; // Use validated data
      
      // In a real implementation, you would mark the notification as read in database
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post('/api/notifications/mark-all-read', isAuthenticated, validateRequest(emptySchema), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // In a real implementation, you would mark all notifications as read in database
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:notificationId', isAuthenticated, validateRequest(notificationParamSchema), async (req: any, res) => {
    try {
      const { notificationId } = req.validatedParams; // Use validated data
      
      // In a real implementation, you would delete the notification from database
      res.json({ message: "Notification dismissed" });
    } catch (error) {
      console.error("Error dismissing notification:", error);
      res.status(500).json({ message: "Failed to dismiss notification" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
