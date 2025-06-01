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
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Total Patrons", 
      value: data?.totalPatrons.toLocaleString() || "0",
      change: data?.patronChange || 0,
      icon: Users,
      color: "text-foreground",
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Avg Per Patron",
      value: data ? formatCurrency(data.avgPerPatron) : formatCurrency(0),
      change: data?.avgChange || 0,
      icon: HandHeart,
      color: "text-foreground",
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "New Patrons",
      value: data ? `+${data.newPatrons}` : "+0",
      change: data?.newPatronChange || 0,
      icon: UserPlus,
      color: "text-foreground",
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const isPositive = metric.change >= 0;
        const ChangeIcon = isPositive ? TrendingUp : TrendingDown;
        
        return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="metric-card overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </h3>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${metric.bgColor}`}>
                      <Icon className={`w-5 h-5 ${metric.iconColor}`} />
                    </div>
                  </div>
                  
                  {isLoading ? (
                    <div className="space-y-2">
                      <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className={`text-3xl font-bold ${metric.color}`}>
                        {metric.value}
                      </div>
                      <div className="flex items-center space-x-1">
                        <ChangeIcon className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {formatPercentage(metric.change)}
                        </span>
                        <span className="text-muted-foreground text-sm">from last month</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
