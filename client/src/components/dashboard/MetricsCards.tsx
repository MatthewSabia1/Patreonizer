import { motion } from "framer-motion";
import { DollarSign, Users, HandHeart, UserPlus, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import type { DashboardMetrics } from "@/lib/types";

interface MetricsCardsProps {
  data?: DashboardMetrics;
  isLoading?: boolean;
}

export function MetricsCards({ data, isLoading }: MetricsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const metrics = [
    {
      title: "Monthly Revenue",
      value: data ? formatCurrency(data.monthlyRevenue) : formatCurrency(0),
      change: data?.revenueChange || 0,
      icon: DollarSign,
      color: "text-foreground",
      bgColor: "bg-gradient-to-br from-accent/20 to-accent/10",
      iconColor: "text-accent",
    },
    {
      title: "Total Patrons", 
      value: data?.totalPatrons.toLocaleString() || "0",
      change: data?.patronChange || 0,
      icon: Users,
      color: "text-foreground",
      bgColor: "bg-gradient-to-br from-blue-500/20 to-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      title: "Avg Per Patron",
      value: data ? formatCurrency(data.avgPerPatron) : formatCurrency(0),
      change: data?.avgChange || 0,
      icon: HandHeart,
      color: "text-foreground",
      bgColor: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/10",
      iconColor: "text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const isPositive = metric.change >= 0;
        const ChangeIcon = isPositive ? TrendingUp : TrendingDown;
        
        return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.15, 
              duration: 0.5,
              ease: "easeOut"
            }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
          >
            <Card className="card-enhanced overflow-hidden border-border/50 backdrop-blur-sm">
              <CardContent className="p-6 relative">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider">
                      {metric.title}
                    </h3>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${metric.bgColor} shadow-lg transition-transform duration-300 hover:scale-110`}>
                      <Icon className={`w-6 h-6 ${metric.iconColor}`} />
                    </div>
                  </div>
                  
                  {isLoading ? (
                    <div className="space-y-3">
                      <div className="h-9 w-36 bg-muted/50 animate-pulse rounded-lg" />
                      <div className="h-5 w-28 bg-muted/30 animate-pulse rounded-md" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className={`text-3xl font-bold ${metric.color} tracking-tight`}>
                        {metric.value}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          <ChangeIcon className={`w-3 h-3 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
                          <span className={`text-xs font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {formatPercentage(metric.change)}
                          </span>
                        </div>
                        <span className="text-muted-foreground/70 text-xs">from last month</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Subtle background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-accent/5 pointer-events-none" />
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
