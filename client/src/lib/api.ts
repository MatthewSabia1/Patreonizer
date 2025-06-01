import { apiRequest } from "./queryClient";
import type { 
  DashboardMetrics, 
  RecentActivity, 
  PatreonAccount, 
  Campaign, 
  PatronDataResponse, 
  RevenueSnapshot, 
  SyncStatus 
} from "@/types";

export class API {
  // Dashboard APIs
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await apiRequest("GET", "/api/dashboard/metrics");
    return await response.json();
  }

  async getRecentActivity(limit?: number): Promise<RecentActivity[]> {
    const url = limit ? `/api/dashboard/activity?limit=${limit}` : "/api/dashboard/activity";
    const response = await apiRequest("GET", url);
    return await response.json();
  }

  // Patreon Account APIs
  async getPatreonAccounts(): Promise<PatreonAccount[]> {
    const response = await apiRequest("GET", "/api/patreon/accounts");
    return await response.json();
  }

  async disconnectPatreonAccount(accountId: number): Promise<void> {
    await apiRequest("DELETE", `/api/patreon/accounts/${accountId}`);
  }

  // Campaign APIs
  async getCampaigns(): Promise<Campaign[]> {
    const response = await apiRequest("GET", "/api/campaigns");
    return await response.json();
  }

  // Patron APIs
  async getPatrons(params?: {
    campaignId?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PatronDataResponse> {
    const searchParams = new URLSearchParams();
    if (params?.campaignId) searchParams.append("campaignId", params.campaignId.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const url = `/api/patrons${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await apiRequest("GET", url);
    return await response.json();
  }

  async exportPatrons(campaignId?: number): Promise<Blob> {
    const url = campaignId 
      ? `/api/patrons/export?campaignId=${campaignId}` 
      : "/api/patrons/export";
    const response = await apiRequest("GET", url);
    return await response.blob();
  }

  // Revenue APIs
  async getRevenueSnapshots(params?: {
    campaignId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<RevenueSnapshot[]> {
    const searchParams = new URLSearchParams();
    if (params?.campaignId) searchParams.append("campaignId", params.campaignId.toString());
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);

    const url = `/api/revenue/snapshots${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await apiRequest("GET", url);
    return await response.json();
  }

  // Sync APIs
  async syncAccount(accountId: number, syncType: "full" | "incremental" = "incremental"): Promise<void> {
    await apiRequest("POST", `/api/sync/account/${accountId}`, { syncType });
  }

  async syncAllAccounts(): Promise<void> {
    await apiRequest("POST", "/api/sync/all");
  }

  async getSyncStatus(): Promise<SyncStatus[]> {
    const response = await apiRequest("GET", "/api/sync/status");
    return await response.json();
  }
}

export const api = new API();
