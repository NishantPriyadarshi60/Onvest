// apps/web/src/lib/blockchain/fundService.ts
import {
  getFundTokenContract,
  getFundFactoryContract,
  getChainId,
  getDeployerAddress,
} from "./client";
import {
  getFundById,
  updateFund,
  getInvestorById,
  updateInvestor,
  insertActivityLog,
} from "@onvest/db";
import { sendEmail, InvestorWhitelisted, InvestorWhitelistedGp } from "@onvest/email";
import * as Sentry from "@sentry/nextjs";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const CONFIRMATIONS_DEPLOY = 2;
const CONFIRMATIONS_WHITELIST = 1;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extracts human-readable revert reason from ethers error.
 */
function parseRevertReason(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    // Common revert patterns
    if (msg.includes("FundToken: from not whitelisted")) return "Sender is not whitelisted.";
    if (msg.includes("FundToken: to not whitelisted")) return "Recipient is not whitelisted.";
    if (msg.includes("OwnableUnauthorizedAccount")) return "Only the token owner can perform this action.";
    if (msg.includes("insufficient funds")) return "Insufficient funds for gas.";
    if (msg.includes("network timeout") || msg.includes("ETIMEDOUT")) return "Network timeout. Please retry.";
    if (msg.includes("reverted")) {
      const match = msg.match(/reason="([^"]+)"/) ?? msg.match(/reverted with reason string '([^']+)'/);
      if (match) return match[1];
    }
    return msg.slice(0, 200);
  }
  return String(error);
}

/**
 * Retries a function with exponential backoff.
 */
async function withRetry<T>(fn: () => Promise<T>, context: Record<string, unknown>): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      const msg = String(e instanceof Error ? e.message : e);
      if (msg.includes("insufficient funds") || msg.includes("revert")) {
        Sentry.captureException(e, { extra: context });
        throw e;
      }
      if (i < MAX_RETRIES - 1) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, i);
        await sleep(backoff);
      }
    }
  }
  Sentry.captureException(lastError, { extra: context });
  throw lastError;
}

/**
 * Deploys a FundToken via FundFactory.
 * Waits for 2 confirmations, updates funds table with contract_addr and chain_id.
 *
 * @param fundId - Fund UUID
 * @param name - Token name
 * @param symbol - Token symbol
 * @returns { contractAddress, txHash }
 */
export async function deployFundToken(
  fundId: string,
  name: string,
  symbol: string
): Promise<{ contractAddress: string; txHash: string }> {
  const fund = await getFundById(fundId);
  if (!fund) throw new Error("Fund not found");

  const deployerAddress = await getDeployerAddress();

  const run = async () => {
    const factory = getFundFactoryContract();
    const tx = await factory.deployFund(name, symbol, deployerAddress);
    const receipt = await tx.wait(CONFIRMATIONS_DEPLOY);
    if (!receipt) throw new Error("No receipt");
    const event = receipt.logs
      .map((log: { topics: string[]; data: string }) => {
        try {
          return factory.interface.parseLog({ topics: [...log.topics], data: log.data });
        } catch {
          return null;
        }
      })
      .find((e: { name?: string } | null) => e?.name === "FundDeployed");
    const tokenAddress = event?.args?.[0] ?? receipt?.contractAddress;
    if (!tokenAddress) throw new Error("Could not determine token address");
    return { contractAddress: tokenAddress, txHash: receipt.hash };
  };

  const result = await withRetry(run, { fundId, name, symbol, action: "deployFundToken" });

  const tokenConfig = { ...(fund.token_config as Record<string, unknown>), contract_addr: result.contractAddress, chain_id: 137 };
  await updateFund(fundId, { token_config: tokenConfig });

  return result;
}

/**
 * Adds a wallet to the token whitelist.
 * Waits for 1 confirmation, updates investors table, logs activity, sends email.
 *
 * @param contractAddress - FundToken contract address
 * @param walletAddress - Wallet to whitelist
 * @param investorId - Investor UUID (for DB and email)
 * @returns { txHash, blockNumber }
 */
