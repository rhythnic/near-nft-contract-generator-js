import {
    AccountId,
    assert,
    call,
    UnorderedMap,
    near,
    NearBindgen,
    NearPromise,
    view,
} from 'near-sdk-js';
import {
    INEP171,
    NEP171Token,
    NEP171JsonToken,
    TransferLogData,
    NFTEvent,
} from './nft/interfaces/index.js';
import {
    NftResolveTransferArgs,
    NftTokenArgs,
    NftTransferArgs,
    NftTransferCallArgs,
} from './nft/args.js';
import { CollectionPrefix } from './nft/common.js';
import {
    GAS_FOR_NFT_ON_TRANSFER,
    GAS_FOR_RESOLVE_TRANSFER,
    NFT_METADATA_SPEC,
    NFT_STANDARD_NAME,
} from './nft/constants.js';
import {
    assertOneYocto,
    logMint,
    acceptStorageDeposit,
    promiseResult,
    storageDiff,
} from './nft/helpers.js';

type Token = NEP171Token;
type JsonToken = NEP171JsonToken;

@NearBindgen({})
class Contract implements INEP171<Token, JsonToken> {
    tokenById = new UnorderedMap<Token>(CollectionPrefix.TOKENS_BY_ID);

    constructor() {}

    /**
     * Get token information for a specific token ID
     *
     * @param token_id - The token ID to retrieve information for
     * @returns The token information as a JsonToken object, or null if the token doesn't exist
     */
    @view({})
    nft_token({ token_id }: NftTokenArgs): JsonToken | null {
        return this.generateJsonToken(token_id);
    }

    /**
     * Mint a new token
     *
     * @param token_id - The token ID to mint
     * @param receiver_id - The account ID that will own the minted token
     */
    @call({ payableFunction: true })
    nft_mint({
        token_id,
        receiver_id,
    }: {
        token_id: string;
        receiver_id: AccountId;
    }): void {
        assert(!this.tokenById.get(token_id), 'Token already exists');
        let initialStorageUsage = near.storageUsage();
        const token = this.generateNewToken(receiver_id);
        this.tokenById.set(token_id, token);
        logMint(token.owner_id, [token_id]);
        const senderId = near.predecessorAccountId();
        acceptStorageDeposit(senderId, storageDiff(initialStorageUsage));
    }

    /**
     * Resolves a cross-contract call from nft_transfer_call
     *
     * @param owner_id - The original owner of the token
     * @param receiver_id - The account ID that received the token
     * @param token_id - The token ID that was transferred
     * @param memo - Optional memo included in the transfer
     * @returns True if the token was successfully transferred
     */
    @call({ privateFunction: true })
    nft_resolve_transfer({
        owner_id,
        receiver_id,
        token_id,
        memo,
    }: NftResolveTransferArgs): boolean {
        let { result: shouldRevertTransfer } = promiseResult(0);
        if (shouldRevertTransfer === 'false') {
            return true;
        }
        let token = this.tokenById.get(token_id);
        if (
            // token was burned
            token == null ||
            // token is not owned by the receiver
            token.owner_id != receiver_id
        ) {
            return true;
        }
        this.nftTransferInternal(token_id, receiver_id, owner_id, memo);
        return false;
    }

    /**
     * Transfer a token to a new owner
     *
     * @param receiver_id - The account ID of the token's new owner
     * @param token_id - The token ID to transfer
     * @param memo - Optional memo to include with the transfer
     */
    @call({ payableFunction: true })
    nft_transfer({ receiver_id, token_id, memo }: NftTransferArgs): void {
        assertOneYocto();
        const senderId = near.predecessorAccountId();
        const token = this.authorizeTransfer(token_id, senderId, receiver_id);
        this.nftTransferInternal(token_id, token.owner_id, receiver_id, memo);
    }

