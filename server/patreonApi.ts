import axios from 'axios';

const PATREON_API_BASE = 'https://www.patreon.com/api/oauth2/v2';

class PatreonAPI {
  private async makeRequest(endpoint: string, accessToken: string, params: any = {}) {
    try {
      const response = await axios.get(`${PATREON_API_BASE}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Patreonizer/1.0',
        },
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error(`Patreon API error for ${endpoint}:`, error.response?.data || error.message);
      throw new Error(`Patreon API error: ${error.response?.status || 'Network error'}`);
    }
  }

  async getCurrentUser(accessToken: string) {
    const data = await this.makeRequest('/identity', accessToken, {
      'fields[user]': 'email,first_name,last_name,full_name,image_url,thumb_url,url',
    });
    return data.data;
  }

  async getUserCampaigns(accessToken: string) {
    const data = await this.makeRequest('/campaigns', accessToken, {
      'fields[campaign]': 'creation_name,summary,image_url,vanity,patron_count,pledge_sum,published_at,is_monthly,is_charged_immediately',
    });
    return data.data || [];
  }

  async getCampaignMembers(accessToken: string, campaignId: string, cursor?: string) {
    const params: any = {
      'fields[member]': 'full_name,email,patron_status,pledge_relationship_start,lifetime_support_cents,currently_entitled_amount_cents,last_charge_date,last_charge_status,will_pay_amount_cents',
      'fields[user]': 'email,first_name,last_name,full_name,image_url,thumb_url,url,is_follower',
      'include': 'user',
      'page[count]': '1000',
    };

    if (cursor) {
      params['page[cursor]'] = cursor;
    }

    const data = await this.makeRequest(`/campaigns/${campaignId}/members`, accessToken, params);
    return {
      data: data.data || [],
      included: data.included || [],
      meta: data.meta || {},
      links: data.links || {},
    };
  }

  async getCampaignPosts(accessToken: string, campaignId: string, cursor?: string) {
    const params: any = {
      'fields[post]': 'title,content,url,embed_data,embed_url,image,is_public,is_paid,published_at,edited_at,like_count,comment_count',
      'page[count]': '500',
    };

    if (cursor) {
      params['page[cursor]'] = cursor;
    }

    const data = await this.makeRequest(`/campaigns/${campaignId}/posts`, accessToken, params);
    return {
      data: data.data || [],
      meta: data.meta || {},
      links: data.links || {},
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    try {
      const response = await axios.post('https://www.patreon.com/api/oauth2/token', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.PATREON_CLIENT_ID || process.env.VITE_PATREON_CLIENT_ID || "default_client_id",
        client_secret: process.env.PATREON_CLIENT_SECRET || process.env.VITE_PATREON_CLIENT_SECRET || "default_secret",
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + (expires_in * 1000));

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      };
    } catch (error: any) {
      console.error('Error refreshing Patreon token:', error.response?.data || error.message);
      throw new Error('Failed to refresh Patreon access token');
    }
  }
}

export const patreonApi = new PatreonAPI();
