import { motion } from "framer-motion";
import { DollarSign, Users, HandHeart, UserPlus, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricsData {
  monthlyRevenue: number;
  revenueChange: number;
  totalPatrons: number;
  patronChange: number;
  avgPerPatron: number;
  avgChange: number;
  newPatrons: number;
  newPatronChange: number;
}

interface MetricsCardsProps {
  data?: MetricsData;
  isLoading?: boolean;
}

export function MetricsCards({ data, isLoading }: MetricsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const metrics = [
    {
      title: "Monthly Revenue",
      value: data ? formatCurrency(data.monthlyRevenue) : "$0",
      change: data?.revenueChange || 0,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Patrons", 
      value: data?.totalPatrons.toLocaleString() || "0",
      change: data?.patronChange || 0,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Avg. Per Patron",
      value: data ? formatCurrency(data.avgPerPatron) : "$0",
      change: data?.avgChange || 0,
      icon: HandHeart,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "New Patrons",
      value: data ? `+${data.newPatrons}` : "+0",
      change: data?.newPatronChange || 0,
      icon: UserPlus,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
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
            <Card className="metric-card bg-card border-border hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-muted-foreground text-sm font-medium">
                      {metric.title}
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {isLoading ? (
                        <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                      ) : (
                        <span className={metric.color}>{metric.value}</span>
                      )}
                    </p>
                    <div className="flex items-center space-x-1 mt-2">
                      <ChangeIcon className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPercentage(metric.change)}
                      </span>
                      <span className="text-muted-foreground text-sm">vs last month</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${metric.bgColor}`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
