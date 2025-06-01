import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  BarChart3,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import type { DashboardMetrics } from "@/types";

interface MetricsCardsProps {
  metrics?: DashboardMetrics;
  isLoading: boolean;
}

export function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  const cards = [
    {
      title: "Monthly Revenue",
      value: metrics ? `$${parseFloat(metrics.totalRevenue).toLocaleString()}` : "$0",
      change: metrics?.revenueGrowth || 0,
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Patrons",
      value: metrics?.totalPatrons.toLocaleString() || "0",
      change: metrics?.patronGrowth || 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Connected Campaigns",
      value: metrics?.totalCampaigns.toString() || "0",
      change: 0, // Campaigns don't typically have growth metrics
      icon: BarChart3,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Average Pledge",
      value: metrics ? `$${parseFloat(metrics.avgPledgeAmount).toFixed(2)}` : "$0.00",
      change: 0, // Can be calculated if historical data is available
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="border-border hover:shadow-lg transition-all duration-200 metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{card.value}</div>
              {card.change !== 0 && (
                <div className="flex items-center text-sm">
                  {card.change > 0 ? (
                    <>
                      <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-500 font-medium">
                        +{card.change.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-red-500 font-medium">
                        {card.change.toFixed(1)}%
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground ml-2">vs last month</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
