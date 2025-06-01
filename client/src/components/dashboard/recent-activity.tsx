import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  UserPlus, 
  ArrowUp, 
  FileText, 
  Heart,
  ExternalLink,
  Clock
} from "lucide-react";
import { formatDistance } from "date-fns";
import { api } from "@/lib/api";
import type { RecentActivity } from "@/types";

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/dashboard/activity"],
    queryFn: () => api.getRecentActivity(10),
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "patron":
        return UserPlus;
      case "upgrade":
        return ArrowUp;
      case "post":
        return FileText;
      case "like":
        return Heart;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "patron":
        return "text-green-500 bg-green-500/10";
      case "upgrade":
        return "text-blue-500 bg-blue-500/10";
      case "post":
        return "text-purple-500 bg-purple-500/10";
      case "like":
        return "text-pink-500 bg-pink-500/10";
      default:
        return "text-muted-foreground bg-muted/10";
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <Skeleton className="h-8 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              <ExternalLink className="w-4 h-4 mr-1" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!activities || activities.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Recent Activity</h3>
              <p className="text-sm text-muted-foreground">
                Activity will appear here as your patrons interact with your campaigns
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                const colorClasses = getActivityColor(activity.type);
                
                return (
                  <motion.div
                    key={`${activity.timestamp}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClasses}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {activity.campaignName}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistance(new Date(activity.timestamp), new Date(), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    {activity.amount && (
                      <div className="text-sm font-medium text-green-500">
                        {activity.amount}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
