import { storage } from "./storage";
import { patreonApi } from "./patreonApi";
import type { InsertPatron, InsertPost, InsertRevenueData, PatreonCampaign } from "@shared/schema";

class SyncService {
  private activeSyncs = new Map<number, boolean>();

  async startSync(userId: string, campaignId: number, syncType: 'initial' | 'incremental' | 'full') {
    try {
      // Check if sync is already running for this campaign
      if (this.activeSyncs.get(campaignId)) {
        throw new Error('Sync already in progress for this campaign');
      }

      // Get campaign details
      const campaign = await storage.getCampaignById(campaignId);
      if (!campaign || campaign.userId !== userId) {
        throw new Error('Campaign not found or access denied');
      }

      // Create sync status record
      const syncStatus = await storage.createSyncStatus({
        campaignId,
        syncType,
        status: 'pending',
        progress: 0,
        totalItems: 0,
        processedItems: 0,
      });

      // Start async sync process
      this.performSync(campaign, syncStatus.id, syncType).catch(error => {
        console.error(`Sync failed for campaign ${campaignId}:`, error);
        storage.updateSyncStatus(syncStatus.id, {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date(),
        });
      });

      return syncStatus.id;
    } catch (error) {
      console.error('Error starting sync:', error);
      throw error;
    }
  }

  private async performSync(campaign: PatreonCampaign, syncId: number, syncType: string) {
    this.activeSyncs.set(campaign.id, true);

    try {
      await storage.updateSyncStatus(syncId, {
        status: 'in_progress',
        startedAt: new Date(),
      });

      // Check if token needs refresh
      const now = new Date();
      let accessToken = campaign.accessToken;
      
      if (campaign.tokenExpiresAt && campaign.tokenExpiresAt < now && campaign.refreshToken) {
        try {
          const refreshed = await patreonApi.refreshAccessToken(campaign.refreshToken);
          accessToken = refreshed.accessToken;
          
          // Update campaign with new tokens
          await storage.updateCampaign(campaign.id, {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            tokenExpiresAt: refreshed.expiresAt,
          });
        } catch (error) {
          console.error('Failed to refresh token:', error);
          throw new Error('Token refresh failed');
        }
      }

      // Sync members/patrons
      await this.syncPatrons(campaign, accessToken, syncId);
      
      // Sync posts
      await this.syncPosts(campaign, accessToken, syncId);
      
      // Update campaign stats
      await this.updateCampaignStats(campaign.id);
      
      // Create revenue data snapshot
      await this.createRevenueSnapshot(campaign.id);

      // Mark sync as completed
      await storage.updateSyncStatus(syncId, {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
      });

      // Update campaign last sync time
      await storage.updateCampaign(campaign.id, {
        lastSyncAt: new Date(),
      });

    } finally {
      this.activeSyncs.delete(campaign.id);
    }
  }

  private async syncPatrons(campaign: PatreonCampaign, accessToken: string, syncId: number) {
    let cursor: string | undefined;
    let totalPatrons = 0;
    let processedPatrons = 0;

    do {
      const response = await patreonApi.getCampaignMembers(
        accessToken,
        campaign.patreonCampaignId,
        cursor
      );

      const members = response.data;
      const users = response.included?.filter((item: any) => item.type === 'user') || [];
      
      totalPatrons += members.length;

      for (const member of members) {
        const user = users.find((u: any) => u.id === member.relationships?.user?.data?.id);
        
        const patronData: InsertPatron = {
          campaignId: campaign.id,
          patreonUserId: member.relationships?.user?.data?.id || member.id,
          email: user?.attributes?.email || null,
          fullName: user?.attributes?.full_name || member.attributes?.full_name || null,
          firstName: user?.attributes?.first_name || null,
          lastName: user?.attributes?.last_name || null,
          imageUrl: user?.attributes?.image_url || null,
          thumbUrl: user?.attributes?.thumb_url || null,
          url: user?.attributes?.url || null,
          isFollower: user?.attributes?.is_follower || false,
          pledgeRelationshipStart: member.attributes?.pledge_relationship_start ? 
            new Date(member.attributes.pledge_relationship_start) : null,
          lifetimeSupportCents: member.attributes?.lifetime_support_cents || 0,
          currentlyEntitledAmountCents: member.attributes?.currently_entitled_amount_cents || 0,
          patronStatus: member.attributes?.patron_status || null,
          lastChargeDate: member.attributes?.last_charge_date ? 
            new Date(member.attributes.last_charge_date) : null,
          lastChargeStatus: member.attributes?.last_charge_status || null,
          willPayAmountCents: member.attributes?.will_pay_amount_cents || 0,
        };

        await storage.upsertPatron(patronData);
        processedPatrons++;

        // Update progress
        const progress = Math.min(Math.floor((processedPatrons / Math.max(totalPatrons, 1)) * 50), 50);
        await storage.updateSyncStatus(syncId, {
          progress,
          totalItems: totalPatrons,
          processedItems: processedPatrons,
        });
      }

      cursor = response.links?.next ? 
        new URL(response.links.next).searchParams.get('page[cursor]') || undefined : 
        undefined;

    } while (cursor);
  }

  private async syncPosts(campaign: PatreonCampaign, accessToken: string, syncId: number) {
    let cursor: string | undefined;
    let processedPosts = 0;

    do {
      const response = await patreonApi.getCampaignPosts(
        accessToken,
        campaign.patreonCampaignId,
        cursor
      );

      const posts = response.data;

      for (const post of posts) {
        const postData: InsertPost = {
          campaignId: campaign.id,
          patreonPostId: post.id,
          title: post.attributes?.title || null,
          content: post.attributes?.content || null,
          url: post.attributes?.url || null,
          embedData: post.attributes?.embed_data || null,
          embedUrl: post.attributes?.embed_url || null,
          imageUrl: post.attributes?.image?.large_url || post.attributes?.image?.url || null,
          isPublic: post.attributes?.is_public || false,
          isPaid: post.attributes?.is_paid || false,
          publishedAt: post.attributes?.published_at ? 
            new Date(post.attributes.published_at) : null,
          editedAt: post.attributes?.edited_at ? 
            new Date(post.attributes.edited_at) : null,
          likesCount: post.attributes?.like_count || 0,
          commentsCount: post.attributes?.comment_count || 0,
        };

        await storage.upsertPost(postData);
        processedPosts++;
      }

      // Update progress (posts are the second half of sync)
      const progress = Math.min(50 + Math.floor((processedPosts / Math.max(posts.length, 1)) * 50), 100);
      await storage.updateSyncStatus(syncId, {
        progress,
      });

      cursor = response.links?.next ? 
        new URL(response.links.next).searchParams.get('page[cursor]') || undefined : 
        undefined;

    } while (cursor);
  }

  private async updateCampaignStats(campaignId: number) {
    const stats = await storage.getCampaignStats(campaignId);
    await storage.updateCampaign(campaignId, {
      patronCount: stats.patronCount,
      pledgeSum: stats.totalPledgeSum.toString(),
    });
  }

  private async createRevenueSnapshot(campaignId: number) {
    const stats = await storage.getCampaignStats(campaignId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const revenueData: InsertRevenueData = {
      campaignId,
      date: today,
      patronCount: stats.patronCount,
      pledgeSum: stats.totalPledgeSum.toString(),
      newPatrons: 0, // This would require tracking changes
      lostPatrons: 0, // This would require tracking changes
    };

    await storage.upsertRevenueData(revenueData);
  }
}

export const syncService = new SyncService();
