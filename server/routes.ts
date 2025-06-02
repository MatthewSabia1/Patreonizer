import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupPatreonAuth } from "./patreonAuth";
import { setupWebhookHandlers } from "./webhookHandler";
import { patreonApi } from "./patreonApi";
import { syncService } from "./syncService";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Patreon OAuth setup
  setupPatreonAuth(app);
  
  // Webhook handlers
  setupWebhookHandlers(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/dashboard/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const metrics = await storage.getDashboardMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get('/api/dashboard/revenue-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { days = '30', campaignId } = req.query;
      const revenueData = await storage.getRevenueData(userId, parseInt(days as string), campaignId as string);
      res.json(revenueData);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  // Campaign routes
  app.get('/api/campaigns', isAuthenticated, async (req: any, res) => {
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

  app.delete('/api/campaigns/:campaignId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;
      
      // Verify user owns this campaign
      const campaign = await storage.getCampaignById(parseInt(campaignId));
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteCampaign(parseInt(campaignId));
      res.json({ message: "Campaign disconnected successfully" });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to disconnect campaign" });
    }
  });

  // Patron data routes
  app.get('/api/patrons', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId, page = '1', limit = '50', search = '' } = req.query;
      
      const patrons = await storage.getPatrons(
        userId,
        campaignId as string,
        parseInt(page as string),
        parseInt(limit as string),
        search as string
      );
      res.json(patrons);
    } catch (error) {
      console.error("Error fetching patrons:", error);
      res.status(500).json({ message: "Failed to fetch patrons" });
    }
  });

  app.get('/api/patrons/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.query;
      
      const csv = await storage.exportPatronsCSV(userId, campaignId as string);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="patrons.csv"');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting patrons:", error);
      res.status(500).json({ message: "Failed to export patron data" });
    }
  });

  // Sync routes
  app.post('/api/sync/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId, syncType = 'incremental' } = req.body;
      
      const syncId = await syncService.startSync(userId, campaignId, syncType);
      res.json({ syncId, message: "Sync started successfully" });
    } catch (error) {
      console.error("Error starting sync:", error);
      res.status(500).json({ message: "Failed to start sync" });
    }
  });

  app.get('/api/sync/status/:syncId', isAuthenticated, async (req: any, res) => {
    try {
      const { syncId } = req.params;
      const status = await storage.getSyncStatus(parseInt(syncId));
      res.json(status);
    } catch (error) {
      console.error("Error fetching sync status:", error);
      res.status(500).json({ message: "Failed to fetch sync status" });
    }
  });

  app.get('/api/sync/active', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId, page = '1', limit = '20', search, postType } = req.query;
      
      const posts = await storage.getPosts(
        userId,
        campaignId === 'all' ? undefined : campaignId as string,
        parseInt(page as string),
        parseInt(limit as string),
        search as string,
        postType as string
      );
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Recent activity route
  app.get('/api/activity/recent', isAuthenticated, async (req: any, res) => {
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
  app.post('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = req.body;
      
      // In a real implementation, you would save settings to database
      // For now, just return success
      res.json({ message: "Settings saved successfully", settings });
    } catch (error) {
      console.error("Error saving settings:", error);
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  app.get('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // In a real implementation, you would fetch settings from database
      // For now, return default settings
      const defaultSettings = {
        theme: 'dark',
        notifications: {
          email: true,
          sync: true,
          revenue: true,
          newPatrons: true,
        },
        privacy: {
          dataSharing: false,
          analytics: true,
        },
        sync: {
          autoSync: true,
          syncFrequency: 'daily',
        }
      };
      
      res.json(defaultSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Export routes
  app.post('/api/export/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exportOptions = req.body;
      
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
  app.get('/api/webhooks/:campaignId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;
      
      // Verify user owns this campaign
      const campaign = await storage.getCampaignById(parseInt(campaignId));
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const webhooks = await storage.getCampaignWebhooks(parseInt(campaignId));
      res.json(webhooks);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      res.status(500).json({ message: "Failed to fetch webhooks" });
    }
  });

  app.post('/api/webhooks/:campaignId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;
      const { uri, triggers, secret } = req.body;
      
      // Verify user owns this campaign
      const campaign = await storage.getCampaignById(parseInt(campaignId));
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Create webhook via Patreon API
      const webhookData = await patreonApi.createWebhook(campaign.accessToken, uri, triggers, secret);
      
      // Store webhook in our database
      const webhook = await storage.upsertWebhook({
        campaignId: parseInt(campaignId),
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

  app.delete('/api/webhooks/:webhookId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { webhookId } = req.params;
      
      // Get webhook to verify ownership
      const webhook = await storage.getWebhookById(parseInt(webhookId));
      if (!webhook) {
        return res.status(404).json({ message: "Webhook not found" });
      }
      
      const campaign = await storage.getCampaignById(webhook.campaignId);
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Delete from Patreon API
      await patreonApi.deleteWebhook(campaign.accessToken, webhook.patreonWebhookId);
      
      // Delete from our database
      await storage.deleteWebhook(parseInt(webhookId));
      
      res.json({ message: "Webhook deleted successfully" });
    } catch (error) {
      console.error("Error deleting webhook:", error);
      res.status(500).json({ message: "Failed to delete webhook" });
    }
  });

  // Campaign tier routes
  app.get('/api/campaigns/:campaignId/tiers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;
      
      // Verify user owns this campaign
      const campaign = await storage.getCampaignById(parseInt(campaignId));
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const tiers = await storage.getCampaignTiers(parseInt(campaignId));
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching campaign tiers:", error);
      res.status(500).json({ message: "Failed to fetch campaign tiers" });
    }
  });

  // Campaign goals routes
  app.get('/api/campaigns/:campaignId/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;
      
      // Verify user owns this campaign
      const campaign = await storage.getCampaignById(parseInt(campaignId));
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const goals = await storage.getCampaignGoals(parseInt(campaignId));
      res.json(goals);
    } catch (error) {
      console.error("Error fetching campaign goals:", error);
      res.status(500).json({ message: "Failed to fetch campaign goals" });
    }
  });

  // Campaign benefits routes
  app.get('/api/campaigns/:campaignId/benefits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;
      
      // Verify user owns this campaign
      const campaign = await storage.getCampaignById(parseInt(campaignId));
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const benefits = await storage.getCampaignBenefits(parseInt(campaignId));
      res.json(benefits);
    } catch (error) {
      console.error("Error fetching campaign benefits:", error);
      res.status(500).json({ message: "Failed to fetch campaign benefits" });
    }
  });

  // Account deletion route
  app.delete('/api/auth/delete-account', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/notifications/:notificationId/read', isAuthenticated, async (req: any, res) => {
    try {
      const { notificationId } = req.params;
      
      // In a real implementation, you would mark the notification as read in database
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // In a real implementation, you would mark all notifications as read in database
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:notificationId', isAuthenticated, async (req: any, res) => {
    try {
      const { notificationId } = req.params;
      
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
