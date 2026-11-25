import {
  clientHistogram,
  clientSummary,
} from '@/common/configs/metrics.config';

export interface MetricsData extends Partial<Record<string, string | number>> {
  method: string;
  route: string;
  status_code: number;
}

export default class Metrics {
  private readonly consumers: ((
    labels?: Partial<Record<string, string | number>>,
  ) => void)[];
  private readonly timer: [number, number];
  private data: MetricsData;

  constructor(data: MetricsData) {
    const histogramMetrics = clientHistogram.startTimer();
    const summaryMetrics = clientSummary.startTimer();
    this.consumers = [histogramMetrics, summaryMetrics];
    this.timer = process.hrtime();
    this.data = data;
  }

  updateStatus(status: number) {
    this.data.status_code = status;
    return this;
  }

  consume() {
    for (const consumer of this.consumers) {
      consumer(this.data);
    }
  }

  getResponseTime() {
    const responseTime = process.hrtime(this.timer);
    return responseTime[0] * 1e3 + responseTime[1] / 1e6;
  }

  static init(data: MetricsData) {
    return new Metrics(data);
  }
}
