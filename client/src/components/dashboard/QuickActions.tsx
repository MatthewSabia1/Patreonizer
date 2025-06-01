import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Download, 
  Users, 
  RotateCcw, 
  ArrowRight,
  Sparkles
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
      title: "Connect Campaign",
      description: "Link your Patreon page",
      icon: Plus,
      gradient: "from-accent via-accent to-accent/80",
      bgGradient: "from-accent/15 via-accent/10 to-accent/5",
      hoverGradient: "from-accent/20 via-accent/15 to-accent/8",
      textColor: "text-accent",
      onClick: onConnectPage,
      featured: true,
    },
    {
      title: "Export Analytics",
      description: "Download detailed reports",
      icon: Download,
      gradient: "from-emerald-500 via-emerald-400 to-emerald-300",
      bgGradient: "from-emerald-500/15 via-emerald-500/10 to-emerald-500/5",
      hoverGradient: "from-emerald-500/20 via-emerald-500/15 to-emerald-500/8",
      textColor: "text-emerald-400",
      onClick: onExportData,
    },
    {
      title: "Patron Management",
      description: "View and manage supporters",
      icon: Users,
      gradient: "from-blue-500 via-blue-400 to-blue-300",
      bgGradient: "from-blue-500/15 via-blue-500/10 to-blue-500/5",
      hoverGradient: "from-blue-500/20 via-blue-500/15 to-blue-500/8",
      textColor: "text-blue-400",
      onClick: onViewPatrons,
    },
    {
      title: "Sync Data",
      description: "Refresh all campaigns",
      icon: RotateCcw,
      gradient: "from-purple-500 via-purple-400 to-purple-300",
      bgGradient: "from-purple-500/15 via-purple-500/10 to-purple-500/5",
      hoverGradient: "from-purple-500/20 via-purple-500/15 to-purple-500/8",
      textColor: "text-purple-400",
      onClick: onSyncAll,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="card-enhanced border-border/50 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight">Quick Actions</CardTitle>
            </div>
            <div className="text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
              Shortcuts
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action, index) => {
              const Icon = action.icon;
              
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.98, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    delay: 0.1 + index * 0.05, 
                    duration: 0.3,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  whileHover={{ 
                    y: -2,
                    transition: { duration: 0.2, ease: "easeOut" }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={`
                      group relative overflow-hidden rounded-xl border border-border/30 
                      bg-gradient-to-br ${action.bgGradient} 
                      hover:bg-gradient-to-br hover:${action.hoverGradient}
                      backdrop-blur-sm transition-all duration-300 ease-out
                      cursor-pointer h-full
                      ${action.featured ? 'ring-1 ring-accent/20' : ''}
                    `}
                    onClick={action.onClick}
                  >
                    {/* Background glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Content */}
                    <div className="relative p-6 h-full flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`
                          w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} 
                          flex items-center justify-center shadow-lg 
                          group-hover:scale-110 transition-transform duration-300 ease-out
                          ring-1 ring-white/10
                        `}>
                          <Icon className="w-6 h-6 text-white drop-shadow-sm" />
                        </div>
                        {action.featured && (
                          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className={`font-semibold text-base ${action.textColor} mb-1 tracking-tight`}>
                            {action.title}
                          </h3>
                          <p className="text-sm text-muted-foreground/80 leading-relaxed">
                            {action.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <ArrowRight className={`w-4 h-4 ${action.textColor} transform group-hover:translate-x-1 transition-transform duration-300`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
