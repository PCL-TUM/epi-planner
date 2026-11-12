import { createPcvSchedule, createSchedule, parseDate } from './schedule.js';
import { formatAge, formatThaiDate, parseThaiDate } from './date-format.js';
import { initThaiDatePicker } from './thai-date-picker.js';

const form = document.querySelector('#schedule-form');
const birthInput = document.querySelector('#birth-date');
const birthDateValue = document.querySelector('#birth-date-value');
const birthAge = document.querySelector('#birth-age');
const birthAgeValue = document.querySelector('#birth-age-value');
const pcvDoses = document.querySelector('#pcv-doses');
const pcvFirstDateField = document.querySelector('#pcv-first-date-field');
const pcvFirstDate = document.querySelector('#pcv-first-date');
const pcvFirstDateValue = document.querySelector('#pcv-first-date-value');
const results = document.querySelector('#results');
const body = document.querySelector('#schedule-body');
const pcvBody = document.querySelector('#pcv-schedule-body');
const summary = document.querySelector('#birth-summary');
const pcvSummary = document.querySelector('#pcv-summary');
const pcvFirstDateSummary = document.querySelector('#pcv-first-date-summary');

function localToday() {
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
}

const birthDatePicker = initThaiDatePicker({
  input: birthInput,
  valueInput: birthDateValue,
  root: document.querySelector('[data-date-picker="birth"]'),
  minDate: parseDate('1900-01-01'),
  maxDate: localToday,
  onOpen: () => { results.hidden = true; }
});
const pcvDatePicker = initThaiDatePicker({
  input: pcvFirstDate,
  valueInput: pcvFirstDateValue,
  root: document.querySelector('[data-date-picker="pcv"]'),
  minDate: () => parseDate(birthDateValue.value),
  maxDate: localToday,
  onOpen: () => { results.hidden = true; }
});

function renderRows(target, rows) {
  const labels = ['อายุ', 'วัคซีนที่ให้', 'วันที่ครบอายุ', 'วันนัดเบื้องต้น'];
  target.replaceChildren();
  for (const values of rows) {
    const row = document.createElement('tr');
    for (const [index, value] of values.entries()) {
      const cell = document.createElement('td');
      const label = document.createElement('span');
      label.className = 'cell-label';
      label.textContent = labels[index];
      const content = document.createElement('span');
      content.className = 'cell-value';
      if (typeof value === 'object') {
        const date = document.createElement('time');
        date.dateTime = value.date.toISOString().slice(0, 10);
        date.className = 'date-value';
        date.textContent = formatThaiDate(value.date);
        const age = document.createElement('span');
        age.className = 'date-age';
        age.textContent = value.age;
        content.append(date, age);
      } else {
        content.textContent = value;
      }
      cell.append(label, content);
      row.append(cell);
    }
    target.append(row);
  }
}

function renderPcvCards(rows, birthDate) {
  pcvBody.replaceChildren();
  for (const item of rows) {
    const card = document.createElement('article');
    card.className = 'pcv-card';
    card.setAttribute('role', 'listitem');

    const dose = document.createElement('span');
    dose.className = 'pcv-dose';
    dose.textContent = item.dose;

    const ageLabel = document.createElement('span');
    ageLabel.className = 'pcv-card-label';
    ageLabel.textContent = 'อายุตามตารางปกติ';

    const age = document.createElement('h3');
    age.className = 'pcv-card-age';
    age.textContent = item.age;

    const dateLabel = document.createElement('span');
    dateLabel.className = 'pcv-card-label';
    dateLabel.textContent = 'วันที่ครบอายุ';

    const date = document.createElement('time');
    date.className = 'pcv-card-date';
    date.dateTime = item.due.toISOString().slice(0, 10);
    date.textContent = formatThaiDate(item.due);

    const dueAge = document.createElement('span');
    dueAge.className = 'pcv-card-age-detail';
    dueAge.textContent = formatAge(birthDate, item.due);

    const divider = document.createElement('span');
    divider.className = 'pcv-card-divider';
    divider.setAttribute('aria-hidden', 'true');

    const appointmentLabel = document.createElement('span');
    appointmentLabel.className = 'pcv-card-label pcv-appointment-label';
    appointmentLabel.textContent = 'วันนัดเบื้องต้น';

    const appointment = document.createElement('time');
    appointment.className = 'pcv-card-date pcv-appointment-date';
    appointment.dateTime = item.appointment.toISOString().slice(0, 10);
    appointment.textContent = formatThaiDate(item.appointment);

    const appointmentAge = document.createElement('span');
    appointmentAge.className = 'pcv-card-age-detail';
    appointmentAge.textContent = formatAge(birthDate, item.appointment);

    card.append(dose, ageLabel, age, dateLabel, date, dueAge, divider,
      appointmentLabel, appointment, appointmentAge);
    pcvBody.append(card);
  }
}

