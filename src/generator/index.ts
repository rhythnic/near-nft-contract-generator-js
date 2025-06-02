import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { generateImports } from './imports';
import { generateTypes } from './types';
import { generateClass } from './class';
import { logHelp } from './help';
import { generateMethods } from './methods';
import * as prettier from 'prettier';

export function generateContract(opts: {
    neps: string[];
    outputPath: string;
    name?: string;
    symbol?: string;
}) {
    const { neps, name, symbol } = opts;

    // Generate imports
    const importsStr = generateImports(neps);

    // Generate types
    const typesStr = generateTypes(neps);

    // Generate methods
    const methodsStr = generateMethods(neps);

    // Generate class declaration with methods
    const classStr = generateClass({ neps, name, symbol, methods: methodsStr });

    // Combine all parts
    const contractSrc = `${importsStr}\n${typesStr}\n${classStr}`;

    return contractSrc;
}

export async function main() {
    // Parse command-line arguments
    const args = process.argv.slice(2);

    if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
        logHelp();
        process.exit(0);
    }

    const outputPath = resolve(args[0]);

    const neps = ['nep171'];

    if (args.includes('--nep177')) {
        neps.push('nep177');
    }

    if (args.includes('--nep178')) {
        neps.push('nep178');
    }

    if (args.includes('--nep181')) {
        neps.push('nep181');
    }

    if (args.includes('--nep199')) {
        neps.push('nep199');
    }

    if (neps.includes('nep199') && !neps.includes('nep178')) {
        console.error('Error: NEP-199 requires NEP-178 to be included.');
        process.exit(1);
    }

    // Parse options
    const options = {
        neps,
        outputPath,
        name: 'My NFT',
        symbol: 'NFT',
    };

    // Parse name and symbol if provided
    const nameIndex = args.indexOf('--name');
    if (nameIndex !== -1 && nameIndex + 1 < args.length) {
        options.name = args[nameIndex + 1];
    }

    const symbolIndex = args.indexOf('--symbol');
    if (symbolIndex !== -1 && symbolIndex + 1 < args.length) {
        options.symbol = args[symbolIndex + 1];
    }

    // Generate the contract based on the selected NEP standards
    let generatedContract = generateContract(options);

    // Format the generated code using Prettier
    try {
        // Get Prettier config from package.json or .prettierrc if it exists
        const prettierConfig = await prettier.resolveConfig(process.cwd());

        // Format the code with Prettier using the resolved config or defaults
        generatedContract = await prettier.format(generatedContract, {
            ...prettierConfig,
            parser: 'typescript',
        });
    } catch (error) {
        console.warn(
            `Warning: Could not format code with Prettier: ${error.message}`
        );
        // Continue with unformatted code if Prettier fails
    }

    // Check if the output file already exists
    if (existsSync(outputPath)) {
        console.error(`Error: Output file already exists at: ${outputPath}`);
        console.error(
            'To prevent accidental overwrites, please specify a different output path or delete the existing file.'
        );
        process.exit(1);
    }

    // Write the generated contract to the output file
    writeFileSync(outputPath, generatedContract);

    console.log(`✅ Contract successfully generated at: ${outputPath}`);

    // Log which standards were included
    console.log('\nIncluded standards:');
    console.log('- NEP-171: Core NFT Standard (required)');
    if (options.neps.includes('nep177')) console.log('- NEP-177: NFT Metadata');
    if (options.neps.includes('nep178'))
        console.log('- NEP-178: NFT Approval Management');
    if (options.neps.includes('nep181'))
        console.log('- NEP-181: NFT Enumeration');
    if (options.neps.includes('nep199')) console.log('- NEP-199: NFT Royalty');
    console.log('- Minting Methods: nft_mint (always included)');
}

main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
});
