// Comprehensive Country List with Dial Codes, Flags, and Number Formats
export const COUNTRIES = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', format: '(###) ###-####', minDigits: 10, maxDigits: 10, placeholder: '(555) 000-0000' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', format: '(###) ###-####', minDigits: 10, maxDigits: 10, placeholder: '(555) 000-0000' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', format: '##### ######', minDigits: 10, maxDigits: 11, placeholder: '7911 123456' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', format: '##### #####', minDigits: 10, maxDigits: 10, placeholder: '98765 43210' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', format: '#### ### ###', minDigits: 9, maxDigits: 9, placeholder: '0412 345 678' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', format: '## ### ####', minDigits: 9, maxDigits: 9, placeholder: '50 123 4567' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', format: '## ### ####', minDigits: 9, maxDigits: 9, placeholder: '50 123 4567' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', format: '#### #######', minDigits: 10, maxDigits: 11, placeholder: '1512 3456789' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', format: '# ## ## ## ##', minDigits: 9, maxDigits: 9, placeholder: '6 12 34 56 78' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', format: '#### ####', minDigits: 8, maxDigits: 8, placeholder: '8123 4567' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', format: '### ### ####', minDigits: 10, maxDigits: 10, placeholder: '551 234 5678' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', format: '## #####-####', minDigits: 11, maxDigits: 11, placeholder: '11 91234-5678' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', format: '### ### ####', minDigits: 8, maxDigits: 10, placeholder: '021 123 4567' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', format: '## ### ####', minDigits: 9, maxDigits: 9, placeholder: '85 123 4567' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', format: '### ## ## ##', minDigits: 9, maxDigits: 9, placeholder: '612 34 56 78' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', format: '### #######', minDigits: 10, maxDigits: 10, placeholder: '312 3456789' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', format: '# ########', minDigits: 9, maxDigits: 9, placeholder: '6 12345678' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', format: '## ### ## ##', minDigits: 9, maxDigits: 9, placeholder: '78 123 45 67' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', format: '## ### ## ##', minDigits: 9, maxDigits: 9, placeholder: '70 123 45 67' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', format: '### ## ###', minDigits: 8, maxDigits: 8, placeholder: '412 34 567' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', format: '## ## ## ##', minDigits: 8, maxDigits: 8, placeholder: '20 12 34 56' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', format: '### #######', minDigits: 9, maxDigits: 10, placeholder: '412 3456789' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', format: '## ### ####', minDigits: 9, maxDigits: 9, placeholder: '71 123 4567' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', format: '## #### ####', minDigits: 10, maxDigits: 10, placeholder: '90 1234 5678' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', format: '### #### ####', minDigits: 11, maxDigits: 11, placeholder: '138 0000 0000' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', format: '## #### ####', minDigits: 10, maxDigits: 10, placeholder: '10 1234 5678' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰', format: '#### ####', minDigits: 8, maxDigits: 8, placeholder: '9123 4567' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', format: '### ### ####', minDigits: 10, maxDigits: 10, placeholder: '912 345 6789' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', format: '### #######', minDigits: 10, maxDigits: 10, placeholder: '300 1234567' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', format: '#### ######' , minDigits: 10, maxDigits: 10, placeholder: '1712 345678' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', format: '## ### ####', minDigits: 9, maxDigits: 9, placeholder: '71 123 4567' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', format: '## #######', minDigits: 10, maxDigits: 10, placeholder: '98 12345678' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', format: '## ### ####', minDigits: 9, maxDigits: 10, placeholder: '12 345 6789' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', format: '### #### ####', minDigits: 10, maxDigits: 12, placeholder: '812 3456 7890' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', format: '## ### ####', minDigits: 9, maxDigits: 9, placeholder: '81 234 5678' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', format: '## #### ####', minDigits: 9, maxDigits: 10, placeholder: '91 2345 6789' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', format: '#### ####', minDigits: 8, maxDigits: 8, placeholder: '3312 3456' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', format: '#### ####', minDigits: 8, maxDigits: 8, placeholder: '9123 4567' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', format: '#### ####', minDigits: 8, maxDigits: 8, placeholder: '9123 4567' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', format: '#### ####', minDigits: 8, maxDigits: 8, placeholder: '3912 3456' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱', format: '## ### ####', minDigits: 9, maxDigits: 9, placeholder: '50 123 4567' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', format: '### ### ## ##', minDigits: 10, maxDigits: 10, placeholder: '532 123 45 67' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', format: '### ### ####', minDigits: 10, maxDigits: 10, placeholder: '100 123 4567' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', format: '### ### ####', minDigits: 10, maxDigits: 10, placeholder: '802 345 6789' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', format: '### ######', minDigits: 9, maxDigits: 9, placeholder: '712 345678' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', format: '## ### ####', minDigits: 9, maxDigits: 9, placeholder: '24 123 4567' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', format: '## #### ####', minDigits: 10, maxDigits: 10, placeholder: '11 1234 5678' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱', format: '# #### ####', minDigits: 9, maxDigits: 9, placeholder: '9 1234 5678' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴', format: '### ### ####', minDigits: 10, maxDigits: 10, placeholder: '300 123 4567' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪', format: '### ### ###', minDigits: 9, maxDigits: 9, placeholder: '912 345 678' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', format: '### ### ###', minDigits: 9, maxDigits: 9, placeholder: '912 345 678' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷', format: '### #######', minDigits: 10, maxDigits: 10, placeholder: '691 2345678' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', format: '### ### ###', minDigits: 9, maxDigits: 9, placeholder: '512 345 678' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿', format: '### ### ###', minDigits: 9, maxDigits: 9, placeholder: '601 234 567' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', format: '### #######', minDigits: 10, maxDigits: 11, placeholder: '664 1234567' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', format: '### ## ## ##', minDigits: 9, maxDigits: 9, placeholder: '470 12 34 56' },
  { code: 'RO', name: 'Romania', dialCode: '+40', flag: '🇷🇴', format: '### ### ###', minDigits: 9, maxDigits: 9, placeholder: '712 345 678' },
  { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺', format: '## ### ####', minDigits: 9, maxDigits: 9, placeholder: '20 123 4567' }
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // USA (+1)

export const findCountryByDialCode = (dialCode) => {
  if (!dialCode) return DEFAULT_COUNTRY;
  const clean = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return COUNTRIES.find(c => c.dialCode === clean) || DEFAULT_COUNTRY;
};

export const findCountryByCode = (code) => {
  if (!code) return DEFAULT_COUNTRY;
  return COUNTRIES.find(c => c.code.toUpperCase() === code.toUpperCase()) || DEFAULT_COUNTRY;
};

/**
 * Format raw input as digits according to country mask and strictly enforce max digits.
 */
export const formatPhoneByCountry = (rawValue, country = DEFAULT_COUNTRY) => {
  if (!rawValue) return '';
  // Only allow numeric digits
  const digits = String(rawValue).replace(/\D/g, '');
  const maxDigits = country.maxDigits || 15;
  const trimmedDigits = digits.slice(0, maxDigits);

  const template = country.format || '(###) ###-####';
  let formatted = '';
  let digitIndex = 0;

  for (let i = 0; i < template.length && digitIndex < trimmedDigits.length; i++) {
    if (template[i] === '#') {
      formatted += trimmedDigits[digitIndex];
      digitIndex++;
    } else {
      formatted += template[i];
    }
  }

  // If there are leftover digits beyond template
  if (digitIndex < trimmedDigits.length) {
    formatted += ' ' + trimmedDigits.slice(digitIndex);
  }

  return formatted;
};

/**
 * Validate phone digits according to the selected country rules
 */
export const validatePhoneByCountry = (rawValue, countryOrDialCode = DEFAULT_COUNTRY) => {
  if (!rawValue) return { isValid: true, message: '' };
  const digits = String(rawValue).replace(/\D/g, '');
  if (digits.length === 0) return { isValid: true, message: '' };

  let country = DEFAULT_COUNTRY;
  if (typeof countryOrDialCode === 'string') {
    country = findCountryByDialCode(countryOrDialCode) || findCountryByCode(countryOrDialCode) || DEFAULT_COUNTRY;
  } else if (countryOrDialCode && countryOrDialCode.minDigits) {
    country = countryOrDialCode;
  }

  const min = country.minDigits || 7;
  const max = country.maxDigits || 15;
  const isValid = digits.length >= min && digits.length <= max;

  return {
    isValid,
    minDigits: min,
    maxDigits: max,
    countryName: country.name,
    message: isValid ? '' : `Please enter a valid ${country.name} mobile number (${min}${min !== max ? `-${max}` : ''} digits).`
  };
};

