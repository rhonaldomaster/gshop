/**
 * Colombian Fiscal Data Validators
 *
 * Validates NIT, Cédula, and other Colombian tax identification numbers
 * following DIAN (Dirección de Impuestos y Aduanas Nacionales) regulations
 */

/**
 * Validate Colombian NIT (Número de Identificación Tributaria)
 *
 * Format: XXX.XXX.XXX-X or XXXXXXXXX-X
 * Last digit is check digit calculated with specific algorithm
 *
 * @param nit - NIT string to validate
 * @returns true if valid, false otherwise
 */
export function isValidNIT(nit: string): boolean {
  if (!nit) return false;

  // Remove dots, hyphens, and spaces
  const cleanNIT = nit.replace(/[\.\-\s]/g, '');

  // NIT must be 9-10 digits
  if (!/^\d{9,10}$/.test(cleanNIT)) {
    return false;
  }

  // Extract main number and check digit
  const mainNumber = cleanNIT.slice(0, -1);
  const checkDigit = parseInt(cleanNIT.slice(-1), 10);

  // Calculate expected check digit
  const expectedCheckDigit = calculateNITCheckDigit(mainNumber);

  return checkDigit === expectedCheckDigit;
}

/**
 * Calculate NIT check digit using Colombian algorithm
 *
 * @param mainNumber - NIT without check digit
 * @returns calculated check digit (0-9)
 */
function calculateNITCheckDigit(mainNumber: string): number {
  // Fibonacci-based weights for NIT validation
  const weights = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];

  let sum = 0;
  const digits = mainNumber.split('').reverse();

  for (let i = 0; i < digits.length; i++) {
    sum += parseInt(digits[i], 10) * weights[i];
  }

  const remainder = sum % 11;

  if (remainder === 0 || remainder === 1) {
    return remainder;
  } else {
    return 11 - remainder;
  }
}

/**
 * Format NIT with dots and hyphen
 *
 * @param nit - Raw NIT string
 * @returns Formatted NIT (e.g., "900.123.456-7")
 */
export function formatNIT(nit: string): string {
  const cleanNIT = nit.replace(/[\.\-\s]/g, '');

  if (cleanNIT.length === 9) {
    // XXX.XXX.XXX-X
    return `${cleanNIT.slice(0, 3)}.${cleanNIT.slice(3, 6)}.${cleanNIT.slice(6, 8)}-${cleanNIT.slice(8)}`;
  } else if (cleanNIT.length === 10) {
    // X.XXX.XXX.XXX-X
    return `${cleanNIT.slice(0, 1)}.${cleanNIT.slice(1, 4)}.${cleanNIT.slice(4, 7)}.${cleanNIT.slice(7, 9)}-${cleanNIT.slice(9)}`;
  }

  return nit; // Return as-is if invalid length
}

/**
 * Validate Colombian Cédula de Ciudadanía
 *
 * @param cedula - Cédula number
 * @returns true if valid format
 */
export function isValidCedula(cedula: string): boolean {
  if (!cedula) return false;

  const cleanCedula = cedula.replace(/[\.\-\s]/g, '');

  // Cédula is typically 6-10 digits
  return /^\d{6,10}$/.test(cleanCedula);
}

/**
 * Validate Colombian postal code
 *
 * @param postalCode - Postal code to validate
 * @returns true if valid format
 */
export function isValidColombianPostalCode(postalCode: string): boolean {
  if (!postalCode) return false;

  // Colombian postal codes are 6 digits
  return /^\d{6}$/.test(postalCode);
}

/**
 * Validate invoice amount (positive, max 2 decimals)
 *
 * @param amount - Amount to validate
 * @returns true if valid
 */
export function isValidInvoiceAmount(amount: number): boolean {
  if (typeof amount !== 'number') return false;
  if (amount < 0) return false;
  if (!isFinite(amount)) return false;

  // Check max 2 decimal places
  const decimals = (amount.toString().split('.')[1] || '').length;
  return decimals <= 2;
}

/**
 * Validate Colombian department (state)
 *
 * @param department - Department name or code
 * @returns true if valid
 */
