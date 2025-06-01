import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react";

interface Campaign {
  id: number;
  title: string;
  imageUrl?: string;
  patronCount: number;
  pledgeSum: number;
  isActive: boolean;
  lastSyncAt?: string;
}

interface CampaignTableProps {
  campaigns?: Campaign[];
  isLoading?: boolean;
}

export function CampaignTable({ campaigns = [], isLoading }: CampaignTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500";
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? "Active" : "Limited";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="lg:col-span-2"
    >
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Campaign Performance</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All <ExternalLink className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-muted animate-pulse rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
                  </div>
                  <div className="w-16 h-4 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No campaigns connected yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your first Patreon campaign to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 font-medium text-muted-foreground">Campaign</th>
                    <th className="text-left py-3 font-medium text-muted-foreground">Patrons</th>
                    <th className="text-left py-3 font-medium text-muted-foreground">Revenue</th>
                    <th className="text-left py-3 font-medium text-muted-foreground">Growth</th>
                    <th className="text-left py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign, index) => (
                    <motion.tr
                      key={campaign.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={campaign.imageUrl} alt={campaign.title} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {campaign.title[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{campaign.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Last sync: {campaign.lastSyncAt ? 
                                new Date(campaign.lastSyncAt).toLocaleDateString() : 
                                'Never'
                              }
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 font-medium">{campaign.patronCount.toLocaleString()}</td>
                      <td className="py-4 font-medium">{formatCurrency(campaign.pledgeSum)}</td>
                      <td className="py-4">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-green-500 text-sm">+8.2%</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge className={getStatusColor(campaign.isActive)}>
                          {getStatusText(campaign.isActive)}
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
