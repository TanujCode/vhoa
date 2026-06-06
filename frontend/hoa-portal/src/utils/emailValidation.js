/**
 * Shared Email Validation Utility
 * Validates email format and detects common domain + TLD typos.
 */

export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// Allowed standard email domains
export const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.co.in', 'hotmail.com', 'outlook.com', 
  'icloud.com', 'aol.com', 'live.com', 'msn.com', 'zoho.com', 
  'protonmail.com', 'proton.me', 'mail.com', 'yandex.com', 'gmx.com',
  'rediffmail.com', 'outlook.in', 'live.in', 'hotmail.co.uk', 'yahoo.co.uk',
  'att.net', 'comcast.net', 'verizon.net', 'sbcglobal.net', 'cox.net',
  'charter.net', 'me.com', 'mac.com'
];

// Blocked / Disposable / Fake domains
export const BLOCKED_DOMAINS = [
  'test.com', 'test.in', 'testing.com', 'example.com', 'fake.com', 'temp.com',
  'junk.com', 'dummy.com', 'invalid.com', 'mailinator.com', 'yopmail.com',
  '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'guerrillamail.com'
];

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

const COM_TLD_TYPOS = [
  'cpom', 'cmo', 'ocm', 'con', 'copm', 'comn',
  'vom', 'xom', 'cpm', 'coom', 'coam', 'coa', 'coma',
  'col', 'cob', 'cof', 'cor', 'co', 'cm'
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

  // Blocked / Disposable / Fake domains check
  if (BLOCKED_DOMAINS.includes(domain)) {
    return 'This email domain is not allowed. Please use a valid email address.';
  }

  const firstPart = domain.split('.')[0] || '';
  
  // Generic startsWith/endsWith key-mash checks for popular providers
  const popularProviders = ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud'];
  for (const provider of popularProviders) {
    if (firstPart.startsWith(provider) && firstPart !== provider) {
      return `Suspicious domain! Did you mean "${localPart}@${provider}.com"?`;
    }
  }

  // Gmail key-mash check (e.g. gmHAHAHAil.com)
  if (firstPart.startsWith('gm') && firstPart.endsWith('il') && firstPart !== 'gmail' && firstPart.length <= 12) {
    return `Suspicious domain! Did you mean "${localPart}@gmail.com"?`;
  }

  // Yahoo key-mash check (e.g. yahahahaoo.com)
  if (firstPart.startsWith('ya') && firstPart.endsWith('oo') && firstPart !== 'yahoo' && firstPart.length <= 12) {
    return `Suspicious domain! Did you mean "${localPart}@yahoo.com"?`;
  }

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

  // 3. Deep substring typo check
  const gmailTypos = ['gamil', 'gmial', 'gmal', 'gimail', 'gnail', 'gmali', 'gmaill', 'gml', 'gmailgmail', 'gamail', 'gmmak', 'gmmmak', 'gamilgamil', 'gmailgamil'];
  for (const typo of gmailTypos) {
    if (domain.includes(typo) && domain !== 'gmail.com') {
      return `Suspicious domain! Did you mean "${localPart}@gmail.com"?`;
    }
  }

  const yahooTypos = ['yahooyahoo', 'yahooo', 'yhaoo', 'yaaho', 'yhoo'];
  for (const typo of yahooTypos) {
    if (domain.includes(typo) && domain !== 'yahoo.com') {
      return `Suspicious domain! Did you mean "${localPart}@yahoo.com"?`;
    }
  }

  const hotmailTypos = ['hotmial', 'hotmali', 'hotmal', 'htmail', 'homail', 'hotamil'];
  for (const typo of hotmailTypos) {
    if (domain.includes(typo) && domain !== 'hotmail.com') {
      return `Suspicious domain! Did you mean "${localPart}@hotmail.com"?`;
    }
  }

  const outlookTypos = ['outlok', 'outloo', 'outloook', 'outlookk', 'outlookoutlook'];
  for (const typo of outlookTypos) {
    if (domain.includes(typo) && domain !== 'outlook.com') {
      return `Suspicious domain! Did you mean "${localPart}@outlook.com"?`;
    }
  }

  const icloudTypos = ['iclod', 'iclould', 'iclooud'];
  for (const typo of icloudTypos) {
    if (domain.includes(typo) && domain !== 'icloud.com') {
      return `Suspicious domain! Did you mean "${localPart}@icloud.com"?`;
    }
  }

  // Whitelist check
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return 'Only standard email domains (e.g. @gmail.com, @yahoo.com, @outlook.com) are allowed.';
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

  // Blocked / Disposable / Fake domains check
  if (BLOCKED_DOMAINS.includes(domain)) {
    return { valid: false, message: 'This email domain is not allowed. Please use a valid email address.' };
  }

  const firstPart = domain.split('.')[0] || '';
  
  // Generic startsWith/endsWith key-mash checks for popular providers
  const popularProviders = ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud'];
  for (const provider of popularProviders) {
    if (firstPart.startsWith(provider) && firstPart !== provider) {
      return { valid: false, message: `Suspicious domain! Did you mean "${localPart}@${provider}.com"?` };
    }
  }

  // Gmail key-mash check (e.g. gmHAHAHAil.com)
  if (firstPart.startsWith('gm') && firstPart.endsWith('il') && firstPart !== 'gmail' && firstPart.length <= 12) {
    return { valid: false, message: `Suspicious domain! Did you mean "${localPart}@gmail.com"?` };
  }

  // Yahoo key-mash check (e.g. yahahahaoo.com)
  if (firstPart.startsWith('ya') && firstPart.endsWith('oo') && firstPart !== 'yahoo' && firstPart.length <= 12) {
    return { valid: false, message: `Suspicious domain! Did you mean "${localPart}@yahoo.com"?` };
  }

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

  // 3. Deep substring typo check
  const gmailTypos = ['gamil', 'gmial', 'gmal', 'gimail', 'gnail', 'gmali', 'gmaill', 'gml', 'gmailgmail', 'gamail', 'gmmak', 'gmmmak', 'gamilgamil', 'gmailgamil'];
  for (const typo of gmailTypos) {
    if (domain.includes(typo) && domain !== 'gmail.com') {
      return { valid: false, message: `Suspicious domain! Did you mean "${localPart}@gmail.com"?` };
    }
  }

  const yahooTypos = ['yahooyahoo', 'yahooo', 'yhaoo', 'yaaho', 'yhoo'];
  for (const typo of yahooTypos) {
    if (domain.includes(typo) && domain !== 'yahoo.com') {
      return { valid: false, message: `Suspicious domain! Did you mean "${localPart}@yahoo.com"?` };
    }
  }

  const hotmailTypos = ['hotmial', 'hotmali', 'hotmal', 'htmail', 'homail', 'hotamil'];
  for (const typo of hotmailTypos) {
    if (domain.includes(typo) && domain !== 'hotmail.com') {
      return { valid: false, message: `Suspicious domain! Did you mean "${localPart}@hotmail.com"?` };
    }
  }

  const outlookTypos = ['outlok', 'outloo', 'outloook', 'outlookk', 'outlookoutlook'];
  for (const typo of outlookTypos) {
    if (domain.includes(typo) && domain !== 'outlook.com') {
      return { valid: false, message: `Suspicious domain! Did you mean "${localPart}@outlook.com"?` };
    }
  }

  const icloudTypos = ['iclod', 'iclould', 'iclooud'];
  for (const typo of icloudTypos) {
    if (domain.includes(typo) && domain !== 'icloud.com') {
      return { valid: false, message: `Suspicious domain! Did you mean "${localPart}@icloud.com"?` };
    }
  }

  // Whitelist check
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return { valid: false, message: 'Only standard email domains (e.g. @gmail.com, @yahoo.com, @outlook.com) are allowed.' };
  }

  return { valid: true, message: '' };
};
