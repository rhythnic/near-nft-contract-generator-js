import { generateJSDoc } from './jsdocs';

export const methodsConfig = {
    nep171: {
        // Core NFT methods
        nft_token: {
            decorator: 'view({})',
            argInterface: 'NftTokenArgs',
            returnType: 'JsonToken | null',
            args: ['token_id'],
            src: () => ['return this.generateJsonToken(token_id);'],
        },
        nft_mint: {
            decorator: 'call({ payableFunction: true })',
            returnType: 'void',
            args: ['token_id', 'receiver_id'],
            argTypes: ['string', 'AccountId'],
            src: () => [
                `assert(!this.tokenById.get(token_id), "Token already exists");`,
                `let initialStorageUsage = near.storageUsage();`,
                'const token = this.generateNewToken(receiver_id);',
                'this.tokenById.set(token_id, token);',
                'logMint(token.owner_id, [token_id]);',
                'const senderId = near.predecessorAccountId();',
                'acceptStorageDeposit(senderId, storageDiff(initialStorageUsage));',
            ],
        },
        nft_transfer: {
            decorator: 'call({ payableFunction: true })',
            argInterface: 'NftTransferArgs',
            returnType: 'void',
            args: ['receiver_id', 'token_id', 'memo'],
            src: () => [
                'assertOneYocto();',
                'const senderId = near.predecessorAccountId();',
                'const token = this.authorizeTransfer(token_id, senderId, receiver_id);',
                'this.nftTransferInternal(token_id, token.owner_id, receiver_id, memo);',
            ],
        },
        nft_transfer_call: {
            decorator: 'call({ payableFunction: true })',
            argInterface: 'NftTransferCallArgs',
            returnType: 'NearPromise',
            args: ['receiver_id', 'token_id', 'memo', 'msg'],
            src: () => [
                'assertOneYocto();',
                'const senderId = near.predecessorAccountId();',
                'const token = this.authorizeTransfer(token_id, senderId, receiver_id);',
                'this.nftTransferInternal(token_id, token.owner_id, receiver_id, memo);',
                'const authorized_id = senderId === token.owner_id ? null : senderId;',
                'return NearPromise.new(receiver_id)',
                '  .functionCall(',
                '    "nft_on_transfer",',
                '    JSON.stringify({sender_id: senderId, previous_owner_id: token.owner_id, token_id, msg}),',
                '    BigInt(0),',
                '    BigInt(GAS_FOR_NFT_ON_TRANSFER)',
                '  )',
                '  .then(',
                '    // this function is the callback',
                '    NearPromise.new(near.currentAccountId()).functionCall(',
                '      "nft_resolve_transfer",',
                '      JSON.stringify({authorized_id, owner_id: token.owner_id, receiver_id, token_id}),',
                '      BigInt(0),',
                '      BigInt(GAS_FOR_RESOLVE_TRANSFER)',
                '    )',
                '  )',
                '  .asReturn();',
            ],
        },
        nft_resolve_transfer: {
            decorator: 'call({ privateFunction: true })',
            argInterface: 'NftResolveTransferArgs',
            returnType: 'boolean',
            args: ['owner_id', 'receiver_id', 'token_id', 'memo'],
            src: () => [
                'let { result: shouldRevertTransfer } = promiseResult(0);',
                'if (shouldRevertTransfer === "false") {',
                'return true;',
                '}',
                'let token = this.tokenById.get(token_id);',
                'if (',
                '  // token was burned',
                '  token == null ||',
                '  // token is not owned by the receiver',
                '  token.owner_id != receiver_id',
                ') {',
                'return true;',
                '}',
                'this.nftTransferInternal(token_id, receiver_id, owner_id, memo);',
                'return false;',
            ],
        },

        // Internal helper methods
        generateNewToken: {
            params: {
                ownerId: 'AccountId',
            },
            returnType: 'Token',
            src: () => ['return {', 'owner_id: ownerId,', '};'],
        },
        generateJsonToken: {
            params: { tokenId: 'string' },
            returnType: 'JsonToken',
            src: () => [
                'const token = this.tokenById.get(tokenId);',
                'if (!token) return null;',
                'return {',
                '  token_id: tokenId,',
                '  owner_id: token.owner_id,',
                '};',
            ],
        },
        assertTokenExists: {
            params: { tokenId: 'string' },
            returnType: 'Token',
            src: () => [
                'const token = this.tokenById.get(tokenId);',
                'assert(token != null, "Token not found");',
                'return token;',
            ],
        },
        authorizeTransfer: {
            params: {
                tokenId: 'string',
                senderId: 'AccountId',
                receiverId: 'AccountId',
            },
            returnType: 'Token',
            src: () => [
                'const token = this.assertTokenExists(tokenId);',
                'assert(token.owner_id != receiverId, "The token receiver cannot be the owner");',
                'assert(token.owner_id == senderId, "Unauthorized");',
                'return token;',
            ],
        },
        nftTransferInternal: {
            params: {
                tokenId: 'string',
                ownerId: 'AccountId',
                receiverId: 'AccountId',
                'memo?': 'string',
            },
            returnType: 'void',
            src: () => [
                'const newToken = this.generateNewToken(receiverId);',
                'this.tokenById.set(tokenId, newToken);',
                'if (memo != null) {',
                '  near.log(`Memo: ${memo}`);',
                '}',
                'const nftTransferLog: NFTEvent<TransferLogData> = {',
                'standard: NFT_STANDARD_NAME,',
                'version: NFT_METADATA_SPEC,',
                'event: "nft_transfer",',
                'data: [',
                '  {',
                '    old_owner_id: ownerId,',
                '    new_owner_id: receiverId,',
                '    token_ids: [tokenId],',
                '    memo,',
                '  },',
                '],',
                '};',
                'near.log(`EVENT_JSON:${JSON.stringify(nftTransferLog)}`);',
            ],
        },
    },

    nep177: {
        // NEP-177 Metadata methods
        nft_mint: {
            args: ['metadata'],
            argTypes: ['TokenMetadata'],
            src: (src: string[]) => [
                ...src.slice(0, 4),
                'this.metadataById.set(token_id, metadata);',
                ...src.slice(4),
            ],
        },
        nft_metadata: {
            decorator: 'view({})',
            returnType: 'ContractMetadata',
            src: () => ['return this.metadata;'],
        },
        nft_token_metadata: {
            decorator: 'view({})',
            argInterface: 'NftTokenMetadataArgs',
            returnType: 'TokenMetadata | null',
            args: ['token_id'],
            src: () => ['return this.metadataById.get(token_id) ?? null;'],
        },
        generateJsonToken: {
            src: (src: string[]) => [
                ...src.slice(0, 2),
                'const metadata = this.metadataById.get(tokenId);',
                ...src.slice(2, 5),
                'metadata: metadata ?? null,',
                ...src.slice(5),
            ],
        },
    },

    nep178: {
        // NEP-178 Approval Management methods
        nft_approve: {
            decorator: 'call({ payableFunction: true })',
            argInterface: 'NftApproveArgs',
            returnType: 'void | NearPromise',
            args: ['token_id', 'account_id', 'msg'],
            src: () => [
                'assertAtLeastOneYocto();',
                'const token = this.assertTokenExists(token_id);',
                'assertPredecessorIsOwner(token.owner_id);',
                'let approvalExisted = token.approved_account_ids.hasOwnProperty(account_id);',
                'token.approved_account_ids[account_id] = token.next_approval_id;',
                'token.next_approval_id += 1;',
                'this.tokenById.set(token_id, token);',
                'let storageUsed = approvalExisted ? 0 : accountIdBytes(account_id);',
                'acceptStorageDeposit(token.owner_id, BigInt(storageUsed));',
                'if (msg == null) return;',
                'return NearPromise.new(account_id)',
                '  .functionCall(',
                '    "nft_on_approve",',
                '    JSON.stringify({token_id, owner_id: token.owner_id, approval_id: token.next_approval_id, msg}),',
                '    BigInt(0),',
                '    BigInt(GAS_FOR_NFT_ON_APPROVE)',
                '  )',
                '  .asReturn();',
            ],
        },
        nft_is_approved: {
            decorator: 'view({})',
            argInterface: 'NftIsApprovedArgs',
            returnType: 'boolean',
            args: ['token_id', 'approved_account_id', 'approval_id'],
            src: () => [
                'const token = this.assertTokenExists(token_id);',
                'const approval = token.approved_account_ids[approved_account_id];',
                'if (approval == null) return false;',
                'return approval_id == null ? true : approval_id === approval;',
            ],
        },
        nft_revoke: {
            decorator: 'call({ payableFunction: true })',
            argInterface: 'NftRevokeArgs',
            returnType: 'void',
            args: ['token_id', 'account_id'],
            src: () => [
                'assertOneYocto();',
                'const token = this.assertTokenExists(token_id);',
                'assertPredecessorIsOwner(token.owner_id);',
                'if (token.approved_account_ids.hasOwnProperty(account_id)) {',
                '  delete token.approved_account_ids[account_id];',
                '  refundStorageDeposit(token.owner_id, BigInt(accountIdBytes(account_id)));',
                '  this.tokenById.set(token_id, token);',
                '}',
            ],
        },
        nft_revoke_all: {
            decorator: 'call({})',
            argInterface: 'NftRevokeAllArgs',
            returnType: 'void',
            args: ['token_id'],
            src: () => [
                'assertOneYocto();',
                'const token = this.assertTokenExists(token_id);',
                'assertPredecessorIsOwner(token.owner_id);',
                'if (',
                '  token.approved_account_ids == null ||',
                '  Object.getPrototypeOf(token.approved_account_ids) === Object.prototype ||',
                '  Object.keys(token.approved_account_ids).length === 0',
                ') {',
                '  return;',
                '}',
                'token.approved_account_ids = {};',
                'this.tokenById.set(token_id, token);',
                'refundApprovedAccountStorage(token.owner_id, token.approved_account_ids);',
            ],
        },
        nft_transfer: {
            args: ['approval_id'],
            src: (src: string[]) => {
                const index1 = findIndex(
                    src,
                    'const token = this.authorizeTransfer(token_id, senderId, receiver_id);',
                    'nft_transfer',
                    '178'
                );
                return [
                    ...src.slice(0, index1),
                    'const token = this.authorizeTransfer(token_id, senderId, receiver_id, approval_id);',
                    ...src.slice(index1 + 1),
                ];
            },
        },
        nft_transfer_call: {
            args: ['approval_id'],
            src: (src: string[]) => {
                const index1 = findIndex(
                    src,
                    'const token = this.authorizeTransfer',
                    'nft_transfer_call',
                    '178'
                );
                const index2 = findIndex(
                    src,
                    'JSON.stringify({authorized_id',
                    'nft_transfer_call',
                    '178'
                );
                return [
                    ...src.slice(0, index1),
                    'const token = this.authorizeTransfer(token_id, senderId, receiver_id, approval_id);',
                    ...src.slice(index1 + 1, index2),
                    'JSON.stringify({authorized_id, owner_id: token.owner_id, receiver_id, token_id, approved_account_ids: token.approved_account_ids }),',
                    ...src.slice(index2 + 1),
                ];
            },
        },
        nft_resolve_transfer: {
            args: ['approved_account_ids'],
            argTypes: ['AccountToNumberMap'],
            src: (src: string[]) => {
                const index1 = findIndex(
                    src,
                    'return true',
                    'nft_resolve_transfer',
                    '178'
                );
                const index2 = findIndex(
                    src,
                    'return true;',
                    'nft_resolve_transfer',
                    '178',
                    index1 + 1
                );
                const index3 = findIndex(
                    src,
                    'this.nftTransferInternal(token_id, receiver_id, owner_id, memo);',
                    'nft_resolve_transfer',
                    '178',
                    index2 + 1
                );

                return [
                    ...src.slice(0, index1),
                    'refundApprovedAccountStorage(owner_id, approved_account_ids);',
                    ...src.slice(index1, index2),
                    'refundApprovedAccountStorage(owner_id, approved_account_ids);',
                    ...src.slice(index2, index3),
                    'this.nftTransferInternal(token_id, receiver_id, owner_id, memo, approved_account_ids);',
                    ...src.slice(index3 + 1),
                ];
            },
        },
        nftTransferInternal: {
            params: {
                'approvedAccountIds?': 'AccountToNumberMap',
            },
            src: (src: string[]) => [
                'const newToken = this.generateNewToken(receiverId, approvedAccountIds);',
                ...src.slice(1),
            ],
        },
        generateNewToken: {
            params: {
                'approvedAccountIds?': 'AccountToNumberMap',
            },
            src: (src: string[]) => [
                ...src.slice(0, 2),
                'approved_account_ids: approvedAccountIds ?? {},',
                'next_approval_id: 0,',
                ...src.slice(2),
            ],
        },
        generateJsonToken: {
            src: (src: string[]) => {
                const index = findIndex(
                    src,
                    'owner_id: token.owner_id',
                    'generateJsonToken',
                    '178'
                );
                return [
                    ...src.slice(0, index),
                    'approved_account_ids: token.approved_account_ids,',
                    ...src.slice(index),
                ];
            },
        },
        authorizeTransfer: {
            params: {
                'approvalId?': 'number',
            },
            returnType: 'Token',
            src: (src: string[]) => [
                ...src.slice(0, 2),
                'if (senderId != token.owner_id) {',
                '  const approval = token.approved_account_ids[senderId];',
                '  assert(approval != null, "Unauthorized");',
                '  if (approvalId != null) {',
                '    assert(approvalId == approval, "The actual approval_id is different from the given approval_id");',
                '  }',
                '}',
                'return token;',
            ],
        },
    },

    nep181: {
        // NEP-181 Enumeration methods
        nft_total_supply: {
            decorator: 'view({})',
            returnType: 'string',
            src: () => ['return this.tokenById.length.toString();'],
        },
        nft_tokens: {
            decorator: 'view({})',
            argInterface: 'NftTokensArgs',
            returnType: 'JsonToken[]',
            args: ['from_index', 'limit'],
            src: () => [
                'let start = from_index ? parseInt(from_index) : 0;',
                'if (limit == null) {',
                '  limit = 50;',
                '}',
                '',
                'const keys = this.tokenById.keys({ start, limit });',
                'return keys.map((key) => this.generateJsonToken(key));',
            ],
        },
        nft_supply_for_owner: {
            decorator: 'view({})',
            argInterface: 'NftSupplyForOwnerArgs',
            returnType: 'string',
            args: ['account_id'],
            src: () => [
                'const token_id_set = restoreOwners(this.tokensPerOwner.get(account_id));',
                'return token_id_set == null ? "0" : token_id_set.length.toString();',
            ],
        },
        nft_tokens_for_owner: {
            decorator: 'view({})',
            argInterface: 'NftTokensForOwnerArgs',
            returnType: 'JsonToken[]',
            args: ['account_id', 'from_index', 'limit'],
            src: () => [
                'const token_id_set = restoreOwners(this.tokensPerOwner.get(account_id));',
                'if (token_id_set == null) {',
                '  return [];',
                '}',
                'let start = from_index ? parseInt(from_index) : 0;',
                'if (limit == null) {',
                '  limit = 50;',
                '}',
                'let token_ids = token_id_set.elements({ start, limit });',
                'return token_ids.map((x) => this.generateJsonToken(x));',
            ],
        },
        addTokenToOwner: {
            params: { tokenId: 'string', accountId: 'AccountId' },
            returnType: 'void',
            src: () => [
                'let tokenSet = restoreOwners(this.tokensPerOwner.get(accountId));',
                'if (tokenSet == null) {',
                '  tokenSet = new UnorderedSet(CollectionPrefix.OWNER_TOKEN_SET + accountId.toString());',
                '}',
                'tokenSet.set(tokenId);',
                'this.tokensPerOwner.set(accountId, tokenSet);',
            ],
        },
        removeTokenFromOwner: {
            params: { tokenId: 'string', accountId: 'AccountId' },
            returnType: 'void',
            src: () => [
                'let tokenSet = restoreOwners(this.tokensPerOwner.get(accountId));',
                'assert(tokenSet != null, "Account does not own any tokens");',
                'tokenSet.remove(tokenId);',
                'if (tokenSet.isEmpty()) {',
                '  this.tokensPerOwner.remove(accountId);',
                '} else {',
                '  this.tokensPerOwner.set(accountId, tokenSet);',
                '}',
            ],
        },
        nft_mint: {
            src: (src: string[]): string[] => {
                const index = findIndex(src, 'logMint', 'nft_mint', '181');
                return [
                    ...src.slice(0, index),
                    'this.addTokenToOwner(token.owner_id, token_id);',
                    ...src.slice(index),
                ];
            },
        },
        nftTransferInternal: {
            src: (src: string[]) => {
                const index = findIndex(
                    src,
                    'const nftTransferLog',
                    'nftTransferInternal',
                    '181'
                );
                return [
                    ...src.slice(0, index),
                    'this.removeTokenFromOwner(ownerId, tokenId);',
                    'this.addTokenToOwner(receiverId, tokenId);',
                    ...src.slice(index),
                ];
            },
        },
    },

    nep199: {
        // NEP-199 Royalty methods
        nft_payout: {
            decorator: 'view({})',
            argInterface: 'NftPayoutArgs',
            returnType: 'Payout',
            args: ['token_id', 'balance', 'max_len_payout'],
            src: () => [
                'const token = this.assertTokenExists(token_id);',
                'const { owner_id, royalty } = token;',
                'let totalPerpetual = 0;',
                'const payout: AccountToStringMap = {};',
                'assert(',
                'Object.keys(royalty).length <= max_len_payout,',
                '"Cannot payout to that many receivers"',
                ');',
                'Object.entries(royalty).forEach(([key, value]) => {',
                'if (key != owner_id) {',
                '  payout[key] = royaltyToPayout(value, BigInt(balance));',
                '  totalPerpetual += value;',
                '}',
                '});',
                'payout[owner_id] = royaltyToPayout(10000 - totalPerpetual, BigInt(balance));',
                'return { payout };',
            ],
        },
        nft_transfer_payout: {
            decorator: 'call({})',
            argInterface: 'NftTransferPayoutArgs',
            returnType: 'Payout',
            args: [
                'receiver_id',
                'token_id',
                'approval_id',
                'memo',
                'balance',
                'max_len_payout',
            ],
            src: () => [
                'assertOneYocto();',
                'const senderId = near.predecessorAccountId();',
                'const token = this.authorizeTransfer(token_id, senderId, receiver_id, approval_id);',
                'this.nftTransferInternal(token_id, token.owner_id, receiver_id, memo);',
                'refundApprovedAccountStorage(token.owner_id, token.approved_account_ids);',
                '//get the owner of the token',
                'const { owner_id, royalty } = token;',
                '//keep track of the total perpetual royalties',
                'let totalPerpetual = 0;',
                '//keep track of the payout object to send back',
                'let payout: AccountToStringMap = {};',
                'assert(',
                'Object.keys(royalty).length <= max_len_payout,',
                '"Cannot payout to that many receivers"',
                ');',
                'Object.entries(royalty).forEach(([key, value], index) => {',
                '  if (key != owner_id) {',
                '    payout[key] = royaltyToPayout(value, BigInt(balance));',
                '    totalPerpetual += value;',
                '  }',
                '});',
                'payout[owner_id] = royaltyToPayout(10000 - totalPerpetual, BigInt(balance));',
                'return { payout };',
            ],
        },
        nft_mint: {
            args: ['perpetual_royalties'],
            argTypes: ['AccountToNumberMap'],
            src: (src: string[]) => {
                const index = src.findIndex((x) =>
                    x.includes('this.generateNewToken')
                );
                return [
                    ...src.slice(0, index),
                    'const royalty: AccountToNumberMap = {};',
                    'if (perpetual_royalties != null) {',
                    'assert(Object.keys(perpetual_royalties).length <= 10, "Cannot add more than 10 perpetual royalty amounts");',
                    'Object.entries(perpetual_royalties).forEach(([account, amount]) => {',
                    'royalty[account] = amount;',
                    '});',
                    '}',
                    'const token = this.generateNewToken(receiver_id, {}, royalty);',
                    ...src.slice(index + 1),
                ];
            },
        },
        generateNewToken: {
            params: {
                'royalty?': 'AccountToNumberMap',
            },
            src: (src: string[]) => {
                const index = src.findIndex((x) =>
                    x.includes('next_approval_id: 0,')
                );
                return [
                    ...src.slice(0, index),
                    'royalty: royalty ?? {},',
                    ...src.slice(index),
                ];
            },
        },
        generateJsonToken: {
            src: (src: string[]) => {
                const index = src.findIndex((x) =>
                    x.includes(
                        'approved_account_ids: token.approved_account_ids,'
                    )
                );

                return [
                    ...src.slice(0, index),
                    '  royalty: token.royalty,',
                    ...src.slice(index),
                ];
            },
        },
    },
};

