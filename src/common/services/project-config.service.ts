import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';

@Injectable()
export class ProjectConfig {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
  ) {}

  private async loadConfig(projectId: number): Promise<Record<string, string>> {
    const project = await this.projects.findOneBy({ id: projectId });
    const config = project.configurations;
    return config;
  }

  async managedByCustomer(projectId: number): Promise<boolean> {
    const config = await this.loadConfig(projectId);
    return !config?.walletManagedBy || config?.walletManagedBy === 'Customer';
  }
}
