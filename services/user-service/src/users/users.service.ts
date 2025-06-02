import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from 'generated/prisma';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { USER_SELECT } from 'src/prisma/selectors/selectors';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<{
    user: Omit<User, 'password'>;
    token: string;
  }> {
    const { password, email, firstName, lastName, role } = createUserDto;
    const hashPassword = await bcrypt.hash(password, 10);

    try {
      const user = await this.prisma.user.create({
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw new BadRequestException('Creating new user failed');
    }
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    try {
      return await this.prisma.user.findMany({
        select: USER_SELECT,
      });
    } catch {
      throw new BadRequestException('Failed to fetch users');
    }
  }

  async findOne(id: string): Promise<Omit<User, 'password'> | null> {
    try {
      return await this.prisma.user.findUnique({
        where: {
          id: id,
        },
        select: USER_SELECT,
      });
    } catch {
      throw new BadRequestException('Failed to fetch user');
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<{
    user: Omit<User, 'password'>;
    token?: string;
  }> {
    const data: Record<string, any> = {};

    if (updateUserDto.password)
      data.password = await bcrypt.hash(updateUserDto.password, 10);

    if (updateUserDto.email !== undefined) data.email = updateUserDto.email;

    if (updateUserDto.firstName !== undefined)
      data.firstName = updateUserDto.firstName;

    if (updateUserDto.lastName !== undefined)
      data.lastName = updateUserDto.lastName;

    if (updateUserDto.role !== undefined) data.role = updateUserDto.role;

    if (updateUserDto.isActive !== undefined)
      data.isActive = updateUserDto.isActive;

    try {
      const updatedUser = await this.prisma.user.update({
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw new BadRequestException('Failed to update user');
    }
  }

  async remove(id: string): Promise<Omit<User, 'password'>> {
    try {
      return await this.prisma.user.delete({
        where: {
          id,
        },
        select: USER_SELECT,
      });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw new BadRequestException('Failed to delete user');
    }
  }
}
