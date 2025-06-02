import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { PatronData, Campaign } from "@/types";

interface PatronTableProps {
  campaigns?: Campaign[];
}

export function PatronTable({ campaigns = [] }: PatronTableProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const pageSize = 25;

  const { data: patronData, isLoading } = useQuery({
    queryKey: ["/api/patrons", { 
      search: search || undefined, 
      campaignId: selectedCampaign !== "all" ? parseInt(selectedCampaign) : undefined,
      page: currentPage,
      limit: pageSize
    }],
    queryFn: () => api.getPatrons({
      search: search || undefined,
      campaignId: selectedCampaign !== "all" ? parseInt(selectedCampaign) : undefined,
      page: currentPage,
      limit: pageSize,
    }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await api.exportPatrons(
        selectedCampaign !== "all" ? parseInt(selectedCampaign) : undefined
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `patron-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: "Your patron data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export patron data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active_patron":
        return <Badge className="status-active">Active</Badge>;
      case "former_patron":
        return <Badge className="status-inactive">Former</Badge>;
      case "declined_patron":
        return <Badge className="status-paused">Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTierBadge = (tierName: string) => {
    if (tierName === "No Tier") {
      return <Badge variant="outline">{tierName}</Badge>;
    }
    return <Badge variant="default">{tierName}</Badge>;
  };

  const getPatronInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Patron Data</CardTitle>
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-48" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const patrons = patronData?.data || [];
  const pagination = patronData?.pagination;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Patron Data</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleExport}
                disabled={isExporting || patrons.length === 0}
                className="bg-primary hover:bg-primary/90"
              >
                <Download className={`w-4 h-4 mr-2 ${isExporting ? "animate-spin" : ""}`} />
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search patrons by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-10"
              />
            </div>
            
            {campaigns.length > 1 && (
              <Select value={selectedCampaign} onValueChange={(value) => {
                setSelectedCampaign(value);
                setCurrentPage(1); // Reset to first page when filtering
              }}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Table */}
          {patrons.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Patrons Found</h3>
              <p className="text-sm text-muted-foreground">
                {search || selectedCampaign !== "all" 
                  ? "No patrons match your current filters" 
                  : "Connect your Patreon accounts to start tracking patrons"
                }
              </p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Patron</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Total Contributed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patrons.map((patron, index) => (
                      <motion.tr
                        key={patron.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        className="table-row"
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={patron.imageUrl || ""} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getPatronInitials(patron.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{patron.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {patron.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{patron.campaignName}</span>
                        </TableCell>
                        <TableCell>
                          {getTierBadge(patron.tierName)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            ${parseFloat(patron.amount).toFixed(2)}/{patron.currency === "USD" ? "mo" : "month"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(patron.status)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {patron.pledgeStartDate 
                              ? format(new Date(patron.pledgeStartDate), "MMM d, yyyy")
                              : "Unknown"
                            }
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium text-green-600">
                            ${parseFloat(patron.totalHistoricalAmount).toFixed(2)}
                          </span>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} patrons
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      {pagination.totalPages > 5 && (
                        <>
                          <span className="text-muted-foreground px-2">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(pagination.totalPages)}
                            className="w-8 h-8"
                          >
                            {pagination.totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
