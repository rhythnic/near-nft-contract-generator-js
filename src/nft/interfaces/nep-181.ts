import { LookupMap, UnorderedSet } from 'near-sdk-js';
import { NEP171JsonToken } from './nep-171';
import {
    NftSupplyForOwnerArgs,
    NftTokensArgs,
    NftTokensForOwnerArgs,
} from '../args';

export interface INEP181<TJsonToken extends NEP171JsonToken> {
    /**
     * A mapping of owner ID to the list of token IDs they own
     */
    tokensPerOwner: LookupMap<UnorderedSet<string>>;

    /**
     * View
     * Returns the total supply of non-fungible tokens as a string representing an
     * unsigned 128-bit integer to avoid JSON number limit of 2^53; and "0" if there are no tokens.
     */
    nft_total_supply(): string;

    /**
     * View
     * Get a list of all tokens
     * @param spec.from_index The starting index of tokens to return, an unsigned 128-bit integer
     * @param spec.limit The maximum number of tokens to return
     * @returns An array of tokens as described in Core standard, and an empty array if there are no tokens
     */
    nft_tokens(spec: NftTokensArgs): TJsonToken[];

    /**
     * View
     * Get number of tokens owned by a given account
     * @param spec.account_id The account ID to get the number of tokens for
     * @returns The number of tokens owned by the account as a string representing
     * the value as an unsigned 128-bit integer to avoid JSON number limit of 2^53;
     * and "0" if there are no tokens.
     */
    nft_supply_for_owner(spec: NftSupplyForOwnerArgs): string;

    /**
     * View
     * Get list of all tokens owned by a given account
     * @param spec.account_id The account ID to get the list of tokens for
     * @param spec.from_index The starting index of tokens to return
     * @param spec.limit The maximum number of tokens to return
     * @returns A paginated list of all tokens owned by this account, and an empty array if there are no tokens
     */
    nft_tokens_for_owner(spec: NftTokensForOwnerArgs): TJsonToken[];
}
