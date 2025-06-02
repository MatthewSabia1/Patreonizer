import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { ConnectPatreonModal } from "@/components/dashboard/ConnectPatreonModal";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { 
  Plus, 
  RotateCcw, 
  Trash2, 
  ExternalLink,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

interface Campaign {
  id: number;
  creationName: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  vanityUrl: string | null;
  patronCount: number;
  pledgeSum: string;
  actualMonthlyRevenue?: number;
  actualPatronCount?: number;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

export default function ConnectedPages() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    retry: false,
  });

  // Fetch active syncs
  const { data: activeSyncs = [] } = useQuery({
    queryKey: ["/api/sync/active"],
    refetchInterval: 2000,
    retry: false,
  });

  // Delete campaign mutation
  const deleteMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      await apiRequest("DELETE", `/api/campaigns/${campaignId}`);
    },
    onSuccess: () => {
      toast({
        title: "Campaign Disconnected",
        description: "The campaign has been successfully disconnected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setShowDeleteDialog(false);
      setCampaignToDelete(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Delete Failed",
        description: "Failed to disconnect campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Sync campaign mutation
  const syncMutation = useMutation({
    mutationFn: async ({ campaignId, syncType }: { campaignId: number; syncType: string }) => {
      await apiRequest("POST", "/api/sync/start", { campaignId, syncType });
    },
    onSuccess: () => {
      toast({
        title: "Sync Started",
        description: "Campaign data sync has been initiated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sync/active"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Sync Failed",
        description: "Failed to start campaign sync. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const cleanSummary = (html: string) => {
    if (!html) return '';
    // Remove HTML tags and decode entities
    const withoutTags = html.replace(/<[^>]*>/g, ' ');
    // Replace multiple spaces with single space
    const cleaned = withoutTags.replace(/\s+/g, ' ').trim();
    // Limit length
    return cleaned.length > 150 ? cleaned.slice(0, 150) + '...' : cleaned;
  };

  const getSyncStatus = (campaignId: number) => {
    const sync = activeSyncs.find((s: any) => s.campaignId === campaignId);
    if (!sync) return null;
    return sync;
  };

  const getStatusBadge = (campaign: Campaign) => {
    const sync = getSyncStatus(campaign.id);
    
    if (sync) {
      if (sync.status === 'in_progress') {
        return (
          <Badge className="bg-blue-500/10 text-blue-500">
            <Clock className="w-3 h-3 mr-1" />
            Syncing ({sync.progress}%)
          </Badge>
        );
      } else if (sync.status === 'failed') {
        return (
          <Badge className="bg-red-500/10 text-red-500">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Sync Failed
          </Badge>
        );
      }
    }

    if (campaign.isActive) {
      return (
        <Badge className="bg-green-500/10 text-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }

    return (
      <Badge className="bg-yellow-500/10 text-yellow-500">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Limited
      </Badge>
    );
  };

  const handleDeleteClick = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setShowDeleteDialog(true);
  };

  const handleSyncClick = (campaignId: number) => {
    syncMutation.mutate({ campaignId, syncType: 'full' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar onConnectPatreon={() => setShowConnectModal(true)} />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-b border-border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Connected Pages</h1>
              <p className="text-muted-foreground">
                Manage your connected Patreon campaigns and sync status
              </p>
            </div>
            
            <Button
              onClick={() => setShowConnectModal(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect New Page
            </Button>
          </div>
        </motion.header>

        {/* Content */}
        <div className="p-6">
          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
          >
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ExternalLink className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Connected Pages</p>
                    <p className="text-2xl font-bold">{campaigns.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Patrons</p>
                    <p className="text-2xl font-bold">
                      {campaigns.reduce((sum: number, campaign: Campaign) => sum + campaign.patronCount, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        campaigns.reduce((sum: number, campaign: Campaign) => sum + (campaign.actualMonthlyRevenue || parseFloat(campaign.pledgeSum)), 0).toString()
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Campaigns Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {campaignsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-card border-border">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-muted animate-pulse rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                            <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted animate-pulse rounded" />
                          <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <ExternalLink className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Connected Pages</h3>
                  <p className="text-muted-foreground mb-6">
                    Connect your first Patreon campaign to start tracking your creator analytics.
                  </p>
                  <Button
                    onClick={() => setShowConnectModal(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Your First Page
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign: Campaign, index: number) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card border-border hover:shadow-lg transition-all duration-200">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={campaign.imageUrl || ""} alt={campaign.creationName} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {campaign.creationName[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg">{campaign.creationName}</h3>
                              {campaign.vanityUrl && (
                                <p className="text-sm text-muted-foreground">
                                  patreon.com/{campaign.vanityUrl}
                                </p>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(campaign)}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {campaign.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {cleanSummary(campaign.summary)}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-secondary/20 rounded-lg">
                            <p className="text-lg font-bold">{campaign.patronCount}</p>
                            <p className="text-xs text-muted-foreground">Patrons</p>
                          </div>
                          <div className="text-center p-3 bg-secondary/20 rounded-lg">
                            <p className="text-lg font-bold">{formatCurrency(campaign.pledgeSum)}</p>
                            <p className="text-xs text-muted-foreground">Monthly</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Last sync: {formatDate(campaign.lastSyncAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncClick(campaign.id)}
                            disabled={syncMutation.isPending || !!getSyncStatus(campaign.id)}
                            className="flex-1"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Sync
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(campaign)}
                            disabled={deleteMutation.isPending}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Connect Modal */}
      <ConnectPatreonModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect "{campaignToDelete?.title}"? 
              This will remove all associated data from Patreonizer and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => campaignToDelete && deleteMutation.mutate(campaignToDelete.id)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
