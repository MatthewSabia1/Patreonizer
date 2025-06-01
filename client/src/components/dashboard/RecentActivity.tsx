import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity,
  Clock,
  ArrowRight,
  ExternalLink
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="lg:col-span-2"
    >
      <Card className="card-enhanced border-border/50 h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight">Recent Activity</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-accent hover:text-accent/80 hover:bg-accent/10 transition-colors duration-200"
            >
              View All 
              <ExternalLink className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-4 p-4 rounded-lg bg-muted/20 animate-pulse">
                  <div className="w-10 h-10 bg-muted/40 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted/40 rounded w-3/4" />
                    <div className="h-3 bg-muted/30 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Recent Activity</h3>
              <p className="text-sm text-muted-foreground/80 max-w-sm leading-relaxed">
                Activity will appear here as your patrons interact with your campaigns. Connect a Patreon page to start tracking.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 border-accent/20 text-accent hover:bg-accent/10"
              >
                Connect Campaign
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.slice(0, 5).map((activity, index) => {
                const Icon = activity.icon;
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: 0.1 + index * 0.05, 
                      duration: 0.3,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    className="group p-4 rounded-xl hover:bg-muted/30 transition-all duration-200 cursor-pointer border border-transparent hover:border-border/30"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center 
                        ${activity.iconBg} ring-1 ring-white/10
                        group-hover:scale-105 transition-transform duration-200
                      `}>
                        <Icon className={`w-5 h-5 ${activity.iconColor}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground leading-tight">
                              {activity.title}
                            </p>
                            <p className="text-xs text-muted-foreground/80 mt-1">
                              {activity.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge variant="secondary" className="text-xs font-medium">
                              {activity.timestamp}
                            </Badge>
                            <ArrowRight className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {activities.length > 5 && (
                <div className="pt-4 border-t border-border/30">
                  <Button 
                    variant="ghost" 
                    className="w-full text-accent hover:text-accent/80 hover:bg-accent/10 transition-colors duration-200"
                  >
                    View {activities.length - 5} More Activities
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
