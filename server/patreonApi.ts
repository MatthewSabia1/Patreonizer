import axios, { AxiosResponse } from "axios";
import { storage } from "./storage";
import type { PatreonAccount } from "@shared/schema";

export class PatreonAPI {
  private baseURL = "https://www.patreon.com/api/oauth2/v2";

  async refreshAccessToken(account: PatreonAccount): Promise<string> {
    if (!account.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await axios.post("https://www.patreon.com/api/oauth2/token", {
        grant_type: "refresh_token",
        refresh_token: account.refreshToken,
        client_id: process.env.PATREON_CLIENT_ID || process.env.PATREON_CLIENT_ID_ENV_VAR || "patreon_client_id",
        client_secret: process.env.PATREON_CLIENT_SECRET || process.env.PATREON_CLIENT_SECRET_ENV_VAR || "patreon_client_secret",
      });

      const { access_token, refresh_token, expires_in } = response.data;
      
      // Update the account with new tokens
      await storage.updatePatreonAccount(account.id, {
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      });

      return access_token;
    } catch (error) {
      console.error("Failed to refresh Patreon access token:", error);
      throw new Error("Failed to refresh access token");
    }
  }

  async makeAuthenticatedRequest(account: PatreonAccount, url: string): Promise<AxiosResponse> {
    let accessToken = account.accessToken;

    // Check if token needs refresh
    if (account.tokenExpiresAt && new Date() >= account.tokenExpiresAt) {
      accessToken = await this.refreshAccessToken(account);
    }

    try {
      return await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token might be invalid, try refreshing
        accessToken = await this.refreshAccessToken(account);
        return await axios.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
      throw error;
    }
  }

  async getCampaigns(account: PatreonAccount) {
    const url = `${this.baseURL}/campaigns?include=tiers,goals&fields%5Bcampaign%5D=creation_name,display_name,image_url,is_nsfw,is_monthly,patron_count,pledge_sum,published_at,summary,url&fields%5Btier%5D=amount_cents,created_at,description,discord_role_ids,edited_at,image_url,patron_count,published,published_at,requires_shipping,title,unpublished_at,url&fields%5Bgoal%5D=amount_cents,completed_percentage,created_at,description,reached_at,title`;

    const response = await this.makeAuthenticatedRequest(account, url);
    return response.data;
  }

  async getCampaignMembers(account: PatreonAccount, campaignId: string, cursor?: string) {
    let url = `${this.baseURL}/campaigns/${campaignId}/members?include=currently_entitled_tiers,user&fields%5Bmember%5D=campaign_lifetime_support_cents,currently_entitled_amount_cents,email,full_name,is_follower,last_charge_date,last_charge_status,lifetime_support_cents,next_charge_date,note,patron_status,pledge_cadence,pledge_relationship_start,will_pay_amount_cents&fields%5Btier%5D=amount_cents,created_at,description,discord_role_ids,edited_at,image_url,patron_count,published,published_at,requires_shipping,title,unpublished_at,url&fields%5Buser%5D=email,first_name,full_name,image_url,last_name,social_connections,thumb_url,url,vanity`;

    if (cursor) {
      url += `&page%5Bcursor%5D=${cursor}`;
    }

    const response = await this.makeAuthenticatedRequest(account, url);
    return response.data;
  }

  async getCampaignPosts(account: PatreonAccount, campaignId: string, cursor?: string) {
    let url = `${this.baseURL}/campaigns/${campaignId}/posts?include=user,campaign,access_rules.tier&fields%5Bpost%5D=app_id,app_status,content,embed_data,embed_url,is_automated_monthly_charge,is_paid,like_count,min_cents_pledged_to_view,patreon_url,pledge_url,published_at,teaser_text,title,upgrade_url,url,was_posted_by_campaign_owner&fields%5Buser%5D=email,first_name,full_name,image_url,last_name,social_connections,thumb_url,url,vanity&fields%5Bcampaign%5D=creation_name,display_name,image_url,is_nsfw,is_monthly,patron_count,pledge_sum,published_at,summary,url&fields%5Baccess_rule%5D=access_rule_type,amount_cents&fields%5Btier%5D=amount_cents,created_at,description,discord_role_ids,edited_at,image_url,patron_count,published,published_at,requires_shipping,title,unpublished_at,url`;

    if (cursor) {
      url += `&page%5Bcursor%5D=${cursor}`;
    }

    const response = await this.makeAuthenticatedRequest(account, url);
    return response.data;
  }

  async getUserIdentity(account: PatreonAccount) {
    const url = `${this.baseURL}/identity?include=campaigns&fields%5Buser%5D=email,first_name,last_name,full_name,image_url,url&fields%5Bcampaign%5D=creation_name,display_name,image_url,is_nsfw,is_monthly,patron_count,pledge_sum,published_at,summary,url`;

    const response = await this.makeAuthenticatedRequest(account, url);
    return response.data;
  }
}

export const patreonAPI = new PatreonAPI();