birthInput.addEventListener('input', () => {
  birthInput.setCustomValidity('');
  pcvFirstDate.setCustomValidity('');
  const birth = parseThaiDate(birthInput.value);
  birthDateValue.value = birth?.toISOString().slice(0, 10) || '';
  const today = localToday();
  if (birth && birth <= today) {
    birthAgeValue.textContent = formatAge(birth, today);
    birthAge.hidden = false;
  } else {
    birthAgeValue.textContent = '';
    birthAge.hidden = true;
  }
  results.hidden = true;
});

pcvDoses.addEventListener('change', () => {
  const hasPcvHistory = ['1', '2', '3'].includes(pcvDoses.value);
  pcvFirstDateField.hidden = !hasPcvHistory;
  pcvFirstDate.required = hasPcvHistory;
  pcvFirstDate.setCustomValidity('');
  if (!hasPcvHistory) {
    pcvFirstDate.value = '';
    pcvFirstDateValue.value = '';
  }
  results.hidden = true;
});

pcvFirstDate.addEventListener('input', () => {
  pcvFirstDate.setCustomValidity('');
  pcvFirstDateValue.value = parseThaiDate(pcvFirstDate.value)?.toISOString().slice(0, 10) || '';
  results.hidden = true;
});

form.addEventListener('submit', event => {
  event.preventDefault();
  birthDatePicker.close();
  pcvDatePicker.close();
  const birth = parseDate(birthDateValue.value);
  if (!birth || birth > localToday()) {
    birthInput.setCustomValidity('กรุณาระบุวันเกิดที่ถูกต้องในรูปแบบ วว/ดด/พ.ศ. และไม่อยู่ในอนาคต');
    birthInput.reportValidity();
    results.hidden = true;
    return;
  }
  birthInput.setCustomValidity('');
  let firstDose = null;
  if (pcvFirstDate.required) {
    firstDose = parseDate(pcvFirstDateValue.value);
    if (!firstDose || firstDose < birth || firstDose > localToday()) {
      pcvFirstDate.setCustomValidity('กรุณาระบุวันที่ได้รับเข็มแรกตั้งแต่วันเกิดและไม่เกินวันนี้');
      pcvFirstDate.reportValidity();
      results.hidden = true;
      return;
    }
  }
  pcvFirstDate.setCustomValidity('');
  renderRows(body, createSchedule(birth).map(item =>
    [
      item.age,
      item.vaccines,
      { date: item.due, age: formatAge(birth, item.due) },
      { date: item.appointment, age: formatAge(birth, item.appointment) }
    ]));
  renderPcvCards(createPcvSchedule(birth), birth);
  summary.textContent = `วันเกิด: ${formatThaiDate(birth)}`;
  pcvSummary.textContent = `ประวัติ PCV ที่ระบุ: ${pcvDoses.selectedOptions[0].textContent}`;
  pcvFirstDateSummary.hidden = !firstDose;
  pcvFirstDateSummary.textContent = firstDose ? `วันที่ได้รับ PCV เข็มแรก: ${formatThaiDate(firstDose)}` : '';
  results.hidden = false;
});

form.addEventListener('invalid', () => {
  birthDatePicker.close();
  pcvDatePicker.close();
}, true);

document.querySelector('#print-button').addEventListener('click', () => window.print());
