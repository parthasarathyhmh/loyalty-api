import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { Customer } from '../entities/customer.entity';
import { UserEntity } from '../interfaces/user';
import { ProjectConfig } from './project-config.service';

export interface Account {
  managedByCustomer: boolean;
  customer: Customer;
  wallet: Wallet;
  walletIds?: number[];
  active: number;
  blocked: number;
}

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(Wallet)
    private readonly wallets: Repository<Wallet>,
    private readonly projectConfig: ProjectConfig,
  ) {}

  private async findWalletsByRetailer(
    projectId: number,
    retailerCode: string,
  ): Promise<Wallet[]> {
    return this.wallets.findBy({ retailerCode, projectId });
  }

  private async findWalletsByCustomer(
    projectId: number,
    customerId: number,
  ): Promise<Wallet[]> {
    return this.wallets.findBy({ customer: { customerId }, projectId });
  }

  async fetchWalletIds(
    projectId: number,
    customerId: number,
    retailerCode: string,
    skipWallet: boolean,
  ) {
    const managedByCustomer =
      await this.projectConfig.managedByCustomer(projectId);
    const wallets = managedByCustomer
      ? await this.findWalletsByCustomer(projectId, customerId)
      : await this.findWalletsByRetailer(projectId, retailerCode);

    if (!wallets.length) {
      if (skipWallet) {
        console.log('Skipping wallet for tier update:', customerId);
        return;
      }
      throw new NotFoundException('wallet not found');
    }

    return wallets.map(({ id }) => id);
  }

  async getWalletIds(
    projectId: number,
    customer: Customer,
    skipWallet?: boolean,
  ): Promise<number[]>;
  async getWalletIds(
    projectId: number,
    user: UserEntity,
    skipWallet?: boolean,
  ): Promise<number[]>;
  async getWalletIds(
    projectId: number,
    userOrCustomer: UserEntity | Customer,
    skipWallet: boolean = false,
  ): Promise<number[]> {
    const customerId =
      'customerId' in userOrCustomer
        ? userOrCustomer.customerId
        : Number.parseInt(userOrCustomer.user_id, 10);
    const retailerCode =
      'retailer_code' in userOrCustomer
        ? userOrCustomer.retailer_code
        : userOrCustomer.retailerCode;

    return this.fetchWalletIds(projectId, customerId, retailerCode, skipWallet);
  }

  async getDetails(
    userId: string,
    projectId: number,
    options?: { supressWalletError: boolean },
  ): Promise<Account> {
    const customer = await this.customers.findOneBy({
      customerId: Number.parseInt(userId),
    });

    if (!customer) throw new NotFoundException('user not found');

    const managedByCustomer =
      await this.projectConfig.managedByCustomer(projectId);

    const wallets = managedByCustomer
      ? await this.findWalletsByCustomer(projectId, customer.customerId)
      : await this.findWalletsByRetailer(projectId, customer.retailerCode);

    if (!wallets.length && !options?.supressWalletError) {
      throw new NotFoundException('wallet not found');
    }

    const wallet = managedByCustomer
      ? wallets[0]
      : wallets.find((w) => w.customerId === customer.id);
    const walletIds = wallets.map((w) => w.id);
    const { active, blocked } = wallets.reduce(
      (totals, w) => {
        totals.active += Number(w.active) || 0;
        totals.blocked += Number(w.blocked) || 0;
        return totals;
      },
      { active: 0, blocked: 0 },
    );

    return {
      active,
      blocked,
      wallet,
      customer,
      managedByCustomer,
      walletIds,
    };
  }
}
