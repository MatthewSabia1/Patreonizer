import passport from "passport";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import type { Express } from "express";
import { patreonApi } from "./patreonApi";
import { storage } from "./storage";
import { syncService } from "./syncService";

const PATREON_CLIENT_ID = process.env.PATREON_CLIENT_ID || process.env.VITE_PATREON_CLIENT_ID || "default_client_id";
const PATREON_CLIENT_SECRET = process.env.PATREON_CLIENT_SECRET || process.env.VITE_PATREON_CLIENT_SECRET || "default_secret";

// Debug logging for credentials
console.log('Patreon OAuth Config:', {
  clientId: PATREON_CLIENT_ID ? `${PATREON_CLIENT_ID.substring(0, 10)}...` : 'NOT SET',
  clientSecret: PATREON_CLIENT_SECRET ? `${PATREON_CLIENT_SECRET.substring(0, 10)}...` : 'NOT SET',
  hasCredentials: !!(PATREON_CLIENT_ID && PATREON_CLIENT_SECRET && PATREON_CLIENT_ID !== 'default_client_id')
});

export function setupPatreonAuth(app: Express) {
  // Get the base URL from REPLIT_DOMAINS or fallback
  const baseUrl = process.env.REPLIT_DOMAINS ? 
    `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
    'http://localhost:5000';

  console.log('Patreon OAuth Callback URL:', `${baseUrl}/api/auth/patreon/callback`);

  passport.use('patreon', new OAuth2Strategy({
    authorizationURL: 'https://www.patreon.com/oauth2/authorize',
    tokenURL: 'https://www.patreon.com/api/oauth2/token',
    clientID: PATREON_CLIENT_ID,
    clientSecret: PATREON_CLIENT_SECRET,
    callbackURL: `${baseUrl}/api/auth/patreon/callback`,
    scope: 'identity campaigns campaigns.members campaigns.posts w:campaigns.webhook',
    customHeaders: {
      'User-Agent': 'Patreonizer/1.0',
    },
  }, async (accessToken: string, refreshToken: string, params: any, profile: any, done: any) => {
    try {
      const expiresAt = params.expires_in ? 
        new Date(Date.now() + (params.expires_in * 1000)) : 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

      done(null, { 
        accessToken, 
        refreshToken, 
        expiresAt,
        scope: params.scope || 'identity campaigns campaigns.members campaigns.posts my-campaign pledges-to-me'
      });
    } catch (error) {
      done(error);
    }
  }));

  // Patreon OAuth routes
  app.get('/api/auth/patreon', (req: any, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Must be logged in to connect Patreon" });
    }
    
    // Store user ID in session for later use
    req.session.connectingUserId = req.user.claims.sub;
    
    passport.authenticate('patreon', {
      scope: 'identity campaigns campaigns.members campaigns.posts w:campaigns.webhook'
    })(req, res, next);
  });

  app.get('/api/auth/patreon/callback', 
    passport.authenticate('patreon', { session: false }),
    async (req: any, res) => {
      try {
        let { accessToken, refreshToken, expiresAt, scope } = req.user as {
          accessToken: string;
          refreshToken: string;
          expiresAt: Date;
          scope: string;
        };
        const userId = req.session.connectingUserId;

        if (!userId) {
          return res.redirect('/?error=session_expired');
        }

        // Define onTokenRefresh callback for this scope
        const onTokenRefresh = async (newTokens: { accessToken: string; refreshToken: string; expiresAt: Date }) => {
          console.log("Patreon tokens refreshed during OAuth callback flow.");
          accessToken = newTokens.accessToken;
          refreshToken = newTokens.refreshToken;
          expiresAt = newTokens.expiresAt;
          // Note: We don't have a specific campaignId to update storage here yet.
          // The refreshed tokens will be used when creating new campaign entries.
        };

        // Verify we have the required scopes
        const requiredScopes = ['identity', 'campaigns', 'campaigns.members'];
        const grantedScopes = scope ? scope.split(' ') : [];
        
        // Check for identity scope (can be identity or identity[email])
        const hasIdentity = grantedScopes.some((s: string) => s.startsWith('identity'));
        const hasCampaigns = grantedScopes.includes('campaigns');
        const hasMembers = grantedScopes.includes('campaigns.members');
        
        if (!hasIdentity || !hasCampaigns || !hasMembers) {
          console.error('Missing required scopes. Granted:', grantedScopes);
          return res.redirect('/?error=insufficient_permissions');
        }

        // Fetch user identity and campaigns from Patreon API
        const identity = await patreonApi.getCurrentUser(accessToken, refreshToken, onTokenRefresh);
        const campaignsResponse = await patreonApi.getUserCampaigns(accessToken, refreshToken, onTokenRefresh);

        if (!campaignsResponse.campaigns || campaignsResponse.campaigns.length === 0) {
          return res.redirect('/?error=no_campaigns_found');
        }

        // Store each campaign with authentic Patreon data
        for (const campaignData of campaignsResponse.campaigns) {
          // Use vanity URL for page display name, fallback to creation_name
          const pageDisplayName = campaignData.attributes?.vanity || 
                                campaignData.attributes?.creation_name || 
                                'Untitled Campaign';
          
          const campaign = await storage.createCampaign({
            userId,
            patreonCampaignId: campaignData.id,
            creationName: pageDisplayName,
            title: campaignData.attributes?.creation_name || 'Untitled Campaign',
            summary: campaignData.attributes.summary || null,
            imageUrl: campaignData.attributes.image_url || null,
            vanityUrl: campaignData.attributes.vanity || null,
            patronCount: campaignData.attributes.patron_count || 0,
            pledgeSum: "0", // Will be updated during sync
            accessToken,
            refreshToken,
            tokenExpiresAt: expiresAt,
          });

          // Start initial sync for the campaign to get authentic patron data
          await syncService.startSync(userId, campaign.id, 'initial');
        }

        // Clean up session
        delete req.session.connectingUserId;

        res.redirect('/?connected=true');
      } catch (error) {
        console.error('Patreon OAuth callback error:', error);
        
        // Handle specific API errors
        const err = error as Error;
        if (err.message?.includes('Unauthorized')) {
          return res.redirect('/?error=invalid_token');
        } else if (err.message?.includes('Forbidden')) {
          return res.redirect('/?error=access_denied');
        } else if (err.message?.includes('Rate limited')) {
          return res.redirect('/?error=rate_limited');
        }
        
        res.redirect('/?error=connection_failed');
      }
    }
  );

  // Disconnect Patreon account
  app.post('/api/auth/patreon/disconnect', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Must be logged in" });
      }

      const userId = req.user.claims.sub;
      const { campaignId } = req.body;

      if (campaignId) {
        // Disconnect specific campaign
        await storage.deleteCampaign(campaignId);
      } else {
        // Disconnect all campaigns
        const campaigns = await storage.getUserCampaigns(userId);
        for (const campaign of campaigns) {
          await storage.deleteCampaign(campaign.id);
        }
      }

      res.json({ message: "Patreon account disconnected successfully" });
    } catch (error) {
      console.error('Error disconnecting Patreon:', error);
      res.status(500).json({ message: "Failed to disconnect Patreon account" });
    }
  });
}
