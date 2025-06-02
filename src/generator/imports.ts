export const importConfig = {
    nep171: {
        'near-sdk-js': {
            AccountId: null,
            assert: null,
            call: null,
            UnorderedMap: null,
            near: null,
            NearBindgen: null,
            NearPromise: null,
            view: null,
        },
        './nft/interfaces/index.js': {
            INEP171: null,
            NEP171Token: null,
            NEP171JsonToken: null,
            TransferLogData: null,
            NFTEvent: null,
        },
        './nft/args.js': {
            NftResolveTransferArgs: null,
            NftTokenArgs: null,
            NftTransferArgs: null,
            NftTransferCallArgs: null,
        },
        './nft/common.js': {
            CollectionPrefix: null,
        },
        './nft/constants.js': {
            GAS_FOR_NFT_ON_TRANSFER: null,
            GAS_FOR_RESOLVE_TRANSFER: null,
            NFT_METADATA_SPEC: null,
            NFT_STANDARD_NAME: null,
        },
        './nft/helpers.js': {
            assertOneYocto: null,
            logMint: null,
            acceptStorageDeposit: null,
            promiseResult: null,
            storageDiff: null,
        },
    },
    nep177: {
        'near-sdk-js': {
            LookupMap: null,
        },
        './nft/interfaces/index.js': {
            INEP177: null,
            NEP177ContractMetadata: null,
            NEP177JsonToken: { replace: 'NEP171JsonToken' },
            NEP177TokenMetadata: null,
        },
        './nft/args.js': {
            NftTokenMetadataArgs: null,
        },
    },
    nep178: {
        'near-sdk-js': {},
        './nft/interfaces/index.js': {
            INEP178: null,
            NEP178Token: { replace: 'NEP171Token' },
            NEP178JsonToken: { replace: 'NEP171JsonToken' },
        },
        './nft/args.js': {
            NftApproveArgs: null,
            NftIsApprovedArgs: null,
            NftRevokeArgs: null,
            NftRevokeAllArgs: null,
        },
        './nft/common.js': {
            AccountToNumberMap: null,
        },
        './nft/constants.js': {
            GAS_FOR_NFT_ON_APPROVE: null,
        },
        './nft/helpers.js': {
            assertAtLeastOneYocto: null,
            assertPredecessorIsOwner: null,
            accountIdBytes: null,
            refundStorageDeposit: null,
            refundApprovedAccountStorage: null,
            restoreOwners: null,
        },
    },
    nep181: {
        'near-sdk-js': {
            LookupMap: null,
            UnorderedSet: null,
        },
        './nft/interfaces/index.js': {
            INEP181: null,
        },
        './nft/args.js': {
            NftSupplyForOwnerArgs: null,
            NftTokensArgs: null,
            NftTokensForOwnerArgs: null,
        },
        './nft/helpers.js': {
            restoreOwners: null,
        },
    },
    nep199: {
        './nft/interfaces/index.js': {
            INEP199: null,
            NEP199JsonToken: { replace: 'NEP178JsonToken' },
            NEP199Token: { replace: 'NEP178Token' },
            Payout: null,
        },
        './nft/args.js': {
            NftPayoutArgs: null,
            NftTransferPayoutArgs: null,
        },
        './nft/helpers.js': {
            royaltyToPayout: null,
        },
        './nft/common.js': {
            AccountToStringMap: null,
        },
    },
};

export function generateImports(neps: string[]) {
    const importSpec = {};

    for (const nep of neps) {
        for (const moduleName in importConfig[nep]) {
            if (importSpec[moduleName] == null) {
                importSpec[moduleName] = {};
            }
            Object.assign(
                importSpec[moduleName],
                importConfig[nep][moduleName]
            );
        }
    }

    for (const moduleName in importSpec) {
        for (const exportName in importSpec[moduleName]) {
            const exportSpec = importSpec[moduleName][exportName];
            if (exportSpec == null) continue;
            if (typeof exportSpec.replace === 'string') {
                delete importSpec[moduleName][exportSpec.replace];
            }
        }
    }

    let src = '';

    for (const moduleName in importSpec) {
        const exportNames = Object.keys(importSpec[moduleName]);
        src += `import { ${exportNames.join(', ')} } from "${moduleName}";\n`;
    }

    return src;
}
