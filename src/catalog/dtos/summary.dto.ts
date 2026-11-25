export class RewardItem {
  id: number;
  icon: string;
  title: string;
  description: string;
  points: number;
  expiry: Date;
  available: boolean;
  price: number;
  terms: string;
  link: string;
}

export type SummaryResponse = {
  id: number;
  name: string;
  icons: string;
  items: RewardItem[];
  totalCount: number
}[];
