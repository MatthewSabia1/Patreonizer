import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Download, 
  Users, 
  RotateCcw, 
  FileText, 
  BarChart3 
} from "lucide-react";

interface QuickActionsProps {
  onConnectPage?: () => void;
  onExportData?: () => void;
  onViewPatrons?: () => void;
  onSyncAll?: () => void;
}

export function QuickActions({ 
  onConnectPage, 
  onExportData, 
  onViewPatrons, 
  onSyncAll 
}: QuickActionsProps) {
  const actions = [
    {
      title: "Connect Page",
      description: "Add new Patreon campaign",
      icon: Plus,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      onClick: onConnectPage,
    },
    {
      title: "Export Data",
      description: "Download CSV reports",
      icon: Download,
      color: "text-accent",
      bgColor: "bg-accent/10",
      borderColor: "border-accent/20",
      onClick: onExportData,
    },
    {
      title: "View Patrons",
      description: "Manage patron data",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      onClick: onViewPatrons,
    },
    {
      title: "Full Sync",
      description: "Refresh all campaign data",
      icon: RotateCcw,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      onClick: onSyncAll,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action, index) => {
              const Icon = action.icon;
              
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    className={`
                      h-auto p-4 flex flex-col items-center space-y-2 text-left transition-all duration-200
                      hover:bg-muted/50 ${action.borderColor}
                    `}
                    onClick={action.onClick}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.bgColor}`}>
                      <Icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
