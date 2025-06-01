import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  CheckCircle2, 
  ExternalLink, 
  Shield, 
  Zap,
  Users,
  BarChart3
} from "lucide-react";

interface ConnectPatreonModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ConnectPatreonModal({ 
  isOpen, 
  onOpenChange, 
  trigger 
}: ConnectPatreonModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    window.location.href = "/api/patreon/connect";
  };

  const benefits = [
    {
      icon: BarChart3,
      title: "Comprehensive Analytics",
      description: "Track revenue, patron growth, and engagement metrics"
    },
    {
      icon: Users,
      title: "Patron Management",
      description: "Detailed patron information and membership tracking"
    },
    {
      icon: Zap,
      title: "Real-time Sync",
      description: "Automatic data synchronization with your Patreon account"
    }
  ];

  const securityFeatures = [
    "Read-only access to your data",
    "Secure OAuth 2.0 authentication",
    "Industry-standard encryption",
    "No password storage required",
    "Revoke access anytime from Patreon"
  ];

  const steps = [
    "Click 'Connect with Patreon' below",
    "Log in to your Patreon creator account",
    "Authorize Patreonizer to access your data",
    "Return here to start analyzing your campaigns"
  ];

  const modalContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <DialogHeader className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M0 .48v23.04h4.22V.48zm15.385 0c-4.764 0-8.641 3.88-8.641 8.65 0 4.755 3.877 8.623 8.641 8.623 4.75 0 8.615-3.868 8.615-8.623C24 4.36 20.136.48 15.385.48z"/>
            </svg>
          </div>
          <div>
            <DialogTitle className="text-2xl">Connect Your Patreon Account</DialogTitle>
            <DialogDescription className="text-base">
              Securely link your Patreon creator account to unlock powerful analytics
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-6 mt-6">
        {/* What you'll get */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2 text-primary" />
            What you'll get
          </h3>
          <div className="grid gap-3">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 rounded-lg bg-accent/50"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Security & Privacy */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center">
            <Shield className="w-4 h-4 mr-2 text-green-500" />
            Security & Privacy
          </h3>
          <div className="space-y-2">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
                className="flex items-center text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div>
          <h3 className="font-semibold mb-3">How it works</h3>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.5 + index * 0.05 }}
                className="flex items-start text-sm"
              >
                <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs mr-3 flex-shrink-0">
                  {index + 1}
                </Badge>
                <span>{step}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Connect Button */}
        <div className="space-y-3 pt-4">
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            size="lg"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 .48v23.04h4.22V.48zm15.385 0c-4.764 0-8.641 3.88-8.641 8.65 0 4.755 3.877 8.623 8.641 8.623 4.75 0 8.615-3.868 8.615-8.623C24 4.36 20.136.48 15.385.48z"/>
                </svg>
                Connect with Patreon
                <ExternalLink className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            By connecting, you agree to our Terms of Service and Privacy Policy.
            You can disconnect your account at any time.
          </p>
        </div>
      </div>
    </motion.div>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {modalContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => onOpenChange?.(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-2xl mx-auto border-border">
              <CardContent className="pt-6">
                {modalContent}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing the modal
export function useConnectPatreonModal() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    openModal: () => setIsOpen(true),
    closeModal: () => setIsOpen(false),
    ConnectPatreonModal: () => (
      <ConnectPatreonModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    ),
  };
}
