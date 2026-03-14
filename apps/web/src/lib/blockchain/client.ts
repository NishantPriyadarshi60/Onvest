// apps/web/src/lib/blockchain/client.ts
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import { getEnvVar } from "@onvest/config";

const POLYGON_CHAIN_ID = 137;
const POLYGON_AMOY_CHAIN_ID = 80002;

/** Minimal ABI for FundToken (whitelist + view). */
const FUND_TOKEN_ABI = [
  "function addToWhitelist(address account) external",
  "function removeFromWhitelist(address account) external",
  "function isWhitelisted(address account) view returns (bool)",
];

/** Minimal ABI for FundFactory (deploy + event). */
const FUND_FACTORY_ABI = [
  "function deployFund(string name, string symbol, address initialOwner) external returns (address)",
  "event FundDeployed(address indexed tokenAddress, string name, address indexed owner)",
];

let _provider: JsonRpcProvider | null = null;
let _wallet: Wallet | null = null;

/**
 * Gets or creates the Polygon RPC provider.
 * Uses POLYGON_RPC_URL or fallback to NEXT_PUBLIC_POLYGON_RPC.
 */
function getProvider(): JsonRpcProvider {
  if (_provider) return _provider;
  const rpc =
    getEnvVar("POLYGON_RPC_URL") ??
    getEnvVar("NEXT_PUBLIC_POLYGON_RPC") ??
    "https://polygon-rpc.com";
  _provider = new JsonRpcProvider(rpc);
  return _provider;
}

/**
 * Gets or creates the deployer wallet.
 * Uses DEPLOYER_WALLET_PRIVATE_KEY from config.
 * @throws Error if private key is missing
 */
function getDeployerWallet(): Wallet {
  if (_wallet) return _wallet;
  const key = getEnvVar("DEPLOYER_WALLET_PRIVATE_KEY", true);
  if (!key || !key.startsWith("0x")) {
    throw new Error("DEPLOYER_WALLET_PRIVATE_KEY must be a valid hex string (0x...)");
  }
  _wallet = new Wallet(key, getProvider());
  return _wallet;
}

/**
 * Returns the deployer wallet address.
 */
export async function getDeployerAddress(): Promise<string> {
  return getDeployerWallet().getAddress();
}

/**
 * Returns a typed FundToken contract instance.
 * @param contractAddress - Token contract address
 * @returns ethers Contract for FundToken
 */
export function getFundTokenContract(contractAddress: string): Contract {
  const signer = getDeployerWallet();
  return new Contract(contractAddress, FUND_TOKEN_ABI, signer);
}

/**
 * Returns the FundFactory contract instance.
 * Uses FACTORY_CONTRACT_ADDRESS env var.
 * @throws Error if FACTORY_CONTRACT_ADDRESS is not set
 */
export function getFundFactoryContract(): Contract {
  const address = getEnvVar("FACTORY_CONTRACT_ADDRESS", true);
  if (!address || !address.startsWith("0x")) {
    throw new Error("FACTORY_CONTRACT_ADDRESS must be set to a valid address");
  }
  const signer = getDeployerWallet();
  return new Contract(address, FUND_FACTORY_ABI, signer);
}

/**
 * Current Polygon chain ID (137 mainnet, 80002 Amoy testnet).
 * Uses CHAIN_ID env var if set, else 137.
 */
export function getChainId(): number {
  const env = getEnvVar("CHAIN_ID");
  if (env) {
    const id = parseInt(env, 10);
    if (!Number.isNaN(id)) return id;
  }
  return POLYGON_CHAIN_ID;
}
