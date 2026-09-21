(function attachQuizChoices(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.QuizChoices = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createQuizChoicesModule() {
  const LABELS = ['A', 'B', 'C', 'D'];

  function parseNumber(value) {
    const raw = String(value ?? '').trim().toLowerCase();
    const cleaned = raw
      .replace(/dollars?|cents?|degrees?|square units?|cubic units?|inches?|feet|yards?|hours?|minutes?|days?|weeks?/g, '')
      .replace(/[$,\u00b0]/g, '')
      .trim();
    const mixed = cleaned.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixed && Number(mixed[3]) !== 0) {
      const whole = Number(mixed[1]);
      const fraction = Number(mixed[2]) / Number(mixed[3]);
      return whole < 0 ? whole - fraction : whole + fraction;
    }
    const fraction = cleaned.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
    if (fraction && Number(fraction[2]) !== 0) return Number(fraction[1]) / Number(fraction[2]);
    const percent = cleaned.match(/^(-?\d*\.?\d+)\s*(?:%|percent)$/);
    if (percent) return Number(percent[1]) / 100;
    if (/^-?\d*\.?\d+$/.test(cleaned)) return Number(cleaned);
    return null;
  }

  function normalized(value) {
    return String(value ?? '')
      .toLowerCase()
      .trim()
      .replace(/\u00d7/g, 'x')
      .replace(/\s+/g, '')
      .replace(/[.$,\u00b0]/g, '');
  }

  function equivalent(left, right) {
    if (normalized(left) === normalized(right)) return true;
    const leftNumber = parseNumber(left);
    const rightNumber = parseNumber(right);
    return leftNumber !== null && rightNumber !== null && Math.abs(leftNumber - rightNumber) < 0.000001;
  }

  function formatNumber(value, decimalPlaces = 0) {
    if (!Number.isFinite(value)) return '';
    const places = Math.max(0, Math.min(decimalPlaces, 4));
    return Number(value.toFixed(places)).toString();
  }

  function addFractionDistractors(answer, add) {
    const match = answer.match(/^(-?\d+)\s*\/\s*(\d+)$/);
    if (!match) return;
    const numerator = Number(match[1]);
    const denominator = Number(match[2]);
    add(`${numerator + 1}/${denominator}`);
    add(`${Math.max(1, numerator - 1)}/${denominator}`);
    add(`${numerator}/${denominator + 1}`);
    add(`${denominator}/${numerator || 1}`);
    add(`${numerator + denominator}/${denominator}`);
  }

  function addCoordinateDistractors(answer, add) {
    const match = answer.match(/^\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/);
    if (!match) return;
    const x = Number(match[1]);
    const y = Number(match[2]);
    add(`(${y}, ${x})`);
    add(`(${-x}, ${y})`);
    add(`(${x}, ${-y})`);
    add(`(${x + 1}, ${y - 1})`);
  }

  function addInequalityDistractors(answer, add) {
    const match = answer.match(/^\s*([a-z])\s*(<=|>=|<|>)\s*(-?\d*\.?\d+)\s*$/i);
    if (!match) return;
    const variable = match[1];
    const sign = match[2];
    const boundary = Number(match[3]);
    const reversed = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' }[sign];
    add(`${variable} ${reversed} ${boundary}`);
    add(`${variable} ${sign} ${boundary + 1}`);
    add(`${variable} ${sign} ${boundary - 1}`);
    add(`${variable} ${reversed} ${-boundary}`);
  }

  function addScientificDistractors(answer, add) {
    const match = answer.match(/^(-?\d*\.?\d+)\s*[x\u00d7*]\s*10\^(-?\d+)$/i);
    if (!match) return;
    const coefficient = Number(match[1]);
    const exponent = Number(match[2]);
    add(`${coefficient} x 10^${exponent + 1}`);
    add(`${coefficient} x 10^${exponent - 1}`);
    add(`${formatNumber(coefficient + 1, 1)} x 10^${exponent}`);
    add(`${coefficient} x 10^${-exponent}`);
  }

  function addAlgebraDistractors(answer, add) {
    const linear = answer.match(/^(?:y\s*=\s*)?(-?\d*)x\s*([+-])\s*(\d+)$/i);
    if (linear) {
      const prefix = /^y\s*=/i.test(answer) ? 'y = ' : '';
      const coefficientText = linear[1];
      const coefficient = coefficientText === '' ? 1 : coefficientText === '-' ? -1 : Number(coefficientText);
      const constant = Number(linear[3]);
      const sign = linear[2];
      add(`${prefix}${coefficient === 1 ? '' : coefficient === -1 ? '-' : coefficient}x ${sign === '+' ? '-' : '+'} ${constant}`);
      add(`${prefix}${coefficient + 1}x ${sign} ${constant}`);
      add(`${prefix}${coefficient === 1 ? '' : coefficient === -1 ? '-' : coefficient}x ${sign} ${constant + 1}`);
    }

    const exponent = answer.match(/^([a-z])\^(\d+)$/i);
    if (exponent) {
      add(`${exponent[1]}^${Number(exponent[2]) + 1}`);
      add(`${exponent[1]}^${Math.max(1, Number(exponent[2]) - 1)}`);
      add(`${exponent[1]}^${Number(exponent[2]) * 2}`);
    }

    const factored = answer.match(/^(\d+)\((\d+)([a-z])\s*([+-])\s*(\d+)\)$/i);
    if (factored) {
      add(`${Number(factored[1]) + 1}(${factored[2]}${factored[3]} ${factored[4]} ${factored[5]})`);
      add(`${factored[1]}(${Number(factored[2]) + 1}${factored[3]} ${factored[4]} ${factored[5]})`);
      add(`${factored[1]}(${factored[2]}${factored[3]} ${factored[4] === '+' ? '-' : '+'} ${factored[5]})`);
    }
  }

  function addNumericDistractors(problem, answer, add) {
    const value = parseNumber(answer);
    if (value === null) return;
    const rawDecimal = answer.match(/^-?\d+\.(\d+)$/);
    const decimalPlaces = rawDecimal ? rawDecimal[1].length : 0;
    const step = decimalPlaces > 0 ? 1 / (10 ** decimalPlaces) : 1;

    const multiplication = String(problem.problem || '').match(/(-?\d*\.?\d+)\s*[x\u00d7*]\s*(-?\d*\.?\d+)/i);
    if (multiplication) {
      const a = Number(multiplication[1]);
      const b = Number(multiplication[2]);
      add(formatNumber(a * (b + 1), decimalPlaces));
      add(formatNumber(a * (b - 1), decimalPlaces));
      add(formatNumber((a + 1) * b, decimalPlaces));
    }

    const division = String(problem.problem || '').match(/(-?\d*\.?\d+)\s*(?:\u00f7|\/)\s*(-?\d*\.?\d+)/);
    if (division && Number(division[2]) !== 0) {
      const quotient = Number(division[1]) / Number(division[2]);
      add(formatNumber(quotient + step, decimalPlaces));
      add(formatNumber(quotient - step, decimalPlaces));
    }

    add(formatNumber(value + step, decimalPlaces));
    add(formatNumber(value - step, decimalPlaces));
    add(formatNumber(value + (2 * step), decimalPlaces));
    add(formatNumber(value - (2 * step), decimalPlaces));
    add(formatNumber(-value, decimalPlaces));
    if (Math.abs(value) >= 20) {
      add(formatNumber(value + 10, decimalPlaces));
      add(formatNumber(value - 10, decimalPlaces));
    }
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function createChoices(problem, correctIndex = 0) {
    const answer = String(problem.answer ?? '').trim();
    const accepted = Array.isArray(problem.acceptableAnswers)
      ? problem.acceptableAnswers.map(String)
      : [answer];
    const distractors = [];
    const add = candidate => {
      const value = String(candidate ?? '').trim();
      if (!value || accepted.some(correct => equivalent(value, correct))) return;
      if (distractors.some(existing => equivalent(value, existing))) return;
      distractors.push(value);
    };

    (problem.distractors || []).forEach(add);
    addCoordinateDistractors(answer, add);
    addInequalityDistractors(answer, add);
    addScientificDistractors(answer, add);
    addFractionDistractors(answer, add);
    addAlgebraDistractors(answer, add);
    addNumericDistractors(problem, answer, add);

    const genericNumber = parseNumber(answer);
    for (let offset = 1; distractors.length < 3 && offset < 20; offset++) {
      add(genericNumber === null ? `${answer} ${offset}` : formatNumber(genericNumber + offset));
    }

    const chosenDistractors = shuffle(distractors).slice(0, 3);
    const position = ((Number(correctIndex) % 4) + 4) % 4;
    const values = chosenDistractors;
    values.splice(position, 0, answer);
    return values.map((value, index) => ({
      label: LABELS[index],
      value
    }));
  }

  return { createChoices, equivalent };
});
