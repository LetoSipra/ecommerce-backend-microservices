// src/stripe/stripe.provider.ts
import { Provider } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

export const STRIPE_CLIENT = 'STRIPE_CLIENT';

export const StripeProvider: Provider = {
  provide: STRIPE_CLIENT,
  useFactory: (config: ConfigService) => {
    const secretKey = config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in .env');
    }
    return new Stripe(secretKey, {
      apiVersion: '2025-05-28.basil',
    });
  },
  inject: [ConfigService],
};
