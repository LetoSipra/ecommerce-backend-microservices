import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  Req,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from 'src/stripe/stripe.provider';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

@ApiBearerAuth('jwt')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
  ) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  @Post('confirm/:providerId')
  async confirm(@Param('providerId') providerId: string, @Req() req: Request) {
    // This will move the PaymentIntent from "requires_payment_method" → "succeeded"
    const authHeader = req.headers['authorization'];
    const intent = await this.paymentService.confirmPayment(
      providerId,
      authHeader,
    );
    return { status: intent.status, id: intent.id };
  }

  @Get()
  findAll() {
    return this.paymentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentService.remove(id);
  }
}
