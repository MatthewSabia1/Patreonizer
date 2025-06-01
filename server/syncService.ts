import { patreonAPI } from "./patreonApi";
import { storage } from "./storage";
import type { PatreonAccount } from "@shared/schema";

export class SyncService {
  async syncPatreonAccount(accountId: number, syncType: 'full' | 'incremental' = 'incremental'): Promise<void> {
    const account = await storage.getPatreonAccount(accountId);
    if (!account) {
      throw new Error("Patreon account not found");
    }

    // Create sync log
    const syncLog = await storage.createSyncLog({
      patreonAccountId: accountId,
      syncType,
      status: "in_progress",
    });

    let recordsProcessed = 0;

    try {
      // Sync campaigns
      console.log(`Starting ${syncType} sync for account ${accountId}`);
      
      const campaignsData = await patreonAPI.getCampaigns(account);
      const campaigns = campaignsData.data || [];
      const included = campaignsData.included || [];

      // Process campaigns
      for (const campaignData of campaigns) {
        const campaign = await storage.upsertCampaign({
          patreonAccountId: accountId,
          patreonCampaignId: campaignData.id,
          name: campaignData.attributes.display_name || campaignData.attributes.creation_name,
          summary: campaignData.attributes.summary,
          creationName: campaignData.attributes.creation_name,
          imageUrl: campaignData.attributes.image_url,
          isNsfw: campaignData.attributes.is_nsfw || false,
          isMonthly: campaignData.attributes.is_monthly || true,
          patronCount: campaignData.attributes.patron_count || 0,
          pledgeSum: campaignData.attributes.pledge_sum ? campaignData.attributes.pledge_sum.toString() : "0",
          publishedAt: campaignData.attributes.published_at ? new Date(campaignData.attributes.published_at) : null,
        });

        recordsProcessed++;

        // Process tiers for this campaign
        const campaignTiers = included.filter((item: any) => 
          item.type === "tier" && 
          campaignData.relationships?.tiers?.data?.some((tier: any) => tier.id === item.id)
        );

        for (const tierData of campaignTiers) {
          await storage.upsertCampaignTier({
            campaignId: campaign.id,
            patreonTierId: tierData.id,
            title: tierData.attributes.title,
            description: tierData.attributes.description,
            amount: (tierData.attributes.amount_cents / 100).toString(),
            currency: "USD",
            patronCount: tierData.attributes.patron_count || 0,
            isEnabled: tierData.attributes.published || true,
          });

          recordsProcessed++;
        }

        // Sync campaign members (patrons)
        await this.syncCampaignMembers(account, campaign.id, campaignData.id);
        
        // Sync campaign posts
        await this.syncCampaignPosts(account, campaign.id, campaignData.id);

        // Create revenue snapshot
        await storage.createRevenueSnapshot({
          campaignId: campaign.id,
          snapshotDate: new Date(),
          totalRevenue: campaign.pledgeSum || "0",
          patronCount: campaign.patronCount || 0,
          newPatrons: 0, // TODO: Calculate based on new pledges
          lostPatrons: 0, // TODO: Calculate based on cancelled pledges
        });

        recordsProcessed++;
      }

      // Mark sync as completed
      await storage.updateSyncLog(syncLog.id, {
        status: "completed",
        completedAt: new Date(),
        recordsProcessed,
      });

      console.log(`Sync completed for account ${accountId}. Processed ${recordsProcessed} records.`);
    } catch (error) {
      console.error(`Sync failed for account ${accountId}:`, error);
      
      await storage.updateSyncLog(syncLog.id, {
        status: "failed",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        recordsProcessed,
      });

      throw error;
    }
  }

  private async syncCampaignMembers(account: PatreonAccount, campaignId: number, patreonCampaignId: string): Promise<void> {
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      try {
        const membersData = await patreonAPI.getCampaignMembers(account, patreonCampaignId, cursor);
        const members = membersData.data || [];
        const included = membersData.included || [];

        // Process members
        for (const memberData of members) {
          // Find the associated user data
          const userData = included.find((item: any) => 
            item.type === "user" && 
            memberData.relationships?.user?.data?.id === item.id
          );

          if (!userData) continue;

          // Upsert patron
          const patron = await storage.upsertPatron({
            patreonAccountId: account.id,
            patreonUserId: userData.id,
            email: userData.attributes.email,
            firstName: userData.attributes.first_name,
            lastName: userData.attributes.last_name,
            fullName: userData.attributes.full_name,
            imageUrl: userData.attributes.image_url,
            isEmailVerified: !!userData.attributes.email,
          });

          // Find tier data
          const tierIds = memberData.relationships?.currently_entitled_tiers?.data?.map((tier: any) => tier.id) || [];
          const tierData = included.find((item: any) => 
            item.type === "tier" && tierIds.includes(item.id)
          );

          // Upsert pledge
          await storage.upsertPledge({
            campaignId,
            patronId: patron.id,
            tierId: tierData ? undefined : undefined, // TODO: Map tier properly
            patreonPledgeId: `${memberData.id}_pledge`,
            amount: memberData.attributes.currently_entitled_amount_cents 
              ? (memberData.attributes.currently_entitled_amount_cents / 100).toString() 
              : "0",
            currency: "USD",
            status: memberData.attributes.patron_status || "active_patron",
            totalHistoricalAmount: memberData.attributes.campaign_lifetime_support_cents 
              ? (memberData.attributes.campaign_lifetime_support_cents / 100).toString() 
              : "0",
            pledgeStartDate: memberData.attributes.pledge_relationship_start 
              ? new Date(memberData.attributes.pledge_relationship_start) 
              : null,
          });
        }

        // Check for pagination
        cursor = membersData.meta?.pagination?.cursors?.next;
        hasMore = !!cursor;

        // Rate limiting - pause between requests
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error("Error syncing campaign members:", error);
        hasMore = false;
      }
    }
  }

  private async syncCampaignPosts(account: PatreonAccount, campaignId: number, patreonCampaignId: string): Promise<void> {
    let cursor: string | undefined;
    let hasMore = true;
    let processedCount = 0;
    const maxPosts = 50; // Limit to recent posts to avoid long sync times

    while (hasMore && processedCount < maxPosts) {
      try {
        const postsData = await patreonAPI.getCampaignPosts(account, patreonCampaignId, cursor);
        const posts = postsData.data || [];

        // Process posts
        for (const postData of posts) {
          await storage.upsertPost({
            campaignId,
            patreonPostId: postData.id,
            title: postData.attributes.title,
            content: postData.attributes.content,
            isPublic: !postData.attributes.is_paid,
            isPaid: postData.attributes.is_paid || false,
            likeCount: postData.attributes.like_count || 0,
            commentCount: 0, // Not available in API
            publishedAt: postData.attributes.published_at 
              ? new Date(postData.attributes.published_at) 
              : null,
          });

          processedCount++;
        }

        // Check for pagination
        cursor = postsData.meta?.pagination?.cursors?.next;
        hasMore = !!cursor;

        // Rate limiting - pause between requests
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error("Error syncing campaign posts:", error);
        hasMore = false;
      }
    }
  }

  async syncAllUserAccounts(userId: string): Promise<void> {
    const accounts = await storage.getPatreonAccountsByUserId(userId);
    
    for (const account of accounts) {
      try {
        await this.syncPatreonAccount(account.id, 'incremental');
      } catch (error) {
        console.error(`Failed to sync account ${account.id}:`, error);
        // Continue with other accounts even if one fails
      }
    }
  }

  async performFullSync(accountId: number): Promise<void> {
    await this.syncPatreonAccount(accountId, 'full');
  }
}

export const syncService = new SyncService();
