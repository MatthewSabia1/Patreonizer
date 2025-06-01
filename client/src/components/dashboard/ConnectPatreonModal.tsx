import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ExternalLink, 
  Shield, 
  Zap, 
  BarChart3, 
  Users,
  DollarSign 
} from "lucide-react";

interface ConnectPatreonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectPatreonModal({ isOpen, onClose }: ConnectPatreonModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    // Redirect to Patreon OAuth
    window.location.href = '/api/auth/patreon';
  };

  const features = [
    {
      icon: BarChart3,
      title: "Revenue Analytics",
      description: "Track your monthly revenue, patron growth, and trends across all campaigns"
    },
    {
      icon: Users,
      title: "Patron Management",
      description: "View detailed patron information, membership tiers, and export data"
    },
    {
      icon: DollarSign,
      title: "Financial Insights",
      description: "Understand your average revenue per patron and identify growth opportunities"
    },
    {
      icon: Zap,
      title: "Real-time Sync",
      description: "Automatic data synchronization keeps your dashboard up-to-date"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Connect Your Patreon Account</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Securely connect your Patreon campaigns to start tracking your creator analytics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-secondary/20 border-secondary">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{feature.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-400 text-sm">Secure Connection</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  We use Patreon's official OAuth 2.0 API to securely access your data. 
                  We never store your Patreon password and you can revoke access at any time.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isConnecting}
            >
              Maybe Later
            </Button>
            
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isConnecting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
                />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              {isConnecting ? 'Connecting...' : 'Connect Patreon Account'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
