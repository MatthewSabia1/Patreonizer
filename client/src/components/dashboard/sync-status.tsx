import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Zap
} from "lucide-react";
import { formatDistance } from "date-fns";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { SyncStatus } from "@/types";

export function SyncStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncingAccounts, setSyncingAccounts] = useState<Set<number>>(new Set());

  const { data: syncStatuses, isLoading } = useQuery({
    queryKey: ["/api/sync/status"],
    queryFn: () => api.getSyncStatus(),
    retry: false,
    refetchInterval: 5000, // Refresh every 5 seconds to update sync progress
  });

  const syncAccountMutation = useMutation({
    mutationFn: ({ accountId, syncType }: { accountId: number; syncType: "full" | "incremental" }) =>
      api.syncAccount(accountId, syncType),
    onSuccess: (_, { accountId }) => {
      setSyncingAccounts((prev) => new Set(prev).add(accountId));
      toast({
        title: "Sync Started",
        description: "Account synchronization has been initiated.",
      });
      // Invalidate sync status to get updated data
      queryClient.invalidateQueries({ queryKey: ["/api/sync/status"] });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to start synchronization. Please try again.",
        variant: "destructive",
      });
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: () => api.syncAllAccounts(),
    onSuccess: () => {
      toast({
        title: "Sync Started",
        description: "All accounts are being synchronized.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sync/status"] });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to start synchronization. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle2;
      case "in_progress":
        return RefreshCw;
      case "failed":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "in_progress":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "failed":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      default:
        return "text-muted-foreground bg-muted/10 border-border";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Synced";
      case "in_progress":
        return "Syncing";
      case "failed":
        return "Failed";
      case "never_synced":
        return "Never synced";
      default:
        return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Sync Status</CardTitle>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Sync Status</CardTitle>
            <Button
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncAllMutation.isPending ? "animate-spin" : ""}`} />
              Sync All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!syncStatuses || syncStatuses.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Connected Accounts</h3>
              <p className="text-sm text-muted-foreground">
                Connect your Patreon accounts to start synchronizing data
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {syncStatuses.map((status, index) => {
                const Icon = getStatusIcon(status.status);
                const colorClasses = getStatusColor(status.status);
                const isSyncing = status.status === "in_progress" || syncingAccounts.has(status.accountId);
                
                return (
                  <motion.div
                    key={status.accountId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-accent/50 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${isSyncing ? "animate-pulse" : ""}`}>
                        <Icon className={`w-3 h-3 ${status.status === "in_progress" ? "animate-spin" : ""}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{status.accountName}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {status.lastSync
                              ? `Last synced ${formatDistance(new Date(status.lastSync), new Date(), { addSuffix: true })}`
                              : "Never synced"
                            }
                          </span>
                          {status.recordsProcessed > 0 && (
                            <span className="text-xs text-muted-foreground">
                              • {status.recordsProcessed} records
                            </span>
                          )}
                        </div>
                        {status.errorMessage && (
                          <p className="text-xs text-red-500 mt-1">{status.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={colorClasses}>
                        {getStatusText(status.status)}
                      </Badge>
                      
                      {status.status !== "in_progress" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => syncAccountMutation.mutate({ 
                            accountId: status.accountId, 
                            syncType: "incremental" 
                          })}
                          disabled={syncAccountMutation.isPending}
                        >
                          <RefreshCw className={`w-3 h-3 ${
                            syncAccountMutation.isPending ? "animate-spin" : ""
                          }`} />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Overall sync status */}
              <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Data Sync Health</span>
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                    All systems operational
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  All connected accounts are synchronized and up-to-date
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
