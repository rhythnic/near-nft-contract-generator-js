import { NEP178JsonToken, NEP178Token } from './nep-178';
import { NftPayoutArgs, NftTransferPayoutArgs } from '../args';
import { AccountToNumberMap, AccountToStringMap } from '../common';

export type NEP199Token = NEP178Token & {
    royalty: AccountToNumberMap;
};

export type NEP199JsonToken = NEP178JsonToken & {
    royalty: AccountToNumberMap;
};

/**
 * A mapping of NEAR accounts to the amount each should be paid out, in
 * the event of a token-sale. The payout mapping MUST be shorter than the
 * maximum length specified by the financial contract obtaining this
 * payout data. Any mapping of length 10 or less MUST be accepted by
 * financial contracts, so 10 is a safe upper limit.
 */
export type Payout = {
    payout: AccountToStringMap;
};

export interface INEP199 {
    /**
     * View
     * Given a `token_id` and NEAR-denominated balance, return the `Payout`.
     * struct for the given token. Panic if the length of the payout exceeds
     * `max_len_payout.`
     *
     * @param spec
     */
    nft_payout(spec: NftPayoutArgs): Payout;

    /**
     * Call({ payableFunction: true })
     * Given a `token_id` and NEAR-denominated balance, transfer the token
     * and return the `Payout` struct for the given token. Panic if the
     * length of the payout exceeds `max_len_payout.`
     *
     * @param spec
     */
    nft_transfer_payout(spec: NftTransferPayoutArgs): Payout;
}
