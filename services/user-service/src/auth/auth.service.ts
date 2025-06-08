import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInDto } from './dto/signInDto';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated/prisma';
import bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<{
    user: Omit<User, 'password'>;
    token: string;
  }> {
    const { email, password } = signInDto;
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
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
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to sign in');
    }
  }
}
