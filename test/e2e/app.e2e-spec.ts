import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { gql } from 'apollo-server-express';
import { print } from 'graphql';
import * as faker from 'faker';

import { AppModule } from '../../src/app.module';
import { ChainService } from '../../src/chain/chain.service';
import { NetworkType } from '../../src/chain/enum';
import { EventWatcherService } from '../../src/worker/event-watcher.service';

describe('User e2e Test', () => {
  jest.setTimeout(20000);

  let app: INestApplication;
  let chainService: ChainService;
  let workerService: EventWatcherService;

  let walletAddress: string;
  let userSignature: string;

  // manual testing purposes
  const user2Signature =
    '0x136d9bcb4e5ba4574ff1c8e7d0c4fb3f74a35d8516af7135ef64439e5a3babef0038adcbea27f30a51e6bd2ad3090609147362fbd72f47f5a539c3772b086a481c';
  const user2Address = '0x14791697260E4c9A71f18484C9f997B308e59325';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    chainService = await app.resolve<ChainService>(ChainService);
    workerService = await app.resolve<EventWatcherService>(EventWatcherService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('bootstrap', () => {
    it('init checks', () => {
      expect(app).toBeDefined();
    });

    it('init wallet', async () => {
      const signer = chainService.getSigner(NetworkType.KOVAN);

      const msg = Buffer.from("I'd like to sign in");
      const signature = await signer.signMessage(msg);

      walletAddress = await signer.getAddress();
      userSignature = signature;

      expect(walletAddress).toBeDefined();
      expect(userSignature).toBeDefined();
    });

    it('should index events', async () => {
      await workerService.handleKovanCron();
    });
  });

  describe('user fetching', () => {
    const chainId = 42;

    it('should get existing user', async () => {
      const query = gql`
        query ($address: String!) {
          user(address: $address) {
            id
            chainId
            address
            name
            username
            twitter
          }
        }
      `;
      await request(app.getHttpServer())
        .post('/graphql')
        .set({
          'Chain-Id': chainId,
          'Auth-Signature': userSignature,
        })
        .send({
          variables: {
            address: walletAddress,
          },
          query: print(query),
        })
        .expect((res) => {
          expect(res.body.errors).toBeUndefined();
          expect(res.status).toBe(200);
        });
    });

    it('should return null if user not registered', async () => {
      const query = gql`
        query ($address: String!) {
          user(address: $address) {
            id
            chainId
            address
            name
            username
            twitter
          }
        }
      `;
      await request(app.getHttpServer())
        .post('/graphql')
        .set({
          'Chain-Id': chainId,
          'Auth-Signature': userSignature,
        })
        .send({
          variables: {
            address: '0x7e5323645a93eEaedd957e4bA30f25573AF33725',
          },
          query: print(query),
        })
        .expect((res) => {
          expect(res.body.errors).toBeUndefined();
          expect(res.status).toBe(200);
        });
    });

    it('should get me', async () => {
      const query = gql`
        query {
          me {
            id
            chainId
            address
            name
            username
            twitter
          }
        }
      `;
      await request(app.getHttpServer())
        .post('/graphql')
        .set({
          'Chain-Id': chainId,
          'Auth-Signature': userSignature,
        })
        .send({
          query: print(query),
        })
        .expect((res) => {
          expect(res.body.errors).toBeUndefined();
          expect(res.status).toBe(200);
        });
    });
  });

  describe('user create', () => {
    const chainId = 42;

    const username = faker.internet.userName();
    const name = `${faker.name.firstName()} ${faker.name.lastName()}`;
    const twitter =
      '@' +
      name
        .split(' ')
        .map((name) => name[0])
        .join('');

    it('should create new identity', async () => {
      const query = gql`
        mutation ($input: UserInput!) {
          signUp(input: $input) {
            id
            chainId
            address
          }
        }
      `;
      await request(app.getHttpServer())
        .post('/graphql')
        .set({
          'Chain-Id': chainId,
          'Auth-Signature': userSignature,
        })
        .send({
          variables: {
            input: {
              username,
              name,
              twitter,
            },
          },
          query: print(query),
        })
        .expect((res) => {
          expect(res.body.errors).toBeUndefined();
          expect(res.status).toBe(200);

          expect(walletAddress).toBe(res.body.data?.signUp?.address);
          expect(chainId).toBe(res.body.data?.signUp?.chainId);

          const generatedId = res.body.data?.signUp?.id;
          const splitId = generatedId.split(':');

          expect(chainId).toBe(Number(splitId[0]));
          expect(walletAddress).toBe(splitId[1]);
        });
    });
  });

  // TODO: won'w work with user create since nonces are too different, run separately
  // describe('user update', () => {
  //   const chainId = 42;

  //   const newUsername = faker.internet.userName();
  //   const newName = `${faker.name.firstName()} ${faker.name.lastName()}`;
  //   const newTwitter =
  //     '@' +
  //     newName
  //       .split(' ')
  //       .map((name) => name[0])
  //       .join('');

  //   it('should update me', async () => {
  //     const query = gql`
  //       mutation ($input: UserInput!) {
  //         updateMe(input: $input) {
  //           id
  //           chainId
  //           address
  //           name
  //           username
  //           twitter
  //         }
  //       }
  //     `;
  //     await request(app.getHttpServer())
  //       .post('/graphql')
  //       .set({
  //         'Chain-Id': chainId,
  //         'Auth-Signature': userSignature,
  //       })
  //       .send({
  //         variables: {
  //           input: {
  //             username: newUsername,
  //             name: newName,
  //             twitter: newTwitter,
  //           },
  //         },
  //         query: print(query),
  //       })
  //       .expect((res) => {
  //         expect(res.body.errors).toBeUndefined();
  //         expect(res.status).toBe(200);
  //         expect(res.body.data?.updateMe?.name).toBe(newName);
  //         expect(res.body.data?.updateMe?.username).toBe(newUsername);
  //         expect(res.body.data?.updateMe?.twitter).toBe(newTwitter);
  //       });
  //   });
  // });
});
