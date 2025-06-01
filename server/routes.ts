import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupPatreonAuth } from "./patreonAuth";
import { syncService } from "./syncService";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
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

  // Dashboard metrics
  app.get('/api/dashboard/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const metrics = await storage.getDashboardMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Recent activity
  app.get('/api/dashboard/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await storage.getRecentActivity(userId, limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Patreon accounts
  app.get('/api/patreon/accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getPatreonAccountsByUserId(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching Patreon accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.delete('/api/patreon/accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify the account belongs to the user
      const account = await storage.getPatreonAccount(accountId);
      if (!account || account.userId !== userId) {
        return res.status(404).json({ message: "Account not found" });
      }

      await storage.deletePatreonAccount(accountId);
      res.json({ message: "Account disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting Patreon account:", error);
      res.status(500).json({ message: "Failed to disconnect account" });
    }
  });

  // Campaigns
  app.get('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getPatreonAccountsByUserId(userId);
      
      let allCampaigns: any[] = [];
      for (const account of accounts) {
        const campaigns = await storage.getCampaignsByAccountId(account.id);
        allCampaigns = allCampaigns.concat(
          campaigns.map(campaign => ({
            ...campaign,
            accountName: account.accountName,
          }))
        );
      }

      res.json(allCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // Patron data
  app.get('/api/patrons', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
      const search = req.query.search as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const offset = (page - 1) * limit;

      const accounts = await storage.getPatreonAccountsByUserId(userId);
      let allPatrons: any[] = [];

      for (const account of accounts) {
        const pledges = await storage.getActivePledgesByAccountId(account.id);
        
        for (const pledge of pledges) {
          // Filter by campaign if specified
          if (campaignId && pledge.campaign.id !== campaignId) {
            continue;
          }

          // Filter by search if specified
          if (search) {
            const searchLower = search.toLowerCase();
            const patronName = (pledge.patron.fullName || 
              `${pledge.patron.firstName} ${pledge.patron.lastName}`).toLowerCase();
            const patronEmail = (pledge.patron.email || "").toLowerCase();
            
            if (!patronName.includes(searchLower) && !patronEmail.includes(searchLower)) {
              continue;
            }
          }

          allPatrons.push({
            id: pledge.patron.id,
            name: pledge.patron.fullName || `${pledge.patron.firstName} ${pledge.patron.lastName}`.trim(),
            email: pledge.patron.email,
            imageUrl: pledge.patron.imageUrl,
            campaignName: pledge.campaign.name,
            campaignId: pledge.campaign.id,
            tierName: pledge.tier?.title || "No Tier",
            amount: pledge.amount,
            currency: pledge.currency,
            status: pledge.status,
            pledgeStartDate: pledge.pledgeStartDate,
            totalHistoricalAmount: pledge.totalHistoricalAmount,
          });
        }
      }

      // Sort by pledge start date (newest first)
      allPatrons.sort((a, b) => {
        const dateA = a.pledgeStartDate ? new Date(a.pledgeStartDate).getTime() : 0;
        const dateB = b.pledgeStartDate ? new Date(b.pledgeStartDate).getTime() : 0;
        return dateB - dateA;
      });

      // Pagination
      const paginatedPatrons = allPatrons.slice(offset, offset + limit);
      
      res.json({
        data: paginatedPatrons,
        pagination: {
          page,
          limit,
          total: allPatrons.length,
          totalPages: Math.ceil(allPatrons.length / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching patrons:", error);
      res.status(500).json({ message: "Failed to fetch patrons" });
    }
  });

  // Export patron data as CSV
  app.get('/api/patrons/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;

      const accounts = await storage.getPatreonAccountsByUserId(userId);
      let allPatrons: any[] = [];

      for (const account of accounts) {
        const pledges = await storage.getActivePledgesByAccountId(account.id);
        
        for (const pledge of pledges) {
          if (campaignId && pledge.campaign.id !== campaignId) {
            continue;
          }

          allPatrons.push({
            "Patron Name": pledge.patron.fullName || `${pledge.patron.firstName} ${pledge.patron.lastName}`.trim(),
            "Email": pledge.patron.email || "",
            "Campaign": pledge.campaign.name,
            "Tier": pledge.tier?.title || "No Tier",
            "Monthly Amount": `$${pledge.amount}`,
            "Currency": pledge.currency,
            "Status": pledge.status,
            "Pledge Start Date": pledge.pledgeStartDate ? new Date(pledge.pledgeStartDate).toISOString().split('T')[0] : "",
            "Total Historical Amount": `$${pledge.totalHistoricalAmount}`,
          });
        }
      }

      // Generate CSV
      if (allPatrons.length === 0) {
        return res.status(200).send("No patron data to export");
      }

      const headers = Object.keys(allPatrons[0]);
      const csvContent = [
        headers.join(","),
        ...allPatrons.map(patron => 
          headers.map(header => {
            const value = patron[header] || "";
            // Escape commas and quotes in CSV
            return `"${value.toString().replace(/"/g, '""')}"`;
          }).join(",")
        )
      ].join("\n");

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="patron-data.csv"');
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting patron data:", error);
      res.status(500).json({ message: "Failed to export patron data" });
    }
  });

  // Revenue snapshots for charts
  app.get('/api/revenue/snapshots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      if (campaignId) {
        // Verify campaign belongs to user
        const campaign = await storage.getCampaignByPatreonId(campaignId.toString());
        if (!campaign) {
          return res.status(404).json({ message: "Campaign not found" });
        }

        const snapshots = await storage.getRevenueSnapshots(campaignId, startDate, endDate);
        res.json(snapshots);
      } else {
        // Get snapshots for all user campaigns
        const accounts = await storage.getPatreonAccountsByUserId(userId);
        let allSnapshots: any[] = [];

        for (const account of accounts) {
          const campaigns = await storage.getCampaignsByAccountId(account.id);
          for (const campaign of campaigns) {
            const snapshots = await storage.getRevenueSnapshots(campaign.id, startDate, endDate);
            allSnapshots = allSnapshots.concat(snapshots.map(snapshot => ({
              ...snapshot,
              campaignName: campaign.name,
            })));
          }
        }

        res.json(allSnapshots);
      }
    } catch (error) {
      console.error("Error fetching revenue snapshots:", error);
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  // Sync operations
  app.post('/api/sync/account/:id', isAuthenticated, async (req: any, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { syncType = 'incremental' } = req.body;

      // Verify the account belongs to the user
      const account = await storage.getPatreonAccount(accountId);
      if (!account || account.userId !== userId) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Start sync in background
      syncService.syncPatreonAccount(accountId, syncType)
        .then(() => {
          console.log(`Sync completed for account ${accountId}`);
        })
        .catch((error) => {
          console.error(`Sync failed for account ${accountId}:`, error);
        });

      res.json({ message: "Sync started", accountId, syncType });
    } catch (error) {
      console.error("Error starting sync:", error);
      res.status(500).json({ message: "Failed to start sync" });
    }
  });

  app.post('/api/sync/all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Start sync for all accounts in background
      syncService.syncAllUserAccounts(userId)
        .then(() => {
          console.log(`Sync completed for all accounts of user ${userId}`);
        })
        .catch((error) => {
          console.error(`Sync failed for user ${userId}:`, error);
        });

      res.json({ message: "Sync started for all accounts" });
    } catch (error) {
      console.error("Error starting sync for all accounts:", error);
      res.status(500).json({ message: "Failed to start sync" });
    }
  });

  // Sync status
  app.get('/api/sync/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getPatreonAccountsByUserId(userId);
      
      const syncStatuses = [];
      for (const account of accounts) {
        const logs = await storage.getLatestSyncLogs(account.id, 1);
        const latestLog = logs[0];
        
        syncStatuses.push({
          accountId: account.id,
          accountName: account.accountName,
          status: latestLog?.status || "never_synced",
          lastSync: latestLog?.completedAt || latestLog?.startedAt,
          recordsProcessed: latestLog?.recordsProcessed || 0,
          errorMessage: latestLog?.errorMessage,
        });
      }

      res.json(syncStatuses);
    } catch (error) {
      console.error("Error fetching sync status:", error);
      res.status(500).json({ message: "Failed to fetch sync status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
