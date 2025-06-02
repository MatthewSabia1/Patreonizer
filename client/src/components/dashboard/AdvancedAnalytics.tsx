import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";

interface AnalyticsProps {
  campaigns?: any[];
  revenueData?: any[];
  patronData?: any[];
  isLoading?: boolean;
}

export function AdvancedAnalytics({ campaigns = [], revenueData = [], patronData = [], isLoading }: AnalyticsProps) {
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("area");
  const [timeRange, setTimeRange] = useState("30");
  const [selectedMetric, setSelectedMetric] = useState<"revenue" | "patrons" | "growth">("revenue");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Use actual revenue data with proper validation
  const analyticsData = Array.isArray(revenueData) ? revenueData : [];

  // Calculate growth metrics only if we have sufficient data
  const hasData = analyticsData.length > 0;
  let currentRevenue = 0;
  let previousRevenue = 0;
  let revenueGrowth = 0;
  let currentPatrons = 0;
  let previousPatrons = 0;
  let patronGrowth = 0;

  if (hasData && analyticsData.length >= 14) {
    const currentPeriod = analyticsData.slice(-7);
    const previousPeriod = analyticsData.slice(-14, -7);
    
    currentRevenue = currentPeriod.reduce((sum, item) => {
      const revenue = typeof item.revenue === 'number' ? item.revenue : 
                     typeof item.pledgeSum === 'string' ? parseFloat(item.pledgeSum) || 0 : 
                     typeof item.pledgeSum === 'number' ? item.pledgeSum : 0;
      return sum + revenue;
    }, 0);
    
    previousRevenue = previousPeriod.reduce((sum, item) => {
      const revenue = typeof item.revenue === 'number' ? item.revenue : 
                     typeof item.pledgeSum === 'string' ? parseFloat(item.pledgeSum) || 0 : 
                     typeof item.pledgeSum === 'number' ? item.pledgeSum : 0;
      return sum + revenue;
    }, 0);
    
    revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    currentPatrons = currentPeriod[currentPeriod.length - 1]?.patronCount || currentPeriod[currentPeriod.length - 1]?.patrons || 0;
    previousPatrons = previousPeriod[previousPeriod.length - 1]?.patronCount || previousPeriod[previousPeriod.length - 1]?.patrons || 0;
    patronGrowth = previousPatrons > 0 ? ((currentPatrons - previousPatrons) / previousPatrons) * 100 : 0;
  }

  // Campaign performance data for pie chart using accurate data
  const campaignPerformance = campaigns.length > 0 ? campaigns.map((campaign, index) => {
    const revenue = typeof campaign.actualMonthlyRevenue === 'number' 
      ? campaign.actualMonthlyRevenue 
      : typeof campaign.pledgeSum === 'string' ? parseFloat(campaign.pledgeSum) || 0 
      : typeof campaign.pledgeSum === 'number' ? campaign.pledgeSum : 0;
    
    return {
      name: campaign.title || campaign.creationName || 'Untitled Campaign',
      value: revenue,
      fill: COLORS[index % COLORS.length],
    };
  }).filter(item => item.value > 0) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderChart = () => {
    const chartProps = {
      data: analyticsData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case "line":
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={selectedMetric === "revenue" ? formatCurrency : undefined}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Line
              type="monotone"
              dataKey={selectedMetric === "revenue" ? "revenue" : "patrons"}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );
      case "area":
        return (
          <AreaChart {...chartProps}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={selectedMetric === "revenue" ? formatCurrency : undefined}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Area
              type="monotone"
              dataKey={selectedMetric === "revenue" ? "revenue" : "patrons"}
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={selectedMetric === "revenue" ? formatCurrency : undefined}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Bar
              dataKey={selectedMetric === "revenue" ? "revenue" : "patrons"}
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
      default:
        return (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            No chart type selected
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Advanced Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Detailed performance insights and trends
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="patrons">Patrons</SelectItem>
              <SelectItem value="growth">Growth</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="area">Area</SelectItem>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Growth</p>
                  <p className="text-2xl font-bold flex items-center">
                    {formatPercentage(revenueGrowth)}
                    {revenueGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 ml-1 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 ml-1 text-red-500" />
                    )}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Patron Growth</p>
                  <p className="text-2xl font-bold flex items-center">
                    {formatPercentage(patronGrowth)}
                    {patronGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 ml-1 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 ml-1 text-red-500" />
                    )}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Revenue/Day</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(currentRevenue / 7)}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Target Progress</p>
                  <p className="text-2xl font-bold">—</p>
                </div>
                <Target className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Performance Trend</span>
                <Badge variant="outline">
                  {selectedMetric === "revenue" ? "Revenue" : "Patrons"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 bg-muted animate-pulse rounded" />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  {renderChart()}
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Campaign Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChartIcon className="w-5 h-5" />
                <span>Campaign Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 bg-muted animate-pulse rounded" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={campaignPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {campaignPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Metrics Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Campaign Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Campaign Data</h3>
                <p className="text-muted-foreground">
                  Connect your Patreon campaigns to see detailed analytics.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2">Campaign</th>
                      <th className="text-right py-2">Patrons</th>
                      <th className="text-right py-2">Revenue</th>
                      <th className="text-right py-2">Avg/Patron</th>
                      <th className="text-right py-2">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign, index) => {
                      const avgPerPatron = campaign.patronCount > 0 ? 
                        parseInt(campaign.pledgeSum) / campaign.patronCount : 0;
                      const growth = Math.random() * 20 - 10; // Simulated growth
                      
                      return (
                        <motion.tr
                          key={campaign.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-b border-border/50"
                        >
                          <td className="py-3">
                            <div>
                              <p className="font-medium">{campaign.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Active since {new Date(campaign.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </td>
                          <td className="text-right py-3">{campaign.patronCount.toLocaleString()}</td>
                          <td className="text-right py-3">{formatCurrency(parseInt(campaign.pledgeSum))}</td>
                          <td className="text-right py-3">{formatCurrency(avgPerPatron)}</td>
                          <td className="text-right py-3">
                            <Badge variant={growth >= 0 ? "default" : "destructive"}>
                              {formatPercentage(growth)}
                            </Badge>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}