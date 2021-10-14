import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const GetAuthSig = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const context = GqlExecutionContext.create(ctx).getContext();
    return context?.locals?.authSignature;
  },
);
