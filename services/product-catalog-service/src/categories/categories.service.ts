import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, PrismaClient } from 'generated/prisma';

const prisma = new PrismaClient();

@Injectable()
export class CategoriesService {
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name, description } = createCategoryDto;

    try {
      const category = await prisma.category.create({
        data: {
          name,
          description,
        },
      });

      return category;
    } catch (error) {
      console.log(error);
      throw new Error('Test');
    }
  }

  async findAll(): Promise<Category[]> {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
      });
      return categories;
    } catch (error) {
      console.log(error);
      throw new Error('test');
    }
  }

  async findOne(id: string): Promise<Category | null> {
    try {
      const category = await prisma.category.findUnique({
        where: {
          id,
        },
      });
      return category;
    } catch (error) {
      console.log(error);
      throw new Error('test');
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const { name, description } = updateCategoryDto;
    if (name === undefined && description === undefined) {
      throw new Error(
        'At least one field (name or description) must be provided',
      );
    }
    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    try {
      const updatedCategory = await prisma.category.update({
        where: {
          id,
        },
        data,
      });

      return updatedCategory;
    } catch (error) {
      console.log(error);
      throw new Error('Test');
    }
  }

  async remove(id: string) {
    try {
      const category = await prisma.category.delete({
        where: {
          id,
        },
      });

      return category;
    } catch (error) {
      console.log(error);
      throw new Error('Test');
    }
  }
}
