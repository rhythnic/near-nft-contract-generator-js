export function logHelp() {
    console.log(`
  NFT Contract Generator
  
  Usage: node src/generator/contract-generator.js <output-path> [options]
  
  Options:
    --nep177            Include NEP-177 (NFT Metadata)
    --nep178            Include NEP-178 (NFT Approval Management)
    --nep181            Include NEP-181 (NFT Enumeration)
    --nep199            Include NEP-199 (NFT Royalty)
    --name <name>       Contract name (default: "My NFT")
    --symbol <symbol>   Contract symbol (default: "NFT")
    --help, -h          Show this help message

  Note: The generator will fail if the output file already exists to prevent accidental overwrites.
  Either specify a different output path or delete the existing file before generating.
    `);
}
