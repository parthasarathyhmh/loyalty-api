import { Options } from 'pino-http';

export function getLogConfig(): Options {
  if (process.env.NODE_ENV === 'dev') {
    return {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          levelFirst: true,
        },
      },
      quietReqLogger: true,
      autoLogging: false,
    };
  }
  return {
    quietReqLogger: true,
    autoLogging: false,
    formatters: {
      level: (label) => ({ level: label }),
    },
  };
}
