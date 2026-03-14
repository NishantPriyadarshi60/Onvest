/** Shared types for Onvest RWA platform */

export type KYCStatus = "PENDING" | "APPROVED" | "REJECTED" | "UNDER_REVIEW";
export type AccreditationType = "INCOME" | "NET_WORTH" | "PROFESSIONAL" | "INSTITUTIONAL";
export type InvestorStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "gp" | "lp" | "admin";
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Fund {
  id: string;
  gpId: string;
  name: string;
  slug: string;
  description?: string;
  fundType?: string;
  targetRaiseCents: number;
  minInvestmentCents: number;
  jurisdiction: string;
  status: string;
  branding: Record<string, unknown>;
  tokenConfig: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Investor {
  id: string;
  fundId: string;
  profileId?: string;
  email: string;
  fullName?: string;
  status: string;
  kycStatus: string;
  walletAddress?: string;
  isWhitelisted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
