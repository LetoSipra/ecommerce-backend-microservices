import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaClient } from 'generated/prisma';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { USER_SELECT } from 'src/lib/selectors';
import {
  CreateSignInUserResponse,
  FindUserResponse,
  PublicUser,
} from './types';

const prisma = new PrismaClient();
@Injectable()
export class UsersService {
  constructor(private jwtService: JwtService) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<CreateSignInUserResponse> {
    const { password, email, firstName, lastName, role } = createUserDto;
    const hashPassword = await bcrypt.hash(password, 10);

    try {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashPassword,
          firstName,
          lastName,
          role,
        },
        select: USER_SELECT,
      });

      const payload = {
        id: user.id,
        role: user.role,
      };

      const token = await this.jwtService.signAsync(payload);

      return { user, token };
    } catch (error) {
      console.error(error);
      throw new Error('Creating new user failed');
    }
  }

  async findAll(): Promise<FindUserResponse[]> {
    try {
      const users = await prisma.user.findMany({
        select: USER_SELECT,
      });
      return users.map((user) => ({ user }));
    } catch (error) {
      console.log(error);
      throw new Error('Error');
    }
  }

  async findOne(id: string): Promise<FindUserResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: id,
        },
        select: USER_SELECT,
      });
      return { user };
    } catch (error) {
      console.log(error);
      throw new Error('Error');
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<{ user: PublicUser; token?: string }> {
    const data: Record<string, any> = {};

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.email !== undefined) {
      data.email = updateUserDto.email;
    }
    if (updateUserDto.firstName !== undefined) {
      data.firstName = updateUserDto.firstName;
    }
    if (updateUserDto.lastName !== undefined) {
      data.lastName = updateUserDto.lastName;
    }
    if (updateUserDto.role !== undefined) {
      data.role = updateUserDto.role;
    }
    if (updateUserDto.isActive !== undefined) {
      data.isActive = updateUserDto.isActive;
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id },
        data,
        select: USER_SELECT,
      });

      let newToken: string | undefined;
      if (updateUserDto.role !== undefined) {
        const payload = { id: updatedUser.id, role: updatedUser.role };
        newToken = await this.jwtService.signAsync(payload);
      }

      return { user: updatedUser, token: newToken };
    } catch (error) {
      console.error(error);
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<PublicUser> {
    try {
      const user = await prisma.user.delete({
        where: {
          id,
        },
        select: USER_SELECT,
      });
      return user;
    } catch (error) {
      console.log(error);
      throw new Error('Error deleting user');
    }
  }
}
