import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupPatreonAuth } from "./patreonAuth";
import { patreonApi } from "./patreonApi";
import { syncService } from "./syncService";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Patreon OAuth setup
  setupPatreonAuth(app);

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
      res.json(campaigns);
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
      const { campaignId, page = '1', limit = '20' } = req.query;
      
      const posts = await storage.getPosts(
        userId,
        campaignId as string,
        parseInt(page as string),
        parseInt(limit as string)
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

  const httpServer = createServer(app);
  return httpServer;
}
