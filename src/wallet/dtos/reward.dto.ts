export class WalletRewardItem {
  id: number;
  price: number;
  icon: string;
  title: string;
  description: string;
  createdAt: Date;
  expiry: Date;
  code: string;
  link: string;
}

export class WalletRewardResponse {
  available: WalletRewardItem[];
  expired: WalletRewardItem[];
}
