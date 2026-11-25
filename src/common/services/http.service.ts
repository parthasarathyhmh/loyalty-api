import { Logger } from '@nestjs/common';
import axios from 'axios';
import Metrics from './metrics';

export interface HttpCallOptions {
  url: string;
  headers?: Record<string, string>;
  method?: string;
  data?: any;
  path: string;
}

export default class HttpService {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  async rest(opts: HttpCallOptions) {
    const common = {
      message: 'External Request Context',
      request: {
        url: opts.url,
        method: opts.method ?? 'GET',
        data: opts.data,
        headers: opts.headers,
      },
    };

    this.logger.log(common);

    const mInstance = Metrics.init({
      status_code: 200,
      method: opts.method ?? 'GET',
      route: opts.path,
    });

    try {
      const response = await axios({
        url: opts.url,
        method: opts.method,
        data: opts.data,
        headers: { ...opts.headers, 'Content-Type': 'application/json' },
      });

      mInstance.updateStatus(response.status).consume();
      this.logger.log({
        ...common,
        message: 'External Response Context:',
        response: {
          data: response.data,
          status_code: response.status,
        },
      });
      return response.data;
    } catch (error) {
      mInstance.updateStatus(error?.response?.status || 500).consume();
      this.logger.error({
        ...common,
        message: 'External Error Context:',
        response: {
          error: error?.response?.data,
          status_code: error?.response?.status,
          ...(error?.message && { raw_error: error.message }),
        },
      });
    }
  }
}
