/**
 * JSDoc templates for NFT contract methods
 * Each template is keyed by the NEP standard and method name
 */

/**
 * JSDoc template structure
 */
export interface JSDocTemplate {
    /** Short description of the method */
    description: string[];
    /** Parameter descriptions keyed by parameter name */
    params?: { [key: string]: string };
    /** Return value description */
    returns?: string;
}

export const jsdocTemplates: {
    [nep: string]: { [method: string]: Partial<JSDocTemplate> };
} = {
    nep171: {
        // Core NFT methods
        nft_token: {
            description: ['Get token information for a specific token ID'],
            params: {
                token_id: 'The token ID to retrieve information for',
            },
            returns:
                "The token information as a JsonToken object, or null if the token doesn't exist",
        },
        nft_transfer: {
            description: ['Transfer a token to a new owner'],
            params: {
                receiver_id: "The account ID of the token's new owner",
                token_id: 'The token ID to transfer',
                memo: 'Optional memo to include with the transfer',
            },
        },
        nft_transfer_call: {
            description: [
                "Transfer a token and call a method on the receiver's contract",
            ],
            params: {
                receiver_id: "The account ID of the token's new owner",
                token_id: 'The token ID to transfer',
                memo: 'Optional memo to include with the transfer',
                msg: 'The message to pass to the receiving contract',
            },
            returns: "Promise to the receiving contract's method",
        },
        nft_resolve_transfer: {
            description: [
                'Resolves a cross-contract call from nft_transfer_call',
            ],
            params: {
                owner_id: 'The original owner of the token',
                receiver_id: 'The account ID that received the token',
                token_id: 'The token ID that was transferred',
                memo: 'Optional memo included in the transfer',
            },
            returns: 'True if the token was successfully transferred',
        },
        nft_mint: {
            description: ['Mint a new token'],
            params: {
                token_id: 'The token ID to mint',
                receiver_id: 'The account ID that will own the minted token',
            },
        },

        // Internal helper methods
        generateNewToken: {
            description: ['Generate a new token with the specified owner'],
            params: {
                ownerId: 'The account ID that will own the new token',
            },
            returns: 'A new Token object',
        },
        generateJsonToken: {
            description: [
                'Generate a JSON representation of a token for external view',
            ],
            params: {
                tokenId: 'The ID of the token to generate JSON for',
            },
            returns:
                "JSON representation of the token, or null if token doesn't exist",
        },
        assertTokenExists: {
            description: ['Assert that a token exists and return it'],
            params: {
                tokenId: 'The ID of the token to check',
            },
            returns: 'The Token object if it exists',
        },
        authorizeTransfer: {
            description: ['Authorize a token transfer by checking ownership'],
            params: {
                tokenId: 'The ID of the token to transfer',
                senderId: 'The account ID attempting to initiate the transfer',
                receiverId: 'The account ID that will receive the token',
            },
            returns: 'The Token object if transfer is authorized',
        },
        nftTransferInternal: {
            description: ['Internal implementation of token transfer logic'],
            params: {
                tokenId: 'The ID of the token to transfer',
                ownerId: 'The current owner of the token',
                receiverId: 'The account ID that will receive the token',
                memo: 'Optional memo to include with the transfer',
            },
            returns: 'void',
        },
    },
    nep177: {
        // Metadata methods
        nft_mint: {
            params: {
                metadata: 'The metadata for the new token',
            },
        },
        nft_metadata: {
            description: ['Get the contract-level metadata'],
            returns: 'The contract metadata',
        },
        nft_token_metadata: {
            description: ['Get the metadata for a specific token'],
            params: {
                token_id: 'The token ID to get metadata for',
            },
            returns: "The token metadata or null if the token doesn't exist",
        },
    },
    nep178: {
        // Approval methods
        nft_is_approved: {
            description: [
                'Check if a specific account is approved to transfer a token',
            ],
            params: {
                token_id: 'The token ID to check',
                approved_account_id: 'The account ID to check for approval',
                approval_id: 'Optional approval ID to compare against',
            },
            returns: 'True if the account is approved to transfer the token',
        },
        nft_approve: {
            description: ['Approve an account ID to transfer a token'],
            params: {
                token_id: 'The token ID to approve for transfer',
                account_id: 'The account ID being granted approval',
                msg: 'Optional message to pass to the approved account contract',
            },
            returns:
                "Promise to the approved account's contract if msg is provided",
        },
        nft_revoke: {
            description: ['Revoke approval for a specific account'],
            params: {
                token_id: 'The token ID to revoke approval for',
                account_id: 'The account ID to revoke approval from',
            },
        },
        nft_revoke_all: {
            description: ['Revoke all approvals for a specific token'],
            params: {
                token_id: 'The token ID to revoke all approvals for',
            },
        },
        nft_transfer: {
            params: {
                approval_id: 'The approval ID if using an approved account',
            },
        },
        nft_transfer_call: {
            params: {
                approval_id: 'The approval ID if using an approved account',
            },
        },

        // Internal helper methods for NEP-178
        generateNewToken: {
            params: {
                approvedAccountIds:
                    'Map of approved account IDs to approval IDs',
            },
        },
        generateJsonToken: {
            // This extends the base generateJsonToken to include approved_account_ids
            params: {
                approvedAccountIds:
                    'Map of approved account IDs to approval IDs',
            },
        },
        authorizeTransfer: {
            params: {
                approvalId:
                    'Optional approval ID if transfer is by an approved account',
            },
        },
    },
    nep181: {
        // Enumeration methods
        nft_total_supply: {
            description: ['Get the total supply of tokens'],
            returns: 'The total number of tokens as a string',
        },
        nft_tokens: {
            description: ['Get a list of tokens'],
            params: {
                from_index: 'Optional starting index as a string',
                limit: 'Optional maximum number of tokens to return',
            },
            returns: 'Array of token objects',
        },
        nft_supply_for_owner: {
            description: [
                'Get the number of tokens owned by a specific account',
            ],
            params: {
                account_id: 'The account ID to check',
            },
            returns: 'The number of tokens owned by the account as a string',
        },
        nft_tokens_for_owner: {
            description: ['Get a list of tokens owned by a specific account'],
            params: {
                account_id: 'The account ID to get tokens for',
                from_index: 'Optional starting index as a string',
                limit: 'Optional maximum number of tokens to return',
            },
            returns: 'Array of token objects owned by the account',
        },

        // Internal helper methods for NEP-181
        addTokenToOwner: {
            description: [
                'Add a token to the list of tokens owned by an account',
            ],
            params: {
                tokenId: 'The ID of the token to add',
                accountId: 'The account ID that owns the token',
            },
        },
        removeTokenFromOwner: {
            description: [
                'Remove a token from the list of tokens owned by an account',
            ],
            params: {
                tokenId: 'The ID of the token to remove',
                accountId: 'The account ID that owns the token',
            },
        },
    },
    nep199: {
        // Royalty methods
        nft_payout: {
            description: ['Calculate the payout for a token'],
            params: {
                token_id: 'The token ID to calculate the payout for',
                balance: 'The balance to calculate the payout from',
                max_len_payout:
                    'The maximum number of accounts to include in the payout',
            },
            returns: 'The payout object',
        },
        nft_transfer_payout: {
            description: ['Transfer a token and calculate the payout'],
            params: {
                receiver_id: "The account ID of the token's new owner",
                token_id: 'The token ID to transfer',
                approval_id: 'The approval ID',
                memo: 'Optional memo to include with the transfer',
                balance: 'The balance to calculate the payout from',
                max_len_payout:
                    'The maximum number of accounts to include in the payout',
            },
            returns: 'The payout object',
        },
        nft_mint: {
            params: {
                perpetual_royalties: 'The royalty configuration for the token',
            },
        },

        // Internal helper methods for NEP-199
        generateNewToken: {
            params: {
                royalty: 'Map of account IDs to royalty percentages',
            },
        },
        generateJsonToken: {
            // This extends the base generateJsonToken to include royalty
        },
    },
};

