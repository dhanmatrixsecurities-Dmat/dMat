export type UserStatus = 'FREE' | 'ACTIVE' | 'BLOCKED';
export type SubscriptionAccess = 'equity' | 'fno' | 'all' | 'none';

export interface User {
  id: string;
  phone: string;
  status: UserStatus;
  fcmToken?: string;
  createdAt: string;
  name?: string;
  subscriptionEndDate?: string;
  subscriptionAccess?: SubscriptionAccess; // ✅ THIS WAS MISSING
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
