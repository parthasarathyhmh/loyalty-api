import { SetMetadata } from '@nestjs/common';

export enum ConsumerType {
  HSF_MX = 'HSF_MX',
  MAGENTO = 'MAGENTO',
  YALO = 'YALO',
}

export const Consumer = (consumer: ConsumerType) =>
  SetMetadata('consumer', consumer);
