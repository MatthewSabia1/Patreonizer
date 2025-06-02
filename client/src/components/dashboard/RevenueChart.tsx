import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useState } from "react";

interface RevenueChartProps {
  revenueData?: any[];
  patronData?: any[];
  campaigns?: any[];
  isLoading?: boolean;
}

export function RevenueChart({ revenueData = [], patronData = [], campaigns = [], isLoading }: RevenueChartProps) {
  const [timeRange, setTimeRange] = useState("30");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [activeChart, setActiveChart] = useState<"revenue" | "patrons">("revenue");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const chartData = activeChart === "revenue" ? revenueData : patronData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant={activeChart === "revenue" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveChart("revenue")}
                  className="text-xs"
                >
                  Revenue
                </Button>
                <Button
                  variant={activeChart === "patrons" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveChart("patrons")}
                  className="text-xs"
                >
                  Patrons
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">This year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.creationName || campaign.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="h-64 bg-muted animate-pulse rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={activeChart === "revenue" ? formatCurrency : undefined}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value: any) => [
                      activeChart === "revenue" ? formatCurrency(value) : value,
                      activeChart === "revenue" ? "Revenue" : "Patrons"
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey={activeChart === "revenue" ? "revenue" : "patrons"}
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Campaign Breakdown */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Campaign Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-2 bg-muted animate-pulse rounded" />
                  </div>
                ))
              ) : (
                campaigns.map((campaign, index) => {
                  // Use accurate revenue data with proper fallbacks
                  const actualRevenue = typeof campaign.actualMonthlyRevenue === 'number' 
                    ? campaign.actualMonthlyRevenue 
                    : (typeof campaign.pledgeSum === 'string' ? parseFloat(campaign.pledgeSum) || 0 : campaign.pledgeSum || 0);
                  const totalRevenue = campaigns.reduce((sum: number, c: any) => {
                    const campRevenue = typeof c.actualMonthlyRevenue === 'number' 
                      ? c.actualMonthlyRevenue 
                      : (typeof c.pledgeSum === 'string' ? parseFloat(c.pledgeSum) || 0 : c.pledgeSum || 0);
                    return sum + campRevenue;
                  }, 0);
                  const percentage = totalRevenue > 0 ? (actualRevenue / totalRevenue) * 100 : 0;
                  
                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{campaign.creationName || campaign.title}</span>
                        <span className="text-sm font-bold">
                          {formatCurrency(actualRevenue)}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                          className="bg-primary h-2 rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {(typeof campaign.actualPatronCount === 'number' ? campaign.actualPatronCount : campaign.patronCount || 0)} patrons
                        </span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
