import { Injectable } from '@nestjs/common';
import { SignInDto } from './dto/signInDto';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from 'generated/prisma';
import bcrypt from 'bcrypt';
import { CreateSignInUserResponse } from '../users/types';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async signIn(signInDto: SignInDto): Promise<CreateSignInUserResponse> {
    const { email, password } = signInDto;
    try {
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });
      if (!user) {
        throw new Error('Invalid credentials');
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      const payload = {
        id: user.id,
        role: user.role,
      };

      const token = await this.jwtService.signAsync(payload);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: pwd, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, token };
    } catch (error) {
      console.log(error);
      throw new Error('Invalid credentials');
    }
  }
}
