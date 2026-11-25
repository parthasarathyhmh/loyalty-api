import { Histogram, Summary } from 'prom-client';

const buckets = [
  0.03, 0.05, 0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10,
];
const percentiles = [0.2, 0.5, 0.9, 0.95, 0.99];

const METRICS_CONFIGS = {
  endpoint: '/metrics',
  routeMetrics: {
    overrides: {
      histogram: {
        name: 'http_request_duration_seconds',
        help: 'request duration in seconds',
        labelNames: ['status_code', 'method', 'route'],
        buckets: buckets,
      },
      summary: {
        name: 'http_request_summary_seconds',
        help: 'request duration in seconds summary',
        labelNames: ['status_code', 'method', 'route'],
        percentiles: percentiles,
      },
    },
  },
  name: 'metrics',
  defaultMetrics: { enabled: true },
  clearRegisterOnInit: false,
};

const clientHistogramOptions = {
  name: 'http_client_request_duration_seconds',
  help: 'Client request duration in seconds histogram',
  labelNames: ['status_code', 'method', 'route'],
  buckets,
};

const clientSummaryOptions = {
  name: 'http_client_request_summary_seconds',
  help: 'Client request duration in seconds summary',
  labelNames: ['status_code', 'method', 'route'],
  percentiles,
};

const clientHistogram = new Histogram(clientHistogramOptions);
const clientSummary = new Summary(clientSummaryOptions);

export { METRICS_CONFIGS, clientHistogram, clientSummary };
