import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const GetChainId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const context = GqlExecutionContext.create(ctx).getContext();
    return Number(context?.headers['chain-id']);
  },
);
