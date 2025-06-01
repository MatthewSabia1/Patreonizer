import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  UserPlus, 
  TrendingUp, 
  FileText, 
  MessageCircle, 
  ExternalLink,
  DollarSign 
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'new_patron' | 'tier_upgrade' | 'new_post' | 'new_comments';
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  iconColor: string;
  iconBg: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
  isLoading?: boolean;
}

export function RecentActivity({ activities = [], isLoading }: RecentActivityProps) {
  const defaultActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'new_patron',
      title: 'Sarah M. became a patron',
      description: '$15/month • Art & Design',
      timestamp: '2 minutes ago',
      icon: UserPlus,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
    },
    {
      id: '2',
      type: 'tier_upgrade',
      title: 'John D. upgraded tier',
      description: '$10 → $25/month • Tech Tutorials',
      timestamp: '1 hour ago',
      icon: TrendingUp,
      iconColor: 'text-accent',
      iconBg: 'bg-accent/10',
    },
    {
      id: '3',
      type: 'new_post',
      title: 'New post published',
      description: '"Advanced Photoshop Techniques"',
      timestamp: '3 hours ago',
      icon: FileText,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-500/10',
    },
    {
      id: '4',
      type: 'new_comments',
      title: '5 new comments',
      description: 'On "JavaScript Best Practices"',
      timestamp: '6 hours ago',
      icon: MessageCircle,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
    },
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All <ExternalLink className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {displayActivities.map((activity, index) => {
                const Icon = activity.icon;
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${activity.iconBg}`}>
                      <Icon className={`w-4 h-4 ${activity.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary/80">
            View All Activity
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
