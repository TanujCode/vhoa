export const formatUsPhone = (phoneStr) => {
  if (!phoneStr) return '—';
  
  // Remove all non-digit characters
  const cleaned = phoneStr.replace(/\D/g, '');
  
  // If it is a 10-digit number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // If it is an 11-digit number starting with 1
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const mainPart = cleaned.slice(1);
    return `(${mainPart.slice(0, 3)}) ${mainPart.slice(3, 6)}-${mainPart.slice(6)}`;
  }

  // If it starts with country code (e.g. 91 for India, 44 for UK, 971 for UAE)
  // Let's format 10-digit trailing part if it exists
  if (cleaned.length > 10) {
    const mainPart = cleaned.slice(-10);
    const countryCode = cleaned.slice(0, cleaned.length - 10);
    return `+${countryCode} (${mainPart.slice(0, 3)}) ${mainPart.slice(3, 6)}-${mainPart.slice(6)}`;
  }
  
  // Fallback to formatted components if possible
  return phoneStr;
};

export const formatPhoneAsYouType = (value) => {
  if (!value) return value;
  let cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  
  // If it's an 11-digit number starting with '1', strip the leading '1' (US country code)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    cleaned = cleaned.slice(1);
  }
  
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};


