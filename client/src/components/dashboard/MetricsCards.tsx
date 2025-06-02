import { motion } from "framer-motion";
import { DollarSign, Users, HandHeart, UserPlus, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useScreenSize } from "@/hooks/use-mobile";

import type { DashboardMetrics } from "@/lib/types";

interface MetricsCardsProps {
  data?: DashboardMetrics;
  isLoading?: boolean;
}

export function MetricsCards({ data, isLoading }: MetricsCardsProps) {
  const { isMobile, isSmallMobile } = useScreenSize();
  
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
    <div className={`grid ${isSmallMobile ? 'grid-cols-1' : isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'} gap-4 md:gap-6`}>
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const isPositive = metric.change >= 0;
        const ChangeIcon = isPositive ? TrendingUp : TrendingDown;
        
        return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.08, 
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            whileHover={{ 
              y: -2,
              transition: { duration: 0.15, ease: "easeOut" }
            }}
          >
            <Card className="card-enhanced overflow-hidden border-border/50 backdrop-blur-sm">
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'} relative`}>
                <div className={`space-y-${isMobile ? '3' : '4'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground/80 uppercase tracking-wider`}>
                      {metric.title}
                    </h3>
                    <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl flex items-center justify-center ${metric.bgColor} shadow-lg transition-all duration-200 hover:scale-105 ring-1 ring-white/5`}>
                      <Icon className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} ${metric.iconColor} drop-shadow-sm`} />
                    </div>
                  </div>
                  
                  {isLoading ? (
                    <div className="space-y-3">
                      <div className={`${isMobile ? 'h-7 w-28' : 'h-9 w-36'} bg-muted/50 animate-pulse rounded-lg`} />
                      <div className={`${isMobile ? 'h-4 w-20' : 'h-5 w-28'} bg-muted/30 animate-pulse rounded-md`} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold ${metric.color} tracking-tight`}>
                        {metric.value}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          <ChangeIcon className={`w-3 h-3 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
                          <span className={`text-xs font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {formatPercentage(metric.change)}
                          </span>
                        </div>
                        <span className={`text-muted-foreground/70 ${isMobile ? 'text-xs' : 'text-xs'} ${isSmallMobile ? 'hidden' : ''}`}>
                          from last month
                        </span>
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