function findIndex(
    src: string[],
    text: string,
    method: string,
    nep: string,
    startIndex = 0
) {
    const index = src.findIndex(
        (x, index) => index >= startIndex && x.includes(text)
    );
    if (index === -1) {
        throw new Error(
            `Failed to generate method ${method} for NEP ${nep}: no text ${text}`
        );
    }
    return index;
}

export function generateMethods(neps: string[]) {
    const methodSpec = {};

    for (const nep of neps) {
        for (const methodName in methodsConfig[nep]) {
            const methodConfig = methodsConfig[nep][methodName];
            const spec = methodSpec[methodName] || {};
            spec.decorator = spec.decorator || methodConfig.decorator;
            spec.argInterface = spec.argInterface || methodConfig.argInterface;
            spec.returnType = spec.returnType || methodConfig.returnType;
            if (methodConfig.args) {
                spec.args = [...(spec.args || []), ...methodConfig.args];
            }
            if (methodConfig.argTypes) {
                spec.argTypes = [
                    ...(spec.argTypes || []),
                    ...methodConfig.argTypes,
                ];
            }
            if (methodConfig.params) {
                spec.params = {
                    ...(spec.params || {}),
                    ...methodConfig.params,
                };
            }
            if (!methodConfig.src) {
                console.log('No src for', nep, methodName);
                continue;
            }
            spec.src = methodConfig.src(spec.src);
            methodSpec[methodName] = spec;
        }
    }

    let src = '';

    const methods: { methodName: string; spec: any }[] = Object.entries(
        methodSpec
    ).map(([methodName, spec]) => ({
        methodName,
        spec,
    }));

    // Sort methods to put @view({}) first, @call({}) second, and private/internal methods last.
    methods.sort((a, b) => {
        const aDecorator = a.spec.decorator;
        const bDecorator = b.spec.decorator;
        if (!aDecorator && !bDecorator) {
            return a.methodName.localeCompare(b.methodName);
        }
        if (!aDecorator) return 1;
        if (!bDecorator) return -1;
        if (aDecorator.startsWith('view') && bDecorator.startsWith('call')) {
            return -1;
        }
        if (aDecorator.startsWith('call') && bDecorator.startsWith('view')) {
            return 1;
        }
        return a.methodName.localeCompare(b.methodName);
    });

    for (const { methodName, spec } of methods) {
        src += '\n';

        // Add JSDoc comment for the method
        const jsDoc = generateJSDoc(methodName, neps);
        if (jsDoc) {
            src += `${jsDoc}\n`;
        }

        if (spec.decorator != null) {
            src += `@${spec.decorator}\n`;
        }

        src += `${methodName}(`;
        if (spec.params) {
            src += `${Object.entries(spec.params)
                .map(([key, type]) => `${key}: ${type}`)
                .join(', ')}`;
        } else if (spec.args) {
            const param = `{ ${spec.args.join(', ')}}`;
            if (spec.argInterface) {
                src += `${param}: ${spec.argInterface}`;
            } else if (spec.argTypes) {
                const type = spec.args.reduce((acc, arg, i) => {
                    const item = `${arg}: ${spec.argTypes[i]}`;
                    return i === 0 ? item : `${acc}, ${item}`;
                }, '');
                src += `${param}: { ${type} }`;
            }
        }
        src += `): ${spec.returnType} {\n`;
        src += spec.src.join('\n');
        src += '\n}\n';
    }

    return src;
}
