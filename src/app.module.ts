import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ConfigModule } from './config/config.module';

import { join } from 'path';
import { UserModule } from './user/user.module';
import { MongoModule } from './mongo/mongo.module';
import { ChainModule } from './chain/chain.module';
import { WorkerModule } from './worker/worker.module';

@Module({
  imports: [
    ConfigModule,
    MongoModule,
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'],
      definitions: {
        path: join(process.cwd(), 'src/graphql.ts'),
        outputAs: 'class',
      },
      context: ({ req }) => {
        req.locals = {
          chainId: Number(req.headers['chain-id']),
          authSignature: req.headers['auth-signature'],
        };
        return req;
      },
    }),
    ChainModule,
    UserModule,
    WorkerModule,
  ],
})
export class AppModule {}