/**
 * Build a JSDoc comment string from a template
 * @param template - The JSDoc template object
 * @returns Formatted JSDoc comment string
 */
export function buildJSDocComment(template: JSDocTemplate): string {
    if (!template) return '';

    let comment = '/**\n';

    // Add description
    if (template.description && template.description.length > 0) {
        for (const line of template.description) {
            comment += ` * ${line}\n`;
        }
    }

    // Add empty line if we have both description and params/returns
    if (template.description?.length && (template.params || template.returns)) {
        comment += ` *\n`;
    }

    // Add params
    if (template.params) {
        for (const [param, desc] of Object.entries(template.params)) {
            comment += ` * @param ${param} - ${desc}\n`;
        }
    }

    // Add returns
    if (template.returns) {
        comment += ` * @returns ${template.returns}\n`;
    }

    comment += ' */';
    return comment;
}

/**
 * Get JSDoc template for a specific method and NEP standard
 * @param nep - The NEP standard
 * @param methodName - The method name
 * @returns The JSDoc template object or undefined if not found
 */
export function getJSDocTemplate(
    nep: string,
    methodName: string
): Partial<JSDocTemplate> | undefined {
    return jsdocTemplates[nep]?.[methodName];
}

/**
 * Merge multiple JSDoc templates into a single template
 * @param templates - Array of JSDoc templates to merge
 * @returns Merged JSDoc template
 */
export function mergeJSDocTemplates(
    templates: Partial<JSDocTemplate>[]
): JSDocTemplate {
    if (!templates || templates.length === 0) return null;

    const result: JSDocTemplate = {
        description: [],
        params: {},
    };

    // Use the description from the first template that has one
    for (const template of templates) {
        if (template.description && template.description.length > 0) {
            result.description = template.description;
            break;
        }
    }

    // Merge all params from all templates
    for (const template of templates) {
        if (template.params) {
            result.params = { ...result.params, ...template.params };
        }
    }

    // Use the returns from the first template that has one
    for (const template of templates) {
        if (template.returns) {
            result.returns = template.returns;
            break;
        }
    }

    return result;
}

/**
 * Generate JSDoc comment for a method based on selected NEP standards
 * @param methodName - The method name
 * @param neps - Array of selected NEP standards
 * @returns Formatted JSDoc comment string or an empty string if no template found
 */
export function generateJSDoc(methodName: string, neps: string[]): string {
    // Collect all templates for this method from all selected NEPs
    const templates: Partial<JSDocTemplate>[] = [];

    for (const nep of neps) {
        const template = jsdocTemplates[nep]?.[methodName];
        if (template) {
            templates.push(template);
        }
    }

    if (templates.length === 0) {
        return '';
    }

    // Merge all templates and build the JSDoc comment
    const mergedTemplate = mergeJSDocTemplates(templates);
    return buildJSDocComment(mergedTemplate);
}
