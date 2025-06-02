import {
    AccountId,
    assert,
    call,
    UnorderedMap,
    near,
    NearBindgen,
    NearPromise,
    view,
    LookupMap,
    UnorderedSet,
} from 'near-sdk-js';
import {
    INEP171,
    TransferLogData,
    NFTEvent,
    INEP177,
    NEP177ContractMetadata,
    NEP177JsonToken,
    NEP177TokenMetadata,
    INEP178,
    INEP181,
    INEP199,
    NEP199JsonToken,
    NEP199Token,
    Payout,
} from './nft/interfaces/index.js';
import {
    NftResolveTransferArgs,
    NftTokenArgs,
    NftTransferArgs,
    NftTransferCallArgs,
    NftTokenMetadataArgs,
    NftApproveArgs,
    NftIsApprovedArgs,
    NftRevokeArgs,
    NftRevokeAllArgs,
    NftSupplyForOwnerArgs,
    NftTokensArgs,
    NftTokensForOwnerArgs,
    NftPayoutArgs,
    NftTransferPayoutArgs,
} from './nft/args.js';
import {
    CollectionPrefix,
    AccountToNumberMap,
    AccountToStringMap,
} from './nft/common.js';
import {
    GAS_FOR_NFT_ON_TRANSFER,
    GAS_FOR_RESOLVE_TRANSFER,
    NFT_METADATA_SPEC,
    NFT_STANDARD_NAME,
    GAS_FOR_NFT_ON_APPROVE,
} from './nft/constants.js';
import {
    assertOneYocto,
    logMint,
    acceptStorageDeposit,
    promiseResult,
    storageDiff,
    assertAtLeastOneYocto,
    assertPredecessorIsOwner,
    accountIdBytes,
    refundStorageDeposit,
    refundApprovedAccountStorage,
    restoreOwners,
    royaltyToPayout,
} from './nft/helpers.js';

type Token = NEP199Token;
type JsonToken = NEP177JsonToken & NEP199JsonToken;
type ContractMetadata = NEP177ContractMetadata;
type TokenMetadata = NEP177TokenMetadata;

