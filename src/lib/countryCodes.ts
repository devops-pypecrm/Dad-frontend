export interface CountryCode {
    name: string;
    code: string;
    prefix: string;
    flag: string;
}

export const countryCodes: CountryCode[] = [
    { name: 'India', code: 'IN', prefix: '+91', flag: '🇮🇳' },
    { name: 'United States', code: 'US', prefix: '+1', flag: '🇺🇸' },
    { name: 'United Kingdom', code: 'GB', prefix: '+44', flag: '🇬🇧' },
    { name: 'United Arab Emirates', code: 'AE', prefix: '+971', flag: '🇦🇪' },
    { name: 'Australia', code: 'AU', prefix: '+61', flag: '🇦🇺' },
    { name: 'Canada', code: 'CA', prefix: '+1', flag: '🇨🇦' },
    { name: 'Saudi Arabia', code: 'SA', prefix: '+966', flag: '🇸🇦' },
    { name: 'Singapore', code: 'SG', prefix: '+65', flag: '🇸🇬' },
    { name: 'Germany', code: 'DE', prefix: '+49', flag: '🇩🇪' },
    { name: 'France', code: 'FR', prefix: '+33', flag: '🇫🇷' },
    { name: 'Qatar', code: 'QA', prefix: '+974', flag: '🇶🇦' },
    { name: 'Oman', code: 'OM', prefix: '+968', flag: '🇴🇲' },
    { name: 'Kuwait', code: 'KW', prefix: '+965', flag: '🇰🇼' },
    { name: 'Bahrain', code: 'BH', prefix: '+973', flag: '🇧🇭' },
    { name: 'Malaysia', code: 'MY', prefix: '+60', flag: '🇲🇾' },
    { name: 'Sri Lanka', code: 'LK', prefix: '+94', flag: '🇱🇰' },
    { name: 'Pakistan', code: 'PK', prefix: '+92', flag: '🇵🇰' },
    { name: 'Bangladesh', code: 'BD', prefix: '+880', flag: '🇧🇩' },
    { name: 'Nepal', code: 'NP', prefix: '+977', flag: '🇳🇵' },
];

export const getCountryByPrefix = (prefix: string) => {
    return countryCodes.find(c => c.prefix === prefix);
};

export const getCountryByCode = (code: string) => {
    return countryCodes.find(c => c.code === code.toUpperCase());
};

export const identifyCountryFromPhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Sort by prefix length descending to match longest prefixes first (e.g. +880 before +8)
    const sortedCodes = [...countryCodes].sort((a, b) => b.prefix.length - a.prefix.length);
    
    for (const country of sortedCodes) {
        const prefixNoPlus = country.prefix.replace('+', '');
        if (cleanPhone.startsWith(prefixNoPlus)) {
            return {
                country,
                localNumber: cleanPhone.slice(prefixNoPlus.length)
            };
        }
    }
    
    return null;
};

/** One entry per dialling prefix (the list has +1 twice for US and Canada), for pickers keyed by prefix. */
export const uniquePrefixes: CountryCode[] = countryCodes.filter((c, i, all) => all.findIndex(x => x.prefix === c.prefix) === i);

/**
 * Splits a stored lead phone into the picker's country prefix and the local number.
 * Leads arrive in different shapes: Meta/imports store "+9198...", the quick-add form stores local digits with a
 * separate phoneCountryCode, and older rows have bare digits with no code at all.
 */
export const splitLeadPhone = (phone?: string | null, storedCode?: string | null): { prefix: string; local: string } => {
    const raw = (phone ?? '').toString().trim();
    const digits = raw.replace(/\D/g, '');
    const ccDigits = (storedCode ?? '').replace(/\D/g, '');

    // Explicit "+" means the country code is part of the number
    if (raw.startsWith('+')) {
        const found = identifyCountryFromPhone(raw);
        if (found) return { prefix: found.country.prefix, local: found.localNumber };
    }
    // A stored code is authoritative; strip it only when the number clearly carries it already
    if (ccDigits) {
        const carries = digits.startsWith(ccDigits) && digits.length >= ccDigits.length + 7 && digits.length > 10;
        return { prefix: `+${ccDigits}`, local: carries ? digits.slice(ccDigits.length) : digits };
    }
    // No code stored: a bare 10-digit mobile is Indian; otherwise try to read the prefix from the digits
    if (digits.length === 10) return { prefix: '+91', local: digits };
    const found = identifyCountryFromPhone(digits);
    if (found && found.localNumber.length >= 6) return { prefix: found.country.prefix, local: found.localNumber };
    return { prefix: '+91', local: digits };
};
