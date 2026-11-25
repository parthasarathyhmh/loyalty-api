import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export interface NetInvoiceItem {
  skuCode: string;
  grossInvoiceValue: string;
  netInvoiceValue: string;
  netQuantity: string;
}

export interface NetInvoiceResponse {
  purchaseOrderNumber: string;
  items: NetInvoiceItem[];
}


@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50 })
  billingNumber: string;

  @Column({ type: 'boolean', default: false }) // Default to `false` if not processed
  isProcessed: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  grossSalesValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  netSalesValue: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  taxAmount: number;

  @Column({ type: 'varchar', length: 50 })
  skuCode: string;

  @Column({ type: 'varchar', length: 50 })
  purchaseOrderNumber: string;

  @Column({ type: 'varchar', length: 50 })
  retailerCode: string;

  @Column({ type: 'varchar', length: 10 })
  orderTypeCode: string;

  @Column({ type: 'timestamp' })
  billingDate: Date;

  @Column({ type: 'timestamp' })
  orderCreationDate: Date;

  @Column({ type: 'varchar', length: 50 })
  channelName: string;
}
