import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ConnectPatreonModal } from "@/components/dashboard/ConnectPatreonModal";
import { 
  ChartArea, 
  Users, 
  DollarSign, 
  BarChart3, 
  Zap, 
  Shield,
  ExternalLink,
  TrendingUp 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check for connection success/error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');

    if (connected === 'true') {
      toast({
        title: "Successfully Connected!",
        description: "Your Patreon account has been connected and data sync has started.",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/');
    } else if (error) {
      let errorMessage = "Failed to connect your Patreon account.";
      if (error === 'session_expired') {
        errorMessage = "Your session expired. Please try connecting again.";
      } else if (error === 'connection_failed') {
        errorMessage = "Connection failed. Please check your Patreon account and try again.";
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
  }, [toast]);

  const features = [
    {
      icon: BarChart3,
      title: "Multi-Campaign Analytics",
      description: "Track revenue, patron growth, and performance across all your Patreon campaigns in one dashboard."
    },
    {
      icon: Users,
      title: "Patron Insights",
      description: "Detailed patron data with membership information, tier history, and export capabilities."
    },
    {
      icon: DollarSign,
      title: "Revenue Tracking",
      description: "Monitor monthly revenue, average pledge amounts, and identify growth trends over time."
    },
    {
      icon: Zap,
      title: "Real-time Sync",
      description: "Automatic data synchronization keeps your analytics up-to-date with the latest patron activity."
    },
    {
      icon: TrendingUp,
      title: "Performance Metrics",
      description: "Track post engagement, patron retention rates, and campaign performance indicators."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Bank-level security with OAuth 2.0 authentication. Your data stays private and secure."
    }
  ];

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  // Show connect modal for authenticated users without campaigns
  if (isAuthenticated && !isLoading) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ChartArea className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Welcome to Patreonizer!</h1>
            <p className="text-muted-foreground mb-8">
              Let's connect your first Patreon campaign to start tracking your creator analytics.
            </p>
            <Button
              onClick={() => setShowConnectModal(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect Patreon Account
            </Button>
          </motion.div>
        </div>
        
        <ConnectPatreonModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mr-4">
                <ChartArea className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Patreonizer
              </h1>
            </div>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              The ultimate analytics platform for Patreon creators. Track revenue, manage patrons, 
              and optimize your campaigns across multiple Patreon pages in one powerful dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowConnectModal(true)}
                className="px-8"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">Everything you need to grow your Patreon</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful analytics and insights to help you understand your audience, 
            optimize your content, and maximize your creator income.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -5 }}
              >
                <Card className="bg-card border-border h-full hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-card border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to optimize your Patreon?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of creators who are already using Patreonizer to grow their communities.
            </p>
            <Button
              onClick={handleLogin}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            >
              Start Your Free Account
            </Button>
          </motion.div>
        </div>
      </div>

      <ConnectPatreonModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />
    </div>
  );
}
