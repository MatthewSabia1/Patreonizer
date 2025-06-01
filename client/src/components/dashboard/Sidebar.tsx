import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ChartArea, 
  Users, 
  DollarSign, 
  FileText, 
  Link2, 
  Download,
  Settings,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

const navigation = [
  { name: "Dashboard", href: "/", icon: ChartArea },
  { name: "Patron Data", href: "/patrons", icon: Users },
  { name: "Revenue Analytics", href: "/revenue", icon: DollarSign },
  { name: "Post Performance", href: "/posts", icon: FileText },
  { name: "Connected Pages", href: "/connected-pages", icon: Link2 },
  { name: "Export Data", href: "/export", icon: Download },
];

interface SidebarProps {
  onConnectPatreon: () => void;
}

export function Sidebar({ onConnectPatreon }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/campaigns"],
  });

  return (
    <motion.aside 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <ChartArea className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Patreonizer</h1>
            <p className="text-xs text-sidebar-foreground/60">Multi-Campaign Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors sidebar-link
                  ${isActive 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Connected Campaigns */}
      <div className="p-4 border-t border-sidebar-border">
        <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wide mb-3">
          Connected Pages
        </h3>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {campaigns.map((campaign: any) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 p-2 rounded-md bg-sidebar-accent/50"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs font-medium text-sidebar-foreground truncate">
                {campaign.title}
              </span>
            </motion.div>
          ))}
        </div>

        <Button 
          onClick={onConnectPatreon}
          className="w-full mt-4 bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Page
        </Button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.profileImageUrl || ""} alt="Profile" />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.firstName || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => window.location.href = '/api/logout'}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}
