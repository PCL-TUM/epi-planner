import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { formatAge, formatThaiDate, formatThaiDateInput, parseThaiDate } from '../src/date-format.js';
import { addMonths, createPcvSchedule, createSchedule, parseDate, thirdWednesdayOnOrAfter } from '../src/schedule.js';

const iso = date => date.toISOString().slice(0, 10);

test('Thai dates use a consistent day/month/Buddhist-year format with weekday', () => {
  assert.equal(formatThaiDate(parseDate('2026-01-01')), '01/01/2569 (พฤหัสบดี)');
  assert.equal(formatThaiDate(parseDate('2026-01-21')), '21/01/2569 (พุธ)');
});

test('Thai date input round-trips Buddhist-era dates and rejects invalid days', () => {
  const date = parseDate('2026-07-14');
  assert.equal(formatThaiDateInput(date), '14/07/2569');
  assert.equal(parseThaiDate('14/07/2569').toISOString(), date.toISOString());
  for (const value of ['31/02/2569', '14/13/2569', '14-07-2569', '14/07/2026']) {
    assert.equal(parseThaiDate(value), null);
  }
});

test('age at due and appointment dates includes completed months and remaining days', () => {
  const birth = parseDate('2026-01-01');
  assert.equal(formatAge(birth, parseDate('2026-03-01')), 'อายุ 2 เดือน 0 วัน');
  assert.equal(formatAge(birth, parseDate('2026-03-18')), 'อายุ 2 เดือน 17 วัน');
  assert.equal(formatAge(parseDate('2026-01-31'), parseDate('2026-02-28')), 'อายุ 1 เดือน 0 วัน');
  assert.equal(formatAge(birth, parseDate('2027-01-01')), 'อายุ 1 ปี 0 เดือน 0 วัน');
});

test('parse valid dates and reject invalid dates', () => {
  assert.equal(iso(parseDate('2024-02-29')), '2024-02-29');
  for (const value of ['2025-02-29', '2024-13-01', '2024-00-01', 'not-a-date', '1899-12-31']) {
    assert.equal(parseDate(value), null);
  }
});

test('month addition clamps dates at the end of the month', () => {
  assert.equal(iso(addMonths(parseDate('2024-12-31'), 2)), '2025-02-28');
  assert.equal(iso(addMonths(parseDate('2024-01-31'), 1)), '2024-02-29');
});

test('third Wednesday is on or after the due date including same day and year boundary', () => {
  assert.equal(iso(thirdWednesdayOnOrAfter(parseDate('2026-03-01'))), '2026-03-18');
  assert.equal(iso(thirdWednesdayOnOrAfter(parseDate('2026-03-18'))), '2026-03-18');
  assert.equal(iso(thirdWednesdayOnOrAfter(parseDate('2026-03-19'))), '2026-04-15');
  assert.equal(iso(thirdWednesdayOnOrAfter(parseDate('2026-12-31'))), '2027-01-20');
});

test('schedule contains the observed routine vaccine rows with third-Wednesday appointments', () => {
  const rows = createSchedule(parseDate('2026-01-01'));
  assert.deepEqual(rows.map(row => row.months), [2, 4, 6, 9, 12, 18, 30, 48]);
  assert.equal(iso(rows[0].due), '2026-03-01');
  assert.equal(iso(rows[0].appointment), '2026-03-18');
  assert.equal(iso(rows[7].due), '2030-01-01');
  assert.equal(iso(rows[7].appointment), '2030-01-16');
});

test('PCV routine schedule includes provisional third-Wednesday appointments', () => {
  const rows = createPcvSchedule(parseDate('2026-01-01'));
  assert.deepEqual(rows.map(row => row.months), [2, 4, 12]);
  assert.deepEqual(rows.map(row => row.dose), ['เข็มที่ 1', 'เข็มที่ 2', 'เข็มกระตุ้น']);
  assert.deepEqual(rows.map(row => iso(row.due)), ['2026-03-01', '2026-05-01', '2027-01-01']);
  assert.deepEqual(rows.map(row => iso(row.appointment)), ['2026-03-18', '2026-05-20', '2027-01-20']);
  assert.equal(iso(createPcvSchedule(parseDate('2024-12-31'))[0].due), '2025-02-28');
  assert.equal(iso(createPcvSchedule(parseDate('2024-12-31'))[0].appointment), '2025-03-19');
});
