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
    { name: 'Israel', code: 'IL', prefix: '+972', flag: '🇮🇱' },
    { name: 'Malaysia', code: 'MY', prefix: '+60', flag: '🇲🇾' },
    { name: 'Sri Lanka', code: 'LK', prefix: '+94', flag: '🇱🇰' },
    { name: 'Pakistan', code: 'PK', prefix: '+92', flag: '🇵🇰' },
    { name: 'Bangladesh', code: 'BD', prefix: '+880', flag: '🇧🇩' },
    { name: 'Nepal', code: 'NP', prefix: '+977', flag: '🇳🇵' },
    { name: 'Afghanistan', code: 'AF', prefix: '+93', flag: '🇦🇫' },
    { name: 'Åland Islands', code: 'AX', prefix: '+358', flag: '🇦🇽' },
    { name: 'Albania', code: 'AL', prefix: '+355', flag: '🇦🇱' },
    { name: 'Algeria', code: 'DZ', prefix: '+213', flag: '🇩🇿' },
    { name: 'American Samoa', code: 'AS', prefix: '+1', flag: '🇦🇸' },
    { name: 'Andorra', code: 'AD', prefix: '+376', flag: '🇦🇩' },
    { name: 'Angola', code: 'AO', prefix: '+244', flag: '🇦🇴' },
    { name: 'Anguilla', code: 'AI', prefix: '+1', flag: '🇦🇮' },
    { name: 'Antigua & Barbuda', code: 'AG', prefix: '+1', flag: '🇦🇬' },
    { name: 'Argentina', code: 'AR', prefix: '+54', flag: '🇦🇷' },
    { name: 'Armenia', code: 'AM', prefix: '+374', flag: '🇦🇲' },
    { name: 'Aruba', code: 'AW', prefix: '+297', flag: '🇦🇼' },
    { name: 'Ascension Island', code: 'AC', prefix: '+247', flag: '🇦🇨' },
    { name: 'Austria', code: 'AT', prefix: '+43', flag: '🇦🇹' },
    { name: 'Azerbaijan', code: 'AZ', prefix: '+994', flag: '🇦🇿' },
    { name: 'Bahamas', code: 'BS', prefix: '+1', flag: '🇧🇸' },
    { name: 'Barbados', code: 'BB', prefix: '+1', flag: '🇧🇧' },
    { name: 'Belarus', code: 'BY', prefix: '+375', flag: '🇧🇾' },
    { name: 'Belgium', code: 'BE', prefix: '+32', flag: '🇧🇪' },
    { name: 'Belize', code: 'BZ', prefix: '+501', flag: '🇧🇿' },
    { name: 'Benin', code: 'BJ', prefix: '+229', flag: '🇧🇯' },
    { name: 'Bermuda', code: 'BM', prefix: '+1', flag: '🇧🇲' },
    { name: 'Bhutan', code: 'BT', prefix: '+975', flag: '🇧🇹' },
    { name: 'Bolivia', code: 'BO', prefix: '+591', flag: '🇧🇴' },
    { name: 'Bosnia & Herzegovina', code: 'BA', prefix: '+387', flag: '🇧🇦' },
    { name: 'Botswana', code: 'BW', prefix: '+267', flag: '🇧🇼' },
    { name: 'Brazil', code: 'BR', prefix: '+55', flag: '🇧🇷' },
    { name: 'British Indian Ocean Territory', code: 'IO', prefix: '+246', flag: '🇮🇴' },
    { name: 'British Virgin Islands', code: 'VG', prefix: '+1', flag: '🇻🇬' },
    { name: 'Brunei', code: 'BN', prefix: '+673', flag: '🇧🇳' },
    { name: 'Bulgaria', code: 'BG', prefix: '+359', flag: '🇧🇬' },
    { name: 'Burkina Faso', code: 'BF', prefix: '+226', flag: '🇧🇫' },
    { name: 'Burundi', code: 'BI', prefix: '+257', flag: '🇧🇮' },
    { name: 'Cambodia', code: 'KH', prefix: '+855', flag: '🇰🇭' },
    { name: 'Cameroon', code: 'CM', prefix: '+237', flag: '🇨🇲' },
    { name: 'Cape Verde', code: 'CV', prefix: '+238', flag: '🇨🇻' },
    { name: 'Caribbean Netherlands', code: 'BQ', prefix: '+599', flag: '🇧🇶' },
    { name: 'Cayman Islands', code: 'KY', prefix: '+1', flag: '🇰🇾' },
    { name: 'Central African Republic', code: 'CF', prefix: '+236', flag: '🇨🇫' },
    { name: 'Chad', code: 'TD', prefix: '+235', flag: '🇹🇩' },
    { name: 'Chile', code: 'CL', prefix: '+56', flag: '🇨🇱' },
    { name: 'China', code: 'CN', prefix: '+86', flag: '🇨🇳' },
    { name: 'Christmas Island', code: 'CX', prefix: '+61', flag: '🇨🇽' },
    { name: 'Cocos (Keeling) Islands', code: 'CC', prefix: '+61', flag: '🇨🇨' },
    { name: 'Colombia', code: 'CO', prefix: '+57', flag: '🇨🇴' },
    { name: 'Comoros', code: 'KM', prefix: '+269', flag: '🇰🇲' },
    { name: 'Congo - Brazzaville', code: 'CG', prefix: '+242', flag: '🇨🇬' },
    { name: 'Congo - Kinshasa', code: 'CD', prefix: '+243', flag: '🇨🇩' },
    { name: 'Cook Islands', code: 'CK', prefix: '+682', flag: '🇨🇰' },
    { name: 'Costa Rica', code: 'CR', prefix: '+506', flag: '🇨🇷' },
    { name: 'Côte d’Ivoire', code: 'CI', prefix: '+225', flag: '🇨🇮' },
    { name: 'Croatia', code: 'HR', prefix: '+385', flag: '🇭🇷' },
    { name: 'Cuba', code: 'CU', prefix: '+53', flag: '🇨🇺' },
    { name: 'Curaçao', code: 'CW', prefix: '+599', flag: '🇨🇼' },
    { name: 'Cyprus', code: 'CY', prefix: '+357', flag: '🇨🇾' },
    { name: 'Czechia', code: 'CZ', prefix: '+420', flag: '🇨🇿' },
    { name: 'Denmark', code: 'DK', prefix: '+45', flag: '🇩🇰' },
    { name: 'Djibouti', code: 'DJ', prefix: '+253', flag: '🇩🇯' },
    { name: 'Dominica', code: 'DM', prefix: '+1', flag: '🇩🇲' },
    { name: 'Dominican Republic', code: 'DO', prefix: '+1', flag: '🇩🇴' },
    { name: 'Ecuador', code: 'EC', prefix: '+593', flag: '🇪🇨' },
    { name: 'Egypt', code: 'EG', prefix: '+20', flag: '🇪🇬' },
    { name: 'El Salvador', code: 'SV', prefix: '+503', flag: '🇸🇻' },
    { name: 'Equatorial Guinea', code: 'GQ', prefix: '+240', flag: '🇬🇶' },
    { name: 'Eritrea', code: 'ER', prefix: '+291', flag: '🇪🇷' },
    { name: 'Estonia', code: 'EE', prefix: '+372', flag: '🇪🇪' },
    { name: 'Eswatini', code: 'SZ', prefix: '+268', flag: '🇸🇿' },
    { name: 'Ethiopia', code: 'ET', prefix: '+251', flag: '🇪🇹' },
    { name: 'Falkland Islands', code: 'FK', prefix: '+500', flag: '🇫🇰' },
    { name: 'Faroe Islands', code: 'FO', prefix: '+298', flag: '🇫🇴' },
    { name: 'Fiji', code: 'FJ', prefix: '+679', flag: '🇫🇯' },
    { name: 'Finland', code: 'FI', prefix: '+358', flag: '🇫🇮' },
    { name: 'French Guiana', code: 'GF', prefix: '+594', flag: '🇬🇫' },
    { name: 'French Polynesia', code: 'PF', prefix: '+689', flag: '🇵🇫' },
    { name: 'Gabon', code: 'GA', prefix: '+241', flag: '🇬🇦' },
    { name: 'Gambia', code: 'GM', prefix: '+220', flag: '🇬🇲' },
    { name: 'Georgia', code: 'GE', prefix: '+995', flag: '🇬🇪' },
    { name: 'Ghana', code: 'GH', prefix: '+233', flag: '🇬🇭' },
    { name: 'Gibraltar', code: 'GI', prefix: '+350', flag: '🇬🇮' },
    { name: 'Greece', code: 'GR', prefix: '+30', flag: '🇬🇷' },
    { name: 'Greenland', code: 'GL', prefix: '+299', flag: '🇬🇱' },
    { name: 'Grenada', code: 'GD', prefix: '+1', flag: '🇬🇩' },
    { name: 'Guadeloupe', code: 'GP', prefix: '+590', flag: '🇬🇵' },
    { name: 'Guam', code: 'GU', prefix: '+1', flag: '🇬🇺' },
    { name: 'Guatemala', code: 'GT', prefix: '+502', flag: '🇬🇹' },
    { name: 'Guernsey', code: 'GG', prefix: '+44', flag: '🇬🇬' },
    { name: 'Guinea', code: 'GN', prefix: '+224', flag: '🇬🇳' },
    { name: 'Guinea-Bissau', code: 'GW', prefix: '+245', flag: '🇬🇼' },
    { name: 'Guyana', code: 'GY', prefix: '+592', flag: '🇬🇾' },
    { name: 'Haiti', code: 'HT', prefix: '+509', flag: '🇭🇹' },
    { name: 'Honduras', code: 'HN', prefix: '+504', flag: '🇭🇳' },
    { name: 'Hong Kong SAR China', code: 'HK', prefix: '+852', flag: '🇭🇰' },
    { name: 'Hungary', code: 'HU', prefix: '+36', flag: '🇭🇺' },
    { name: 'Iceland', code: 'IS', prefix: '+354', flag: '🇮🇸' },
    { name: 'Indonesia', code: 'ID', prefix: '+62', flag: '🇮🇩' },
    { name: 'Iran', code: 'IR', prefix: '+98', flag: '🇮🇷' },
    { name: 'Iraq', code: 'IQ', prefix: '+964', flag: '🇮🇶' },
    { name: 'Ireland', code: 'IE', prefix: '+353', flag: '🇮🇪' },
    { name: 'Isle of Man', code: 'IM', prefix: '+44', flag: '🇮🇲' },
    { name: 'Italy', code: 'IT', prefix: '+39', flag: '🇮🇹' },
    { name: 'Jamaica', code: 'JM', prefix: '+1', flag: '🇯🇲' },
    { name: 'Japan', code: 'JP', prefix: '+81', flag: '🇯🇵' },
    { name: 'Jersey', code: 'JE', prefix: '+44', flag: '🇯🇪' },
    { name: 'Jordan', code: 'JO', prefix: '+962', flag: '🇯🇴' },
    { name: 'Kazakhstan', code: 'KZ', prefix: '+7', flag: '🇰🇿' },
    { name: 'Kenya', code: 'KE', prefix: '+254', flag: '🇰🇪' },
    { name: 'Kiribati', code: 'KI', prefix: '+686', flag: '🇰🇮' },
    { name: 'Kosovo', code: 'XK', prefix: '+383', flag: '🇽🇰' },
    { name: 'Kyrgyzstan', code: 'KG', prefix: '+996', flag: '🇰🇬' },
    { name: 'Laos', code: 'LA', prefix: '+856', flag: '🇱🇦' },
    { name: 'Latvia', code: 'LV', prefix: '+371', flag: '🇱🇻' },
    { name: 'Lebanon', code: 'LB', prefix: '+961', flag: '🇱🇧' },
    { name: 'Lesotho', code: 'LS', prefix: '+266', flag: '🇱🇸' },
    { name: 'Liberia', code: 'LR', prefix: '+231', flag: '🇱🇷' },
    { name: 'Libya', code: 'LY', prefix: '+218', flag: '🇱🇾' },
    { name: 'Liechtenstein', code: 'LI', prefix: '+423', flag: '🇱🇮' },
    { name: 'Lithuania', code: 'LT', prefix: '+370', flag: '🇱🇹' },
    { name: 'Luxembourg', code: 'LU', prefix: '+352', flag: '🇱🇺' },
    { name: 'Macao SAR China', code: 'MO', prefix: '+853', flag: '🇲🇴' },
    { name: 'Madagascar', code: 'MG', prefix: '+261', flag: '🇲🇬' },
    { name: 'Malawi', code: 'MW', prefix: '+265', flag: '🇲🇼' },
    { name: 'Maldives', code: 'MV', prefix: '+960', flag: '🇲🇻' },
    { name: 'Mali', code: 'ML', prefix: '+223', flag: '🇲🇱' },
    { name: 'Malta', code: 'MT', prefix: '+356', flag: '🇲🇹' },
    { name: 'Marshall Islands', code: 'MH', prefix: '+692', flag: '🇲🇭' },
    { name: 'Martinique', code: 'MQ', prefix: '+596', flag: '🇲🇶' },
    { name: 'Mauritania', code: 'MR', prefix: '+222', flag: '🇲🇷' },
    { name: 'Mauritius', code: 'MU', prefix: '+230', flag: '🇲🇺' },
    { name: 'Mayotte', code: 'YT', prefix: '+262', flag: '🇾🇹' },
    { name: 'Mexico', code: 'MX', prefix: '+52', flag: '🇲🇽' },
    { name: 'Micronesia', code: 'FM', prefix: '+691', flag: '🇫🇲' },
    { name: 'Moldova', code: 'MD', prefix: '+373', flag: '🇲🇩' },
    { name: 'Monaco', code: 'MC', prefix: '+377', flag: '🇲🇨' },
    { name: 'Mongolia', code: 'MN', prefix: '+976', flag: '🇲🇳' },
    { name: 'Montenegro', code: 'ME', prefix: '+382', flag: '🇲🇪' },
    { name: 'Montserrat', code: 'MS', prefix: '+1', flag: '🇲🇸' },
    { name: 'Morocco', code: 'MA', prefix: '+212', flag: '🇲🇦' },
    { name: 'Mozambique', code: 'MZ', prefix: '+258', flag: '🇲🇿' },
    { name: 'Myanmar (Burma)', code: 'MM', prefix: '+95', flag: '🇲🇲' },
    { name: 'Namibia', code: 'NA', prefix: '+264', flag: '🇳🇦' },
    { name: 'Nauru', code: 'NR', prefix: '+674', flag: '🇳🇷' },
    { name: 'Netherlands', code: 'NL', prefix: '+31', flag: '🇳🇱' },
    { name: 'New Caledonia', code: 'NC', prefix: '+687', flag: '🇳🇨' },
    { name: 'New Zealand', code: 'NZ', prefix: '+64', flag: '🇳🇿' },
    { name: 'Nicaragua', code: 'NI', prefix: '+505', flag: '🇳🇮' },
    { name: 'Niger', code: 'NE', prefix: '+227', flag: '🇳🇪' },
    { name: 'Nigeria', code: 'NG', prefix: '+234', flag: '🇳🇬' },
    { name: 'Niue', code: 'NU', prefix: '+683', flag: '🇳🇺' },
    { name: 'Norfolk Island', code: 'NF', prefix: '+672', flag: '🇳🇫' },
    { name: 'North Korea', code: 'KP', prefix: '+850', flag: '🇰🇵' },
    { name: 'North Macedonia', code: 'MK', prefix: '+389', flag: '🇲🇰' },
    { name: 'Northern Mariana Islands', code: 'MP', prefix: '+1', flag: '🇲🇵' },
    { name: 'Norway', code: 'NO', prefix: '+47', flag: '🇳🇴' },
    { name: 'Palau', code: 'PW', prefix: '+680', flag: '🇵🇼' },
    { name: 'Palestinian Territories', code: 'PS', prefix: '+970', flag: '🇵🇸' },
    { name: 'Panama', code: 'PA', prefix: '+507', flag: '🇵🇦' },
    { name: 'Papua New Guinea', code: 'PG', prefix: '+675', flag: '🇵🇬' },
    { name: 'Paraguay', code: 'PY', prefix: '+595', flag: '🇵🇾' },
    { name: 'Peru', code: 'PE', prefix: '+51', flag: '🇵🇪' },
    { name: 'Philippines', code: 'PH', prefix: '+63', flag: '🇵🇭' },
    { name: 'Poland', code: 'PL', prefix: '+48', flag: '🇵🇱' },
    { name: 'Portugal', code: 'PT', prefix: '+351', flag: '🇵🇹' },
    { name: 'Puerto Rico', code: 'PR', prefix: '+1', flag: '🇵🇷' },
    { name: 'Réunion', code: 'RE', prefix: '+262', flag: '🇷🇪' },
    { name: 'Romania', code: 'RO', prefix: '+40', flag: '🇷🇴' },
    { name: 'Russia', code: 'RU', prefix: '+7', flag: '🇷🇺' },
    { name: 'Rwanda', code: 'RW', prefix: '+250', flag: '🇷🇼' },
    { name: 'Samoa', code: 'WS', prefix: '+685', flag: '🇼🇸' },
    { name: 'San Marino', code: 'SM', prefix: '+378', flag: '🇸🇲' },
    { name: 'São Tomé & Príncipe', code: 'ST', prefix: '+239', flag: '🇸🇹' },
    { name: 'Senegal', code: 'SN', prefix: '+221', flag: '🇸🇳' },
    { name: 'Serbia', code: 'RS', prefix: '+381', flag: '🇷🇸' },
    { name: 'Seychelles', code: 'SC', prefix: '+248', flag: '🇸🇨' },
    { name: 'Sierra Leone', code: 'SL', prefix: '+232', flag: '🇸🇱' },
    { name: 'Sint Maarten', code: 'SX', prefix: '+1', flag: '🇸🇽' },
    { name: 'Slovakia', code: 'SK', prefix: '+421', flag: '🇸🇰' },
    { name: 'Slovenia', code: 'SI', prefix: '+386', flag: '🇸🇮' },
    { name: 'Solomon Islands', code: 'SB', prefix: '+677', flag: '🇸🇧' },
    { name: 'Somalia', code: 'SO', prefix: '+252', flag: '🇸🇴' },
    { name: 'South Africa', code: 'ZA', prefix: '+27', flag: '🇿🇦' },
    { name: 'South Korea', code: 'KR', prefix: '+82', flag: '🇰🇷' },
    { name: 'South Sudan', code: 'SS', prefix: '+211', flag: '🇸🇸' },
    { name: 'Spain', code: 'ES', prefix: '+34', flag: '🇪🇸' },
    { name: 'St. Barthélemy', code: 'BL', prefix: '+590', flag: '🇧🇱' },
    { name: 'St. Helena', code: 'SH', prefix: '+290', flag: '🇸🇭' },
    { name: 'St. Kitts & Nevis', code: 'KN', prefix: '+1', flag: '🇰🇳' },
    { name: 'St. Lucia', code: 'LC', prefix: '+1', flag: '🇱🇨' },
    { name: 'St. Martin', code: 'MF', prefix: '+590', flag: '🇲🇫' },
    { name: 'St. Pierre & Miquelon', code: 'PM', prefix: '+508', flag: '🇵🇲' },
    { name: 'St. Vincent & Grenadines', code: 'VC', prefix: '+1', flag: '🇻🇨' },
    { name: 'Sudan', code: 'SD', prefix: '+249', flag: '🇸🇩' },
    { name: 'Suriname', code: 'SR', prefix: '+597', flag: '🇸🇷' },
    { name: 'Svalbard & Jan Mayen', code: 'SJ', prefix: '+47', flag: '🇸🇯' },
    { name: 'Sweden', code: 'SE', prefix: '+46', flag: '🇸🇪' },
    { name: 'Switzerland', code: 'CH', prefix: '+41', flag: '🇨🇭' },
    { name: 'Syria', code: 'SY', prefix: '+963', flag: '🇸🇾' },
    { name: 'Taiwan', code: 'TW', prefix: '+886', flag: '🇹🇼' },
    { name: 'Tajikistan', code: 'TJ', prefix: '+992', flag: '🇹🇯' },
    { name: 'Tanzania', code: 'TZ', prefix: '+255', flag: '🇹🇿' },
    { name: 'Thailand', code: 'TH', prefix: '+66', flag: '🇹🇭' },
    { name: 'Timor-Leste', code: 'TL', prefix: '+670', flag: '🇹🇱' },
    { name: 'Togo', code: 'TG', prefix: '+228', flag: '🇹🇬' },
    { name: 'Tokelau', code: 'TK', prefix: '+690', flag: '🇹🇰' },
    { name: 'Tonga', code: 'TO', prefix: '+676', flag: '🇹🇴' },
    { name: 'Trinidad & Tobago', code: 'TT', prefix: '+1', flag: '🇹🇹' },
    { name: 'Tristan da Cunha', code: 'TA', prefix: '+290', flag: '🇹🇦' },
    { name: 'Tunisia', code: 'TN', prefix: '+216', flag: '🇹🇳' },
    { name: 'Türkiye', code: 'TR', prefix: '+90', flag: '🇹🇷' },
    { name: 'Turkmenistan', code: 'TM', prefix: '+993', flag: '🇹🇲' },
    { name: 'Turks & Caicos Islands', code: 'TC', prefix: '+1', flag: '🇹🇨' },
    { name: 'Tuvalu', code: 'TV', prefix: '+688', flag: '🇹🇻' },
    { name: 'U.S. Virgin Islands', code: 'VI', prefix: '+1', flag: '🇻🇮' },
    { name: 'Uganda', code: 'UG', prefix: '+256', flag: '🇺🇬' },
    { name: 'Ukraine', code: 'UA', prefix: '+380', flag: '🇺🇦' },
    { name: 'Uruguay', code: 'UY', prefix: '+598', flag: '🇺🇾' },
    { name: 'Uzbekistan', code: 'UZ', prefix: '+998', flag: '🇺🇿' },
    { name: 'Vanuatu', code: 'VU', prefix: '+678', flag: '🇻🇺' },
    { name: 'Vatican City', code: 'VA', prefix: '+39', flag: '🇻🇦' },
    { name: 'Venezuela', code: 'VE', prefix: '+58', flag: '🇻🇪' },
    { name: 'Vietnam', code: 'VN', prefix: '+84', flag: '🇻🇳' },
    { name: 'Wallis & Futuna', code: 'WF', prefix: '+681', flag: '🇼🇫' },
    { name: 'Western Sahara', code: 'EH', prefix: '+212', flag: '🇪🇭' },
    { name: 'Yemen', code: 'YE', prefix: '+967', flag: '🇾🇪' },
    { name: 'Zambia', code: 'ZM', prefix: '+260', flag: '🇿🇲' },
    { name: 'Zimbabwe', code: 'ZW', prefix: '+263', flag: '🇿🇼' },
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
