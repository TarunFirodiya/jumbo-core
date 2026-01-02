/**
 * Service Layer Error Classes
 * Custom errors for service operations
 */

/**
 * Base error for service operations
 */
export class ServiceError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Entity not found error
 */
export class NotFoundError extends ServiceError {
  constructor(entityType: string, entityId: string) {
    super(`${entityType} with ID ${entityId} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

/**
 * Validation error (business logic)
 */
export class ValidationError extends ServiceError {
  public readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
    this.details = details;
  }
}

/**
 * Conflict error (e.g., duplicate entry)
 */
export class ConflictError extends ServiceError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

/**
 * Operation not allowed error
 */
export class OperationNotAllowedError extends ServiceError {
  constructor(message: string) {
    super(message, "OPERATION_NOT_ALLOWED", 400);
    this.name = "OperationNotAllowedError";
  }
}

/**
 * Database error
 */
export class DatabaseError extends ServiceError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message, "DATABASE_ERROR", 500);
    this.name = "DatabaseError";
    this.originalError = originalError;
  }
}

/**
 * Rule not found error (for coin system)
 */
export class RuleNotFoundError extends ServiceError {
  constructor(actionType: string) {
    super(`No coin rule found for action: ${actionType}`, "RULE_NOT_FOUND", 404);
    this.name = "RuleNotFoundError";
  }
}

/**
 * OTP verification error
 */
export class OTPError extends ServiceError {
  constructor(message: string) {
    super(message, "OTP_ERROR", 400);
    this.name = "OTPError";
  }
}

