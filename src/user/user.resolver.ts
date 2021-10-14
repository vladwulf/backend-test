import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserInputError, ForbiddenError } from 'apollo-server-express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserInput } from '../graphql';
import { Event, EventDocument } from '../worker/event.schema';
import { GetAuthSig, GetChainId } from '../common/decorators';
import { ChainService } from '../chain/chain.service';
import { EventType } from '../worker/enum';
import { NetworkType } from '../chain/enum';
import { isValidChainId } from '../common/utils';

@Resolver('User')
export class UserResolver {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    private chainService: ChainService,
  ) {}

  @Query()
  async user(@Args('address') address: string, @GetChainId() chainId: number) {
    if (!chainId || !isValidChainId(chainId))
      return new UserInputError('Provided ChainId not valid');

    const userId = `${chainId}:${address}`;
    const lastRecord = await this.eventModel.findOne(
      {
        address,
        chainId,
      },
      {},
      {
        sort: {
          blockNumber: -1,
        },
      },
    );

    if (!lastRecord) return null;
    if (lastRecord.type === EventType.DELETE_IDENTITY) return null;

    return {
      id: userId,
      chainId: lastRecord.chainId,
      address: lastRecord.address,
      username: lastRecord.username,
      name: lastRecord.name,
      twitter: lastRecord.twitter,
    };
  }

  @Query()
  async me(@GetChainId() chainId: number, @GetAuthSig() authSig: string) {
    console.log('chainId', chainId);
    if (!chainId || !isValidChainId(chainId))
      return new UserInputError('Provided ChainId not valid');
    if (!authSig) return new UserInputError('Auth-Signature not provided');

    let address: string;
    try {
      address = this.chainService.recoverEthAddress(authSig);
    } catch (error) {
      return new UserInputError('Auth-Signature invalid');
    }

    const userId = `${chainId}:${address}`;
    const lastRecord = await this.eventModel.findOne(
      {
        address,
        chainId,
      },
      {},
      {
        sort: {
          blockNumber: -1,
        },
      },
    );

    if (!lastRecord)
      throw new UserInputError(`User at id ${userId} does not exist`);

    if (lastRecord.type === EventType.DELETE_IDENTITY) return null;

    return {
      id: userId,
      chainId: lastRecord.chainId,
      address: lastRecord.address,
      username: lastRecord.username,
      name: lastRecord.name,
      twitter: lastRecord.twitter,
    };
  }

  @Mutation()
  async signUp(
    @Args('input') input: UserInput,
    @GetChainId() chainId: number,
    @GetAuthSig() authSig: string,
  ) {
    if (!chainId) throw new UserInputError('Chain id not defined');
    if (!authSig) throw new UserInputError('Auth sig not defined');
    try {
      const address = this.chainService.recoverEthAddress(authSig);
      const userId = `${chainId}:${address}`;

      if (chainId === 42) {
        await this.chainService.createIdentity(
          NetworkType.KOVAN,
          address,
          input,
        );

        return {
          id: userId,
          chainId: chainId,
          address: address,
          username: input.username,
          name: input.name,
          twitter: input.twitter,
        };
      }
    } catch (error) {
      throw new ForbiddenError(error);
    }
  }

  @Mutation()
  async updateMe(
    @Args('input') input: UserInput,
    @GetChainId() chainId: number,
    @GetAuthSig() authSig: string,
  ) {
    try {
      const address = this.chainService.recoverEthAddress(authSig);
      const userId = `${chainId}:${address}`;

      if (chainId === 42) {
        await this.chainService.updateIdentity(
          NetworkType.KOVAN,
          address,
          input,
        );

        const lastRecord = await this.eventModel.findOne(
          {
            address,
            chainId,
          },
          {},
          {
            sort: {
              blockNumber: -1,
            },
          },
        );

        return {
          id: userId,
          chainId: lastRecord.chainId,
          address: lastRecord.address,
          username: input.username || lastRecord.username,
          name: input.name || lastRecord.name,
          twitter: input.twitter || lastRecord.twitter,
        };
      }
    } catch (error) {
      throw new ForbiddenError(error);
    }
  }
}
