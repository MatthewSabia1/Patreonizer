import { storage } from "./storage";
import { patreonApi } from "./patreonApi";
import type { 
  InsertPatron, 
  InsertPost, 
  InsertRevenueData, 
  PatreonCampaign,
  InsertCampaignTier,
  InsertCampaignGoal,
  InsertBenefit,
  InsertAddress
} from "@shared/schema";

class SyncService {
  private activeSyncs = new Map<number, boolean>();

  async startSync(userId: string, campaignId: number | undefined, syncType: 'initial' | 'incremental' | 'full') {
    try {
      let campaign: PatreonCampaign;
      let actualCampaignId: number;
      
      if (campaignId) {
        // Check if sync is already running for this specific campaign
        if (this.activeSyncs.get(campaignId)) {
          throw new Error('Sync already in progress for this campaign');
        }

        // Get specific campaign details
        const foundCampaign = await storage.getCampaignById(campaignId);
        if (!foundCampaign || foundCampaign.userId !== userId) {
          throw new Error('Campaign not found or access denied');
        }
        campaign = foundCampaign;
        actualCampaignId = campaignId;
      } else {
        // Get user's first campaign if no specific campaign ID provided
        const userCampaigns = await storage.getUserCampaigns(userId);
        if (userCampaigns.length === 0) {
          throw new Error('No campaigns found for user');
        }
        campaign = userCampaigns[0];
        actualCampaignId = campaign.id;
        
        // Check if sync is already running for this campaign
        if (this.activeSyncs.get(actualCampaignId)) {
          throw new Error('Sync already in progress for this campaign');
        }
      }

      // Create sync status record
      const syncStatus = await storage.createSyncStatus({
        campaignId: actualCampaignId,
        syncType,
        status: 'pending',
        progress: 0,
        totalItems: 0,
        processedItems: 0,
      });

      // Start async sync process
      this.performSync(campaign, syncStatus.id, syncType).catch(error => {
        console.error(`Sync failed for campaign ${actualCampaignId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        storage.updateSyncStatus(syncStatus.id, {
          status: 'failed',
          errorMessage,
          completedAt: new Date(),
        });
      });

      return syncStatus.id;
    } catch (error) {
      console.error('Error starting sync:', error);
      throw error instanceof Error ? error : new Error('Unknown sync error');
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

      // Get complete campaign data first to update campaign details
      await this.syncCampaignDetails(campaign, accessToken, syncId);
      
      // Sync members/patrons first - this is the most important data
      await this.syncPatrons(campaign, accessToken, syncId);
      
      // Sync posts - another important data source
      await this.syncPosts(campaign, accessToken, syncId);
      
      // Try to sync additional data, but don't fail if endpoints are restricted
      try {
        await this.syncCampaignTiers(campaign, accessToken, syncId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn('Campaign tiers sync failed (may not be available):', errorMessage);
      }
      
      try {
        await this.syncCampaignGoals(campaign, accessToken, syncId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn('Campaign goals sync failed (may not be available):', errorMessage);
      }
      
      try {
        await this.syncCampaignBenefits(campaign, accessToken, syncId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn('Campaign benefits sync failed (may not be available):', errorMessage);
      }
      
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

      const members = response.members;
      const users = response.included?.filter((item: any) => item.type === 'user') || [];
      const addresses = response.included?.filter((item: any) => item.type === 'address') || [];
      
      totalPatrons += members.length;

      for (const member of members) {
        const user = users.find((u: any) => u.id === member.relationships?.user?.data?.id);
        const address = addresses.find((a: any) => 
          member.relationships?.address?.data && a.id === member.relationships.address.data.id
        );
        
        const patronData: InsertPatron = {
          campaignId: campaign.id,
          patreonUserId: member.relationships?.user?.data?.id || member.id,
          patreonMemberId: member.id,
          email: user?.attributes?.email || null,
          fullName: user?.attributes?.full_name || member.attributes?.full_name || null,
          firstName: user?.attributes?.first_name || null,
          lastName: user?.attributes?.last_name || null,
          imageUrl: user?.attributes?.image_url || null,
          thumbUrl: user?.attributes?.thumb_url || null,
          url: user?.attributes?.url || null,
          vanity: user?.attributes?.vanity || null,
          about: user?.attributes?.about || null,
          isFollower: false, // Field not available in current API
          isCreator: user?.attributes?.is_creator || false,
          isEmailVerified: user?.attributes?.is_email_verified || false,
          canSeeNsfw: user?.attributes?.can_see_nsfw || false,
          pledgeRelationshipStart: member.attributes?.pledge_relationship_start ? 
            new Date(member.attributes.pledge_relationship_start) : null,
          lifetimeSupportCents: member.attributes?.lifetime_support_cents || 0,
          campaignLifetimeSupportCents: member.attributes?.campaign_lifetime_support_cents || 0,
          currentlyEntitledAmountCents: member.attributes?.currently_entitled_amount_cents || 0,
          patronStatus: member.attributes?.patron_status || null,
          lastChargeDate: member.attributes?.last_charge_date ? 
            new Date(member.attributes.last_charge_date) : null,
          lastChargeStatus: member.attributes?.last_charge_status || null,
          willPayAmountCents: member.attributes?.will_pay_amount_cents || 0,
          note: member.attributes?.note || null,
          currentlyEntitledTiers: member.relationships?.currently_entitled_tiers?.data || null,
          address: address ? {
            line1: address.attributes?.line_1 || null,
            line2: address.attributes?.line_2 || null,
            city: address.attributes?.city || null,
            state: address.attributes?.state || null,
            postalCode: address.attributes?.postal_code || null,
            country: address.attributes?.country || null,
            phoneNumber: address.attributes?.phone_number || null,
          } : null,
          patreonCreatedAt: user?.attributes?.created ? new Date(user.attributes.created) : null,
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

      const posts = response.posts;

      for (const post of posts) {
        const postData: InsertPost = {
          campaignId: campaign.id,
          patreonPostId: post.id,
          title: post.attributes?.title || null,
          content: post.attributes?.content || null,
          url: post.attributes?.url || null,
          patreonUrl: post.attributes?.patreon_url || null,
          embedData: post.attributes?.embed_data || null,
          embedUrl: post.attributes?.embed_url || null,
          imageUrl: post.attributes?.image?.large_url || post.attributes?.image?.url || null,
          postFile: post.attributes?.post_file || null,
          postMetadata: post.attributes?.post_metadata || null,
          isPublic: post.attributes?.is_public || false,
          isPaid: post.attributes?.is_paid || false,
          likeCount: post.attributes?.like_count || post.attributes?.num_likes || 0,
          commentCount: post.attributes?.comment_count || post.attributes?.num_comments || 0,
          appId: post.attributes?.app_id || null,
          appStatus: post.attributes?.app_status || null,
          publishedAt: post.attributes?.published_at ? 
            new Date(post.attributes.published_at) : null,
          editedAt: post.attributes?.edited_at ? 
            new Date(post.attributes.edited_at) : null,
          patreonCreatedAt: post.attributes?.created_at ? 
            new Date(post.attributes.created_at) : null,
          patreonUpdatedAt: post.attributes?.updated_at ? 
            new Date(post.attributes.updated_at) : null,
          attachments: post.relationships?.attachments?.data || null,
          userDefinedTags: post.relationships?.user_defined_tags?.data || null,
          poll: post.relationships?.poll?.data || null,
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
      pledgeSum: (stats.totalPledgeSum / 100).toString(), // Convert cents to dollars
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

  private async syncCampaignDetails(campaign: PatreonCampaign, accessToken: string, syncId: number) {
    try {
      const response = await patreonApi.getCompleteCampaignData(accessToken, campaign.patreonCampaignId);
      const campaignData = response.campaign;

      // Update campaign with comprehensive data
      await storage.updateCampaign(campaign.id, {
        creationName: campaignData.attributes?.creation_name || campaign.creationName,
        title: campaignData.attributes?.creation_name || campaign.title,
        summary: campaignData.attributes?.summary || campaign.summary,
        imageUrl: campaignData.attributes?.image_url || campaign.imageUrl,
        vanityUrl: campaignData.attributes?.vanity || campaign.vanityUrl,
        patronCount: campaignData.attributes?.patron_count || 0,
        pledgeSum: (campaignData.attributes?.pledge_sum || 0).toString(),
        currency: campaignData.attributes?.currency || 'USD',
        isMonthly: campaignData.attributes?.is_monthly ?? true,
        isChargedImmediately: campaignData.attributes?.is_charged_immediately ?? false,
        isNsfw: campaignData.attributes?.is_nsfw ?? false,
        mainVideoEmbed: campaignData.attributes?.main_video_embed || null,
        mainVideoUrl: campaignData.attributes?.main_video_url || null,
        oneLiner: campaignData.attributes?.one_liner || null,
        payPerName: campaignData.attributes?.pay_per_name || null,
        pledgeUrl: campaignData.attributes?.pledge_url || null,
        thanksEmbed: campaignData.attributes?.thanks_embed || null,
        thanksMsg: campaignData.attributes?.thanks_msg || null,
        thanksVideoUrl: campaignData.attributes?.thanks_video_url || null,
        hasRss: campaignData.attributes?.has_rss ?? false,
        hasSentRssNotify: campaignData.attributes?.has_sent_rss_notify ?? false,
        rssFeedTitle: campaignData.attributes?.rss_feed_title || null,
        rssArtworkUrl: campaignData.attributes?.rss_artwork_url || null,
        publishedAt: campaignData.attributes?.published_at ? new Date(campaignData.attributes.published_at) : null,
      });
    } catch (error) {
      console.error('Error syncing campaign details:', error);
    }
  }

  private async syncCampaignTiers(campaign: PatreonCampaign, accessToken: string, syncId: number) {
    try {
      const response = await patreonApi.getCampaignTiers(accessToken, campaign.patreonCampaignId);
      const tiers = response.tiers;

      for (const tier of tiers) {
        const tierData: InsertCampaignTier = {
          campaignId: campaign.id,
          patreonTierId: tier.id,
          title: tier.attributes?.title || 'Untitled Tier',
          description: tier.attributes?.description || null,
          amountCents: tier.attributes?.amount_cents || 0,
          imageUrl: tier.attributes?.image_url || null,
          patronCount: tier.attributes?.patron_count || 0,
          remaining: tier.attributes?.remaining || null,
          requiresShipping: tier.attributes?.requires_shipping ?? false,
          discordRoleIds: tier.attributes?.discord_role_ids || null,
          published: tier.attributes?.published ?? true,
          patreonCreatedAt: tier.attributes?.created_at ? new Date(tier.attributes.created_at) : null,
          editedAt: tier.attributes?.edited_at ? new Date(tier.attributes.edited_at) : null,
          publishedAt: tier.attributes?.published_at ? new Date(tier.attributes.published_at) : null,
          unpublishedAt: tier.attributes?.unpublished_at ? new Date(tier.attributes.unpublished_at) : null,
        };

        await storage.upsertCampaignTier(tierData);
      }
    } catch (error) {
      console.error('Error syncing campaign tiers:', error);
    }
  }

  private async syncCampaignGoals(campaign: PatreonCampaign, accessToken: string, syncId: number) {
    try {
      const response = await patreonApi.getCampaignGoals(accessToken, campaign.patreonCampaignId);
      const goals = response.goals;

      for (const goal of goals) {
        const goalData: InsertCampaignGoal = {
          campaignId: campaign.id,
          patreonGoalId: goal.id,
          title: goal.attributes?.title || 'Untitled Goal',
          description: goal.attributes?.description || null,
          amountCents: goal.attributes?.amount_cents || 0,
          completedPercentage: goal.attributes?.completed_percentage || 0,
          patreonCreatedAt: goal.attributes?.created_at ? new Date(goal.attributes.created_at) : null,
          reachedAt: goal.attributes?.reached_at ? new Date(goal.attributes.reached_at) : null,
        };

        await storage.upsertCampaignGoal(goalData);
      }
    } catch (error) {
      console.error('Error syncing campaign goals:', error);
    }
  }

  private async syncCampaignBenefits(campaign: PatreonCampaign, accessToken: string, syncId: number) {
    try {
      const response = await patreonApi.getCampaignBenefits(accessToken, campaign.patreonCampaignId);
      const benefits = response.benefits;

      for (const benefit of benefits) {
        const benefitData: InsertBenefit = {
          campaignId: campaign.id,
          patreonBenefitId: benefit.id,
          title: benefit.attributes?.title || 'Untitled Benefit',
          description: benefit.attributes?.description || null,
          benefitType: benefit.attributes?.benefit_type || null,
          isDelivered: false, // Default value since field may not be available
          isPublished: benefit.attributes?.is_published ?? true,
          nextDeliverableDue: null, // Field may not be available in current API
          deliveredDeliverables: 0, // Field may not be available in current API
          notDeliveredDeliverables: 0, // Field may not be available in current API
          patreonCreatedAt: benefit.attributes?.created_at ? new Date(benefit.attributes.created_at) : null,
        };

        await storage.upsertBenefit(benefitData);
      }
    } catch (error) {
      console.error('Error syncing campaign benefits:', error);
    }
  }
}

export const syncService = new SyncService();
