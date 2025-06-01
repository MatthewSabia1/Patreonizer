import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { RefreshCw, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: accounts } = useQuery({
    queryKey: ["/api/patreon/accounts"],
    queryFn: () => api.getPatreonAccounts(),
    retry: false,
  });

  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/patron-data":
        return "Patron Data";
      case "/analytics":
        return "Analytics";
      case "/export":
        return "Data Export";
      case "/settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  };

  const getPageDescription = () => {
    switch (location) {
      case "/":
        return "Overview of your Patreon campaign performance";
      case "/patron-data":
        return "Manage and analyze your patron information";
      case "/analytics":
        return "Detailed analytics and insights";
      case "/export":
        return "Export your data for external analysis";
      case "/settings":
        return "Configure your account and preferences";
      default:
        return "Overview of your Patreon campaign performance";
    }
  };

  const handleSyncAll = async () => {
    setIsRefreshing(true);
    try {
      await api.syncAllAccounts();
      toast({
        title: "Sync Started",
        description: "Your data is being synchronized in the background.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to start data synchronization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConnectAccount = () => {
    window.location.href = "/api/patreon/connect";
  };

  return (
    <div className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
              <p className="text-muted-foreground text-sm">{getPageDescription()}</p>
            </div>
            {accounts && accounts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {accounts.length} account{accounts.length !== 1 ? "s" : ""} connected
              </Badge>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center space-x-4"
        >
          {/* Time Period Filter - only show on dashboard and analytics */}
          {(location === "/" || location === "/analytics") && (
            <Select defaultValue="30">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">This year</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Account Filter - show on relevant pages */}
          {(location === "/" || location === "/patron-data" || location === "/analytics") && accounts && accounts.length > 1 && (
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.accountName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sync Button */}
          <Button
            onClick={handleSyncAll}
            disabled={isRefreshing || !accounts || accounts.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Syncing..." : "Sync Data"}
          </Button>

          {/* Connect Account Button */}
          {accounts && accounts.length === 0 && (
            <Button
              onClick={handleConnectAccount}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect Account
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
