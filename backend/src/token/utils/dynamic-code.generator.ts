import { Repository } from 'typeorm';
import { GshopTransaction } from '../token.entity';

// Valid characters for dynamic code (excluding confusing ones: 0/O, 1/I/L)
const VALID_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_PREFIX = 'GS-';
const CODE_LENGTH = 6;

/**
 * Generates a random dynamic code in format GS-XXXXXX
 * Uses only non-confusing alphanumeric characters
 *
 * Example: GS-7K3M9P
 *
 * Total possible combinations: 32^6 = 1,073,741,824 (over 1 billion)
 */
export function generateDynamicCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * VALID_CHARS.length);
    code += VALID_CHARS[randomIndex];
  }
  return `${CODE_PREFIX}${code}`;
}

/**
 * Generates a unique dynamic code by checking against existing codes in database
 * Includes fallback mechanism using timestamp if too many collisions occur
 *
 * @param transactionRepo - TypeORM repository for GshopTransaction
 * @returns Promise<string> - Unique dynamic code
 */
export async function generateUniqueDynamicCode(
  transactionRepo: Repository<GshopTransaction>,
): Promise<string> {
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateDynamicCode();
    const exists = await transactionRepo.findOne({
      where: { dynamicCode: code },
    });

    if (!exists) {
      return code;
    }

    attempts++;
  } while (attempts < maxAttempts);

  // Fallback: use timestamp-based code if too many collisions
  // This is extremely unlikely given 1 billion+ combinations
  const timestampCode = Date.now().toString(36).toUpperCase().slice(-6);
  return `${CODE_PREFIX}${timestampCode}`;
}

/**
 * Validates if a code matches the expected format
 * Format: GS-XXXXXX where X is from VALID_CHARS
 *
 * @param code - Code to validate
 * @returns boolean - True if valid format
 */
export function isValidDynamicCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  const pattern = new RegExp(`^${CODE_PREFIX}[${VALID_CHARS}]{${CODE_LENGTH}}$`);
  return pattern.test(code.toUpperCase());
}

/**
 * Normalizes a dynamic code to uppercase
 *
 * @param code - Code to normalize
 * @returns string - Normalized code
 */
export function normalizeDynamicCode(code: string): string {
  return code?.toUpperCase()?.trim() || '';
}
