import { addMonths, parseDate } from './schedule.js';

const dateFormatter = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC'
});
const weekdayFormatter = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
  weekday: 'long',
  timeZone: 'UTC'
});

export function formatThaiDate(date) {
  const parts = Object.fromEntries(dateFormatter.formatToParts(date).map(part => [part.type, part.value]));
  const weekday = weekdayFormatter.format(date).replace(/^วัน/, '');
  return `${parts.day}/${parts.month}/${parts.year} (${weekday})`;
}

export function formatThaiDateInput(date) {
  const parts = Object.fromEntries(dateFormatter.formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.day}/${parts.month}/${parts.year}`;
}

export function parseThaiDate(value) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, buddhistYear] = match;
  const year = Number(buddhistYear) - 543;
  return parseDate(`${String(year).padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
}

export function formatAge(startDate, endDate) {
  if (endDate < startDate) throw new RangeError('End date must not be before start date');

  let months = (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12
    + endDate.getUTCMonth() - startDate.getUTCMonth();
  let ageStart = addMonths(startDate, months);
  if (ageStart > endDate) {
    months -= 1;
    ageStart = addMonths(startDate, months);
  }

  const days = (endDate.getTime() - ageStart.getTime()) / 86400000;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const age = years > 0
    ? `อายุ ${years} ปี ${remainingMonths} เดือน`
    : `อายุ ${remainingMonths} เดือน`;
  return `${age} ${days} วัน`;
}
