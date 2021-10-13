
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export class UserInput {
    username?: Nullable<string>;
    name?: Nullable<string>;
    twitter?: Nullable<string>;
}

export abstract class IQuery {
    abstract user(address: string): Nullable<User> | Promise<Nullable<User>>;

    abstract me(): Nullable<User> | Promise<Nullable<User>>;
}

export abstract class IMutation {
    abstract signUp(input: UserInput): Nullable<User> | Promise<Nullable<User>>;

    abstract updateMe(input: UserInput): Nullable<User> | Promise<Nullable<User>>;
}

export class User {
    id: string;
    chainId: number;
    address: string;
    username?: Nullable<string>;
    name?: Nullable<string>;
    twitter?: Nullable<string>;
}

type Nullable<T> = T | null;
