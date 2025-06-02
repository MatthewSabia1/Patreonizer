import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChartArea, 
  Users, 
  DollarSign, 
  FileText, 
  Link2, 
  Download,
  Settings,
  Plus,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useScreenSize } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import type { PatreonCampaign, User } from "@/lib/types";

const navigation = [
  { name: "Dashboard", href: "/", icon: ChartArea },
  { name: "Patron Data", href: "/patrons", icon: Users },
  { name: "Post Analytics", href: "/posts", icon: FileText },
  { name: "Connected Pages", href: "/connected-pages", icon: Link2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  onConnectPatreon: () => void;
}

export function Sidebar({ onConnectPatreon }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { isMobile, isTablet } = useScreenSize();
  const [isOpen, setIsOpen] = useState(false);

  const { data: campaigns = [] } = useQuery<PatreonCampaign[]>({
    queryKey: ["/api/campaigns"],
  });

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location, isMobile]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen) {
        const sidebar = document.getElementById('mobile-sidebar');
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isOpen]);

  const SidebarContent = () => (
    <div className={`${isMobile ? 'w-80' : 'w-64'} bg-sidebar/95 backdrop-glass border-r border-sidebar-border flex flex-col h-full shadow-card-soft`}>
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border/50">
        <motion.div 
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex items-center space-x-3"
        >
          <div className="w-11 h-11 bg-gradient-to-br from-accent via-accent to-accent/90 rounded-xl flex items-center justify-center shadow-glow ring-1 ring-accent/20">
            <ChartArea className="h-6 w-6 text-accent-foreground drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground bg-gradient-to-r from-accent via-accent/95 to-accent/80 bg-clip-text text-transparent tracking-tight">
              Patreonizer
            </h1>
            <p className="text-xs text-sidebar-foreground/50 font-medium tracking-wide">Multi-Campaign Manager</p>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="ml-auto p-2 hover:bg-sidebar-accent/50"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item, index) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <motion.div
              key={item.name}
              initial={{ x: -8, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.05 * index, duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Link href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={`
                    sidebar-link flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ease-out relative group cursor-pointer
                    ${isActive 
                      ? 'active bg-gradient-to-r from-accent/15 to-accent/5 text-accent border-accent/30 shadow-glow' 
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 border-transparent'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-102'}`} />
                  <span className="font-medium tracking-wide">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute right-3 w-1.5 h-1.5 bg-accent rounded-full shadow-lg"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  )}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Connected Campaigns */}
      <div className="p-4 border-t border-sidebar-border/50">
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4"
        >
          Connected Pages
        </motion.h3>
        
        <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-custom">
          {campaigns.map((campaign, index: number) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center space-x-3 p-3 rounded-lg bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors duration-200 border border-sidebar-border/30"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full status-dot status-success animate-pulse" />
              <span className="text-xs font-medium text-sidebar-foreground/90 truncate">
                {campaign.title}
              </span>
            </motion.div>
          ))}
          {campaigns.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-sidebar-foreground/40 text-center py-2"
            >
              No pages connected yet
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button 
            onClick={onConnectPatreon}
            className="w-full mt-4 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-accent-foreground btn-glow transition-all duration-300 shadow-lg hover:shadow-glow border-0"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Page
          </Button>
        </motion.div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border/50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center space-x-3"
        >
          <Avatar className="w-10 h-10 ring-2 ring-accent/20 transition-all duration-300 hover:ring-accent/40">
            <AvatarImage src={user?.profileImageUrl || ""} alt="Profile" />
            <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground font-semibold">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.firstName || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
            onClick={() => window.location.href = '/api/logout'}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Header with Menu Button */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-lg border-b border-sidebar-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent via-accent to-accent/90 rounded-lg flex items-center justify-center">
                <ChartArea className="h-4 w-4 text-accent-foreground" />
              </div>
              <h1 className="text-lg font-bold text-sidebar-foreground bg-gradient-to-r from-accent via-accent/95 to-accent/80 bg-clip-text text-transparent">
                Patreonizer
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="p-2 hover:bg-sidebar-accent/50"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                id="mobile-sidebar"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 z-50"
              >
                <SidebarContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <SidebarContent />
    </motion.aside>
  );
}
