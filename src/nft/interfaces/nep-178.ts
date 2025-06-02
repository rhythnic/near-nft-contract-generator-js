// The base structure that will be returned for a token. If contract is using
// extensions such as Approval Management, Metadata, or other

import { NearPromise } from 'near-sdk-js';
import { NEP171JsonToken, NEP171Token } from './nep-171';
import {
    NftApproveArgs,
    NftIsApprovedArgs,
    NftRevokeAllArgs,
    NftRevokeArgs,
} from '../args';
import { AccountToNumberMap } from '../common';

export type NEP178Token = NEP171Token & {
    approved_account_ids: AccountToNumberMap;
    next_approval_id: number;
};

export type NEP178JsonToken = NEP171JsonToken & {
    approved_account_ids: AccountToNumberMap;
};

export interface INEP178 {
    /**
     * View
     * Check if token is approved for account
     * @param args.token_id The token ID
     * @param args.approved_account_id The account ID to check
     * @param args.approval_id The approval ID
     */
    nft_is_approved(args: NftIsApprovedArgs): boolean;

    /**
     * Call
     * Approve an account ID to transfer the token on behalf of the caller
     * @param args.token_id The token ID
     * @param args.account_id The account ID to approve
     * @param args.msg The message to pass to the receiver
     */
    nft_approve(args: NftApproveArgs): NearPromise | void;

    /**
     * Call
     * Revoke token transfer approval for the argsified account
     * @param args.token_id The token ID
     * @param args.account_id The account ID to revoke
     */
    nft_revoke(args: NftRevokeArgs): void;

    /**
     * Call
     * Remove all approved accounts from a token
     * @param args.token_id The token ID
     */
    nft_revoke_all(args: NftRevokeAllArgs): void;
}
