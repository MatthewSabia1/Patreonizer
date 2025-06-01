import type { Express, Request, Response } from "express";
import { patreonApi } from "./patreonApi";
import { storage } from "./storage";
import type { InsertPatron, InsertPost } from "@shared/schema";

export function setupWebhookHandlers(app: Express) {
  // Webhook endpoint for Patreon events
  app.post('/api/webhooks/patreon', async (req: Request, res: Response) => {
    try {
      const signature = req.headers['x-patreon-signature'] as string;
      const event = req.headers['x-patreon-event'] as string;
      const payload = JSON.stringify(req.body);

      if (!signature || !event) {
        return res.status(400).json({ error: 'Missing required webhook headers' });
      }

      // Find the webhook configuration to get the secret
      const triggerData = req.body?.data;
      const campaignId = triggerData?.relationships?.campaign?.data?.id;
      
      if (!campaignId) {
        return res.status(400).json({ error: 'No campaign ID in webhook payload' });
      }

      // Get campaign from our database
      const campaign = await storage.getCampaignByPatreonId(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Get webhook configuration
      const webhooks = await storage.getCampaignWebhooks(campaign.id);
      const webhook = webhooks.find(w => w.triggers.includes(event));
      
      if (!webhook || !webhook.secret) {
        return res.status(400).json({ error: 'Webhook configuration not found' });
      }

      // Validate webhook signature
      const isValid = patreonApi.validateWebhookSignature(payload, signature, webhook.secret);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      // Process the webhook event
      await processWebhookEvent(event, req.body, campaign);

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });
}

async function processWebhookEvent(event: string, payload: any, campaign: any) {
  const data = payload.data;
  const included = payload.included || [];

  switch (event) {
    case 'members:create':
    case 'members:update':
    case 'members:pledge:create':
    case 'members:pledge:update':
      await processMemberEvent(data, included, campaign);
      break;

    case 'members:pledge:delete':
      await processMemberDeleteEvent(data, campaign);
      break;

    case 'posts:publish':
    case 'posts:update':
      await processPostEvent(data, included, campaign);
      break;

    case 'posts:delete':
      await processPostDeleteEvent(data, campaign);
      break;

    default:
      console.log(`Unhandled webhook event: ${event}`);
  }
}

async function processMemberEvent(memberData: any, included: any[], campaign: any) {
  try {
    const user = included.find((item: any) => 
      item.type === 'user' && item.id === memberData.relationships?.user?.data?.id
    );

    const address = included.find((item: any) => 
      item.type === 'address' && 
      memberData.relationships?.address?.data && 
      item.id === memberData.relationships.address.data.id
    );

    const patronData: InsertPatron = {
      campaignId: campaign.id,
      patreonUserId: memberData.relationships?.user?.data?.id || memberData.id,
      patreonMemberId: memberData.id,
      email: user?.attributes?.email || null,
      fullName: user?.attributes?.full_name || memberData.attributes?.full_name || null,
      firstName: user?.attributes?.first_name || null,
      lastName: user?.attributes?.last_name || null,
      imageUrl: user?.attributes?.image_url || null,
      thumbUrl: user?.attributes?.thumb_url || null,
      url: user?.attributes?.url || null,
      vanity: user?.attributes?.vanity || null,
      about: user?.attributes?.about || null,
      isFollower: user?.attributes?.is_follower || false,
      isCreator: user?.attributes?.is_creator || false,
      isEmailVerified: user?.attributes?.is_email_verified || false,
      canSeeNsfw: user?.attributes?.can_see_nsfw || false,
      pledgeRelationshipStart: memberData.attributes?.pledge_relationship_start ? 
        new Date(memberData.attributes.pledge_relationship_start) : null,
      lifetimeSupportCents: memberData.attributes?.lifetime_support_cents || 0,
      campaignLifetimeSupportCents: memberData.attributes?.campaign_lifetime_support_cents || 0,
      currentlyEntitledAmountCents: memberData.attributes?.currently_entitled_amount_cents || 0,
      patronStatus: memberData.attributes?.patron_status || null,
      lastChargeDate: memberData.attributes?.last_charge_date ? 
        new Date(memberData.attributes.last_charge_date) : null,
      lastChargeStatus: memberData.attributes?.last_charge_status || null,
      willPayAmountCents: memberData.attributes?.will_pay_amount_cents || 0,
      note: memberData.attributes?.note || null,
      currentlyEntitledTiers: memberData.relationships?.currently_entitled_tiers?.data || null,
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
    
    // Update campaign stats
    await updateCampaignStatsFromWebhook(campaign.id);
  } catch (error) {
    console.error('Error processing member webhook event:', error);
  }
}

async function processMemberDeleteEvent(memberData: any, campaign: any) {
  try {
    // In a real implementation, you might want to mark the patron as inactive
    // rather than deleting them to preserve historical data
    console.log(`Member ${memberData.id} removed from campaign ${campaign.patreonCampaignId}`);
    
    // Update campaign stats
    await updateCampaignStatsFromWebhook(campaign.id);
  } catch (error) {
    console.error('Error processing member delete webhook event:', error);
  }
}

async function processPostEvent(postData: any, included: any[], campaign: any) {
  try {
    const postEntry: InsertPost = {
      campaignId: campaign.id,
      patreonPostId: postData.id,
      title: postData.attributes?.title || null,
      content: postData.attributes?.content || null,
      url: postData.attributes?.url || null,
      patreonUrl: postData.attributes?.patreon_url || null,
      embedData: postData.attributes?.embed_data || null,
      embedUrl: postData.attributes?.embed_url || null,
      imageUrl: postData.attributes?.image?.large_url || postData.attributes?.image?.url || null,
      postFile: postData.attributes?.post_file || null,
      postMetadata: postData.attributes?.post_metadata || null,
      isPublic: postData.attributes?.is_public || false,
      isPaid: postData.attributes?.is_paid || false,
      likeCount: postData.attributes?.like_count || 0,
      commentCount: postData.attributes?.comment_count || 0,
      appId: postData.attributes?.app_id || null,
      appStatus: postData.attributes?.app_status || null,
      publishedAt: postData.attributes?.published_at ? 
        new Date(postData.attributes.published_at) : null,
      editedAt: postData.attributes?.edited_at ? 
        new Date(postData.attributes.edited_at) : null,
      patreonCreatedAt: postData.attributes?.created_at ? 
        new Date(postData.attributes.created_at) : null,
      patreonUpdatedAt: postData.attributes?.updated_at ? 
        new Date(postData.attributes.updated_at) : null,
      attachments: postData.relationships?.attachments?.data || null,
      userDefinedTags: postData.relationships?.user_defined_tags?.data || null,
      poll: postData.relationships?.poll?.data || null,
    };

    await storage.upsertPost(postEntry);
  } catch (error) {
    console.error('Error processing post webhook event:', error);
  }
}

async function processPostDeleteEvent(postData: any, campaign: any) {
  try {
    console.log(`Post ${postData.id} deleted from campaign ${campaign.patreonCampaignId}`);
    // In a real implementation, you might want to mark the post as deleted
    // rather than removing it to preserve historical data
  } catch (error) {
    console.error('Error processing post delete webhook event:', error);
  }
}

async function updateCampaignStatsFromWebhook(campaignId: number) {
  try {
    const stats = await storage.getCampaignStats(campaignId);
    await storage.updateCampaign(campaignId, {
      patronCount: stats.patronCount,
      pledgeSum: stats.totalPledgeSum.toString(),
    });
  } catch (error) {
    console.error('Error updating campaign stats from webhook:', error);
  }
}