/**
 * Generates the Contract class declaration with the NearBindgen decorator
 * and implements the interfaces for all included NEP standards.
 */

interface ClassConfig {
    // List of interfaces this NEP standard implements
    interfaces: string[];
}

export const classConfig: Record<string, ClassConfig> = {
    nep171: {
        interfaces: ['INEP171<Token, JsonToken>'],
    },
    nep177: {
        interfaces: ['INEP177<ContractMetadata, TokenMetadata>'],
    },
    nep178: {
        interfaces: ['INEP178'],
    },
    nep181: {
        interfaces: ['INEP181<JsonToken>'],
    },
    nep199: {
        interfaces: ['INEP199'],
    },
};

/**
 * Generates the Contract class declaration with the NearBindgen decorator
 * and implements the interfaces for all included NEP standards.
 *
 * @param neps Array of NEP standards to include
 * @returns String containing the Contract class declaration
 */
export function generateClassDeclaration(neps: string[]): string {
    // Ensure nep171 is included as it's the base standard
    if (!neps.includes('nep171')) {
        neps = ['nep171', ...neps];
    }

    // Collect all interfaces that the contract should implement
    const interfaces = neps
        .filter((nep) => classConfig[nep]?.interfaces)
        .flatMap((nep) => classConfig[nep].interfaces);

    // Generate the class declaration
    let classDeclaration = `@NearBindgen({})\nclass Contract\n`;

    // Add interfaces if there are any
    if (interfaces.length > 0) {
        classDeclaration += `  implements\n`;
        classDeclaration += interfaces
            .map((iface) => `    ${iface}`)
            .join(',\n');
        classDeclaration += `\n`;
    }

    classDeclaration += `{\n`;

    return classDeclaration;
}

/**
 * Generates the contract state properties and collections based on the included NEP standards.
 *
 * @param neps Array of NEP standards to include
 * @returns String containing the contract state properties and collections
 */
export function generateContractState(neps: string[]): string {
    let state = '';

    // Core collections for NEP-171 (always included)
    state += `  tokenById = new UnorderedMap<Token>(CollectionPrefix.TOKENS_BY_ID);\n`;

    // Add metadata property and collection for NEP-177
    if (neps.includes('nep177')) {
        state += `  metadata: ContractMetadata;\n`;
        state += `  metadataById = new LookupMap<TokenMetadata>(\n`;
        state += `    CollectionPrefix.TOKEN_METADATA_BY_ID\n`;
        state += `  );\n`;
    }

    // Add tokensPerOwner collection for NEP-181
    if (neps.includes('nep181')) {
        state += `  tokensPerOwner = new LookupMap<UnorderedSet<string>>(\n`;
        state += `    CollectionPrefix.TOKENS_PER_OWNER\n`;
        state += `  );\n`;
    }

    return state;
}

/**
 * Generates the contract constructor based on the included NEP standards.
 *
 * @param neps Array of NEP standards to include
 * @param name Contract name
 * @param symbol Contract symbol
 * @returns String containing the contract constructor
 */
export function generateConstructor(
    neps: string[],
    name: string = 'My NFT',
    symbol: string = 'NFT'
): string {
    let constructor = `  constructor() {\n`;

    // Add metadata initialization for NEP-177
    if (neps.includes('nep177')) {
        constructor += `    this.metadata = {\n`;
        constructor += `      spec: "nft-1.0.0",\n`;
        constructor += `      name: "${name}",\n`;
        constructor += `      symbol: "${symbol}",\n`;
        constructor += `      icon: null,\n`;
        constructor += `      base_uri: null,\n`;
        constructor += `      reference: null,\n`;
        constructor += `      reference_hash: null,\n`;
        constructor += `    };\n`;
    }

    constructor += `  }\n`;
    return constructor;
}

/**
 * Generates the complete Contract class with state, constructor, methods and closing brace.
 *
 * @param opts Options for generating the contract class
 * @returns String containing the complete Contract class
 */
export function generateClass(opts: {
    neps: string[];
    name?: string;
    symbol?: string;
    methods?: string;
}): string {
    const { neps, name = 'My NFT', symbol = 'NFT', methods = '' } = opts;

    let classStr = generateClassDeclaration(neps);
    classStr += generateContractState(neps);
    classStr += '\n';
    classStr += generateConstructor(neps, name, symbol);

    // Add methods if provided
    if (methods) {
        classStr += '\n';
        classStr += methods;
    }

    classStr += '}\n';

    return classStr;
}
