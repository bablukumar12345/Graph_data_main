export function cleanNumericInput(value) {
  const raw = String(value ?? '');
  if (raw === '') return '';

  const numeric = raw
    .replace(/[^0-9.]/g, '')
    .replace(/(\..*)\./g, '$1');

  if (numeric === '') return '';

  const hasDecimal = numeric.includes('.');
  const [integerPart, decimalPart = ''] = numeric.split('.');
  const integer = integerPart.replace(/^0+(?=\d)/, '') || '0';

  return hasDecimal ? `${integer}.${decimalPart}` : integer;
}