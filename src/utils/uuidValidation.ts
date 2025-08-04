/**
 * UUID v4 validation utilities for ensuring proper chapter traceability
 */

// UUID v4 regex pattern
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4 format
 */
export function isValidUUIDv4(uuid: string | null | undefined): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  return UUID_V4_REGEX.test(uuid);
}

/**
 * Validates and returns a UUID, throwing an error if invalid
 */
export function validateRequiredUUID(uuid: string | null | undefined, fieldName: string): string {
  if (!isValidUUIDv4(uuid)) {
    throw new Error(`Invalid UUID format for ${fieldName}: ${uuid}. Expected valid UUID v4 format.`);
  }
  return uuid!;
}

/**
 * Validates a UUID that can be null/undefined, returns null if invalid
 */
export function validateOptionalUUID(uuid: string | null | undefined): string | null {
  if (!uuid) {
    return null;
  }
  if (!isValidUUIDv4(uuid)) {
    console.warn(`Invalid UUID format detected: ${uuid}. Returning null.`);
    return null;
  }
  return uuid;
}