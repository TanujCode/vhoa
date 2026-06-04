/**
 * Shared Email Validation Utility
 * Validates email format and detects common domain + TLD typos.
 */

export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// Map of common typo domains → suggested correct domain
export const EMAIL_TYPO_MAP = {
  // Gmail domain typos
  'gmailgmail.com': 'gmail.com',
  'gamil.com':      'gmail.com',
  'gmial.com':      'gmail.com',
  'gml.com':        'gmail.com',
  'gmail.co':       'gmail.com',
  'gnail.com':      'gmail.com',
  'gmai.com':       'gmail.com',
  'gmaill.com':     'gmail.com',
  'gmali.com':      'gmail.com',
  'gmaill.co':      'gmail.com',
  'gimail.com':     'gmail.com',
  'gmal.com':       'gmail.com',
  'gamailgamail.com': 'gmail.com',
  // Gmail TLD typos
  'gmail.cpom':     'gmail.com',
  'gmail.cmo':      'gmail.com',
  'gmail.ocm':      'gmail.com',
  'gmail.con':      'gmail.com',
  'gmail.copm':     'gmail.com',
  'gmail.comn':     'gmail.com',
  'gmail.coam':     'gmail.com',
  'gmail.vom':      'gmail.com',
  'gmail.xom':      'gmail.com',
  'gmail.cm':       'gmail.com',
  'gmail.cpm':      'gmail.com',
  'gmail.coom':     'gmail.com',
  // Yahoo domain typos
  'yahooyahoo.com': 'yahoo.com',
  'yahooo.com':     'yahoo.com',
  'yaho.com':       'yahoo.com',
  'yaho.co':        'yahoo.com',
  'yhoo.com':       'yahoo.com',
  'yhaoo.com':      'yahoo.com',
  'yaaho.com':      'yahoo.com',
  // Yahoo TLD typos
  'yahoo.cpom':     'yahoo.com',
  'yahoo.cmo':      'yahoo.com',
  'yahoo.ocm':      'yahoo.com',
  'yahoo.con':      'yahoo.com',
  'yahoo.coam':     'yahoo.com',
  // Outlook domain typos
  'outlookoutlook.com': 'outlook.com',
  'outlok.com':     'outlook.com',
  'outloo.com':     'outlook.com',
  'outloook.com':   'outlook.com',
  'outlool.com':    'outlook.com',
  'outlookk.com':   'outlook.com',
  // Outlook TLD typos
  'outlook.cpom':   'outlook.com',
  'outlook.cmo':    'outlook.com',
  'outlook.ocm':    'outlook.com',
  'outlook.con':    'outlook.com',
  'outlook.coam':   'outlook.com',
  // Hotmail domain typos
  'hotmial.com':    'hotmail.com',
  'hmal.com':       'hotmail.com',
  'hotmai.com':     'hotmail.com',
  'hotmali.com':    'hotmail.com',
  'hotmal.com':     'hotmail.com',
  'hotmail.co':     'hotmail.com',
  'homail.com':     'hotmail.com',
  'hotamil.com':    'hotmail.com',
  'htmail.com':     'hotmail.com',
  // Hotmail TLD typos
  'hotmail.cpom':   'hotmail.com',
  'hotmail.cmo':    'hotmail.com',
  'hotmail.ocm':    'hotmail.com',
  'hotmail.con':    'hotmail.com',
  'hotmail.coam':   'hotmail.com',
  // iCloud typos
  'iclod.com':      'icloud.com',
  'iclould.com':    'icloud.com',
  'iclooud.com':    'icloud.com',
  'icloud.cpom':    'icloud.com',
  'icloud.cmo':     'icloud.com',
  'icloud.coam':    'icloud.com',
};

// Common TLD scrambles of ".com" — catches ANY domain with a bad TLD
const COM_TLD_TYPOS = [
  'cpom', 'cmo', 'ocm', 'con', 'copm', 'comn',
  'vom', 'xom', 'cpm', 'coom', 'coam', 'coa', 'coma',
  'col', 'cob', 'cof', 'cor', 'cm'
];

/**
 * Internal: detect any domain whose TLD looks like a scrambled ".com"
 * Returns suggested corrected domain string, or null.
 */
const detectTldTypo = (domain) => {
  for (const typo of COM_TLD_TYPOS) {
    if (domain.endsWith('.' + typo)) {
      const base = domain.slice(0, -(typo.length + 1));
      // Avoid flagging real short domains (e.g., something.co.uk)
      if (base.length > 2) {
        return base + '.com';
      }
    }
  }
  return null;
};

/**
 * React Hook Form compatible email validator.
 * Use as: {...register('email', { validate: validateEmail })}
 * Returns true if valid, or an error string if invalid.
 */
export const validateEmail = (value) => {
  const trimmed = (value || '').trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid email address (e.g. name@gmail.com).';
  }
  const domain = trimmed.split('@')[1]?.toLowerCase() || '';
  const localPart = trimmed.split('@')[0];

  // 1. Exact typo map check
  const mapSuggestion = EMAIL_TYPO_MAP[domain];
  if (mapSuggestion) {
    return `Suspicious domain! Did you mean "${localPart}@${mapSuggestion}"?`;
  }

  // 2. Generic TLD typo check (e.g. gmail.cpom → gmail.com, xyz.coam → xyz.com)
  const tldFixedDomain = detectTldTypo(domain);
  if (tldFixedDomain) {
    return `Suspicious domain! Did you mean "${localPart}@${tldFixedDomain}"?`;
  }

  return true;
};

/**
 * Plain JS email validator (for non-React-Hook-Form contexts like Members.jsx alert()).
 * Returns { valid: true } or { valid: false, message: string }
 */
export const checkEmail = (value) => {
  const trimmed = (value || '').trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, message: 'Please enter a valid email address (e.g. name@gmail.com).' };
  }
  const domain = trimmed.split('@')[1]?.toLowerCase() || '';
  const localPart = trimmed.split('@')[0];

  // 1. Exact typo map check
  const mapSuggestion = EMAIL_TYPO_MAP[domain];
  if (mapSuggestion) {
    return { valid: false, message: `Suspicious domain! Did you mean "${localPart}@${mapSuggestion}"?` };
  }

  // 2. Generic TLD typo check
  const tldFixedDomain = detectTldTypo(domain);
  if (tldFixedDomain) {
    return { valid: false, message: `Suspicious domain! Did you mean "${localPart}@${tldFixedDomain}"?` };
  }

  return { valid: true, message: '' };
};
