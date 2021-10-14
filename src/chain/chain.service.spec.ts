import { Test, TestingModule } from '@nestjs/testing';
import { ethers } from 'ethers';
import { ConfigModule } from '../config/config.module';
import { UserInput } from '../graphql';

import { ChainService } from './chain.service';
import { kovanContract } from './contracts';
import { NetworkType } from './enum';

describe('ChainService', () => {
  let service: ChainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ChainService],
    }).compile();

    service = module.get<ChainService>(ChainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should recover eth address', async () => {
    const privateKey =
      '0x0123456789012345678901234567890123456789012345678901234567890123';
    const wallet = new ethers.Wallet(privateKey);
    const msg = Buffer.from("I'd like to sign in");

    const signature = await wallet.signMessage(msg);
    const recoveredAddress = service.recoverEthAddress(signature);
    const initialAddress = await wallet.getAddress();

    expect(initialAddress).toBe(recoveredAddress);
  });

  describe('chain logic', () => {
    let mainAddress: string;
    it('should get signer', async () => {
      const kovanSigner = service.getSigner(NetworkType.KOVAN);
      const address = await kovanSigner.getAddress();
      expect(address).toBeDefined();

      mainAddress = address;
    });

    it('should connect to two chains', async () => {
      const kovanProvider = service.getProvider(NetworkType.KOVAN);
      const rinkebyProvider = service.getProvider(NetworkType.RINKEBY);
      const kovanBlockNumber = await service.getBlockNumber(kovanProvider);
      const rinkebyBlockNumber = await service.getBlockNumber(rinkebyProvider);

      expect(rinkebyBlockNumber).not.toBe(kovanBlockNumber);
    });

    describe('contract', () => {
      it('should get kovan contract', () => {
        const kovanSigner = service.getSigner(NetworkType.KOVAN);
        const contract = service.getContract(NetworkType.KOVAN, kovanSigner);

        expect(contract).toBeDefined();
        expect(contract).not.toBeNull();
      });

      // TODO: enable when rinkeby is deployed
      // it('should get rinkeby contract', async () => {
      //   const rinkebySigner = service.getSigner(NetworkType.RINKEBY);
      //   const contract = service.getContract(
      //     NetworkType.RINKEBY,
      //     rinkebySigner,
      //   );

      //   expect(contract).toBeDefined();
      //   expect(contract).not.toBeNull();
      // });

      it('should get events for kovan', async () => {
        const events = await service.getEvents(
          NetworkType.KOVAN,
          kovanContract.address,
          0,
        );

        expect(events.length).toBeGreaterThan(0);
      });

      it('should create identity', async () => {
        const dto: UserInput = {
          name: 'Cherry pick',
          twitter: '@cp',
          username: 'cherryP',
        };

        const identity = await service.createIdentity(
          NetworkType.KOVAN,
          mainAddress,
          dto,
        );
      });
    });
  });
});
