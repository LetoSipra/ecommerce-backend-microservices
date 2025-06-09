import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Inventory } from 'generated/prisma';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';

@Injectable()
export class InventoriesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const { productId, quantity, reserved } = createInventoryDto;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    try {
      this.logger.log({
        level: 'info',
        message: 'Creating inventory',
        productId,
        quantity,
        reserved,
        timestamp: new Date().toISOString(),
      });

      return await this.prisma.inventory.create({
        data: {
          productId,
          quantity,
          reserved,
        },
      });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      if (error.code === 'P2002' && error.meta?.target?.includes('productId')) {
        throw new BadRequestException(
          'Inventory for this product already exists',
        );
      }
      throw new BadRequestException('Failed to create inventory');
    }
  }

  async findByProductId(productId: string): Promise<Inventory> {
    const inventory = await this.prisma.inventory.findUnique({
      where: { productId },
      include: { product: true },
    });
    if (!inventory) throw new NotFoundException('Inventory not found');
    return inventory;
  }

  async findAll(): Promise<Inventory[]> {
    try {
      return await this.prisma.inventory.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
        },
      });
    } catch {
      throw new BadRequestException('Failed to fetch inventories');
    }
  }

  async findOne(id: string): Promise<Inventory> {
    try {
      const inventory = await this.prisma.inventory.findUnique({
        where: { id },
      });
      if (!inventory) {
        throw new NotFoundException('Inventory not found');
      }
      return inventory;
    } catch {
      throw new BadRequestException('Failed to fetch inventory');
    }
  }

  async updateByProductId(
    productId: string,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<Inventory> {
    const inventory = await this.prisma.inventory.findUnique({
      where: { productId },
    });
    if (!inventory) throw new NotFoundException('Inventory not found');

    this.logger.log({
      level: 'info',
      message: 'Updating inventory by productId',
      productId,
      update: updateInventoryDto,
      timestamp: new Date().toISOString(),
    });

    return this.update(inventory.id, updateInventoryDto);
  }

  async update(
    id: string,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<Inventory> {
    try {
      const existing = await this.prisma.inventory.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new NotFoundException('Inventory not found');
      }

      const data: Record<string, unknown> = {};

      if (updateInventoryDto.quantity !== undefined)
        data.quantity = updateInventoryDto.quantity;
      if (updateInventoryDto.reserved !== undefined)
        data.reserved = updateInventoryDto.reserved;
      if (updateInventoryDto.productId !== undefined)
        data.productId = updateInventoryDto.productId;

      if (updateInventoryDto.incrementQuantity) {
        data.quantity = { increment: updateInventoryDto.incrementQuantity };
      }
      if (updateInventoryDto.decrementQuantity) {
        data.quantity = { decrement: updateInventoryDto.decrementQuantity };
      }
      if (updateInventoryDto.incrementReserved) {
        data.reserved = { increment: updateInventoryDto.incrementReserved };
      }
      if (updateInventoryDto.decrementReserved) {
        data.reserved = { decrement: updateInventoryDto.decrementReserved };
      }

      this.logger.log({
        level: 'info',
        message: 'Updating inventory',
        inventoryId: id,
        update: data,
        timestamp: new Date().toISOString(),
      });

      return await this.prisma.inventory.update({
        where: { id },
        data,
      });
    } catch {
      throw new BadRequestException('Failed to update inventory');
    }
  }

  async remove(id: string): Promise<Inventory> {
    try {
      const existing = await this.prisma.inventory.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new NotFoundException('Inventory not found');
      }

      this.logger.log({
        level: 'info',
        message: 'Deleting inventory',
        inventoryId: id,
        timestamp: new Date().toISOString(),
      });

      return await this.prisma.inventory.delete({ where: { id } });
    } catch {
      throw new BadRequestException('Failed to delete inventory');
    }
  }
}
