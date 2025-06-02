import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from 'src/stripe/stripe.provider';
import { Payment, PaymentStatus } from 'generated/prisma';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(createPaymentDto.amount * 100),
        currency: 'usd',
        payment_method_types: ['card'], // ← force card payments only
        metadata: { orderId: createPaymentDto.orderId },
      });

      return await this.prisma.payment.create({
        data: {
          ...createPaymentDto,
          provider: 'stripe',
          providerId: paymentIntent.id,
          status: 'PENDING',
        },
      });
    } catch {
      throw new BadRequestException('Failed to create payment');
    }
  }

  async confirmPayment(
    providerId: string,
    authHeader?: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const confirmedIntent = await this.stripe.paymentIntents.confirm(
        providerId,
        {
          payment_method: 'pm_card_visa',
        },
      );

      const payment = await this.prisma.payment.findFirst({
        where: { providerId },
      });
      if (!payment) {
        throw new NotFoundException('Payment not found for providerId');
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
        },
      });

      const x = await fetch(`http://localhost:3003/orders/${payment.orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({ status: 'PAID' }),
      });
      if (!x.ok) {
        console.log(x);
        throw new BadRequestException('FFWREFGVREGERG ');
      }
      return confirmedIntent;
    } catch (err) {
      console.log(err);
      throw new BadRequestException('Failed to confirm payment');
    }
  }

  async updateByProviderId(
    providerId: string,
    update: Partial<{ status: PaymentStatus }>,
  ): Promise<Payment> {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: { providerId },
      });
      if (!payment)
        throw new NotFoundException('Payment not found for providerId');
      const data = { ...update };
      return await this.prisma.payment.update({
        where: { id: payment.id },
        data,
      });
    } catch (error) {
      console.error('updateByProviderId error:', error);
      throw new BadRequestException('Failed to update payment by providerId');
    }
  }

  async findAll() {
    try {
      return await this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      throw new BadRequestException('Failed to fetch payments');
    }
  }

  async findOne(id: string) {
    try {
      const payment = await this.prisma.payment.findUnique({ where: { id } });
      if (!payment) throw new NotFoundException('Payment not found');
      return payment;
    } catch {
      throw new BadRequestException('Failed to fetch payment');
    }
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    try {
      const payment = await this.prisma.payment.findUnique({ where: { id } });
      if (!payment) throw new NotFoundException('Payment not found');
      return await this.prisma.payment.update({
        where: { id },
        data: updatePaymentDto,
      });
    } catch {
      throw new BadRequestException('Failed to update payment');
    }
  }

  async remove(id: string) {
    try {
      const payment = await this.prisma.payment.findUnique({ where: { id } });
      if (!payment) throw new NotFoundException('Payment not found');
      return await this.prisma.payment.delete({ where: { id } });
    } catch {
      throw new BadRequestException('Failed to remove payment');
    }
  }
}
