// src/providers/ethereal-mail.provider.ts

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EtherealMailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EtherealMailService.name);

  async onModuleInit() {
    // Create a test account on Ethereal (only once at startup)
    const testAccount = await nodemailer.createTestAccount();

    // Configure transporter to use the Ethereal SMTP server
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user, // e.g. "abcd@ethereal.email"
        pass: testAccount.pass, // the generated password
      },
    });

    this.logger.log(`Ethereal account created: ${testAccount.user}`);
  }

  /**
   * sendMail:
   *   - to: recipient email
   *   - subject: subject line (you can hard‑code per template or pass it in)
   *   - html: full HTML body (must be rendered from your template+payload)
   *
   * Returns { messageId, previewUrl, timestamp } on success.
   */
  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<{ messageId: string; previewUrl: string; timestamp: Date }> {
    if (!this.transporter) {
      throw new Error('Transmitter not initialized');
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info = await this.transporter.sendMail({
        from: '"No Reply" <no-reply@yourdomain.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const previewUrl = nodemailer.getTestMessageUrl(info) || '';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.log(`Ethereal mail sent: ${info.messageId}`);
      this.logger.log(`Preview URL: ${previewUrl}`);

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        messageId: info.messageId,
        previewUrl,
        timestamp: new Date(),
      };
    } catch (err: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Ethereal send failed: ${err.message}`);
      throw err;
    }
  }
}
