export class TierResponse {
    currentTier: string;
    tierInfo: Array<{
      tierName: string;
      pointsRequired: number[];
      exchangeRate: number;
      isCurrent: boolean;
    }>;
}