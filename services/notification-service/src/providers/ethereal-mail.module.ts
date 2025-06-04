// src/providers/ethereal-mail.module.ts

import { Module } from '@nestjs/common';
import { EtherealMailService } from './ethereal-mail.provider';

@Module({
  providers: [EtherealMailService],
  exports: [EtherealMailService],
})
export class EtherealMailModule {}