export function isValidColombiaDepartment(department: string): boolean {
  const validDepartments = [
    'Amazonas',
    'Antioquia',
    'Arauca',
    'Atlántico',
    'Bolívar',
    'Boyacá',
    'Caldas',
    'Caquetá',
    'Casanare',
    'Cauca',
    'Cesar',
    'Chocó',
    'Córdoba',
    'Cundinamarca',
    'Guainía',
    'Guaviare',
    'Huila',
    'La Guajira',
    'Magdalena',
    'Meta',
    'Nariño',
    'Norte de Santander',
    'Putumayo',
    'Quindío',
    'Risaralda',
    'San Andrés y Providencia',
    'Santander',
    'Sucre',
    'Tolima',
    'Valle del Cauca',
    'Vaupés',
    'Vichada',
  ];

  return validDepartments.some(
    (dept) => dept.toLowerCase() === department.toLowerCase(),
  );
}

/**
 * Validate invoice data completeness
 *
 * @param invoiceData - Invoice data to validate
 * @returns validation result with errors
 */
export interface InvoiceValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateInvoiceData(invoiceData: any): InvoiceValidationResult {
  const errors: string[] = [];

  // Validate issuer
  if (!invoiceData.issuerName || invoiceData.issuerName.trim().length < 3) {
    errors.push('Issuer name is required (min 3 characters)');
  }

  if (!invoiceData.issuerDocument) {
    errors.push('Issuer document (NIT) is required');
  } else if (!isValidNIT(invoiceData.issuerDocument)) {
    errors.push('Invalid issuer NIT format');
  }

  if (!invoiceData.issuerAddress || invoiceData.issuerAddress.trim().length < 10) {
    errors.push('Issuer address is required (min 10 characters)');
  }

  // Validate recipient
  if (!invoiceData.recipientName || invoiceData.recipientName.trim().length < 3) {
    errors.push('Recipient name is required (min 3 characters)');
  }

  if (!invoiceData.recipientDocument) {
    errors.push('Recipient document is required');
  }

  if (!invoiceData.recipientAddress || invoiceData.recipientAddress.trim().length < 10) {
    errors.push('Recipient address is required (min 10 characters)');
  }

  // Validate amounts
  if (!isValidInvoiceAmount(invoiceData.subtotal)) {
    errors.push('Invalid subtotal amount');
  }

  if (invoiceData.subtotal < 0) {
    errors.push('Subtotal cannot be negative');
  }

  if (!isValidInvoiceAmount(invoiceData.vatAmount)) {
    errors.push('Invalid VAT amount');
  }

  if (invoiceData.vatAmount < 0) {
    errors.push('VAT amount cannot be negative');
  }

  if (!isValidInvoiceAmount(invoiceData.totalAmount)) {
    errors.push('Invalid total amount');
  }

  if (invoiceData.totalAmount < 0) {
    errors.push('Total amount cannot be negative');
  }

  // Validate total = subtotal + vat
  const expectedTotal = invoiceData.subtotal + invoiceData.vatAmount;
  if (Math.abs(invoiceData.totalAmount - expectedTotal) > 0.01) {
    errors.push('Total amount does not match subtotal + VAT');
  }

  // Validate invoice type
  const validTypes = ['platform_to_buyer_fee', 'platform_to_seller_commission'];
  if (!validTypes.includes(invoiceData.invoiceType)) {
    errors.push(`Invalid invoice type. Must be one of: ${validTypes.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize fiscal data (remove dangerous characters)
 *
 * @param data - Data to sanitize
 * @returns sanitized string
 */
export function sanitizeFiscalData(data: string): string {
  if (!data) return '';

  // Remove SQL injection attempts, XSS, etc.
  return data
    .replace(/[<>\"']/g, '') // Remove HTML/XML chars
    .replace(/[;\(\)]/g, '') // Remove SQL chars
    .trim();
}

/**
 * Validate commission rate (0-50%)
 *
 * @param rate - Rate to validate
 * @returns true if valid
 */
export function isValidCommissionRate(rate: number): boolean {
  if (typeof rate !== 'number') return false;
  if (!isFinite(rate)) return false;
  return rate >= 0 && rate <= 50;
}

/**
 * Round amount to 2 decimal places (for monetary values)
 *
 * @param amount - Amount to round
 * @returns rounded amount
 */
export function roundToTwoDecimals(amount: number): number {
  return Math.round(amount * 100) / 100;
}
