import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const {
      quantity,
      reserved,
      categoryId,
      name,
      price,
      sku,
      description,
      imageUrl,
      isActive,
    } = createProductDto;

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    try {
      const product = await this.prisma.product.create({
        data: {
          name,
          price,
          sku,
          categoryId,
          description,
          imageUrl,
          isActive,
          inventory: {
            create: {
              quantity: quantity || 0,
              reserved: reserved || 0,
            },
          },
        },
        include: {
          category: true,
          inventory: true,
        },
      });

      this.logger.log({
        level: 'info',
        message: 'Product created',
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        categoryId: product.categoryId,
        createdAt: product.createdAt,
      });

      return product;
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
        throw new BadRequestException('SKU must be unique');
      }
      throw new BadRequestException('Failed to create product');
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      return await this.prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          inventory: true,
        },
      });
    } catch {
      throw new BadRequestException('Failed to fetch products');
    }
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { categoryId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        inventory: true,
      },
    });
  }

  async findOne(id: string): Promise<Product> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          inventory: true,
        },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      return product;
    } catch {
      throw new BadRequestException('Failed to fetch product');
    }
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    try {
      const existing = await this.prisma.product.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Product not found');
      }
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
        include: {
          category: true,
          inventory: true,
        },
      });

      this.logger.log({
        level: 'info',
        message: 'Product updated',
        productId: updatedProduct.id,
        name: updatedProduct.name,
        sku: updatedProduct.sku,
        price: updatedProduct.price,
        categoryId: updatedProduct.categoryId,
        updatedAt: updatedProduct.updatedAt,
      });

      return updatedProduct;
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
        throw new BadRequestException('SKU must be unique');
      }
      throw new BadRequestException('Failed to update product');
    }
  }

  async remove(id: string): Promise<Product> {
    try {
      const existing = await this.prisma.product.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Product not found');
      }

      this.logger.log({
        level: 'info',
        message: 'Removing product',
        productId: id,
        name: existing.name,
        sku: existing.sku,
        price: existing.price,
        categoryId: existing.categoryId,
        removedAt: new Date().toISOString(),
      });

      return await this.prisma.product.delete({
        where: { id },
        include: {
          category: true,
          inventory: true,
        },
      });
    } catch {
      throw new BadRequestException('Failed to delete product');
    }
  }
}
