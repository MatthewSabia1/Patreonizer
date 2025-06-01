import passport from "passport";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import type { Express } from "express";
import { storage } from "./storage";

const PATREON_CLIENT_ID = process.env.PATREON_CLIENT_ID || process.env.PATREON_CLIENT_ID_ENV_VAR || "patreon_client_id";
const PATREON_CLIENT_SECRET = process.env.PATREON_CLIENT_SECRET || process.env.PATREON_CLIENT_SECRET_ENV_VAR || "patreon_client_secret";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

export function setupPatreonAuth(app: Express) {
  // Configure Patreon OAuth2 strategy
  const domains = process.env.REPLIT_DOMAINS!.split(",");
  
  domains.forEach(domain => {
    const strategyName = `patreon:${domain}`;
    
    passport.use(strategyName, new OAuth2Strategy({
      authorizationURL: "https://www.patreon.com/oauth2/authorize",
      tokenURL: "https://www.patreon.com/api/oauth2/token",
      clientID: PATREON_CLIENT_ID,
      clientSecret: PATREON_CLIENT_SECRET,
      callbackURL: `https://${domain}/api/patreon/callback`,
      scope: ["identity", "identity[email]", "campaigns", "campaigns.members"],
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // The profile will be populated by our custom userProfile function
        return done(null, {
          accessToken,
          refreshToken,
          profile,
        });
      } catch (error) {
        return done(error);
      }
    }));

    // Custom userProfile function to get Patreon user data
    (passport._strategies[strategyName] as any).userProfile = function(accessToken: string, done: any) {
      this._oauth2.get(
        "https://www.patreon.com/api/oauth2/v2/identity?include=campaigns&fields%5Buser%5D=email,first_name,last_name,full_name,image_url,url&fields%5Bcampaign%5D=creation_name,display_name,image_url,is_nsfw,is_monthly,patron_count,pledge_sum,published_at,summary,url",
        accessToken,
        (err: any, body: string) => {
          if (err) {
            return done(err);
          }

          try {
            const data = JSON.parse(body);
            return done(null, data);
          } catch (parseError) {
            return done(parseError);
          }
        }
      );
    };
  });

  // Patreon OAuth routes
  app.get("/api/patreon/connect", (req, res, next) => {
    const strategyName = `patreon:${req.hostname}`;
    passport.authenticate(strategyName, {
      scope: ["identity", "identity[email]", "campaigns", "campaigns.members"],
    })(req, res, next);
  });

  app.get("/api/patreon/callback", (req, res, next) => {
    const strategyName = `patreon:${req.hostname}`;
    
    passport.authenticate(strategyName, async (err: any, authData: any) => {
      if (err) {
        console.error("Patreon auth error:", err);
        return res.redirect("/?error=patreon_auth_failed");
      }

      if (!authData) {
        return res.redirect("/?error=patreon_auth_cancelled");
      }

      try {
        const user = req.user as any;
        if (!user?.claims?.sub) {
          return res.redirect("/?error=not_logged_in");
        }

        const { accessToken, refreshToken, profile } = authData;
        const userData = profile.data;
        const campaigns = profile.included?.filter((item: any) => item.type === "campaign") || [];

        // Store the Patreon account
        const patreonAccount = await storage.createPatreonAccount({
          userId: user.claims.sub,
          patreonUserId: userData.id,
          accessToken,
          refreshToken,
          tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          accountName: userData.attributes.full_name || `${userData.attributes.first_name} ${userData.attributes.last_name}`.trim(),
          accountUrl: userData.attributes.url,
          accountImageUrl: userData.attributes.image_url,
        });

        // Store campaigns
        for (const campaign of campaigns) {
          await storage.upsertCampaign({
            patreonAccountId: patreonAccount.id,
            patreonCampaignId: campaign.id,
            name: campaign.attributes.display_name || campaign.attributes.creation_name,
            summary: campaign.attributes.summary,
            creationName: campaign.attributes.creation_name,
            imageUrl: campaign.attributes.image_url,
            isNsfw: campaign.attributes.is_nsfw || false,
            isMonthly: campaign.attributes.is_monthly || true,
            patronCount: campaign.attributes.patron_count || 0,
            pledgeSum: campaign.attributes.pledge_sum ? campaign.attributes.pledge_sum.toString() : "0",
            publishedAt: campaign.attributes.published_at ? new Date(campaign.attributes.published_at) : null,
          });
        }

        res.redirect("/?success=patreon_connected");
      } catch (error) {
        console.error("Error storing Patreon account:", error);
        res.redirect("/?error=storage_failed");
      }
    })(req, res, next);
  });
}
