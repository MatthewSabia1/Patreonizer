import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { CampaignTable } from "@/components/dashboard/CampaignTable";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { LoadingOverlay } from "@/components/dashboard/LoadingOverlay";
import { ConnectPatreonModal } from "@/components/dashboard/ConnectPatreonModal";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { ExerciseChart } from "@/components/dashboard/ExerciseChart";
import { PaymentsTable } from "@/components/dashboard/PaymentsTable";
import { AccountForm } from "@/components/dashboard/AccountForm";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from "lucide-react";

export default function Dashboard() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showSyncOverlay, setShowSyncOverlay] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [timeRange, setTimeRange] = useState("30");
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
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
  const { data: metrics, isLoading: metricsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/metrics"],
    retry: false,
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<any[]>({
    queryKey: ["/api/campaigns"],
    retry: false,
  });

  const { data: revenueData = [], isLoading: revenueLoading } = useQuery<any[]>({
    queryKey: ["/api/dashboard/revenue-data", timeRange, selectedCampaign],
    retry: false,
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ["/api/activity/recent"],
    retry: false,
  });

  const { data: activeSyncs = [] } = useQuery<any[]>({
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
        setShowSyncOverlay(true);
        setSyncProgress(latestSync.progress || 0);
      } else {
        setShowSyncOverlay(false);
        setSyncProgress(0);
      }
    } else {
      setShowSyncOverlay(false);
      setSyncProgress(0);
    }
  }, [activeSyncs]);

  const handleSyncAll = () => {
    syncMutation.mutate({ syncType: 'full' });
  };

  const handleExportData = () => {
    exportMutation.mutate();
  };

  const handleViewPatrons = () => {
    window.location.href = '/patrons';
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
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-b border-border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Overview</h1>
              <p className="text-muted-foreground">Track your Patreon campaigns performance</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign: any) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">This year</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Synced 2 min ago</span>
              </div>

              <Button
                onClick={handleSyncAll}
                disabled={syncMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Sync Now
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <MetricsCards data={metrics} isLoading={metricsLoading} />

          {/* Main Dashboard Grid - matches mockup layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Revenue Chart */}
            <div className="lg:col-span-4">
              <RevenueChart
                revenueData={revenueData}
                patronData={revenueData}
                campaigns={campaigns}
                isLoading={revenueLoading}
              />
            </div>

            {/* Middle Column - Calendar */}
            <div className="lg:col-span-3">
              <CalendarWidget />
            </div>

            {/* Right Column - Goal Progress */}
            <div className="lg:col-span-2">
              <GoalProgress
                title="Move Goal"
                currentValue={350}
                goalValue={500}
                unit="CALORIES"
                subtitle="Set your activity goal."
              />
            </div>

            {/* Far Right Column - Account Form */}
            <div className="lg:col-span-3">
              <AccountForm />
            </div>
          </div>

          {/* Second Row - Exercise Chart and Payments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExerciseChart />
            <PaymentsTable />
          </div>

          {/* Campaign Performance & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CampaignTable campaigns={campaigns} isLoading={campaignsLoading} />
            <RecentActivity activities={activity} isLoading={activityLoading} />
          </div>

          {/* Quick Actions */}
          <QuickActions
            onConnectPage={() => setShowConnectModal(true)}
            onExportData={handleExportData}
            onViewPatrons={handleViewPatrons}
            onSyncAll={handleSyncAll}
          />
        </div>
      </main>

      {/* Modals and Overlays */}
      <LoadingOverlay
        isVisible={showSyncOverlay}
        progress={syncProgress}
        message="Syncing Campaign Data"
        details="Importing all your Patreon data. This may take a few minutes."
      />

      <ConnectPatreonModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />
    </div>
  );
}
