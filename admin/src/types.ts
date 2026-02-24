export type UserStatus = 'FREE' | 'ACTIVE' | 'BLOCKED';

export interface User {
  id: string;
  phone: string;
  status: UserStatus;
  fcmToken?: string;
  createdAt: string;
  name?: string;
  subscriptionEndDate?: string; // ISO string e.g. "2025-12-31T00:00:00.000Z"
}

export interface ActiveTrade {
  id: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  status: string;
  createdAt: string;
}

export interface ClosedTrade {
  id: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  profitLossPercent: number;
  closedAt: string;
}
