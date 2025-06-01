import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { ConnectPatreonModal } from "@/components/dashboard/ConnectPatreonModal";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Download,
  Trash2,
  RefreshCw,
  Shield,
  Database,
  Calendar,
  AlertTriangle,
  Check,
  ExternalLink,
  Key,
  Globe,
  Moon,
  Sun
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    sync: boolean;
    revenue: boolean;
    newPatrons: boolean;
  };
  privacy: {
    dataSharing: boolean;
    analytics: boolean;
  };
  sync: {
    autoSync: boolean;
    syncFrequency: 'hourly' | 'daily' | 'weekly';
  };
}

interface ExportData {
  campaigns: boolean;
  patrons: boolean;
  posts: boolean;
  revenue: boolean;
}

export default function Settings() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    notifications: {
      email: true,
      sync: true,
      revenue: true,
      newPatrons: true,
    },
    privacy: {
      dataSharing: false,
      analytics: true,
    },
    sync: {
      autoSync: true,
      syncFrequency: 'daily',
    }
  });
  const [exportData, setExportData] = useState<ExportData>({
    campaigns: true,
    patrons: true,
    posts: true,
    revenue: true,
  });

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch user profile
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Fetch campaigns for data overview
  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/campaigns"],
    retry: false,
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: AppSettings) => {
      return apiRequest('/api/settings', {
        method: 'POST',
        body: JSON.stringify(newSettings),
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async (exportOptions: ExportData) => {
      const response = await fetch('/api/export/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(exportOptions),
      });
      if (!response.ok) throw new Error("Export failed");
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patreon-data-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: "Your data has been exported and downloaded.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/auth/delete-account', {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    },
  });

  const handleSettingsChange = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNestedSettingsChange = (section: keyof AppSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar onConnectPatreon={() => setShowConnectModal(true)} />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-b border-border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account preferences and application settings
              </p>
            </div>
            
            <Button
              onClick={() => saveSettingsMutation.mutate(settings)}
              disabled={saveSettingsMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Check className="w-4 h-4 mr-2" />
              {saveSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </motion.header>

        {/* Content */}
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Profile Information</span>
                    </CardTitle>
                    <CardDescription>
                      Your account details and personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          value={userProfile?.email || ''}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user-id">User ID</Label>
                        <Input
                          id="user-id"
                          value={userProfile?.id || ''}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Account Created</Label>
                        <p className="text-sm text-muted-foreground">
                          {userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'Unknown'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Last Login</Label>
                        <p className="text-sm text-muted-foreground">
                          {userProfile?.lastLoginAt ? formatDate(userProfile.lastLoginAt) : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="w-5 h-5" />
                      <span>Connected Accounts</span>
                    </CardTitle>
                    <CardDescription>
                      Manage your connected Patreon campaigns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {campaigns.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground mb-4">No campaigns connected</p>
                          <Button 
                            onClick={() => setShowConnectModal(true)}
                            variant="outline"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Connect Patreon Campaign
                          </Button>
                        </div>
                      ) : (
                        campaigns.map((campaign: any) => (
                          <div key={campaign.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Globe className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{campaign.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {campaign.patronCount} patrons • Last sync: {formatDate(campaign.lastSyncAt || campaign.createdAt)}
                                </p>
                              </div>
                            </div>
                            <Badge variant={campaign.isActive ? "default" : "secondary"}>
                              {campaign.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Notification Preferences</span>
                    </CardTitle>
                    <CardDescription>
                      Choose what notifications you want to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-notifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive important updates via email
                          </p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={settings.notifications.email}
                          onCheckedChange={(checked) => 
                            handleNestedSettingsChange('notifications', 'email', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="sync-notifications">Sync Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when data sync completes
                          </p>
                        </div>
                        <Switch
                          id="sync-notifications"
                          checked={settings.notifications.sync}
                          onCheckedChange={(checked) => 
                            handleNestedSettingsChange('notifications', 'sync', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="revenue-notifications">Revenue Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Notify about significant revenue changes
                          </p>
                        </div>
                        <Switch
                          id="revenue-notifications"
                          checked={settings.notifications.revenue}
                          onCheckedChange={(checked) => 
                            handleNestedSettingsChange('notifications', 'revenue', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="patron-notifications">New Patron Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified about new patrons
                          </p>
                        </div>
                        <Switch
                          id="patron-notifications"
                          checked={settings.notifications.newPatrons}
                          onCheckedChange={(checked) => 
                            handleNestedSettingsChange('notifications', 'newPatrons', checked)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <RefreshCw className="w-5 h-5" />
                      <span>Sync Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Configure automatic data synchronization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-sync">Automatic Sync</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically sync your data at regular intervals
                        </p>
                      </div>
                      <Switch
                        id="auto-sync"
                        checked={settings.sync.autoSync}
                        onCheckedChange={(checked) => 
                          handleNestedSettingsChange('sync', 'autoSync', checked)
                        }
                      />
                    </div>

                    {settings.sync.autoSync && (
                      <div className="space-y-2">
                        <Label htmlFor="sync-frequency">Sync Frequency</Label>
                        <Select 
                          value={settings.sync.syncFrequency} 
                          onValueChange={(value) => 
                            handleNestedSettingsChange('sync', 'syncFrequency', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Every Hour</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Privacy Tab */}
              <TabsContent value="privacy" className="space-y-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Privacy Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Control how your data is used and shared
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="data-sharing">Data Sharing</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow anonymized data to improve the service
                        </p>
                      </div>
                      <Switch
                        id="data-sharing"
                        checked={settings.privacy.dataSharing}
                        onCheckedChange={(checked) => 
                          handleNestedSettingsChange('privacy', 'dataSharing', checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="analytics">Usage Analytics</Label>
                        <p className="text-sm text-muted-foreground">
                          Help us improve by sharing usage patterns
                        </p>
                      </div>
                      <Switch
                        id="analytics"
                        checked={settings.privacy.analytics}
                        onCheckedChange={(checked) => 
                          handleNestedSettingsChange('privacy', 'analytics', checked)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Data Security</AlertTitle>
                  <AlertDescription>
                    Your data is encrypted and stored securely. We never share personally identifiable information with third parties.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              {/* Data Tab */}
              <TabsContent value="data" className="space-y-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Download className="w-5 h-5" />
                      <span>Export Data</span>
                    </CardTitle>
                    <CardDescription>
                      Download a copy of all your data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="export-campaigns"
                          checked={exportData.campaigns}
                          onChange={(e) => setExportData(prev => ({...prev, campaigns: e.target.checked}))}
                        />
                        <Label htmlFor="export-campaigns">Campaigns</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="export-patrons"
                          checked={exportData.patrons}
                          onChange={(e) => setExportData(prev => ({...prev, patrons: e.target.checked}))}
                        />
                        <Label htmlFor="export-patrons">Patrons</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="export-posts"
                          checked={exportData.posts}
                          onChange={(e) => setExportData(prev => ({...prev, posts: e.target.checked}))}
                        />
                        <Label htmlFor="export-posts">Posts</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="export-revenue"
                          checked={exportData.revenue}
                          onChange={(e) => setExportData(prev => ({...prev, revenue: e.target.checked}))}
                        />
                        <Label htmlFor="export-revenue">Revenue Data</Label>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => exportDataMutation.mutate(exportData)}
                      disabled={exportDataMutation.isPending || !Object.values(exportData).some(Boolean)}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {exportDataMutation.isPending ? 'Preparing Export...' : 'Export Selected Data'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="w-5 h-5" />
                      <span>Data Usage</span>
                    </CardTitle>
                    <CardDescription>
                      Overview of your stored data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{campaigns.length}</p>
                          <p className="text-sm text-muted-foreground">Campaigns</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">—</p>
                          <p className="text-sm text-muted-foreground">Patrons</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">—</p>
                          <p className="text-sm text-muted-foreground">Posts</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">—</p>
                          <p className="text-sm text-muted-foreground">Sync Records</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Account Tab */}
              <TabsContent value="account" className="space-y-6">
                <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-600">Danger Zone</AlertTitle>
                  <AlertDescription className="text-orange-600">
                    These actions are permanent and cannot be undone.
                  </AlertDescription>
                </Alert>

                <Card className="bg-card border-border border-red-200 dark:border-red-800">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-600">
                      <Trash2 className="w-5 h-5" />
                      <span>Delete Account</span>
                    </CardTitle>
                    <CardDescription>
                      Permanently delete your account and all associated data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will permanently delete your account, all connected campaigns, patron data, 
                      posts, and analytics. This action cannot be undone.
                    </p>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete My Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove all your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteAccountMutation.mutate()}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Yes, delete my account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      <ConnectPatreonModal 
        isOpen={showConnectModal} 
        onClose={() => setShowConnectModal(false)} 
      />
    </div>
  );
}