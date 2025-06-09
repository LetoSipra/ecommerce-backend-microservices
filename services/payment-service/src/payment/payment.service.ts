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
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
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

      this.logger.log({
        level: 'info',
        message: 'Payment intent created',
        paymentIntentId: paymentIntent.id,
        orderId: createPaymentDto.orderId,
        amount: createPaymentDto.amount,
        timestamp: new Date().toISOString(),
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

      const orderServiceUrl =
        process.env.ORDER_SERVICE_URL || 'http://order-service:3004';

      const editOrderStatus = await fetch(
        `${orderServiceUrl}/orders/${payment.orderId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify({ status: 'PAID' }),
        },
      );
      if (!editOrderStatus.ok) {
        console.log(editOrderStatus);
        throw new BadRequestException('Failed to update order status');
      }

      this.logger.log({
        level: 'info',
        message: 'Payment confirmed',
        paymentIntentId: confirmedIntent.id,
        orderId: payment.orderId,
        amount: payment.amount,
        timestamp: new Date().toISOString(),
      });

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

      this.logger.log({
        level: 'info',
        message: 'Updating payment by providerId',
        providerId,
        update,
        timestamp: new Date().toISOString(),
      });

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

      this.logger.log({
        level: 'info',
        message: 'Updating payment',
        paymentId: id,
        updateData: updatePaymentDto,
        timestamp: new Date().toISOString(),
      });

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

      this.logger.log({
        level: 'info',
        message: 'Removing payment',
        paymentId: id,
        timestamp: new Date().toISOString(),
      });

      return await this.prisma.payment.delete({ where: { id } });
    } catch {
      throw new BadRequestException('Failed to remove payment');
    }
  }
}
