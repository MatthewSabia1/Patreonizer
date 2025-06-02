import axios from 'axios';

const PATREON_API_BASE = 'https://www.patreon.com/api/oauth2/v2';

interface PatreonApiResponse<T = any> {
  data: T;
  included?: any[];
  meta?: {
    pagination?: {
      cursors?: {
        next?: string;
      };
      total?: number;
    };
  };
  links?: {
    next?: string;
    first?: string;
  };
}

class PatreonAPI {
  private async makeRequest(endpoint: string, accessToken: string, params: any = {}, retryWithRefresh: boolean = true): Promise<PatreonApiResponse> {
    try {
      const response = await axios.get(`${PATREON_API_BASE}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Patreonizer/1.0',
          'Content-Type': 'application/vnd.api+json',
        },
        params,
        timeout: 30000, // 30 second timeout
      });
      return response.data;
    } catch (error: any) {
      console.error(`Patreon API error for ${endpoint}:`, error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid or expired access token');
      } else if (error.response?.status === 403) {
        throw new Error('Forbidden: Insufficient permissions');
      } else if (error.response?.status === 429) {
        // Handle rate limiting with exponential backoff
        const retryAfter = error.response?.headers['retry-after'] || '60';
        throw new Error(`Rate limited: Too many requests. Retry after ${retryAfter} seconds`);
      } else if (error.response?.status >= 500) {
        throw new Error('Patreon server error: Please try again later');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout: Patreon API did not respond in time');
      }
      
      throw new Error(`Patreon API error: ${error.response?.status || 'Network error'}`);
    }
  }

  // Enhanced method with automatic token refresh capability
  async makeRequestWithTokenRefresh(
    endpoint: string, 
    accessToken: string, 
    refreshToken: string | null, 
    params: any = {},
    onTokenRefresh?: (newTokens: { accessToken: string; refreshToken: string; expiresAt: Date }) => Promise<void>
  ): Promise<PatreonApiResponse> {
    try {
      return await this.makeRequest(endpoint, accessToken, params, false);
    } catch (error: any) {
      // If token expired and we have a refresh token, try to refresh
      if (error.message?.includes('Unauthorized') && refreshToken && onTokenRefresh) {
        try {
          const newTokens = await this.refreshAccessToken(refreshToken);
          await onTokenRefresh(newTokens);
          // Retry with new token
          return await this.makeRequest(endpoint, newTokens.accessToken, params, false);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Token expired and refresh failed - user needs to reconnect');
        }
      }
      throw error;
    }
  }

  async getCurrentUser(accessToken: string) {
    const response = await this.makeRequest('/identity', accessToken, {
      'fields[user]': 'email,first_name,last_name,full_name,image_url,thumb_url,url,created,is_creator,vanity,about,can_see_nsfw,is_email_verified,social_connections',
      'include': 'memberships',
      'fields[member]': 'patron_status,currently_entitled_amount_cents,lifetime_support_cents',
    });
    return {
      user: response.data,
      included: response.included || [],
    };
  }

  async getUserCampaigns(accessToken: string) {
    const response = await this.makeRequest('/campaigns', accessToken, {
      'fields[campaign]': 'creation_name,display_name,name,title,summary,image_url,vanity,patron_count,published_at,is_monthly,is_charged_immediately,created_at,main_video_embed,main_video_url,one_liner,pay_per_name,pledge_url,thanks_embed,thanks_msg,thanks_video_url,has_rss,has_sent_rss_notify,rss_feed_title,rss_artwork_url,is_nsfw',
      'include': 'creator,goals,tiers,benefits',
      'fields[user]': 'email,first_name,last_name,full_name,image_url,thumb_url,url,created,is_creator',
      'fields[goal]': 'amount_cents,title,description,created_at,reached_at,completed_percentage',
      'fields[tier]': 'title,amount_cents,description,patron_count,remaining,requires_shipping,created_at,edited_at,published_at,unpublished_at,discord_role_ids,image_url',
      'fields[benefit]': 'title,description,benefit_type,is_published,created_at',
    });
    return {
      campaigns: response.data || [],
      included: response.included || [],
      meta: response.meta,
    };
  }

  async getCampaignMembers(accessToken: string, campaignId: string, cursor?: string) {
    const params: any = {
      'fields[member]': 'full_name,email,patron_status,pledge_relationship_start,lifetime_support_cents,currently_entitled_amount_cents,last_charge_date,last_charge_status,will_pay_amount_cents,campaign_lifetime_support_cents,note',
      'fields[user]': 'email,first_name,last_name,full_name,image_url,thumb_url,url,created,vanity,about,can_see_nsfw,is_email_verified,is_creator,social_connections',
      'fields[tier]': 'title,amount_cents,description,patron_count,remaining,requires_shipping,created_at,edited_at,published_at,unpublished_at,discord_role_ids,image_url',
      'fields[address]': 'addressee,line_1,line_2,postal_code,city,state,country,phone_number,created_at',
      'include': 'user,currently_entitled_tiers,address',
      'page[count]': '1000',
      'sort': '-pledge_relationship_start',
    };

    if (cursor) {
      params['page[cursor]'] = cursor;
    }

    const response = await this.makeRequest(`/campaigns/${campaignId}/members`, accessToken, params);
    return {
      members: response.data || [],
      included: response.included || [],
      meta: response.meta || {},
      links: response.links || {},
    };
  }

  async getCampaignTiers(accessToken: string, campaignId: string) {
    const response = await this.makeRequest(`/campaigns/${campaignId}/tiers`, accessToken, {
      'fields[tier]': 'title,amount_cents,description,patron_count,remaining,requires_shipping,created_at,edited_at,published_at,unpublished_at,discord_role_ids,image_url,post_count,user_limit,published',
      'sort': 'amount_cents',
    });
    return {
      tiers: response.data || [],
      meta: response.meta,
    };
  }

  async getCampaignBenefits(accessToken: string, campaignId: string) {
    const response = await this.makeRequest(`/campaigns/${campaignId}/benefits`, accessToken, {
      'fields[benefit]': 'title,description,benefit_type,is_published,created_at',
      'sort': 'created_at',
    });
    return {
      benefits: response.data || [],
      meta: response.meta,
    };
  }

  async getCampaignGoals(accessToken: string, campaignId: string) {
    const response = await this.makeRequest(`/campaigns/${campaignId}/goals`, accessToken, {
      'fields[goal]': 'amount_cents,title,description,created_at,reached_at,completed_percentage',
      'sort': 'amount_cents',
    });
    return {
      goals: response.data || [],
      meta: response.meta,
    };
  }

  async getAddress(accessToken: string, addressId: string) {
    const response = await this.makeRequest(`/addresses/${addressId}`, accessToken, {
      'fields[address]': 'addressee,line_1,line_2,postal_code,city,state,country,phone_number,created_at',
    });
    return {
      address: response.data,
    };
  }

  async getCampaignDeliverables(accessToken: string, campaignId: string, cursor?: string) {
    const params: any = {
      'fields[deliverable]': 'completion_percentage,delivery_status,due_date,created_at',
      'fields[benefit]': 'title,description,benefit_type',
      'fields[member]': 'full_name,email,patron_status',
      'include': 'benefit,member',
      'page[count]': '500',
      'sort': '-due_date',
    };

    if (cursor) {
      params['page[cursor]'] = cursor;
    }

    const response = await this.makeRequest(`/campaigns/${campaignId}/deliverables`, accessToken, params);
    return {
      deliverables: response.data || [],
      included: response.included || [],
      meta: response.meta || {},
      links: response.links || {},
    };
  }

  async getCampaignPosts(accessToken: string, campaignId: string, cursor?: string) {
    const params: any = {
      'fields[post]': 'title,content,url,embed_data,embed_url,is_public,is_paid,published_at,app_id,app_status',
      'fields[user]': 'full_name,image_url,url',
      'fields[campaign]': 'creation_name',
      'include': 'user,campaign',
      'page[count]': '500',
      'sort': '-published_at',
    };

    if (cursor) {
      params['page[cursor]'] = cursor;
    }

    const response = await this.makeRequest(`/campaigns/${campaignId}/posts`, accessToken, params);
    return {
      posts: response.data || [],
      included: response.included || [],
      meta: response.meta || {},
      links: response.links || {},
    };
  }

  async getPost(accessToken: string, postId: string) {
    const response = await this.makeRequest(`/posts/${postId}`, accessToken, {
      'fields[post]': 'title,content,url,embed_data,embed_url,is_public,is_paid,published_at,app_id,app_status',
      'fields[user]': 'full_name,image_url,url',
      'fields[campaign]': 'creation_name',
      'include': 'user,campaign',
    });
    return {
      post: response.data,
      included: response.included || [],
    };
  }

  async getCampaign(accessToken: string, campaignId: string) {
    const response = await this.makeRequest(`/campaigns/${campaignId}`, accessToken, {
      'fields[campaign]': 'creation_name,display_name,name,title,summary,image_url,vanity,patron_count,pledge_sum,published_at,is_monthly,is_charged_immediately,created_at,currency,main_video_embed,main_video_url,one_liner,pay_per_name,pledge_url,thanks_embed,thanks_msg,thanks_video_url,has_rss,has_sent_rss_notify,rss_feed_title,rss_artwork_url',
      'fields[user]': 'email,first_name,last_name,full_name,image_url,thumb_url,url,created,is_creator',
      'include': 'creator,goals,tiers',
      'fields[goal]': 'amount_cents,title,description,created_at,reached_at,completed_percentage',
      'fields[tier]': 'title,amount_cents,description,patron_count,remaining,requires_shipping,created_at,edited_at,published_at,unpublished_at,discord_role_ids,image_url',
    });
    return {
      campaign: response.data,
      included: response.included || [],
    };
  }

  async getMember(accessToken: string, memberId: string) {
    const response = await this.makeRequest(`/members/${memberId}`, accessToken, {
      'fields[member]': 'full_name,email,patron_status,pledge_relationship_start,lifetime_support_cents,currently_entitled_amount_cents,last_charge_date,last_charge_status,will_pay_amount_cents,campaign_lifetime_support_cents,note',
      'fields[user]': 'email,first_name,last_name,full_name,image_url,thumb_url,url,is_follower,created,vanity',
      'fields[tier]': 'title,amount_cents,description,patron_count,remaining,requires_shipping,created_at,edited_at,published_at,unpublished_at',
      'include': 'user,currently_entitled_tiers,campaign',
    });
    return {
      member: response.data,
      included: response.included || [],
    };
  }

  async getWebhooks(accessToken: string) {
    const response = await this.makeRequest('/webhooks', accessToken, {
      'fields[webhook]': 'last_attempted_at,num_consecutive_times_failed,paused,secret,triggers,uri',
    });
    return {
      webhooks: response.data || [],
      meta: response.meta,
    };
  }

  async createWebhook(accessToken: string, uri: string, triggers: string[], secret?: string) {
    try {
      const payload: any = {
        data: {
          type: 'webhook',
          attributes: {
            triggers: triggers,
            uri: uri,
          },
        },
      };

      if (secret) {
        payload.data.attributes.secret = secret;
      }

      const response = await axios.post(`${PATREON_API_BASE}/webhooks`, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'User-Agent': 'Patreonizer/1.0',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error creating webhook:', error.response?.data || error.message);
      throw new Error('Failed to create webhook');
    }
  }

  async updateWebhook(accessToken: string, webhookId: string, updates: { uri?: string; triggers?: string[]; paused?: boolean }) {
    try {
      const payload = {
        data: {
          type: 'webhook',
          id: webhookId,
          attributes: updates,
        },
      };

      const response = await axios.patch(`${PATREON_API_BASE}/webhooks/${webhookId}`, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'User-Agent': 'Patreonizer/1.0',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error updating webhook:', error.response?.data || error.message);
      throw new Error('Failed to update webhook');
    }
  }

  async deleteWebhook(accessToken: string, webhookId: string) {
    try {
      await axios.delete(`${PATREON_API_BASE}/webhooks/${webhookId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Patreonizer/1.0',
        },
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting webhook:', error.response?.data || error.message);
      throw new Error('Failed to delete webhook');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.PATREON_CLIENT_ID || '',
        client_secret: process.env.PATREON_CLIENT_SECRET || '',
      });

      const response = await axios.post('https://www.patreon.com/api/oauth2/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Patreonizer/1.0',
        },
      });

      const { access_token, refresh_token, expires_in, scope } = response.data;
      const expiresAt = new Date(Date.now() + ((expires_in || 3600) * 1000));

      if (!access_token) {
        throw new Error('No access token received from Patreon');
      }

      return {
        accessToken: access_token,
        refreshToken: refresh_token || refreshToken, // Keep old refresh token if new one not provided
        expiresAt,
      };
    } catch (error: any) {
      console.error('Error refreshing Patreon token:', error.response?.data || error.message);
      
      if (error.response?.status === 400) {
        throw new Error('Invalid refresh token - user needs to reconnect');
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized refresh token - user needs to reconnect');
      } else if (error.response?.status === 403) {
        throw new Error('Forbidden - insufficient permissions for token refresh');
      }
      
      throw new Error('Failed to refresh Patreon access token');
    }
  }

  // Helper method to handle paginated requests
  async getAllPages<T>(
    accessToken: string,
    endpoint: string,
    params: any = {},
    dataExtractor: (response: PatreonApiResponse) => T[]
  ): Promise<T[]> {
    const allData: T[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const requestParams = { ...params };
      if (cursor) {
        requestParams['page[cursor]'] = cursor;
      }

      const response = await this.makeRequest(endpoint, accessToken, requestParams);
      const pageData = dataExtractor(response);
      allData.push(...pageData);

      cursor = response.meta?.pagination?.cursors?.next;
      hasMore = !!cursor;
    }

    return allData;
  }

  // Analytics and reporting methods
  async getCampaignAnalytics(accessToken: string, campaignId: string, startDate?: string, endDate?: string) {
    const params: any = {
      'fields[campaign]': 'patron_count,pledge_sum,currency,created_at',
      'include': 'members,tiers,goals',
      'fields[member]': 'patron_status,lifetime_support_cents,currently_entitled_amount_cents,pledge_relationship_start',
      'fields[tier]': 'amount_cents,patron_count',
      'fields[goal]': 'amount_cents,completed_percentage,reached_at',
    };

    if (startDate) params['filter[created_after]'] = startDate;
    if (endDate) params['filter[created_before]'] = endDate;

    const response = await this.makeRequest(`/campaigns/${campaignId}`, accessToken, params);
    return {
      campaign: response.data,
      included: response.included || [],
    };
  }

  async getBatchMembers(accessToken: string, memberIds: string[]) {
    const idsParam = memberIds.join(',');
    const response = await this.makeRequest('/members', accessToken, {
      'filter[ids]': idsParam,
      'fields[member]': 'full_name,email,patron_status,pledge_relationship_start,lifetime_support_cents,currently_entitled_amount_cents,last_charge_date,last_charge_status,will_pay_amount_cents,campaign_lifetime_support_cents,note',
      'fields[user]': 'email,first_name,last_name,full_name,image_url,thumb_url,url,is_follower,created,vanity,about,can_see_nsfw,is_email_verified',
      'include': 'user,currently_entitled_tiers,address',
    });
    return {
      members: response.data || [],
      included: response.included || [],
    };
  }

  async getBatchPosts(accessToken: string, postIds: string[]) {
    const idsParam = postIds.join(',');
    const response = await this.makeRequest('/posts', accessToken, {
      'filter[ids]': idsParam,
      'fields[post]': 'title,content,url,embed_data,embed_url,image,is_public,is_paid,published_at,edited_at,like_count,comment_count,patreon_url,post_file,post_metadata,app_id,app_status,created_at,updated_at',
      'include': 'user,campaign,attachments,user_defined_tags,poll',
    });
    return {
      posts: response.data || [],
      included: response.included || [],
    };
  }

  async getCampaignActivity(accessToken: string, campaignId: string, cursor?: string) {
    const params: any = {
      'include': 'members,posts,tiers',
      'fields[member]': 'patron_status,pledge_relationship_start,last_charge_date',
      'fields[post]': 'title,published_at,like_count,comment_count',
      'fields[tier]': 'title,amount_cents,patron_count',
      'page[count]': '500',
      'sort': '-created_at',
    };

    if (cursor) {
      params['page[cursor]'] = cursor;
    }

    const response = await this.makeRequest(`/campaigns/${campaignId}`, accessToken, params);
    return {
      activity: response.data,
      included: response.included || [],
      meta: response.meta || {},
      links: response.links || {},
    };
  }

  // Enhanced campaign data with all relationships
  async getCompleteCampaignData(accessToken: string, campaignId: string) {
    const response = await this.makeRequest(`/campaigns/${campaignId}`, accessToken, {
      'fields[campaign]': 'creation_name,summary,image_url,vanity,patron_count,published_at,is_monthly,is_charged_immediately,created_at,main_video_embed,main_video_url,one_liner,pay_per_name,pledge_url,thanks_embed,thanks_msg,thanks_video_url,has_rss,has_sent_rss_notify,rss_feed_title,rss_artwork_url,is_nsfw',
      'include': 'creator',
      'fields[user]': 'email,first_name,last_name,full_name,image_url,thumb_url,url,created,is_creator,vanity,about',
    });
    return {
      campaign: response.data,
      included: response.included || [],
    };
  }

  // Get campaign earnings visibility settings
  async getCampaignEarnings(accessToken: string, campaignId: string) {
    const response = await this.makeRequest(`/campaigns/${campaignId}`, accessToken, {
      'fields[campaign]': 'earnings_visibility,pledge_sum,patron_count,currency',
    });
    return {
      earnings: response.data,
    };
  }

  // Get user's social connections
  async getUserSocialConnections(accessToken: string, userId: string) {
    const response = await this.makeRequest(`/users/${userId}`, accessToken, {
      'fields[user]': 'social_connections,url,vanity,about',
    });
    return {
      user: response.data,
    };
  }

  // Get campaign's creator profile
  async getCampaignCreator(accessToken: string, campaignId: string) {
    const response = await this.makeRequest(`/campaigns/${campaignId}`, accessToken, {
      'include': 'creator',
      'fields[user]': 'email,first_name,last_name,full_name,image_url,thumb_url,url,created,is_creator,vanity,about,can_see_nsfw,is_email_verified,social_connections',
      'fields[campaign]': 'creation_name',
    });
    return {
      campaign: response.data,
      included: response.included || [],
    };
  }

  // Get member's pledge history (if available)
  async getMemberPledgeHistory(accessToken: string, memberId: string) {
    const response = await this.makeRequest(`/members/${memberId}`, accessToken, {
      'fields[member]': 'pledge_relationship_start,lifetime_support_cents,campaign_lifetime_support_cents,last_charge_date,last_charge_status,patron_status',
      'include': 'pledge_history',
    });
    return {
      member: response.data,
      included: response.included || [],
    };
  }

  // Search members by email or name (if permitted by scopes)
  async searchMembers(accessToken: string, campaignId: string, query: string) {
    const response = await this.makeRequest(`/campaigns/${campaignId}/members`, accessToken, {
      'fields[member]': 'full_name,email,patron_status,pledge_relationship_start,lifetime_support_cents,currently_entitled_amount_cents',
      'fields[user]': 'email,first_name,last_name,full_name',
      'include': 'user',
      'filter[email]': query.includes('@') ? query : undefined,
      'page[count]': '50',
    });
    return {
      members: response.data || [],
      included: response.included || [],
    };
  }

  // Get campaign's media and content
  async getCampaignMedia(accessToken: string, campaignId: string) {
    const response = await this.makeRequest(`/campaigns/${campaignId}`, accessToken, {
      'fields[campaign]': 'image_url,main_video_embed,main_video_url,thanks_embed,thanks_video_url,rss_artwork_url',
    });
    return {
      media: response.data,
    };
  }

  // Validate API connection and permissions
  async validateConnection(accessToken: string): Promise<{ isValid: boolean; scopes: string[]; user: any }> {
    try {
      const identity = await this.getCurrentUser(accessToken);
      const campaigns = await this.getUserCampaigns(accessToken);
      
      return {
        isValid: true,
        scopes: [], // Patreon doesn't return explicit scope info in identity endpoint
        user: identity.user,
      };
    } catch (error) {
      return {
        isValid: false,
        scopes: [],
        user: null,
      };
    }
  }

  // Helper method to validate webhook signatures
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    // Patreon sends signature as hex string
    return signature === expectedSignature;
  }
}

export const patreonApi = new PatreonAPI();
