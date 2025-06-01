import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Download,
  Settings,
  LogOut,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

export function Sidebar() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  const { data: accounts } = useQuery({
    queryKey: ["/api/patreon/accounts"],
    queryFn: () => api.getPatreonAccounts(),
    retry: false,
  });

  const navigationItems = [
    {
      label: "Dashboard",
      icon: BarChart3,
      href: "/",
      active: location === "/",
    },
    {
      label: "Patron Data",
      icon: Users,
      href: "/patron-data",
      active: location === "/patron-data",
    },
    {
      label: "Analytics",
      icon: TrendingUp,
      href: "/analytics",
      active: location === "/analytics",
    },
    {
      label: "Export Data",
      icon: Download,
      href: "/export",
      active: location === "/export",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      active: location === "/settings",
    },
  ];

  const handleConnectAccount = () => {
    window.location.href = "/api/patreon/connect";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Patreonizer</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item, index) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Button
              variant={item.active ? "default" : "ghost"}
              className={`w-full justify-start ${
                item.active 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              onClick={() => navigate(item.href)}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </Button>
          </motion.div>
        ))}
      </nav>

      {/* Connected Accounts */}
      <div className="p-4 border-t border-border">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Connected Accounts</h3>
          <div className="space-y-2">
            {accounts?.map((account) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-3 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={account.accountImageUrl || ""} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {account.accountName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{account.accountName}</p>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Connected</span>
                  </div>
                </div>
              </motion.div>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={handleConnectAccount}
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect Account
            </Button>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.profileImageUrl || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "User"
              }
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
