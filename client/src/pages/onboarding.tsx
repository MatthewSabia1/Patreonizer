import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  BarChart3, 
  DollarSign,
  Zap
} from "lucide-react";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectPatreon = () => {
    setIsConnecting(true);
    window.location.href = "/api/patreon/connect";
  };

  const handleSkip = () => {
    navigate("/");
  };

  const steps = [
    {
      icon: Users,
      title: "Connect Your Patreon",
      description: "Link your Patreon creator account to start importing your campaign data.",
      status: "current"
    },
    {
      icon: BarChart3,
      title: "Import Analytics",
      description: "We'll automatically sync your campaigns, patrons, and revenue data.",
      status: "upcoming"
    },
    {
      icon: DollarSign,
      title: "View Insights",
      description: "Access your comprehensive analytics dashboard and start growing.",
      status: "upcoming"
    }
  ];

  const features = [
    "Real-time revenue tracking across all campaigns",
    "Detailed patron analytics and demographics",
    "Growth trends and performance insights",
    "Automated data synchronization",
    "CSV export for external analysis",
    "Multi-campaign management"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mr-4">
                <BarChart3 className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold">Welcome to Patreonizer!</h1>
            </div>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Let's get you set up with powerful analytics for your Patreon campaigns. 
              This will only take a few minutes.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="flex flex-col items-center text-center flex-1"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    step.status === "current" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground max-w-32">{step.description}</p>
                </motion.div>
              ))}
              
              {/* Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted -z-10">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "33%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Connect Patreon Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="h-full border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M0 .48v23.04h4.22V.48zm15.385 0c-4.764 0-8.641 3.88-8.641 8.65 0 4.755 3.877 8.623 8.641 8.623 4.75 0 8.615-3.868 8.615-8.623C24 4.36 20.136.48 15.385.48z"/>
                    </svg>
                  </div>
                  <CardTitle className="text-2xl">Connect Your Patreon Account</CardTitle>
                  <CardDescription>
                    Securely connect your Patreon creator account to start analyzing your campaign performance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      <span>Secure OAuth authentication</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      <span>Read-only access to your data</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      <span>Automatic campaign discovery</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      <span>Real-time data synchronization</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={handleConnectPatreon} 
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
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M0 .48v23.04h4.22V.48zm15.385 0c-4.764 0-8.641 3.88-8.641 8.65 0 4.755 3.877 8.623 8.641 8.623 4.75 0 8.615-3.868 8.615-8.623C24 4.36 20.136.48 15.385.48z"/>
                          </svg>
                          Connect with Patreon
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleSkip}
                      className="w-full"
                      disabled={isConnecting}
                    >
                      Skip for now
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    By connecting, you agree to our Terms of Service and Privacy Policy. 
                    You can disconnect your account at any time.
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Features Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="h-full border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <Zap className="w-8 h-8 text-primary mr-3" />
                    <div>
                      <CardTitle className="text-xl">What you'll get</CardTitle>
                      <CardDescription>Powerful analytics at your fingertips</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {features.map((feature, index) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 + 0.1 * index }}
                        className="flex items-start"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center mb-2">
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        Coming Soon
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">Advanced Features</h4>
                    <p className="text-xs text-muted-foreground">
                      Email notifications, custom reports, goal tracking, and more powerful analytics features.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Help Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-12"
          >
            <Card className="border-border bg-card/30 backdrop-blur-sm">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Need help getting started?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Our onboarding process is designed to be simple and secure. If you have any questions 
                  or need assistance, we're here to help.
                </p>
                <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    <span>5-minute setup</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    <span>Bank-level security</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
