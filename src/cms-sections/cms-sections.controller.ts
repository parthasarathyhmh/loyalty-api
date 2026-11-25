import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { CmsSectionsService } from './cms-sections.service';

@Controller('cms-sections')
export class CmsSectionsController {
  constructor(private readonly cmsSectionsService: CmsSectionsService) {}


  @Get()
  async findAll() {
    return await this.cmsSectionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const section = await this.cmsSectionsService.findOne(+id);
    if (!section) {
      throw new NotFoundException(`CMS Section with ID ${id} not found`);
    }
    return section;
  }
}