@NearBindgen({})
class Contract
    implements
        INEP171<Token, JsonToken>,
        INEP177<ContractMetadata, TokenMetadata>,
        INEP178,
        INEP181<JsonToken>,
        INEP199
{
    tokenById = new UnorderedMap<Token>(CollectionPrefix.TOKENS_BY_ID);
    metadata: ContractMetadata;
    metadataById = new LookupMap<TokenMetadata>(
        CollectionPrefix.TOKEN_METADATA_BY_ID
    );
    tokensPerOwner = new LookupMap<UnorderedSet<string>>(
        CollectionPrefix.TOKENS_PER_OWNER
    );

    constructor() {
        this.metadata = {
            spec: 'nft-1.0.0',
            name: 'My NFT',
            symbol: 'NFT',
            icon: null,
            base_uri: null,
            reference: null,
            reference_hash: null,
        };
    }

    /**
     * Check if a specific account is approved to transfer a token
     *
     * @param token_id - The token ID to check
     * @param approved_account_id - The account ID to check for approval
     * @param approval_id - Optional approval ID to compare against
     * @returns True if the account is approved to transfer the token
     */
    @view({})
    nft_is_approved({
        token_id,
        approved_account_id,
        approval_id,
    }: NftIsApprovedArgs): boolean {
        const token = this.assertTokenExists(token_id);
        const approval = token.approved_account_ids[approved_account_id];
        if (approval == null) return false;
        return approval_id == null ? true : approval_id === approval;
    }

    /**
     * Get the contract-level metadata
     *
     * @returns The contract metadata
     */
    @view({})
    nft_metadata(): ContractMetadata {
        return this.metadata;
    }

    /**
     * Calculate the payout for a token
     *
     * @param token_id - The token ID to calculate the payout for
     * @param balance - The balance to calculate the payout from
     * @param max_len_payout - The maximum number of accounts to include in the payout
     * @returns The payout object
     */
    @view({})
    nft_payout({ token_id, balance, max_len_payout }: NftPayoutArgs): Payout {
        const token = this.assertTokenExists(token_id);
        const { owner_id, royalty } = token;
        let totalPerpetual = 0;
        const payout: AccountToStringMap = {};
        assert(
            Object.keys(royalty).length <= max_len_payout,
            'Cannot payout to that many receivers'
        );
        Object.entries(royalty).forEach(([key, value]) => {
            if (key != owner_id) {
                payout[key] = royaltyToPayout(value, BigInt(balance));
                totalPerpetual += value;
            }
        });
        payout[owner_id] = royaltyToPayout(
            10000 - totalPerpetual,
            BigInt(balance)
        );
        return { payout };
    }

    /**
     * Get the number of tokens owned by a specific account
     *
     * @param account_id - The account ID to check
     * @returns The number of tokens owned by the account as a string
     */
    @view({})
    nft_supply_for_owner({ account_id }: NftSupplyForOwnerArgs): string {
        const token_id_set = restoreOwners(this.tokensPerOwner.get(account_id));
        return token_id_set == null ? '0' : token_id_set.length.toString();
    }

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
     * Get the metadata for a specific token
     *
     * @param token_id - The token ID to get metadata for
     * @returns The token metadata or null if the token doesn't exist
     */
    @view({})
    nft_token_metadata({
        token_id,
    }: NftTokenMetadataArgs): TokenMetadata | null {
        return this.metadataById.get(token_id) ?? null;
    }

    /**
     * Get a list of tokens
     *
     * @param from_index - Optional starting index as a string
     * @param limit - Optional maximum number of tokens to return
     * @returns Array of token objects
     */
    @view({})
    nft_tokens({ from_index, limit }: NftTokensArgs): JsonToken[] {
        let start = from_index ? parseInt(from_index) : 0;
        if (limit == null) {
            limit = 50;
        }

        const keys = this.tokenById.keys({ start, limit });
        return keys.map((key) => this.generateJsonToken(key));
    }

    /**
     * Get a list of tokens owned by a specific account
     *
     * @param account_id - The account ID to get tokens for
     * @param from_index - Optional starting index as a string
     * @param limit - Optional maximum number of tokens to return
     * @returns Array of token objects owned by the account
     */
    @view({})
    nft_tokens_for_owner({
        account_id,
        from_index,
        limit,
    }: NftTokensForOwnerArgs): JsonToken[] {
        const token_id_set = restoreOwners(this.tokensPerOwner.get(account_id));
        if (token_id_set == null) {
            return [];
        }
        let start = from_index ? parseInt(from_index) : 0;
        if (limit == null) {
            limit = 50;
        }
        let token_ids = token_id_set.elements({ start, limit });
        return token_ids.map((x) => this.generateJsonToken(x));
    }

    /**
     * Get the total supply of tokens
     *
     * @returns The total number of tokens as a string
     */
    @view({})
    nft_total_supply(): string {
        return this.tokenById.length.toString();
    }

    /**
     * Approve an account ID to transfer a token
     *
     * @param token_id - The token ID to approve for transfer
     * @param account_id - The account ID being granted approval
     * @param msg - Optional message to pass to the approved account contract
     * @returns Promise to the approved account's contract if msg is provided
     */
    @call({ payableFunction: true })
    nft_approve({
        token_id,
        account_id,
        msg,
    }: NftApproveArgs): void | NearPromise {
        assertAtLeastOneYocto();
        const token = this.assertTokenExists(token_id);
        assertPredecessorIsOwner(token.owner_id);
        let approvalExisted =
            token.approved_account_ids.hasOwnProperty(account_id);
        token.approved_account_ids[account_id] = token.next_approval_id;
        token.next_approval_id += 1;
        this.tokenById.set(token_id, token);
        let storageUsed = approvalExisted ? 0 : accountIdBytes(account_id);
        acceptStorageDeposit(token.owner_id, BigInt(storageUsed));
        if (msg == null) return;
        return NearPromise.new(account_id)
            .functionCall(
                'nft_on_approve',
                JSON.stringify({
                    token_id,
                    owner_id: token.owner_id,
                    approval_id: token.next_approval_id,
                    msg,
                }),
                BigInt(0),
                BigInt(GAS_FOR_NFT_ON_APPROVE)
            )
            .asReturn();
    }

    /**
     * Mint a new token
     *
     * @param token_id - The token ID to mint
     * @param receiver_id - The account ID that will own the minted token
     * @param metadata - The metadata for the new token
     * @param perpetual_royalties - The royalty configuration for the token
     */
    @call({ payableFunction: true })
    nft_mint({
        token_id,
        receiver_id,
        metadata,
        perpetual_royalties,
    }: {
        token_id: string;
        receiver_id: AccountId;
        metadata: TokenMetadata;
        perpetual_royalties: AccountToNumberMap;
    }): void {
        assert(!this.tokenById.get(token_id), 'Token already exists');
        let initialStorageUsage = near.storageUsage();
        const royalty: AccountToNumberMap = {};
        if (perpetual_royalties != null) {
            assert(
                Object.keys(perpetual_royalties).length <= 10,
                'Cannot add more than 10 perpetual royalty amounts'
            );
            Object.entries(perpetual_royalties).forEach(([account, amount]) => {
                royalty[account] = amount;
            });
        }
        const token = this.generateNewToken(receiver_id, {}, royalty);
        this.tokenById.set(token_id, token);
        this.metadataById.set(token_id, metadata);
        this.addTokenToOwner(token.owner_id, token_id);
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
        approved_account_ids,
    }: NftResolveTransferArgs): boolean {
        let { result: shouldRevertTransfer } = promiseResult(0);
        if (shouldRevertTransfer === 'false') {
            refundApprovedAccountStorage(owner_id, approved_account_ids);
            return true;
        }
        let token = this.tokenById.get(token_id);
        if (
            // token was burned
            token == null ||
            // token is not owned by the receiver
            token.owner_id != receiver_id
        ) {
            refundApprovedAccountStorage(owner_id, approved_account_ids);
            return true;
        }
        this.nftTransferInternal(
            token_id,
            receiver_id,
            owner_id,
            memo,
            approved_account_ids
        );
        return false;
    }

    /**
     * Revoke approval for a specific account
     *
     * @param token_id - The token ID to revoke approval for
     * @param account_id - The account ID to revoke approval from
     */
    @call({ payableFunction: true })
    nft_revoke({ token_id, account_id }: NftRevokeArgs): void {
        assertOneYocto();
        const token = this.assertTokenExists(token_id);
        assertPredecessorIsOwner(token.owner_id);
        if (token.approved_account_ids.hasOwnProperty(account_id)) {
            delete token.approved_account_ids[account_id];
            refundStorageDeposit(
                token.owner_id,
                BigInt(accountIdBytes(account_id))
            );
            this.tokenById.set(token_id, token);
        }
    }

    /**
     * Revoke all approvals for a specific token
     *
     * @param token_id - The token ID to revoke all approvals for
     */
    @call({})
    nft_revoke_all({ token_id }: NftRevokeAllArgs): void {
        assertOneYocto();
        const token = this.assertTokenExists(token_id);
        assertPredecessorIsOwner(token.owner_id);
        if (
            token.approved_account_ids == null ||
            Object.getPrototypeOf(token.approved_account_ids) ===
                Object.prototype ||
            Object.keys(token.approved_account_ids).length === 0
        ) {
            return;
        }
        token.approved_account_ids = {};
        this.tokenById.set(token_id, token);
        refundApprovedAccountStorage(
            token.owner_id,
            token.approved_account_ids
        );
    }

    /**
     * Transfer a token to a new owner
     *
     * @param receiver_id - The account ID of the token's new owner
     * @param token_id - The token ID to transfer
     * @param memo - Optional memo to include with the transfer
     * @param approval_id - The approval ID if using an approved account
     */
    @call({ payableFunction: true })
    nft_transfer({
        receiver_id,
        token_id,
        memo,
        approval_id,
    }: NftTransferArgs): void {
        assertOneYocto();
        const senderId = near.predecessorAccountId();
        const token = this.authorizeTransfer(
            token_id,
            senderId,
            receiver_id,
            approval_id
        );
        this.nftTransferInternal(token_id, token.owner_id, receiver_id, memo);
    }

    /**
     * Transfer a token and call a method on the receiver's contract
     *
     * @param receiver_id - The account ID of the token's new owner
     * @param token_id - The token ID to transfer
     * @param memo - Optional memo to include with the transfer
     * @param msg - The message to pass to the receiving contract
     * @param approval_id - The approval ID if using an approved account
     * @returns Promise to the receiving contract's method
     */
    @call({ payableFunction: true })
    nft_transfer_call({
        receiver_id,
        token_id,
        memo,
        msg,
        approval_id,
    }: NftTransferCallArgs): NearPromise {
        assertOneYocto();
        const senderId = near.predecessorAccountId();
        const token = this.authorizeTransfer(
            token_id,
            senderId,
            receiver_id,
            approval_id
        );
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
                        approved_account_ids: token.approved_account_ids,
                    }),
                    BigInt(0),
                    BigInt(GAS_FOR_RESOLVE_TRANSFER)
                )
            )
            .asReturn();
    }

    /**
     * Transfer a token and calculate the payout
     *
     * @param receiver_id - The account ID of the token's new owner
     * @param token_id - The token ID to transfer
     * @param approval_id - The approval ID
     * @param memo - Optional memo to include with the transfer
     * @param balance - The balance to calculate the payout from
     * @param max_len_payout - The maximum number of accounts to include in the payout
     * @returns The payout object
     */
    @call({})
    nft_transfer_payout({
        receiver_id,
        token_id,
        approval_id,
        memo,
        balance,
        max_len_payout,
    }: NftTransferPayoutArgs): Payout {
        assertOneYocto();
        const senderId = near.predecessorAccountId();
        const token = this.authorizeTransfer(
            token_id,
            senderId,
            receiver_id,
            approval_id
        );
        this.nftTransferInternal(token_id, token.owner_id, receiver_id, memo);
        refundApprovedAccountStorage(
            token.owner_id,
            token.approved_account_ids
        );
        //get the owner of the token
        const { owner_id, royalty } = token;
        //keep track of the total perpetual royalties
        let totalPerpetual = 0;
        //keep track of the payout object to send back
        let payout: AccountToStringMap = {};
        assert(
            Object.keys(royalty).length <= max_len_payout,
            'Cannot payout to that many receivers'
        );
        Object.entries(royalty).forEach(([key, value], index) => {
            if (key != owner_id) {
                payout[key] = royaltyToPayout(value, BigInt(balance));
                totalPerpetual += value;
            }
        });
        payout[owner_id] = royaltyToPayout(
            10000 - totalPerpetual,
            BigInt(balance)
        );
        return { payout };
    }

    /**
     * Add a token to the list of tokens owned by an account
     *
     * @param tokenId - The ID of the token to add
     * @param accountId - The account ID that owns the token
     */
    addTokenToOwner(tokenId: string, accountId: AccountId): void {
        let tokenSet = restoreOwners(this.tokensPerOwner.get(accountId));
        if (tokenSet == null) {
            tokenSet = new UnorderedSet(
                CollectionPrefix.OWNER_TOKEN_SET + accountId.toString()
            );
        }
        tokenSet.set(tokenId);
        this.tokensPerOwner.set(accountId, tokenSet);
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
     * @param approvalId - Optional approval ID if transfer is by an approved account
     * @returns The Token object if transfer is authorized
     */
    authorizeTransfer(
        tokenId: string,
        senderId: AccountId,
        receiverId: AccountId,
        approvalId?: number
    ): Token {
        const token = this.assertTokenExists(tokenId);
        assert(
            token.owner_id != receiverId,
            'The token receiver cannot be the owner'
        );
        if (senderId != token.owner_id) {
            const approval = token.approved_account_ids[senderId];
            assert(approval != null, 'Unauthorized');
            if (approvalId != null) {
                assert(
                    approvalId == approval,
                    'The actual approval_id is different from the given approval_id'
                );
            }
        }
        return token;
    }

    /**
     * Generate a JSON representation of a token for external view
     *
     * @param tokenId - The ID of the token to generate JSON for
     * @param approvedAccountIds - Map of approved account IDs to approval IDs
     * @returns JSON representation of the token, or null if token doesn't exist
     */
    generateJsonToken(tokenId: string): JsonToken {
        const token = this.tokenById.get(tokenId);
        if (!token) return null;
        const metadata = this.metadataById.get(tokenId);
        return {
            token_id: tokenId,
            royalty: token.royalty,
            approved_account_ids: token.approved_account_ids,
            owner_id: token.owner_id,
            metadata: metadata ?? null,
        };
    }

    /**
     * Generate a new token with the specified owner
     *
     * @param ownerId - The account ID that will own the new token
     * @param approvedAccountIds - Map of approved account IDs to approval IDs
     * @param royalty - Map of account IDs to royalty percentages
     * @returns A new Token object
     */
    generateNewToken(
        ownerId: AccountId,
        approvedAccountIds?: AccountToNumberMap,
        royalty?: AccountToNumberMap
    ): Token {
        return {
            owner_id: ownerId,
            approved_account_ids: approvedAccountIds ?? {},
            royalty: royalty ?? {},
            next_approval_id: 0,
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
        memo?: string,
        approvedAccountIds?: AccountToNumberMap
    ): void {
        const newToken = this.generateNewToken(receiverId, approvedAccountIds);
        this.tokenById.set(tokenId, newToken);
        if (memo != null) {
            near.log(`Memo: ${memo}`);
        }
        this.removeTokenFromOwner(ownerId, tokenId);
        this.addTokenToOwner(receiverId, tokenId);
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

    /**
     * Remove a token from the list of tokens owned by an account
     *
     * @param tokenId - The ID of the token to remove
     * @param accountId - The account ID that owns the token
     */
    removeTokenFromOwner(tokenId: string, accountId: AccountId): void {
        let tokenSet = restoreOwners(this.tokensPerOwner.get(accountId));
        assert(tokenSet != null, 'Account does not own any tokens');
        tokenSet.remove(tokenId);
        if (tokenSet.isEmpty()) {
            this.tokensPerOwner.remove(accountId);
        } else {
            this.tokensPerOwner.set(accountId, tokenSet);
        }
    }
}
