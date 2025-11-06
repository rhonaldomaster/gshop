import {
  isValidNIT,
  formatNIT,
  isValidCedula,
  isValidColombianPostalCode,
  isValidInvoiceAmount,
  isValidColombiaDepartment,
  validateInvoiceData,
  isValidCommissionRate,
  roundToTwoDecimals,
} from './fiscal-validators';

describe('Fiscal Validators', () => {
  describe('isValidNIT', () => {
    it('should validate correct NITs', () => {
      expect(isValidNIT('900123456-7')).toBe(true);
      expect(isValidNIT('900.123.456-7')).toBe(true);
      expect(isValidNIT('9001234567')).toBe(true);
    });

    it('should reject invalid NITs', () => {
      expect(isValidNIT('900123456-8')).toBe(false); // Wrong check digit
      expect(isValidNIT('123')).toBe(false); // Too short
      expect(isValidNIT('abcdefghij')).toBe(false); // Non-numeric
      expect(isValidNIT('')).toBe(false); // Empty
      expect(isValidNIT(null as any)).toBe(false); // Null
    });

    it('should handle NITs with different formats', () => {
      expect(isValidNIT('900 123 456-7')).toBe(true);
      expect(isValidNIT('900.123.456-7')).toBe(true);
      expect(isValidNIT('9001234567')).toBe(true);
    });
  });

  describe('formatNIT', () => {
    it('should format 9-digit NITs correctly', () => {
      expect(formatNIT('123456789')).toBe('123.456.78-9');
    });

    it('should format 10-digit NITs correctly', () => {
      expect(formatNIT('1234567890')).toBe('1.234.567.89-0');
    });

    it('should handle already formatted NITs', () => {
      const formatted = formatNIT('900.123.456-7');
      expect(formatted).toContain('900');
      expect(formatted).toContain('-');
    });
  });

  describe('isValidCedula', () => {
    it('should validate correct cédulas', () => {
      expect(isValidCedula('1234567890')).toBe(true);
      expect(isValidCedula('123456')).toBe(true);
      expect(isValidCedula('12.345.678')).toBe(true);
    });

    it('should reject invalid cédulas', () => {
      expect(isValidCedula('12345')).toBe(false); // Too short
      expect(isValidCedula('12345678901')).toBe(false); // Too long
      expect(isValidCedula('abc123')).toBe(false); // Non-numeric
      expect(isValidCedula('')).toBe(false); // Empty
    });
  });

  describe('isValidColombianPostalCode', () => {
    it('should validate correct postal codes', () => {
      expect(isValidColombianPostalCode('110111')).toBe(true);
      expect(isValidColombianPostalCode('050001')).toBe(true);
    });

    it('should reject invalid postal codes', () => {
      expect(isValidColombianPostalCode('11011')).toBe(false); // Too short
      expect(isValidColombianPostalCode('1101111')).toBe(false); // Too long
      expect(isValidColombianPostalCode('11011a')).toBe(false); // Non-numeric
      expect(isValidColombianPostalCode('')).toBe(false); // Empty
    });
  });

  describe('isValidInvoiceAmount', () => {
    it('should validate correct amounts', () => {
      expect(isValidInvoiceAmount(100)).toBe(true);
      expect(isValidInvoiceAmount(100.5)).toBe(true);
      expect(isValidInvoiceAmount(100.99)).toBe(true);
      expect(isValidInvoiceAmount(0)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(isValidInvoiceAmount(-100)).toBe(false); // Negative
      expect(isValidInvoiceAmount(100.999)).toBe(false); // More than 2 decimals
      expect(isValidInvoiceAmount(Infinity)).toBe(false); // Infinity
      expect(isValidInvoiceAmount(NaN)).toBe(false); // NaN
      expect(isValidInvoiceAmount('100' as any)).toBe(false); // String
    });
  });

  describe('isValidColombiaDepartment', () => {
    it('should validate correct departments', () => {
      expect(isValidColombiaDepartment('Cundinamarca')).toBe(true);
      expect(isValidColombiaDepartment('Antioquia')).toBe(true);
      expect(isValidColombiaDepartment('Valle del Cauca')).toBe(true);
      expect(isValidColombiaDepartment('BOGOTÁ')).toBe(false); // Bogotá is not a department
    });

    it('should be case insensitive', () => {
      expect(isValidColombiaDepartment('cundinamarca')).toBe(true);
      expect(isValidColombiaDepartment('ANTIOQUIA')).toBe(true);
    });

    it('should reject invalid departments', () => {
      expect(isValidColombiaDepartment('InvalidState')).toBe(false);
      expect(isValidColombiaDepartment('')).toBe(false);
    });
  });

  describe('validateInvoiceData', () => {
    const validInvoiceData = {
      issuerName: 'GSHOP SAS',
      issuerDocument: '900123456-7',
      issuerAddress: 'Calle 100 #10-20, Bogotá',
      recipientName: 'John Doe',
      recipientDocument: '1234567890',
      recipientAddress: 'Carrera 7 #45-67, Medellín',
      subtotal: 100000,
      vatAmount: 19000,
      totalAmount: 119000,
      invoiceType: 'platform_to_buyer_fee',
    };

    it('should validate correct invoice data', () => {
      const result = validateInvoiceData(validInvoiceData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invoice with invalid NIT', () => {
      const invalidData = {
        ...validInvoiceData,
        issuerDocument: '900123456-8', // Wrong check digit
      };

      const result = validateInvoiceData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid issuer NIT format');
    });

    it('should reject invoice with missing fields', () => {
      const invalidData = {
        ...validInvoiceData,
        issuerName: '',
        recipientDocument: '',
      };

      const result = validateInvoiceData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invoice with incorrect total', () => {
      const invalidData = {
        ...validInvoiceData,
        totalAmount: 120000, // Should be 119000
      };

      const result = validateInvoiceData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Total amount does not match subtotal + VAT');
    });

    it('should reject invoice with negative amounts', () => {
      const invalidData = {
        ...validInvoiceData,
        subtotal: -100,
      };

      const result = validateInvoiceData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Subtotal cannot be negative');
    });

    it('should reject invoice with invalid type', () => {
      const invalidData = {
        ...validInvoiceData,
        invoiceType: 'invalid_type',
      };

      const result = validateInvoiceData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate commission invoice without VAT', () => {
      const commissionData = {
        ...validInvoiceData,
        vatAmount: 0,
        totalAmount: 100000,
        invoiceType: 'platform_to_seller_commission',
      };

      const result = validateInvoiceData(commissionData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('isValidCommissionRate', () => {
    it('should validate correct rates', () => {
      expect(isValidCommissionRate(0)).toBe(true);
      expect(isValidCommissionRate(7)).toBe(true);
      expect(isValidCommissionRate(50)).toBe(true);
      expect(isValidCommissionRate(25.5)).toBe(true);
    });

    it('should reject invalid rates', () => {
      expect(isValidCommissionRate(-1)).toBe(false); // Negative
      expect(isValidCommissionRate(51)).toBe(false); // Over 50%
      expect(isValidCommissionRate(100)).toBe(false); // Over 50%
      expect(isValidCommissionRate(Infinity)).toBe(false); // Infinity
      expect(isValidCommissionRate(NaN)).toBe(false); // NaN
    });
  });

  describe('roundToTwoDecimals', () => {
    it('should round correctly', () => {
      expect(roundToTwoDecimals(100.999)).toBe(101);
      expect(roundToTwoDecimals(100.995)).toBe(101);
      expect(roundToTwoDecimals(100.994)).toBe(100.99);
      expect(roundToTwoDecimals(100.001)).toBe(100);
      expect(roundToTwoDecimals(100)).toBe(100);
    });

    it('should handle edge cases', () => {
      expect(roundToTwoDecimals(0.001)).toBe(0);
      expect(roundToTwoDecimals(0.005)).toBe(0.01);
      expect(roundToTwoDecimals(0.004)).toBe(0);
    });
  });
});
