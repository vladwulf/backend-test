import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ethers from 'ethers';
import { keccak256 } from 'js-sha3';
import { UserInput } from '../graphql';

import { kovanContract } from './contracts';
import { NetworkType } from './enum';

@Injectable()
export class ChainService {
  private msg = Buffer.from("I'd like to sign in");
  private prefix = Buffer.from('\x19Ethereum Signed Message:\n');
  private prefixedMsg = keccak256(
    Buffer.concat([
      this.prefix,
      Buffer.from(String(this.msg.length)),
      this.msg,
    ]),
  );
  private privateKey: string;
  private kovanProviderUrl: string;
  private rinkebyProviderUrl: string;

  constructor(private configService: ConfigService) {
    this.privateKey = this.configService.get<string>('ETH_PRIVATE_KEY');
    this.kovanProviderUrl = this.configService.get<string>('KOVAN_PROVIDER');
    this.rinkebyProviderUrl =
      this.configService.get<string>('RINKEBY_PROVIDER');
  }

  getSigner(network: NetworkType) {
    if (network === NetworkType.KOVAN) {
      const kovanProvider = new ethers.providers.JsonRpcProvider(
        this.kovanProviderUrl,
      );
      return new ethers.Wallet('0x' + this.privateKey, kovanProvider);
    }

    if (network === NetworkType.RINKEBY) {
      const rinkebyProvider = new ethers.providers.JsonRpcProvider(
        this.rinkebyProviderUrl,
      );
      return new ethers.Wallet('0x' + this.privateKey, rinkebyProvider);
    }

    return null;
  }

  getProvider(network: NetworkType) {
    if (network === NetworkType.KOVAN) {
      return new ethers.providers.JsonRpcProvider(this.kovanProviderUrl);
    }

    if (network === NetworkType.RINKEBY) {
      return new ethers.providers.JsonRpcProvider(this.rinkebyProviderUrl);
    }

    return null;
  }

  getContract(network: NetworkType, signer: ethers.Wallet) {
    if (network === NetworkType.KOVAN) {
      const contract = new ethers.Contract(
        kovanContract.address,
        kovanContract.abi,
        signer,
      );
      return contract;
    }

    return null;
  }

  /**
   * CONTRACT SPECIFIC
   */
  async createIdentity(
    network: NetworkType,
    address: string,
    dto: UserInput,
    nonce?: number,
  ) {
    if (network === NetworkType.KOVAN) {
      const signer = this.getSigner(NetworkType.KOVAN);
      const contract = this.getContract(NetworkType.KOVAN, signer);

      if (nonce) {
        return contract.createIdentity(
          address,
          dto.username,
          dto.name,
          dto.twitter,
          {
            gasPrice: ethers.utils.parseUnits('20', 'gwei'),
            gasLimit: 3000000,
            nonce,
          },
        );
      }

      return contract.createIdentity(
        address,
        dto.username,
        dto.name,
        dto.twitter,
        {
          gasPrice: ethers.utils.parseUnits('20', 'gwei'),
          gasLimit: 3000000,
        },
      );
    }
  }

  async updateIdentity(
    network: NetworkType,
    address: string,
    dto: UserInput,
    nonce?: number,
  ) {
    if (network === NetworkType.KOVAN) {
      const signer = this.getSigner(NetworkType.KOVAN);
      const contract = this.getContract(NetworkType.KOVAN, signer);

      if (nonce) {
        return await contract.updateIdentity(
          address,
          dto?.username || '',
          dto?.name || '',
          dto?.twitter || '',
          {
            gasPrice: ethers.utils.parseUnits('20', 'gwei'),
            gasLimit: 3000000,
            nonce,
          },
        );
      }

      return await contract.updateIdentity(
        address,
        dto?.username || '',
        dto?.name || '',
        dto?.twitter || '',
        {
          gasPrice: ethers.utils.parseUnits('20', 'gwei'),
          gasLimit: 3000000,
        },
      );
    }
  }

  async deleteIdentity(network: NetworkType, address: string) {
    if (network === NetworkType.KOVAN) {
      const signer = this.getSigner(NetworkType.KOVAN);
      const contract = this.getContract(NetworkType.KOVAN, signer);

      await contract.deleteIdentity(address, {
        gasPrice: ethers.utils.parseUnits('20', 'gwei'),
        gasLimit: 3000000,
      });
    }
  }

  async getEvents(
    network: NetworkType,
    contractAddress: string,
    fromBlock = 0,
  ) {
    const provider = this.getProvider(network);
    const logs = await provider.getLogs({
      address: contractAddress,
      fromBlock: fromBlock,
    });

    const iface = new ethers.utils.Interface(kovanContract.abi);
    const events = logs.map((log) => {
      return {
        blockNumber: log.blockNumber,
        ...iface.parseLog(log),
      };
    });

    return events;
  }

  /**
   * TEST FUNCTION
   */
  getBlockNumber(provider: ethers.providers.JsonRpcProvider) {
    return provider.getBlockNumber();
  }

  recoverEthAddress(sig: string): string {
    const address = ethers.utils.recoverAddress(`0x${this.prefixedMsg}`, sig);
    return address;
  }
}
