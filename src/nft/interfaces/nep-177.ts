import { LookupMap } from 'near-sdk-js';
import { NEP171JsonToken } from './nep-171';
import { NftTokenMetadataArgs } from '../args';

export type NEP177ContractMetadata = {
    spec: string; // required, essentially a version like "nft-2.0.0", replacing "2.0.0" with the implemented version of NEP-177
    name: string; // required, ex. "Mochi Rising — Digital Edition" or "Metaverse 3"
    symbol: string; // required, ex. "MOCHI"
    icon: string | null; // Data URL
    base_uri: string | null; // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
    reference: string | null; // URL to a JSON file with more info
    reference_hash: string | null; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
};

export type NEP177TokenMetadata = {
    title: string | null; // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
    description: string | null; // free-form description
    media: string | null; // URL to associated media, preferably to decentralized, content-addressed storage
    media_hash: string | null; // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
    copies: number | null; // number of copies of this set of metadata in existence when token was minted.
    issued_at: number | null; // When token was issued or minted, Unix epoch in milliseconds
    expires_at: number | null; // When token expires, Unix epoch in milliseconds
    starts_at: number | null; // When token starts being valid, Unix epoch in milliseconds
    updated_at: number | null; // When token was last updated, Unix epoch in milliseconds
    extra: string | null; // anything extra the NFT wants to store on-chain. Can be stringified JSON.
    reference: string | null; // URL to an off-chain JSON file with more info.
    reference_hash: string | null; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
};

export type NEP177JsonToken = NEP171JsonToken & {
    metadata: NEP177TokenMetadata;
};

export interface INEP177<
    TContractMetadata extends NEP177ContractMetadata,
    TTokenMetadata extends NEP177TokenMetadata,
> {
    /**
     * metadata
     * The contract metadata
     */
    metadata: TContractMetadata;

    /**
     * metadataById
     * Mapping of token ID to token metadata
     */
    metadataById: LookupMap<TTokenMetadata>;

    /**
     * View
     * Get the contract metadata
     */
    nft_metadata(): TContractMetadata;

    /**
     * View
     * Get the token metadata
     * @param args.token_id The token ID
     */
    nft_token_metadata(args: NftTokenMetadataArgs): TTokenMetadata | null;
}
