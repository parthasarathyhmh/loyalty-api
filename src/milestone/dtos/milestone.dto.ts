export class Progress {
  inprogress: number;
  total: number;
}

export class MilestoneItem {
  title: string;
  description: string;
  points: number;
  expiry: Date;
  progress: Progress;
  throughput?: boolean;
}

export class MilestoneResponse {
  points: Progress;
  milestones: Progress;
  completed: MilestoneItem[];
  active: MilestoneItem[];
  incomplete: MilestoneItem[];
}
