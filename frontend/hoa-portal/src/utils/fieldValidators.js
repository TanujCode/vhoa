/**
 * Shared Field Validators Utility
 * Provides reusable React Hook Form validators + key-press blockers for all forms.
 */

// ─── Name Fields ─────────────────────────────────────────────────────────────
/** First / Last / Middle name – only letters, spaces, hyphens, apostrophes */
export const validateName = (label = 'Name') => (value) => {
  if (!value || !value.trim()) return true; // required handled separately
  const v = value.trim();
  if (v.length < 2) return `${label} must be at least 2 characters.`;
  if (v.length > 60) return `${label} must be less than 60 characters.`;
  if (!/^[A-Za-z\s'\-]+$/.test(v))
    return `${label} should contain only letters (e.g. "John" or "O'Brien").`;
  return true;
};

/** Block non-letter keys on name inputs (allows space, hyphen, apostrophe) */
export const onlyLettersKeyPress = (e) => {
  if (!/[A-Za-z\s'\-]/.test(e.key)) e.preventDefault();
};

// ─── City / Country ──────────────────────────────────────────────────────────
/** City – only letters, spaces, hyphens */
export const validateCity = (value) => {
  if (!value || !value.trim()) return true;
  if (!/^[A-Za-z\s\-']+$/.test(value.trim()))
    return 'City should contain only letters (e.g. "New York").';
  return true;
};

/** Country – only letters, spaces */
export const validateCountry = (value) => {
  if (!value || !value.trim()) return true;
  if (!/^[A-Za-z\s]+$/.test(value.trim()))
    return 'Country should contain only letters (e.g. "USA").';
  return true;
};

// ─── Zip / Postal Code ───────────────────────────────────────────────────────
/**
 * Zip / Postal code – alphanumeric with optional space or hyphen
 * Accepts: 12345  |  12345-6789  |  SW1A 1AA  |  110001
 */
export const validateZipCode = (value) => {
  if (!value || !value.trim()) return true;
  const v = value.trim();
  if (v.length < 3 || v.length > 12)
    return 'Zip/Postal code must be 3–12 characters.';
  if (!/^[A-Z0-9][A-Z0-9\s\-]{1,10}[A-Z0-9]$/i.test(v))
    return 'Invalid zip/postal code format (e.g. 12345 or SW1A 1AA).';
  return true;
};

/** Block characters that can never appear in a zip code */
export const onlyZipKeyPress = (e) => {
  if (!/[A-Za-z0-9\s\-]/.test(e.key)) e.preventDefault();
};

// ─── Business / HOA Name ─────────────────────────────────────────────────────
/** Business or HOA name – letters, numbers, spaces, and common punctuation */
export const validateBusinessName = (value) => {
  if (!value || !value.trim()) return true;
  const v = value.trim();
  if (v.length < 2) return 'Name must be at least 2 characters.';
  if (v.length > 100) return 'Name must be less than 100 characters.';
  if (!/^[A-Za-z0-9\s.,'\-&()]+$/.test(v))
    return 'Name contains invalid characters. Use letters, numbers, spaces, or . , & ( )';
  return true;
};

// ─── Amount / Number Fields ───────────────────────────────────────────────────
/** Positive decimal amount (e.g. setup fee, renewal fee) */
export const validateAmount = (label = 'Amount') => (value) => {
  if (value === '' || value === null || value === undefined) return true;
  const num = parseFloat(value);
  if (isNaN(num)) return `${label} must be a valid number (e.g. 199.00).`;
  if (num < 0) return `${label} cannot be negative.`;
  if (num > 9999999) return `${label} seems too large.`;
  return true;
};

/** Positive integer (e.g. community size, unit count) */
export const validatePositiveInt = (label = 'Value') => (value) => {
  if (value === '' || value === null || value === undefined) return true;
  const num = parseInt(value, 10);
  if (isNaN(num) || String(num) !== String(value).trim())
    return `${label} must be a whole number (e.g. 100).`;
  if (num < 1) return `${label} must be at least 1.`;
  if (num > 100000) return `${label} seems too large.`;
  return true;
};

/** Block non-digit key presses on integer-only fields */
export const onlyDigitsKeyPress = (e) => {
  if (!/[0-9]/.test(e.key)) e.preventDefault();
};

/** Block non-digit/decimal key presses on amount fields */
export const onlyDecimalKeyPress = (e) => {
  if (!/[0-9.]/.test(e.key)) e.preventDefault();
};

// ─── Unit Number ─────────────────────────────────────────────────────────────
/** Unit number – alphanumeric + a few special chars */
export const validateUnitNo = (value) => {
  if (!value || !value.trim()) return true;
  if (!/^[A-Za-z0-9\s\-/#]+$/.test(value.trim()))
    return 'Unit number should contain only letters, numbers, spaces, -, / or #.';
  return true;
};

// ─── Password ─────────────────────────────────────────────────────────────────
/** Strong password – min 8 chars, at least 1 uppercase, 1 number */
export const validatePassword = (value) => {
  if (!value) return true;
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(value)) return 'Password must contain at least one number.';
  return true;
};