export async function addToWhitelist(
  contractAddress: string,
  walletAddress: string,
  investorId: string,
  options?: {
    fundId: string;
    actorId: string;
    investorEmail: string;
    investorName: string;
    fundName: string;
    gpEmail?: string;
    dashboardUrl?: string;
  }
): Promise<{ txHash: string; blockNumber: number }> {
  const run = async () => {
    const token = getFundTokenContract(contractAddress);
    const tx = await token.addToWhitelist(walletAddress);
    const receipt = await tx.wait(CONFIRMATIONS_WHITELIST);
    if (!receipt) throw new Error("No receipt");
    return { txHash: receipt.hash, blockNumber: Number(receipt.blockNumber) };
  };

  const result = await withRetry(run, {
    contractAddress,
    walletAddress,
    investorId,
    action: "addToWhitelist",
  }).catch((e) => {
    throw new Error(parseRevertReason(e));
  });

  await updateInvestor(investorId, {
    is_whitelisted: true,
    whitelist_tx_hash: result.txHash,
    status: "whitelisted",
  });

  if (options?.fundId && options?.actorId) {
    await insertActivityLog({
      fund_id: options.fundId,
      investor_id: investorId,
      actor_id: options.actorId,
      action: "whitelist_added",
      metadata: { txHash: result.txHash, walletAddress },
    });
  }

  if (options?.investorEmail) {
    try {
      const chainId = getChainId();
      const baseUrl =
        chainId === 137
          ? "https://polygonscan.com"
          : chainId === 80002
            ? "https://amoy.polygonscan.com"
            : "https://polygonscan.com";
      const polygonscanUrl = `${baseUrl}/tx/${result.txHash}`;
      await sendEmail({
        to: options.investorEmail,
        subject: `You are now whitelisted for ${options.fundName ?? "the fund"}`,
        react: InvestorWhitelisted({
          investorName: options.investorName ?? "Investor",
          fundName: options.fundName ?? "the fund",
          polygonscanUrl,
        }),
      });
      if (options.gpEmail) {
        await sendEmail({
          to: options.gpEmail,
          subject: `${options.investorName ?? "Investor"} has been whitelisted for ${options.fundName ?? "the fund"}`,
          react: InvestorWhitelistedGp({
            investorName: options.investorName ?? "Investor",
            fundName: options.fundName ?? "the fund",
            dashboardUrl: options.dashboardUrl,
            polygonscanUrl,
          }),
        });
      }
    } catch (e) {
      console.error("Whitelist email failed:", e);
      Sentry.captureException(e, { extra: { investorId, action: "whitelist_email" } });
    }
  }

  return result;
}

/**
 * Removes a wallet from the token whitelist.
 * Waits for 1 confirmation. If investorId provided, updates investors.is_whitelisted=false.
 *
 * @param contractAddress - FundToken contract address
 * @param walletAddress - Wallet to remove
 * @param investorId - Optional investor UUID to update is_whitelisted in DB
 * @returns { txHash }
 */
export async function removeFromWhitelist(
  contractAddress: string,
  walletAddress: string,
  investorId?: string
): Promise<{ txHash: string }> {
  const run = async () => {
    const token = getFundTokenContract(contractAddress);
    const tx = await token.removeFromWhitelist(walletAddress);
    const receipt = await tx.wait(CONFIRMATIONS_WHITELIST);
    if (!receipt) throw new Error("No receipt");
    return { txHash: receipt.hash };
  };

  const result = await withRetry(run, {
    contractAddress,
    walletAddress,
    action: "removeFromWhitelist",
  }).catch((e) => {
    throw new Error(parseRevertReason(e));
  });

  if (investorId) {
    await updateInvestor(investorId, { is_whitelisted: false });
  }

  return result;
}

/**
 * Checks if a wallet is whitelisted on the token.
 * Read-only, no gas.
 *
 * @param contractAddress - FundToken contract address
 * @param walletAddress - Wallet to check
 * @returns boolean
 */
export async function getWhitelistStatus(
  contractAddress: string,
  walletAddress: string
): Promise<boolean> {
  const token = getFundTokenContract(contractAddress);
  return token.isWhitelisted(walletAddress) as Promise<boolean>;
}
