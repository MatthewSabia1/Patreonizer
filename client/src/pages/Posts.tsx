import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useScreenSize } from "@/hooks/use-mobile";
import { isUnauthorizedError } from "@/lib/authUtils";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { ConnectPatreonModal } from "@/components/dashboard/ConnectPatreonModal";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FileText,
  Eye,
  Lock,
  Heart,
  MessageCircle,
  DollarSign,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from "lucide-react";

interface Post {
  id: number;
  patreonPostId: string;
  title: string | null;
  content: string | null;
  publishedAt: string | null;
  isPublic: boolean;
  isPaid: boolean;
  likeCount: number;
  commentCount: number;
  campaignId: number;
  campaignTitle?: string;
}

interface PostsResponse {
  posts: Post[];
  total: number;
}

export default function Posts() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [postType, setPostType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isMobile, isTablet, isSmallMobile } = useScreenSize();
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
  const { data: campaigns = [] } = useQuery<any[]>({
    queryKey: ["/api/campaigns"],
    retry: false,
  });

  // Fetch posts with filters
  const { data: postsData, isLoading: postsLoading } = useQuery<PostsResponse>({
    queryKey: ["/api/posts", selectedCampaign, currentPage, pageSize, searchQuery, postType],
    retry: false,
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPostTypeColor = (isPublic: boolean, isPaid: boolean) => {
    if (isPublic) return "bg-green-500/10 text-green-500";
    if (isPaid) return "bg-blue-500/10 text-blue-500";
    return "bg-orange-500/10 text-orange-500";
  };

  const getPostTypeLabel = (isPublic: boolean, isPaid: boolean) => {
    if (isPublic) return "Public";
    if (isPaid) return "Paid";
    return "Patron Only";
  };

  const totalPages = postsData ? Math.ceil(postsData.total / pageSize) : 0;
  const posts: Post[] = postsData?.posts || [];

  // Calculate analytics
  const totalPosts = postsData?.total || 0;
  const publicPosts = posts.filter(p => p.isPublic).length;
  const paidPosts = posts.filter(p => p.isPaid).length;
  const totalLikes = posts.reduce((sum, post) => sum + post.likeCount, 0);
  const totalComments = posts.reduce((sum, post) => sum + post.commentCount, 0);
  const avgEngagement = posts.length > 0 ? (totalLikes + totalComments) / posts.length : 0;

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
      {!isMobile && <Sidebar onConnectPatreon={() => setShowConnectModal(true)} />}
      {isMobile && <Sidebar onConnectPatreon={() => setShowConnectModal(true)} />}
      
      <main className={`flex-1 overflow-auto ${isMobile ? 'pt-16' : ''}`}>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-card border-b border-border ${isMobile ? 'p-4' : 'p-6'}`}
        >
          <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}>
            <div>
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>Post Analytics</h1>
              <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
                Analyze your content performance and engagement metrics
              </p>
            </div>
            
            <Button
              onClick={() => setShowConnectModal(true)}
              className={`bg-primary hover:bg-primary/90 text-primary-foreground ${isMobile ? 'w-full' : ''}`}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Latest Posts
            </Button>
          </div>
        </motion.header>

        {/* Content */}
        <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
          {/* Analytics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`grid ${isSmallMobile ? 'grid-cols-1' : isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-4 md:gap-6 mb-6`}
          >
            <Card className="bg-card border-border">
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center space-x-2">
                  <FileText className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-primary`} />
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Total Posts</p>
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{totalPosts.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center space-x-2">
                  <Heart className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-500`} />
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Total Likes</p>
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{totalLikes.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center space-x-2">
                  <MessageCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500`} />
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Total Comments</p>
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{totalComments.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center space-x-2">
                  <TrendingUp className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-500`} />
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Avg. Engagement</p>
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{Math.round(avgEngagement)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className={`flex ${isMobile ? 'flex-col' : 'flex-col md:flex-row'} gap-4`}>
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder={isMobile ? "Search posts..." : "Search posts by title..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
                    <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                      <SelectTrigger className={`${isMobile ? 'w-full' : 'w-48'}`}>
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

                    <Select value={postType} onValueChange={setPostType}>
                      <SelectTrigger className={`${isMobile ? 'w-full' : 'w-40'}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="patron">Patron Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Post Types Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
          >
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Public Posts</p>
                      <p className="text-2xl font-bold">{publicPosts}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-500">Public</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Paid Posts</p>
                      <p className="text-2xl font-bold">{paidPosts}</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-500">Paid</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Patron Only</p>
                      <p className="text-2xl font-bold">{posts.length - publicPosts - paidPosts}</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-500/10 text-orange-500">Patron Only</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Posts Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted animate-pulse rounded" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                          <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || selectedCampaign !== "all" || postType !== "all"
                        ? "Try adjusting your filters or search terms." 
                        : "Connect your Patreon campaigns to see post data."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Published</TableHead>
                            <TableHead>Likes</TableHead>
                            <TableHead>Comments</TableHead>
                            <TableHead>Engagement</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {posts.map((post, index) => (
                            <motion.tr
                              key={post.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b border-border/50 hover:bg-muted/50"
                            >
                              <TableCell>
                                <div className="max-w-sm">
                                  <p className="font-medium truncate">
                                    {post.title || 'Untitled Post'}
                                  </p>
                                  {post.content && (
                                    <p className="text-sm text-muted-foreground truncate">
                                      {post.content.length > 100 
                                        ? `${post.content.substring(0, 100)}...` 
                                        : post.content}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getPostTypeColor(post.isPublic, post.isPaid)}>
                                  {getPostTypeLabel(post.isPublic, post.isPaid)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{post.campaignTitle || 'Unknown Campaign'}</span>
                              </TableCell>
                              <TableCell>
                                {formatDate(post.publishedAt)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Heart className="w-4 h-4 text-red-500" />
                                  <span>{post.likeCount.toLocaleString()}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <MessageCircle className="w-4 h-4 text-blue-500" />
                                  <span>{post.commentCount.toLocaleString()}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">
                                  {(post.likeCount + post.commentCount).toLocaleString()}
                                </span>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-muted-foreground">
                          Showing {posts.length} of {postsData?.total} posts
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          <span className="text-sm">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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