/**
 * Utility functions for generating test strings for DirectiveType/LayerType pattern matching
 * Pattern constraint: ^[a-z0-9]{3,8}$
 */

/**
 * Generate a valid string that matches the pattern ^[a-z0-9]{3,8}$
 */
export function generateValidString(length?: number): string {
  const validLength = length ?? Math.floor(Math.random() * 6) + 3; // 3-8
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  
  for (let i = 0; i < validLength; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generate multiple valid strings
 */
export function generateValidStrings(count: number): string[] {
  const strings: string[] = [];
  const lengths = [3, 4, 5, 6, 7, 8]; // Cover all valid lengths
  
  for (let i = 0; i < count; i++) {
    const length = lengths[i % lengths.length];
    strings.push(generateValidString(length));
  }
  
  return strings;
}

/**
 * Generate an invalid string that does NOT match the pattern ^[a-z0-9]{3,8}$
 */
export function generateInvalidString(invalidType?: InvalidType): string {
  const type = invalidType ?? randomInvalidType();
  
  switch (type) {
    case InvalidType.TooShort:
      return generateValidString(Math.floor(Math.random() * 2) + 1); // 1-2 chars
    
    case InvalidType.TooLong:
      return generateValidString(Math.floor(Math.random() * 5) + 9); // 9-13 chars
    
    case InvalidType.UpperCase:
      return generateStringWithUpperCase();
    
    case InvalidType.SpecialChar:
      return generateStringWithSpecialChar();
    
    case InvalidType.Space:
      return generateStringWithSpace();
    
    case InvalidType.Empty:
      return "";
    
    case InvalidType.Hyphen:
      return generateStringWithHyphen();
    
    case InvalidType.Underscore:
      return generateStringWithUnderscore();
    
    default:
      return generateValidString(2); // Fallback to too short
  }
}

/**
 * Generate multiple invalid strings covering various invalid cases
 */
export function generateInvalidStrings(count: number): string[] {
  const strings: string[] = [];
  const types = Object.values(InvalidType);
  
  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    strings.push(generateInvalidString(type));
  }
  
  return strings;
}

/**
 * Types of invalid strings
 */
export enum InvalidType {
  TooShort = "too_short",
  TooLong = "too_long",
  UpperCase = "upper_case",
  SpecialChar = "special_char",
  Space = "space",
  Empty = "empty",
  Hyphen = "hyphen",
  Underscore = "underscore",
}

/**
 * Get a random invalid type
 */
function randomInvalidType(): InvalidType {
  const types = Object.values(InvalidType);
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * Generate a string with uppercase letters
 */
function generateStringWithUpperCase(): string {
  const base = generateValidString(5);
  const index = Math.floor(Math.random() * base.length);
  return base.substring(0, index) + base.charAt(index).toUpperCase() + base.substring(index + 1);
}

/**
 * Generate a string with special characters
 */
function generateStringWithSpecialChar(): string {
  const base = generateValidString(4);
  const specialChars = "!@#$%^&*()+={}[]|:;<>,.?/~`";
  const specialChar = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  const index = Math.floor(Math.random() * (base.length + 1));
  return base.substring(0, index) + specialChar + base.substring(index);
}

/**
 * Generate a string with space
 */
function generateStringWithSpace(): string {
  const base = generateValidString(4);
  const index = Math.floor(Math.random() * (base.length + 1));
  return base.substring(0, index) + " " + base.substring(index);
}

/**
 * Generate a string with hyphen
 */
function generateStringWithHyphen(): string {
  const base = generateValidString(4);
  const index = Math.floor(Math.random() * (base.length + 1));
  return base.substring(0, index) + "-" + base.substring(index);
}

/**
 * Generate a string with underscore
 */
function generateStringWithUnderscore(): string {
  const base = generateValidString(4);
  const index = Math.floor(Math.random() * (base.length + 1));
  return base.substring(0, index) + "_" + base.substring(index);
}

/**
 * Test data generator for pattern matching tests
 */
export class PatternTestDataGenerator {
  /**
   * Generate a comprehensive test dataset
   */
  static generateTestDataset(): {
    valid: string[];
    invalid: { value: string; type: InvalidType }[];
  } {
    const validStrings = generateValidStrings(12); // 2 for each valid length
    const invalidStrings = Object.values(InvalidType).map(type => ({
      value: generateInvalidString(type),
      type,
    }));
    
    return {
      valid: validStrings,
      invalid: invalidStrings,
    };
  }
  
  /**
   * Generate edge case test data
   */
  static generateEdgeCases(): {
    valid: string[];
    invalid: string[];
  } {
    return {
      valid: [
        "abc",      // Minimum length
        "12345678", // Maximum length
        "abc123",   // Mixed alphanumeric
        "000",      // All numbers
        "zzz",      // All letters
      ],
      invalid: [
        "ab",       // Too short
        "123456789", // Too long
        "",         // Empty
        "ABC",      // Uppercase
        "a-b",      // Hyphen
        "a_b",      // Underscore
        "a b",      // Space
        "a!b",      // Special char
      ],
    };
  }
}

/**
 * Validate if a string matches the pattern ^[a-z0-9]{3,8}$
 */
export function isValidPattern(str: string): boolean {
  return /^[a-z0-9]{3,8}$/.test(str);
}

/**
 * Generate a test description for a pattern test
 */
export function describePatternTest(value: string, expected: boolean): string {
  const lengthInfo = value.length < 3 ? "too short" : 
                     value.length > 8 ? "too long" : 
                     "valid length";
  const contentInfo = /[A-Z]/.test(value) ? "contains uppercase" :
                      /[^a-z0-9]/.test(value) ? "contains invalid char" :
                      "valid content";
  
  return `"${value}" (${lengthInfo}, ${contentInfo}) should be ${expected ? "valid" : "invalid"}`;
}