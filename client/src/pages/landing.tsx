import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }

    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const error = urlParams.get("error");

    if (success === "patreon_connected") {
      toast({
        title: "Success!",
        description: "Your Patreon account has been connected successfully.",
      });
    } else if (error) {
      let errorMessage = "An error occurred";
      switch (error) {
        case "patreon_auth_failed":
          errorMessage = "Failed to connect to Patreon. Please try again.";
          break;
        case "patreon_auth_cancelled":
          errorMessage = "Patreon connection was cancelled.";
          break;
        case "not_logged_in":
          errorMessage = "Please log in first before connecting Patreon.";
          break;
        case "storage_failed":
          errorMessage = "Failed to save your Patreon data. Please try again.";
          break;
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [isAuthenticated, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const features = [
    {
      icon: BarChart3,
      title: "Comprehensive Analytics",
      description: "Track revenue, patron growth, and engagement across all your Patreon campaigns in one unified dashboard."
    },
    {
      icon: Users,
      title: "Patron Management",
      description: "View detailed patron information, track membership changes, and export data for analysis."
    },
    {
      icon: DollarSign,
      title: "Revenue Tracking",
      description: "Monitor monthly revenue trends, identify growth opportunities, and optimize your content strategy."
    },
    {
      icon: TrendingUp,
      title: "Growth Insights",
      description: "Analyze patron acquisition, retention rates, and revenue patterns to grow your creator business."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and secure. We never share your information with third parties."
    },
    {
      icon: Zap,
      title: "Real-time Sync",
      description: "Automatic synchronization with Patreon ensures your data is always up-to-date."
    }
  ];

  const benefits = [
    "Connect multiple Patreon accounts",
    "Real-time data synchronization",
    "Comprehensive analytics dashboard",
    "Patron data management and export",
    "Revenue trend analysis",
    "Growth tracking and insights"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mr-4">
              <BarChart3 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Patreonizer
            </h1>
          </div>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            The ultimate analytics platform for Patreon creators. Manage multiple campaigns, 
            track revenue growth, and understand your audience better than ever before.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
              onClick={() => window.location.href = "/api/login"}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-border hover:bg-accent px-8 py-3 text-lg"
            >
              Learn More
            </Button>
          </div>

          <div className="flex items-center justify-center mt-8 gap-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
              Free to use
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
              Secure & private
            </div>
          </div>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4">Features</Badge>
          <h2 className="text-3xl font-bold mb-4">Everything you need to grow</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Powerful analytics and insights to help you understand your audience and optimize your Patreon strategy.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Card className="h-full border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-200">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Badge variant="secondary" className="mb-4">Why Patreonizer?</Badge>
            <h2 className="text-3xl font-bold mb-6">
              Take control of your creator business
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Stop struggling with spreadsheets and fragmented data. Patreonizer brings all your 
              Patreon analytics together in one powerful, easy-to-use platform.
            </p>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + 0.1 * index }}
                  className="flex items-center"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>{benefit}</span>
                </motion.div>
              ))}
            </div>

            <Button 
              size="lg" 
              className="mt-8 bg-primary hover:bg-primary/90"
              onClick={() => window.location.href = "/api/login"}
            >
              Start Your Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-primary/10 to-muted/20 rounded-2xl p-8 backdrop-blur-sm border border-border">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-card/80 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                    <div className="text-2xl font-bold text-primary">$12,847</div>
                  </div>
                  <div className="text-green-500 text-sm font-medium">+12.5%</div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-card/80 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Patrons</div>
                    <div className="text-2xl font-bold">2,139</div>
                  </div>
                  <div className="text-green-500 text-sm font-medium">+8.3%</div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-card/80 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Connected Accounts</div>
                    <div className="text-2xl font-bold">3</div>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center bg-gradient-to-r from-primary/10 to-muted/20 rounded-2xl p-12 backdrop-blur-sm border border-border"
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to supercharge your Patreon analytics?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are already using Patreonizer to grow their 
            creator businesses and better understand their audience.
          </p>
          
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
            onClick={() => window.location.href = "/api/login"}
          >
            Get Started Now - It's Free!
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Setup in minutes • Cancel anytime
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center mr-3">
                <BarChart3 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Patreonizer</span>
            </div>
          </div>
          <p className="text-center text-muted-foreground mt-4">
            © 2024 Patreonizer. Built for creators, by creators.
          </p>
        </div>
      </footer>
    </div>
  );
}
