import { formatThaiDate, formatThaiDateInput, parseThaiDate } from './date-format.js';
import { parseDate } from './schedule.js';

const dayMilliseconds = 86400000;
const monthFormatter = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
});
const weekdayFormatter = new Intl.DateTimeFormat('th-TH', {
  weekday: 'long',
  timeZone: 'UTC'
});
const weekdayLabels = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

function todayUtc() {
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function shiftDate(date, days) {
  return new Date(date.getTime() + days * dayMilliseconds);
}

function firstOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function initThaiDatePicker({ input, valueInput, root, minDate, maxDate = todayUtc, onOpen = () => {} }) {
  const popover = root.querySelector('.calendar-popover');
  const trigger = root.querySelector('.calendar-toggle');
  const title = popover.querySelector('[data-calendar-title]');
  const weekdayRow = popover.querySelector('thead tr');
  const daysBody = popover.querySelector('tbody');
  const selectionLabel = popover.querySelector('[data-calendar-selection]');
  const previousButton = popover.querySelector('[data-calendar-previous]');
  const nextButton = popover.querySelector('[data-calendar-next]');
  const todayButton = popover.querySelector('[data-calendar-today]');
  let visibleMonth = firstOfMonth(todayUtc());
  let focusedDate = null;

  weekdayRow.replaceChildren(...weekdayLabels.map((label, index) => {
    const heading = document.createElement('th');
    heading.scope = 'col';
    heading.textContent = label;
    heading.setAttribute('aria-label', weekdayFormatter.format(new Date(Date.UTC(2023, 0, index + 1))));
    return heading;
  }));

  function getLimit(limit) {
    return typeof limit === 'function' ? limit() : limit;
  }

  function isDisabled(date) {
    const minimum = getLimit(minDate);
    const maximum = getLimit(maxDate);
    return (minimum && date < minimum) || (maximum && date > maximum);
  }

  function render() {
    title.textContent = monthFormatter.format(visibleMonth);
    const selectedDate = parseDate(valueInput.value);
    const dateToFocus = focusedDate || selectedDate || todayUtc();
    const firstWeekday = visibleMonth.getUTCDay();
    const dayCount = new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth() + 1, 0)).getUTCDate();
    const focusDay = dateToFocus.getUTCFullYear() === visibleMonth.getUTCFullYear()
      && dateToFocus.getUTCMonth() === visibleMonth.getUTCMonth()
      && !isDisabled(dateToFocus)
      ? dateToFocus.getUTCDate()
      : Array.from({ length: dayCount }, (_, index) => index + 1)
        .find(day => !isDisabled(new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth(), day))));
    const today = toIsoDate(todayUtc());
    const rows = [];

    for (let week = 0; week < 6; week += 1) {
      const row = document.createElement('tr');
      row.setAttribute('role', 'row');
      for (let weekday = 0; weekday < 7; weekday += 1) {
        const dayNumber = week * 7 + weekday - firstWeekday + 1;
        const cell = document.createElement('td');
        cell.setAttribute('role', 'gridcell');
        if (dayNumber < 1 || dayNumber > dayCount) {
          cell.setAttribute('aria-disabled', 'true');
        } else {
          const date = new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth(), dayNumber));
          const isoDate = toIsoDate(date);
          const dayButton = document.createElement('button');
          dayButton.type = 'button';
          dayButton.className = 'calendar-day';
          dayButton.textContent = String(dayNumber);
          dayButton.dataset.date = isoDate;
          dayButton.disabled = isDisabled(date);
          dayButton.tabIndex = dayNumber === focusDay ? 0 : -1;
          dayButton.setAttribute('aria-label', formatThaiDate(date));
          dayButton.setAttribute('aria-pressed', String(isoDate === valueInput.value));
          if (isoDate === valueInput.value) dayButton.classList.add('is-selected');
          if (isoDate === today) dayButton.classList.add('is-today');
          cell.append(dayButton);
        }
        row.append(cell);
      }
      rows.push(row);
    }

    daysBody.replaceChildren(...rows);
    selectionLabel.textContent = selectedDate
      ? `เลือกแล้ว ${formatThaiDate(selectedDate)}`
      : 'เลือกวันที่';
    previousButton.disabled = visibleMonth.getUTCFullYear() <= 1900 && visibleMonth.getUTCMonth() === 0;
    const maximum = getLimit(maxDate);
    nextButton.disabled = maximum
      && (visibleMonth.getUTCFullYear() > maximum.getUTCFullYear()
        || (visibleMonth.getUTCFullYear() === maximum.getUTCFullYear()
          && visibleMonth.getUTCMonth() >= maximum.getUTCMonth()));
  }

  function open() {
    const selectedDate = parseDate(valueInput.value);
    visibleMonth = firstOfMonth(selectedDate || todayUtc());
    focusedDate = selectedDate || todayUtc();
    onOpen();
    popover.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-expanded', 'true');
    render();
    daysBody.querySelector('[tabindex="0"]')?.focus();
  }

  function close(restoreFocus = false) {
    popover.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus();
  }

  function selectDate(date) {
    valueInput.value = toIsoDate(date);
    input.value = formatThaiDateInput(date);
    input.setCustomValidity('');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    close(true);
  }

  function moveMonth(amount) {
    visibleMonth = new Date(Date.UTC(
      visibleMonth.getUTCFullYear(),
      visibleMonth.getUTCMonth() + amount,
      1
    ));
    focusedDate = visibleMonth;
    render();
  }

  input.addEventListener('input', () => {
    const parsedDate = parseThaiDate(input.value);
    valueInput.value = parsedDate ? toIsoDate(parsedDate) : '';
  });
  input.addEventListener('change', () => {
    const parsedDate = parseThaiDate(input.value);
    if (parsedDate) input.value = formatThaiDateInput(parsedDate);
  });
  trigger.addEventListener('click', () => {
    if (popover.hidden) open();
    else close();
  });
  previousButton.addEventListener('click', () => moveMonth(-1));
  nextButton.addEventListener('click', () => moveMonth(1));
  todayButton.addEventListener('click', () => selectDate(todayUtc()));
  daysBody.addEventListener('click', event => {
    const dayButton = event.target.closest('[data-date]');
    if (dayButton && !dayButton.disabled) selectDate(parseDate(dayButton.dataset.date));
  });
  daysBody.addEventListener('keydown', event => {
    const dayButton = event.target.closest('[data-date]');
    if (!dayButton) return;
    const currentDate = parseDate(dayButton.dataset.date);
    const dayOfWeek = currentDate.getUTCDay();
    const offsets = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -dayOfWeek,
      End: 6 - dayOfWeek
    };
    if (Object.prototype.hasOwnProperty.call(offsets, event.key)) {
      event.preventDefault();
      const nextDate = shiftDate(currentDate, offsets[event.key]);
      if (isDisabled(nextDate)) return;
      focusedDate = nextDate;
      visibleMonth = firstOfMonth(nextDate);
      render();
      daysBody.querySelector(`[data-date="${toIsoDate(nextDate)}"]`)?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!root.contains(event.target) && !popover.hidden) close();
  });

  return { close };
}
