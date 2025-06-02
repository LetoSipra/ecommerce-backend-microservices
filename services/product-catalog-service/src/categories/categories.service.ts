import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name, description } = createCategoryDto;

    try {
      const category = await this.prisma.category.create({
        data: { name, description },
      });
      return category;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        throw new BadRequestException('Category name must be unique');
      }
      throw new BadRequestException('Failed to create category');
    }
  }

  async findAll(): Promise<Category[]> {
    try {
      return await this.prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          products: true,
        },
      });
    } catch {
      throw new BadRequestException('Failed to fetch categories');
    }
  }

  async findOne(id: string): Promise<Category | null> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        include: {
          products: true,
        },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      return category;
    } catch {
      throw new BadRequestException('Failed to fetch category');
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    try {
      const existing = await this.prisma.category.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Category not found');
      }
      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
        include: {
          products: true,
        },
      });
      return updatedCategory;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        throw new BadRequestException('Category name must be unique');
      }
      throw new BadRequestException('Failed to update category');
    }
  }

  async remove(id: string) {
    try {
      const existing = await this.prisma.category.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Category not found');
      }
      const category = await this.prisma.category.delete({ where: { id } });
      return category;
    } catch {
      throw new BadRequestException('Failed to delete category');
    }
  }
}
