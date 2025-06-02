import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InventoriesService } from './inventories.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/auth/role.enum';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('inventories')
export class InventoriesController {
  constructor(private readonly inventoriesService: InventoriesService) {}

  @Post()
  @ApiBearerAuth('jwt')
  @Roles(Role.ADMIN)
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoriesService.create(createInventoryDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.inventoriesService.findAll();
  }

  @Patch('by-product/:productId')
  @Public()
  updateByProductId(
    @Param('productId') productId: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoriesService.updateByProductId(
      productId,
      updateInventoryDto,
    );
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.inventoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('jwt')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoriesService.update(id, updateInventoryDto);
  }

  @Delete(':id')
  @ApiBearerAuth('jwt')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.inventoriesService.remove(id);
  }
}
