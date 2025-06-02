import { AccountId } from 'near-sdk-js';
import { AccountToNumberMap } from './common';

export type NftTokenArgs = {
    token_id: string;
};

export type NftTransferArgs = {
    receiver_id: AccountId;
    token_id: string;
    approval_id?: number | null;
    memo?: string | null;
};

export type NftTransferCallArgs = {
    receiver_id: AccountId;
    token_id: string;
    approval_id?: number | null;
    memo?: string | null;
    msg: string;
};

export type NftResolveTransferArgs = {
    owner_id: AccountId;
    receiver_id: AccountId;
    token_id: string;
    authorized_id?: AccountId | null;
    approved_account_ids?: AccountToNumberMap | null;
    memo?: string | null;
};

export type NftTokenMetadataArgs = {
    token_id: string;
};

export type NftIsApprovedArgs = {
    token_id: string;
    approved_account_id: string;
    approval_id: number | null;
};

export type NftApproveArgs = {
    token_id: string;
    account_id: string;
    msg: string | null;
};

export type NftRevokeArgs = {
    token_id: string;
    account_id: string;
};

export type NftRevokeAllArgs = {
    token_id: string;
};

export type NftTokensArgs = {
    from_index: string | null;
    limit: number | null;
};

export type NftSupplyForOwnerArgs = {
    account_id: string;
};

export type NftTokensForOwnerArgs = {
    account_id: string;
    from_index: string | null;
    limit: number | null;
};

export type NftPayoutArgs = {
    token_id: string;
    balance: string;
    max_len_payout: number;
};

export type NftTransferPayoutArgs = {
    receiver_id: AccountId;
    token_id: string;
    approval_id: number | null;
    memo: string | null;
    balance: string;
    max_len_payout: number;
};
