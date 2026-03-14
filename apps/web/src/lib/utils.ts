import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with conflict resolution.
 * @param inputs - Class values (strings, arrays, objects)
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency.
 * @param amount - Amount in smallest unit (cents) or major unit (dollars). Use majorUnits=true for dollar amounts.
 * @param currency - ISO 4217 currency code
 * @param majorUnits - If true, amount is in dollars; if false, amount is in cents
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency = "USD",
  majorUnits = false
): string {
  const displayAmount = majorUnits ? amount : amount / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(displayAmount);
}

/**
 * Truncate an Ethereum address for display.
 * @param address - Full Ethereum address
 * @param chars - Characters to show at start and end
 * @returns Truncated address (e.g. "0x1234...5678")
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
