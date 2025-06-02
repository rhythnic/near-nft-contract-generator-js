import { AccountId } from 'near-sdk-js';

export enum CollectionPrefix {
    TOKENS_PER_OWNER = 'a',
    TOKENS_BY_ID = 'b',
    TOKEN_METADATA_BY_ID = 'c',
    OWNER_TOKEN_SET = 'd',
}

export type AccountToNumberMap = { [key: AccountId]: number };

export type AccountToStringMap = { [key: AccountId]: string };
