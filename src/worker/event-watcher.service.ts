import { LogDescription } from '@ethersproject/abi';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { ChainService } from '../chain/chain.service';
import { kovanContract } from '../chain/contracts';
import { NetworkType } from '../chain/enum';
import { EventType } from './enum';

import { EventDocument, Event } from './event.schema';

interface LogDescriptionWithBlock extends LogDescription {
  blockNumber: number;
}

@Injectable()
export class EventWatcherService {
  private readonly logger = new Logger(EventWatcherService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    private chainService: ChainService,
  ) {
    this.handleKovanCron(); // force cron at startup
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleKovanCron() {
    this.logger.debug(`Kovan cron started`);
    const lastBlockNumber = await this.loadLastSavedBlockNumber();
    let events = await this.indexKovanEvents(lastBlockNumber + 1);
    events = events.filter((event) =>
      [
        EventType.CREATE_IDENTITY,
        EventType.UPDATE_IDENTITY,
        EventType.DELETE_IDENTITY,
      ].includes(event.name as EventType),
    );

    const normalizedEvents = events.map((event: LogDescriptionWithBlock) => {
      return {
        blockNumber: event.blockNumber,
        type: event.name,
        chainId: 42,
        address: event.args[0],
        username: event?.args[1]?.hash,
        name: event?.args[2],
        twitter: event?.args[3],
      };
    });

    if (normalizedEvents?.length > 0) {
      await this.syncWithDb(normalizedEvents);
    }
  }

  // TODO: enable once we have enough funds for rinkeby

  // @Cron(CronExpression.EVERY_30_SECONDS)
  // async handleRinkebyCron() {
  //   this.logger.debug(`Kovan cron started`);
  //   const lastBlockNumber = await this.loadLastSavedBlockNumber();
  //   let events = await this.indexRinkebyEvents(lastBlockNumber + 1);
  //   events = events.filter((event) =>
  //     [
  //       EventType.CREATE_IDENTITY,
  //       EventType.UPDATE_IDENTITY,
  //       EventType.DELETE_IDENTITY,
  //     ].includes(event.name as EventType),
  //   );

  //   const normalizedEvents = events.map((event: LogDescriptionWithBlock) => {
  //     return {
  //       blockNumber: event.blockNumber,
  //       type: event.name,
  //       chainId: 4,
  //       address: event.args[0],
  //       username: event?.args[1]?.hash,
  //       name: event?.args[2],
  //       twitter: event?.args[3],
  //     };
  //   });

  //   if (normalizedEvents?.length > 0) {
  //     await this.syncWithDb(normalizedEvents);
  //   }
  // }

  async indexKovanEvents(fromBlock: number) {
    const events = await this.chainService.getEvents(
      NetworkType.KOVAN,
      kovanContract.address,
      fromBlock,
    );

    return events;
  }

  async indexRinkebyEvents(fromBlock: number) {
    const events = await this.chainService.getEvents(
      NetworkType.RINKEBY,
      kovanContract.address,
      fromBlock,
    );

    return events;
  }

  async syncWithDb(events: any) {
    this.logger.debug('Updating db');
    const docs = await this.eventModel.insertMany(events);
    this.logger.debug(`Added ${docs.length} events`);
  }

  async loadLastSavedBlockNumber(): Promise<number> {
    const lastEntry = await this.eventModel.findOne(
      {},
      {},
      {
        sort: {
          blockNumber: -1,
        },
      },
    );
    if (!lastEntry) return 0;
    return lastEntry.blockNumber;
  }
}
