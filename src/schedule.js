export const schedule = [
  { months: 2, age: '2 เดือน', vaccines: 'DTP-HB-Hib1, IPV1, ROTASIIL 1' },
  { months: 4, age: '4 เดือน', vaccines: 'DTP-HB-Hib2, IPV2, ROTASIIL 2' },
  { months: 6, age: '6 เดือน', vaccines: 'DTP-HB-Hib3, OPV1, ROTASIIL 3' },
  { months: 9, age: '9 เดือน', vaccines: 'MMR1' },
  { months: 12, age: '1 ปี', vaccines: 'JE1' },
  { months: 18, age: '1 ปี 6 เดือน', vaccines: 'DTP4, OPV2, MMR2' },
  { months: 30, age: '2 ปี 6 เดือน', vaccines: 'JE2' },
  { months: 48, age: '4 ปี', vaccines: 'DTP5, OPV3' }
];

export const pcvSchedule = [
  { months: 2, dose: 'เข็มที่ 1', age: '2 เดือน' },
  { months: 4, dose: 'เข็มที่ 2', age: '4 เดือน' },
  { months: 12, dose: 'เข็มกระตุ้น', age: '12 เดือน (1 ปี)' }
];

export function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  if (year < 1900 || year > 9995) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function addMonths(date, months) {
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return first;
}

export function thirdWednesdayOnOrAfter(date) {
  const thirdWednesday = (year, month) => {
    const first = new Date(Date.UTC(year, month, 1));
    const day = 1 + (3 - first.getUTCDay() + 7) % 7 + 14;
    return new Date(Date.UTC(year, month, day));
  };
  const candidate = thirdWednesday(date.getUTCFullYear(), date.getUTCMonth());
  return candidate >= date ? candidate : thirdWednesday(date.getUTCFullYear(), date.getUTCMonth() + 1);
}

export function createSchedule(birthDate) {
  return schedule.map(item => {
    const due = addMonths(birthDate, item.months);
    return { ...item, due, appointment: thirdWednesdayOnOrAfter(due) };
  });
}

export function createPcvSchedule(birthDate) {
  return pcvSchedule.map(item => {
    const due = addMonths(birthDate, item.months);
    return { ...item, due, appointment: thirdWednesdayOnOrAfter(due) };
  });
}
