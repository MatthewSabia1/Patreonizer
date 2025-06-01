import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { ConnectPatreonModal } from "@/components/dashboard/ConnectPatreonModal";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { 
  Search, 
  Download, 
  Filter, 
  MoreVertical,
  Mail,
  Calendar,
  DollarSign,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Patron {
  id: number;
  fullName: string | null;
  email: string | null;
  patronStatus: string | null;
  currentlyEntitledAmountCents: number;
  lifetimeSupportCents: number;
  pledgeRelationshipStart: string | null;
  lastChargeDate: string | null;
  lastChargeStatus: string | null;
}

export default function PatronData() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

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

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/campaigns"],
    retry: false,
  });

  // Fetch patrons with filters
  const { data: patronsData, isLoading: patronsLoading } = useQuery({
    queryKey: ["/api/patrons", selectedCampaign, currentPage, pageSize, searchQuery],
    retry: false,
  });

  // Export patrons mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (selectedCampaign !== "all") {
        params.append("campaignId", selectedCampaign);
      }
      
      const response = await fetch(`/api/patrons/export?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export failed");
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patrons-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: "Patron data has been downloaded as CSV.",
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
        title: "Export Failed",
        description: "Failed to export patron data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active_patron':
        return "bg-green-500/10 text-green-500";
      case 'declined_patron':
        return "bg-red-500/10 text-red-500";
      case 'former_patron':
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-blue-500/10 text-blue-500";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'active_patron':
        return "Active";
      case 'declined_patron':
        return "Declined";
      case 'former_patron':
        return "Former";
      default:
        return status || "Unknown";
    }
  };

  const totalPages = patronsData ? Math.ceil(patronsData.total / pageSize) : 0;
  const patrons: Patron[] = patronsData?.patrons || [];

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
              <h1 className="text-2xl font-bold">Patron Data</h1>
              <p className="text-muted-foreground">
                Manage and analyze your patron information across all campaigns
              </p>
            </div>
            
            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </motion.header>

        {/* Content */}
        <div className="p-6">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search patrons by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Campaigns</SelectItem>
                      {campaigns.map((campaign: any) => (
                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                          {campaign.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6"
          >
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Patrons</p>
                    <p className="text-2xl font-bold">{patronsData?.total.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        patrons.reduce((sum, patron) => sum + patron.currentlyEntitledAmountCents, 0)
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Support</p>
                    <p className="text-2xl font-bold">
                      {patrons.length > 0 
                        ? formatCurrency(
                            patrons.reduce((sum, patron) => sum + patron.currentlyEntitledAmountCents, 0) / patrons.length
                          )
                        : formatCurrency(0)
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">With Email</p>
                    <p className="text-2xl font-bold">
                      {patrons.filter(p => p.email).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Patrons Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Patron Details</CardTitle>
              </CardHeader>
              <CardContent>
                {patronsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-muted animate-pulse rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                          <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : patrons.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No patrons found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || selectedCampaign !== "all" 
                        ? "Try adjusting your filters or search terms." 
                        : "Connect your Patreon campaigns to see patron data."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Patron</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Current Pledge</TableHead>
                            <TableHead>Lifetime Support</TableHead>
                            <TableHead>Member Since</TableHead>
                            <TableHead>Last Charge</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {patrons.map((patron, index) => (
                            <motion.tr
                              key={patron.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b border-border/50 hover:bg-muted/50"
                            >
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {patron.fullName?.[0]?.toUpperCase() || 'P'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">
                                      {patron.fullName || 'Anonymous Patron'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {patron.email || 'No email provided'}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(patron.patronStatus)}>
                                  {getStatusLabel(patron.patronStatus)}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(patron.currentlyEntitledAmountCents)}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(patron.lifetimeSupportCents)}
                              </TableCell>
                              <TableCell>
                                {formatDate(patron.pledgeRelationshipStart)}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm">
                                    {formatDate(patron.lastChargeDate)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {patron.lastChargeStatus || '—'}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, patronsData?.total || 0)} of {patronsData?.total || 0} patrons
                        </p>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const page = i + 1;
                              return (
                                <Button
                                  key={page}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className="w-10"
                                >
                                  {page}
                                </Button>
                              );
                            })}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
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
