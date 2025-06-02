import {
    AccountId,
    assert,
    near,
    NearPromise,
    PromiseIndex,
    UnorderedSet,
} from 'near-sdk-js';
import { MintLogData, NEP171Token, NFTEvent } from './interfaces';
import { NFT_METADATA_SPEC, NFT_STANDARD_NAME } from './constants';

// Assert that the user has attached at least 1 yoctoNEAR (for security reasons and to pay for storage)
export function assertAtLeastOneYocto() {
    assert(
        near.attachedDeposit().valueOf() >= BigInt(1),
        'Requires attached deposit of at least 1 yoctoNEAR'
    );
}

// Used to make sure the user attached exactly 1 yoctoNEAR
export function assertOneYocto() {
    assert(
        near.attachedDeposit().toString() === '1',
        'Requires attached deposit of exactly 1 yoctoNEAR'
    );
}

export function assertPredecessorIsOwner(owner_id: AccountId) {
    assert(
        near.predecessorAccountId() === owner_id,
        'Predecessor must be the token owner'
    );
}

//calculate how many bytes the account ID is taking up
export function accountIdBytes(accountId: string): number {
    // The extra 4 bytes are coming from Borsh serialization to store the length of the string.
    return accountId.length + 4 + 8;
}

export function assertReceiverIsNotOwner(
    token: NEP171Token,
    receiverId: string,
    msg = 'The token owner and the receiver should be different'
) {
    assert(token.owner_id != receiverId, msg);
}

export function assertSenderIsOwner(
    token: NEP171Token,
    senderId: string,
    msg = 'Sender is not the owner'
) {
    assert(token.owner_id == senderId, msg);
}

export function logMint(owner_id: string, token_ids: string[]) {
    let nftMintLog: NFTEvent<MintLogData> = {
        standard: NFT_STANDARD_NAME,
        version: NFT_METADATA_SPEC,
        event: 'nft_mint',
        data: [{ owner_id, token_ids }],
    };

    near.log(`EVENT_JSON:${JSON.stringify(nftMintLog)}`);
}

export function acceptStorageDeposit(
    accountId: AccountId,
    storageAmount: bigint
): NearPromise | undefined {
    const cost = storageAmount * near.storageByteCost().valueOf();
    const attachedDeposit = near.attachedDeposit().valueOf();

    assert(
        cost <= attachedDeposit,
        `Must attach ${cost} yoctoNEAR to cover storage`
    );

    //if the refund is greater than 1 yocto NEAR, we refund the predecessor that amount
    const refund = attachedDeposit - cost;
    if (refund > 1) {
        near.log(`Refunding ${refund} yoctoNEAR`);
        return NearPromise.new(accountId).transfer(refund);
    }
}

export function storageDiff(initialStorageUsage: bigint): bigint {
    //calculate the required storage which was the used
    let storageAmount =
        near.storageUsage().valueOf() - initialStorageUsage.valueOf();
    return BigInt(storageAmount);
}

export function refundStorageDeposit(
    accountId: AccountId,
    storageAmount: bigint
): NearPromise | undefined {
    if (storageAmount <= 0) {
        return;
    }
    const refund = storageAmount * near.storageByteCost().valueOf();
    if (refund > 1) {
        near.log(`Refunding ${refund} yoctoNEAR`);
        return NearPromise.new(accountId).transfer(refund);
    }
}

//refund the storage taken up by passed in approved account IDs and send the funds to the passed in account ID.
export function refundApprovedAccountStorage(
    accountId: string,
    approvedAccountIds: { [key: string]: number }
) {
    let storageAmount = 0;
    for (const approvedAccountId of Object.keys(approvedAccountIds)) {
        storageAmount += accountIdBytes(approvedAccountId);
    }
    refundStorageDeposit(accountId, BigInt(storageAmount));
}

export function promiseResult(index: PromiseIndex): {
    result: string;
    success: boolean;
} {
    let result, success;

    try {
        result = near.promiseResult(index);
        success = true;
    } catch {
        result = undefined;
        success = false;
    }

    return { result, success };
}

//convert the royalty percentage and amount to pay into a payout (U128)
export function royaltyToPayout(
    royaltyPercentage: number,
    amountToPay: bigint
): string {
    return (
        (BigInt(royaltyPercentage) * BigInt(amountToPay)) /
        BigInt(10000)
    ).toString();
}

// Gets a collection and deserializes it into a set that can be used.
export function restoreOwners(collection) {
    if (collection == null) {
        return null;
    }
    return UnorderedSet.reconstruct<string>(collection);
}
