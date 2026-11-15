export function formatINR(val: number): string {
  return '₹' + Number(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function numberToWords(num: number): string {
  const a = [
    '',
    'One ',
    'Two ',
    'Three ',
    'Four ',
    'Five ',
    'Six ',
    'Seven ',
    'Eight ',
    'Nine ',
    'Ten ',
    'Eleven ',
    'Twelve ',
    'Thirteen ',
    'Fourteen ',
    'Fifteen ',
    'Sixteen ',
    'Seventeen ',
    'Eighteen ',
    'Nineteen ',
  ];
  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  function inWords(n: number | string): string {
    const s = ('000000000' + n).slice(-9);
    const match = s.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!match) return '';
    let str = '';
    const [, n1, n2, n3, n4, n5] = match;

    const num1 = Number(n1);
    const num2 = Number(n2);
    const num3 = Number(n3);
    const num4 = Number(n4);
    const num5 = Number(n5);

    str += num1 !== 0 ? (a[num1] || b[Number(n1[0])] + ' ' + a[Number(n1[1])]) + 'Crore ' : '';
    str += num2 !== 0 ? (a[num2] || b[Number(n2[0])] + ' ' + a[Number(n2[1])]) + 'Lakh ' : '';
    str += num3 !== 0 ? (a[num3] || b[Number(n3[0])] + ' ' + a[Number(n3[1])]) + 'Thousand ' : '';
    str += num4 !== 0 ? (a[num4] || b[Number(n4[0])] + ' ' + a[Number(n4[1])]) + 'Hundred ' : '';
    str += num5 !== 0 ? (str !== '' ? 'and ' : '') + (a[num5] || b[Number(n5[0])] + ' ' + a[Number(n5[1])]) : '';
    return str.trim();
  }

  const intPart = Math.floor(Math.abs(num));
  const words = inWords(intPart);
  return words ? 'INR ' + words + ' Only' : 'INR Zero Only';
}
