import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { categoryId, name, price, sku, description, imageUrl, isActive } =
      createProductDto;

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
        },
        include: {
          category: true,
          inventory: true,
        },
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
