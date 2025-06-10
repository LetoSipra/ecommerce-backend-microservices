import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as Elasticsearch from 'winston-elasticsearch';

const serviceName = process.env.SERVICE_NAME || 'user-service';
const environment = process.env.NODE_ENV || 'development';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: () => {
        const esTransportOpts: Elasticsearch.ElasticsearchTransportOptions = {
          level: 'info',
          indexPrefix: `${serviceName}-${environment}-`,
          clientOpts: {
            // Points at the Elasticsearch host inside Docker:
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
          },
          // (Optional) bufferLimit, flushInterval, etc. can go here
          bufferLimit: 1,
          flushInterval: 1000,
        };

        const esTransport = new Elasticsearch.ElasticsearchTransport(
          esTransportOpts,
        );

        // Add after creating esTransport
        esTransport.on('error', (err) => {
          console.error('Elasticsearch Transport Error:', err);
        });

        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.metadata({
              fillExcept: ['message', 'level', 'timestamp', 'service', 'env'],
            }),
            winston.format.json(),
          ),
        });

        return {
          defaultMeta: { service: serviceName, env: environment },
          transports: [
            // Log to Console as JSON (so stdout also carries JSON, which Filebeat could pick up)
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
            }),
            // Directly push to Elasticsearch
            esTransport,
          ],
          exitOnError: false,
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
