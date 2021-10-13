import { Module } from '@nestjs/common';
import { ConfigModule as _ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    _ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env${process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''}`,
        '.env.development',
      ],
    }),
  ],
})
export class ConfigModule {}
