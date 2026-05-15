// Eurovision country names (as they appear in public/eurovision.json) mapped
// to ISO 3166-1 alpha-2 codes. Defunct countries without a current code
// (Yugoslavia, Serbia and Montenegro) are intentionally omitted — callers
// fall back to no flag prefix.
const COUNTRY_TO_ISO: Record<string, string> = {
  Albania: 'AL',
  Andorra: 'AD',
  Armenia: 'AM',
  Australia: 'AU',
  Austria: 'AT',
  Azerbaijan: 'AZ',
  Belarus: 'BY',
  Belgium: 'BE',
  'Bosnia and Herzegovina': 'BA',
  Bulgaria: 'BG',
  Croatia: 'HR',
  Cyprus: 'CY',
  'Czech Republic': 'CZ',
  Czechia: 'CZ',
  Denmark: 'DK',
  Estonia: 'EE',
  Finland: 'FI',
  France: 'FR',
  Georgia: 'GE',
  Germany: 'DE',
  Greece: 'GR',
  Hungary: 'HU',
  Iceland: 'IS',
  Ireland: 'IE',
  Israel: 'IL',
  Italy: 'IT',
  Latvia: 'LV',
  Lithuania: 'LT',
  Luxembourg: 'LU',
  Macedonia: 'MK',
  Malta: 'MT',
  Moldova: 'MD',
  Monaco: 'MC',
  Montenegro: 'ME',
  Morocco: 'MA',
  Netherlands: 'NL',
  'North Macedonia': 'MK',
  Norway: 'NO',
  Poland: 'PL',
  Portugal: 'PT',
  Romania: 'RO',
  Russia: 'RU',
  'San Marino': 'SM',
  Serbia: 'RS',
  Slovakia: 'SK',
  Slovenia: 'SI',
  Spain: 'ES',
  Sweden: 'SE',
  Switzerland: 'CH',
  Turkey: 'TR',
  Ukraine: 'UA',
  'United Kingdom': 'GB',
}

const REGIONAL_INDICATOR_A = 0x1f1e6

export function getCountryFlag(country: string): string | null {
  const iso = COUNTRY_TO_ISO[country]
  if (!iso) return null
  const cp0 = REGIONAL_INDICATOR_A + (iso.charCodeAt(0) - 65)
  const cp1 = REGIONAL_INDICATOR_A + (iso.charCodeAt(1) - 65)
  return String.fromCodePoint(cp0, cp1)
}
