import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useScreenSize } from "@/hooks/use-mobile";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { DashboardMetrics, ActivityItem, SyncStatus, RevenueData, PatreonCampaign } from "@/lib/types";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { CampaignTable } from "@/components/dashboard/CampaignTable";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { LoadingOverlay } from "@/components/dashboard/LoadingOverlay";
import { ConnectPatreonModal } from "@/components/dashboard/ConnectPatreonModal";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { AdvancedAnalytics } from "@/components/dashboard/AdvancedAnalytics";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from "lucide-react";

export default function Dashboard() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showSyncOverlay, setShowSyncOverlay] = useState(false);
  const [syncOverlayDismissed, setSyncOverlayDismissed] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [timeRange, setTimeRange] = useState("30");
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isMobile, isTablet, isSmallMobile } = useScreenSize();
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

  // Fetch dashboard data
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
    retry: false,
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<PatreonCampaign[]>({
    queryKey: ["/api/campaigns"],
    retry: false,
  });

  const { data: revenueData = [], isLoading: revenueLoading } = useQuery<RevenueData[]>({
    queryKey: ["/api/dashboard/revenue-data", timeRange, selectedCampaign],
    retry: false,
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ["/api/activity/recent"],
    retry: false,
  });

  const { data: activeSyncs = [] } = useQuery<SyncStatus[]>({
    queryKey: ["/api/sync/active"],
    refetchInterval: 2000, // Poll every 2 seconds for active syncs
    retry: false,
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async ({ campaignId, syncType }: { campaignId?: number; syncType: string }) => {
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
        description: "Failed to start data sync. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export data mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/patrons/export", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export failed");
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patrons-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: "Patron data has been downloaded as CSV.",
      });
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
        title: "Export Failed",
        description: "Failed to export patron data. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle active syncs
  useEffect(() => {
    if (activeSyncs.length > 0) {
      const latestSync = activeSyncs[0];
      if (latestSync.status === 'in_progress') {
        // Only show overlay if not dismissed
        setShowSyncOverlay(!syncOverlayDismissed);
        setSyncProgress(latestSync.progress || 0);
      } else {
        setShowSyncOverlay(false);
        setSyncProgress(0);
        setSyncOverlayDismissed(false); // Reset dismissal when sync completes
      }
    } else {
      setShowSyncOverlay(false);
      setSyncProgress(0);
      setSyncOverlayDismissed(false); // Reset dismissal when no active syncs
    }
  }, [activeSyncs, syncOverlayDismissed]);

  const handleSyncAll = () => {
    syncMutation.mutate({ syncType: 'full' });
  };

  const handleExportData = () => {
    exportMutation.mutate();
  };

  const handleViewPatrons = () => {
    window.location.href = '/patrons';
  };

  const handleCloseSyncOverlay = () => {
    setSyncOverlayDismissed(true);
    setShowSyncOverlay(false);
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
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar onConnectPatreon={() => setShowConnectModal(true)} />
      
      <main className={`flex-1 overflow-auto scrollbar-custom ${isMobile ? 'mobile-content' : ''}`}>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`bg-card/95 backdrop-glass border-b border-border/50 shadow-card-soft ${
            isMobile ? 'mobile-header p-3' : 'p-4 md:p-6'
          }`}
        >
          <div className={`flex flex-col ${isMobile ? 'space-y-3' : 'space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0'}`}>
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <h1 className={`${
                isSmallMobile ? 'text-xl' : isMobile ? 'text-2xl' : 'text-3xl'
              } font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent tracking-tight`}>
                Dashboard Overview
              </h1>
              {!isSmallMobile && (
                <p className={`text-muted-foreground/70 font-medium mt-1 ${isMobile ? 'text-sm' : ''}`}>
                  Track your Patreon campaigns performance
                </p>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`flex flex-col ${
                isMobile ? 'space-y-2' : 'space-y-3 md:flex-row md:items-center md:space-x-4 md:space-y-0'
              }`}
            >
              {!isSmallMobile && <NotificationCenter />}
              
              <div className={`flex ${
                isMobile ? 'flex-col space-y-2' : 'flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0'
              }`}>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger className={`${
                    isMobile ? 'w-full mobile-focus' : 'w-44'
                  } input-enhanced border-border/60 focus:border-accent/50`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={`glass-card ${isMobile ? 'mobile-popover' : ''}`}>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                        {campaign.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className={`${
                    isMobile ? 'w-full mobile-focus' : 'w-36'
                  } input-enhanced border-border/60 focus:border-accent/50`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={`glass-card ${isMobile ? 'mobile-popover' : ''}`}>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">This year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!isMobile && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground/80 bg-muted/20 px-3 py-2 rounded-lg border border-border/20 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full status-dot status-success animate-pulse" />
                  <span className="font-medium">Synced 2 min ago</span>
                </div>
              )}

              <Button
                onClick={handleSyncAll}
                disabled={syncMutation.isPending}
                className={`${
                  isMobile ? 'w-full mobile-focus' : ''
                } bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-accent-foreground btn-glow transition-all duration-300 shadow-lg hover:shadow-glow border-0 ${
                  isSmallMobile ? 'btn-small-mobile' : ''
                }`}
                size={isMobile ? "default" : "default"}
              >
                <RotateCcw className={`${
                  isSmallMobile ? 'w-3 h-3' : 'w-4 h-4'
                } mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
              </Button>
            </motion.div>
          </div>
        </motion.header>

        {/* Dashboard Content */}
        <div className={`${
          isSmallMobile ? 'p-3 space-y-4' : isMobile ? 'mobile-p-4 mobile-gap-4' : 'p-8 space-y-6 md:space-y-8'
        } page-transition ${isMobile ? 'pb-6' : ''}`}>
          {/* Key Metrics */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <MetricsCards data={metrics} isLoading={metricsLoading} />
          </motion.section>

          {/* Charts */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <RevenueChart
              revenueData={revenueData}
              patronData={revenueData}
              campaigns={campaigns}
              isLoading={revenueLoading}
            />
          </motion.section>

          {/* Quick Actions */}
          <QuickActions
            onConnectPage={() => setShowConnectModal(true)}
            onExportData={handleExportData}
            onViewPatrons={handleViewPatrons}
            onSyncAll={handleSyncAll}
          />

          {/* Advanced Analytics */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <AdvancedAnalytics
              campaigns={campaigns}
              revenueData={revenueData}
              patronData={revenueData}
              isLoading={revenueLoading || campaignsLoading}
            />
          </motion.section>

          {/* Campaign Performance & Recent Activity */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={isMobile ? 'pb-4' : 'pb-8'}
          >
            <div className={`grid grid-cols-1 ${
              isMobile ? 'mobile-gap-4' : isTablet ? 'tablet-card-grid' : 'lg:grid-cols-3 gap-8'
            }`}>
              <CampaignTable campaigns={campaigns} isLoading={campaignsLoading} />
              <RecentActivity activities={[]} isLoading={activityLoading} />
            </div>
          </motion.section>
        </div>
      </main>

      {/* Modals and Overlays */}
      <LoadingOverlay
        isVisible={showSyncOverlay}
        progress={syncProgress}
        message="Syncing Campaign Data"
        details="Importing all your Patreon data. This may take a few minutes."
        onClose={handleCloseSyncOverlay}
      />

      <ConnectPatreonModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />
    </div>
  );
}
