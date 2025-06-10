import { Inject, Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicatorResult,
  HealthIndicator,
} from '@nestjs/terminus';
import { STRIPE_CLIENT } from 'src/stripe/stripe.provider';
import Stripe from 'stripe';

@Injectable()
export class StripeHealthIndicator extends HealthIndicator {
  constructor(@Inject(STRIPE_CLIENT) private readonly stripe: Stripe) {
    super();
  }
  async isHealthy(key = 'stripe'): Promise<HealthIndicatorResult> {
    try {
      await this.stripe.accounts.retrieve();
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Stripe check failed',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
