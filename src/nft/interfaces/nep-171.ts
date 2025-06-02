// The base structure that will be returned for a token. If contract is using
// extensions such as Approval Management, Metadata, or other

import { AccountId, NearPromise, UnorderedMap } from 'near-sdk-js';
import {
    NftResolveTransferArgs,
    NftTokenArgs,
    NftTransferArgs,
    NftTransferCallArgs,
} from '../args';

// attributes may be included in this structure.
export type NEP171Token = {
    owner_id: AccountId;
};

export type NEP171JsonToken = {
    token_id: string;
    owner_id: AccountId;
};

export type NFTEvent<T = TransferLogData> = {
    standard: string;
    version: string;
    event: string;
    data: T[];
};

export type MintLogData = {
    owner_id: AccountId;
    token_ids: string[];
};

export type TransferLogData = {
    old_owner_id: AccountId;
    new_owner_id: AccountId;
    authorized_id?: AccountId | null;
    token_ids: string[];
    memo?: string;
};

export interface INEP171<
    TToken extends NEP171Token = NEP171Token,
    TJsonToken extends NEP171JsonToken = NEP171JsonToken,
> {
    /**
     * tokenById
     * Mapping of token ID to token struct
     */
    tokenById: UnorderedMap<TToken>;

    /**
     * View
     * Get the token in the JSON wrapper
     * @param args.token_id The token ID
     * @returns TJsonToken | null
     */
    nft_token(args: NftTokenArgs): TJsonToken | null;

    /**
     * Call
     * Transfer an NFT from the current owner to the receiver_id
     *
     * Requirements
     * * Caller of the method must attach a deposit of 1 yoctoⓃ for security purposes
     * * Contract MUST panic if called by someone other than token owner or,
     *   if using Approval Management, one of the approved accounts
     * * `approval_id` is for use with Approval Management extension, see
     *   that document for full explanation.
     * * If using Approval Management, contract MUST nullify approved accounts on
     *   successful transfer.
     *
     * @param args.receiver_id The receiver ID, the valid NEAR account receiving the token
     * @param args.token_id The token ID
     * @param args.approval_id The approval ID.  A number smaller than
     *    2^53, and therefore representable as JSON.
     * @param args.memo The memo, for use cases that may benefit from indexing or
     *    providing information for a transfer
     */
    nft_transfer(args: NftTransferArgs): void;

    /**
     * Call
     * Transfer token and call a method on a receiver contract. A successful
     * workflow will end in a success execution outcome to the callback on the NFT
     * contract at the method `nft_resolve_transfer`.
     *
     * You can think of this as being similar to attaching native NEAR tokens to a
     * function call. It allows you to attach any Non-Fungible Token in a call to a
     * receiver contract.
     *
     * Requirements:
     * * Caller of the method must attach a deposit of 1 yoctoⓃ for security
     *   purposes
     * * Contract MUST panic if called by someone other than token owner or,
     *   if using Approval Management, one of the approved accounts
     * * The receiving contract must implement `nft_on_transfer` according to the
     *   standard. If it does not, FT contract's `nft_resolve_transfer` MUST deal
     *   with the resulting failed cross-contract call and roll back the transfer.
     * * Contract MUST implement the behavior described in `nft_resolve_transfer`
     * * `approval_id` is for use with Approval Management extension, see
     *   that document for full explanation.
     * * If using Approval Management, contract MUST nullify approved accounts on
     *   successful transfer.
     *
     * @param args.receiver_id The receiver ID, the valid NEAR account receiving the token.
     * @param args.token_id The token to send.
     * @param args.approval_id The approval ID.  A number smaller than
     *    2^53, and therefore representable as JSON.
     * @param args.memo The memo, for use cases that may benefit from indexing or
     *    providing information for a transfer.
     * @param args.msg argsifies information needed by the receiving contract in
     *    order to properly handle the transfer. Can indicate both a function to
     *    call and the parameters to pass to that function.
     */
    nft_transfer_call(args: NftTransferCallArgs): NearPromise;

    /**
     * Call
     * Callback of `nft_transfer_call` method.
     * Private method. Can only be called by this contract.
     *
     * Requirements:
     * * If the result of nft_on_transfer is "true" or if call fails,
     *   this method must reverse the transfer.
     * @param args.owner_id The near account that owned the token before the transfer.
     * @param args.receiver_id The receiver ID, the valid NEAR account that received the token.
     * @param args.token_id The token ID
     * @param args.authorized_id The authorized ID, the valid NEAR account authorized to transfer the token.
     * @param args.approved_account_ids The approved account IDs, the valid NEAR accounts approved to transfer the token.
     * @param args.memo The memo, for use cases that may benefit from indexing or
     *    providing information for a transfer.
     */
    nft_resolve_transfer(args: NftResolveTransferArgs): boolean;
}