    /**
     * Transfer a token and call a method on the receiver's contract
     *
     * @param receiver_id - The account ID of the token's new owner
     * @param token_id - The token ID to transfer
     * @param memo - Optional memo to include with the transfer
     * @param msg - The message to pass to the receiving contract
     * @returns Promise to the receiving contract's method
     */
    @call({ payableFunction: true })
    nft_transfer_call({
        receiver_id,
        token_id,
        memo,
        msg,
    }: NftTransferCallArgs): NearPromise {
        assertOneYocto();
        const senderId = near.predecessorAccountId();
        const token = this.authorizeTransfer(token_id, senderId, receiver_id);
        this.nftTransferInternal(token_id, token.owner_id, receiver_id, memo);
        const authorized_id = senderId === token.owner_id ? null : senderId;
        return NearPromise.new(receiver_id)
            .functionCall(
                'nft_on_transfer',
                JSON.stringify({
                    sender_id: senderId,
                    previous_owner_id: token.owner_id,
                    token_id,
                    msg,
                }),
                BigInt(0),
                BigInt(GAS_FOR_NFT_ON_TRANSFER)
            )
            .then(
                // this function is the callback
                NearPromise.new(near.currentAccountId()).functionCall(
                    'nft_resolve_transfer',
                    JSON.stringify({
                        authorized_id,
                        owner_id: token.owner_id,
                        receiver_id,
                        token_id,
                    }),
                    BigInt(0),
                    BigInt(GAS_FOR_RESOLVE_TRANSFER)
                )
            )
            .asReturn();
    }

    /**
     * Assert that a token exists and return it
     *
     * @param tokenId - The ID of the token to check
     * @returns The Token object if it exists
     */
    assertTokenExists(tokenId: string): Token {
        const token = this.tokenById.get(tokenId);
        assert(token != null, 'Token not found');
        return token;
    }

    /**
     * Authorize a token transfer by checking ownership
     *
     * @param tokenId - The ID of the token to transfer
     * @param senderId - The account ID attempting to initiate the transfer
     * @param receiverId - The account ID that will receive the token
     * @returns The Token object if transfer is authorized
     */
    authorizeTransfer(
        tokenId: string,
        senderId: AccountId,
        receiverId: AccountId
    ): Token {
        const token = this.assertTokenExists(tokenId);
        assert(
            token.owner_id != receiverId,
            'The token receiver cannot be the owner'
        );
        assert(token.owner_id == senderId, 'Unauthorized');
        return token;
    }

    /**
     * Generate a JSON representation of a token for external view
     *
     * @param tokenId - The ID of the token to generate JSON for
     * @returns JSON representation of the token, or null if token doesn't exist
     */
    generateJsonToken(tokenId: string): JsonToken {
        const token = this.tokenById.get(tokenId);
        if (!token) return null;
        return {
            token_id: tokenId,
            owner_id: token.owner_id,
        };
    }

    /**
     * Generate a new token with the specified owner
     *
     * @param ownerId - The account ID that will own the new token
     * @returns A new Token object
     */
    generateNewToken(ownerId: AccountId): Token {
        return {
            owner_id: ownerId,
        };
    }

    /**
     * Internal implementation of token transfer logic
     *
     * @param tokenId - The ID of the token to transfer
     * @param ownerId - The current owner of the token
     * @param receiverId - The account ID that will receive the token
     * @param memo - Optional memo to include with the transfer
     * @returns void
     */
    nftTransferInternal(
        tokenId: string,
        ownerId: AccountId,
        receiverId: AccountId,
        memo?: string
    ): void {
        const newToken = this.generateNewToken(receiverId);
        this.tokenById.set(tokenId, newToken);
        if (memo != null) {
            near.log(`Memo: ${memo}`);
        }
        const nftTransferLog: NFTEvent<TransferLogData> = {
            standard: NFT_STANDARD_NAME,
            version: NFT_METADATA_SPEC,
            event: 'nft_transfer',
            data: [
                {
                    old_owner_id: ownerId,
                    new_owner_id: receiverId,
                    token_ids: [tokenId],
                    memo,
                },
            ],
        };
        near.log(`EVENT_JSON:${JSON.stringify(nftTransferLog)}`);
    }
}
