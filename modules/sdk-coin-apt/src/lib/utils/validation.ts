/**
 * Validation utilities for Aptos transactions
 */

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Core validation logic for module names
 *
 * @param {string} moduleName - Module name to validate
 * @returns {ValidationResult} Validation result with isValid flag and optional error message
 */
function validateModuleNameCore(moduleName: string): ValidationResult {
  if (!moduleName || typeof moduleName !== 'string') {
    return {
      isValid: false,
      errorMessage: 'Module name is required and must be a non-empty string',
    };
  }

  // Aptos module name format: address::module_name
  // Supports both SHORT (0x1) and LONG (0x0000...0001) address formats
  const moduleNamePattern = /^0x[a-fA-F0-9]{1,64}::[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!moduleNamePattern.test(moduleName)) {
    return {
      isValid: false,
      errorMessage: `Invalid module name format: "${moduleName}". Expected format: "0xaddress::module_name" (hex addresses only)`,
    };
  }

  return { isValid: true };
}

/**
 * Core validation logic for function names
 *
 * @param {string} functionName - Function name to validate
 * @returns {ValidationResult} Validation result with isValid flag and optional error message
 */
function validateFunctionNameCore(functionName: string): ValidationResult {
  if (!functionName || typeof functionName !== 'string') {
    return {
      isValid: false,
      errorMessage: 'Function name is required and must be a non-empty string',
    };
  }

  // Aptos function name pattern: valid identifier (letters, numbers, underscores, starting with letter/underscore)
  const functionNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!functionNamePattern.test(functionName)) {
    return {
      isValid: false,
      errorMessage: `Invalid function name format: "${functionName}". Function names must be valid identifiers (letters, numbers, underscores, starting with letter or underscore)`,
    };
  }

  return { isValid: true };
}

/**
 * Validate module name format (throwing version)
 *
 * @param {string} moduleName - Module name to validate
 * @throws {Error} If module name format is invalid
 */
export function validateModuleName(moduleName: string): void {
  const result = validateModuleNameCore(moduleName);
  if (!result.isValid) {
    throw new Error(result.errorMessage);
  }
}

/**
 * Validate function name format (throwing version)
 *
 * @param {string} functionName - Function name to validate
 * @throws {Error} If function name format is invalid
 */
export function validateFunctionName(functionName: string): void {
  const result = validateFunctionNameCore(functionName);
  if (!result.isValid) {
    throw new Error(result.errorMessage);
  }
}

/**
 * Check if a module name matches the expected pattern (non-throwing version)
 *
 * @param {string} moduleName - Module name to check
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidModuleName(moduleName: string): boolean {
  return validateModuleNameCore(moduleName).isValid;
}

/**
 * Check if a function name matches the expected pattern (non-throwing version)
 *
 * @param {string} functionName - Function name to check
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidFunctionName(functionName: string): boolean {
  return validateFunctionNameCore(functionName).isValid;
}
