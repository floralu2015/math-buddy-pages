(() => {
  const originalFetch = window.fetch.bind(window);
  const activeGames = new Map();
  const STORAGE_KEY = 'mathBuddyStaticProgress';

  const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, 13000, 18000, 25000, 35000, 50000, 70000, 100000, 150000, 200000, 300000];
  const LEVEL_NAMES = [
    'Math Rookie', 'Number Ninja', 'Fraction Fighter', 'Equation Explorer', 'Math Master',
    'Math Wizard', 'Math Champion', 'Math Legend', 'Math Genius', 'Math Prodigy',
    'Grand Calculator', 'Supreme Mathematician', 'Algebra Ace', 'Geometry Guru',
    'Calculus Commander', 'Theorem Titan', 'Infinite Master', 'Quantum Calculator',
    'Math Deity', 'Legendary Mathlete'
  ];

  const TOPICS = {
    easy: ['addition', 'subtraction', 'simple multiplication', 'counting'],
    medium: ['multiplication facts', 'division facts', 'missing factors', 'basic fractions', 'decimals'],
    hard: ['foundation review', 'fraction operations', 'mixed numbers', 'percentages', 'percent change', 'multi-step problems', 'integer operations', 'scientific notation', 'data and statistics', 'multi-digit multiplication'],
    challenge: ['grade 6 bridge', 'ratios', 'two-step equations', 'inequalities', 'distributive property', 'combine like terms', 'gcf factoring', 'slope', 'slope-intercept form', 'scale factor', 'angle relationships', 'surface area and volume', 'pythagorean theorem']
  };
  const LEGACY_MODE_CONFIGS = {
    speed: {
      difficulty: 'hard',
      maxProblems: 10,
      topics: ['multiplication facts', 'division facts', 'missing factors', 'multi-digit multiplication', 'two-step equations']
    },
    streak: {
      difficulty: 'hard',
      topics: ['multiplication facts', 'division facts', 'foundation review', 'fraction operations', 'decimals', 'ratios', 'two-step equations']
    },
    daily: {
      difficulty: 'challenge',
      maxProblems: 1,
      topics: ['grade 6 bridge', 'two-step equations', 'inequalities', 'ratios', 'data and statistics', 'scale factor', 'angle relationships']
    },
    levelup: {
      difficulty: 'medium',
      topics: ['multiplication facts', 'division facts', 'foundation review', 'fraction operations', 'decimals']
    }
  };

  const QUIZ_TOPICS = {
    addition: { name: 'Addition', icon: '➕', description: 'Practice adding numbers', difficulty: 'easy', problems: 5, topics: ['addition'] },
    subtraction: { name: 'Subtraction', icon: '➖', description: 'Practice subtracting numbers', difficulty: 'easy', problems: 5, topics: ['subtraction'] },
    multiplication: { name: 'Multiplication', icon: '✖️', description: 'Build speed with multiplication facts', difficulty: 'medium', problems: 14, topics: ['multiplication facts', 'missing factors'] },
    multiplicationTables: { name: 'Times Table Arena', icon: '⚔️', description: '36 fast facts from 2x2 through 12x12', difficulty: 'medium', problems: 36, topics: ['multiplication facts', 'division facts', 'missing factors', 'multi-digit multiplication'], category: 'Fluency' },
    fifthGradeTuneUp: { name: '5th Grade Tune-Up', icon: '🛠️', description: 'Repair weak spots before 6th grade', difficulty: 'hard', problems: 22, topics: ['foundation review', 'division facts', 'fraction operations', 'decimals', 'multi-step problems'], category: 'Foundations' },
    grade6Bridge: { name: '6th Grade Bridge', icon: '🌉', description: 'Equations, ratios, data, geometry, and thinking problems', difficulty: 'challenge', problems: 24, topics: ['grade 6 bridge', 'two-step equations', 'inequalities', 'ratios', 'data and statistics', 'scale factor', 'angle relationships'], category: '6th Grade Prep' },
    division: { name: 'Division', icon: '➗', description: 'Practice dividing numbers', difficulty: 'medium', problems: 8, topics: ['division facts'] },
    fractions: { name: 'Fractions', icon: '🍕', description: 'Add, subtract & compare fractions', difficulty: 'hard', problems: 8, topics: ['fraction operations', 'basic fractions', 'mixed numbers'] },
    decimals: { name: 'Decimals', icon: '🔢', description: 'Work with decimal numbers', difficulty: 'medium', problems: 6, topics: ['decimals'] },
    percentages: { name: 'Percentages', icon: '%', description: 'Calculate percentages', difficulty: 'hard', problems: 6, topics: ['percentages'] },
    wordProblems: { name: 'Word Problems', icon: '📝', description: 'Solve real-world math puzzles', difficulty: 'challenge', problems: 5, topics: ['word problems'] },
    algebra: { name: 'Pre-Algebra', icon: '🔤', description: 'Solve for x!', difficulty: 'challenge', problems: 6, topics: ['algebra basics'] },
    equationsInequalities: { name: 'Equations & Inequalities', icon: '⚖️', description: 'Solve two-step equations and simple inequalities', difficulty: 'challenge', problems: 8, topics: ['two-step equations', 'inequalities'], category: '6th Grade Prep' },
    algebraEssentials: { name: 'Algebra Essentials', icon: '🧩', description: 'Distribute, combine terms, and factor', difficulty: 'challenge', problems: 8, topics: ['distributive property', 'combine like terms', 'gcf factoring'], category: '6th Grade Prep' },
    linearRelationships: { name: 'Linear Relationships', icon: '📈', description: 'Practice slope and line equations', difficulty: 'challenge', problems: 7, topics: ['slope', 'slope-intercept form'], category: '6th Grade Prep' },
    geometryMeasurement: { name: 'Geometry & Measurement', icon: '📐', description: 'Scale, area, volume, and right triangles', difficulty: 'challenge', problems: 8, topics: ['scale factor', 'surface area and volume', 'pythagorean theorem'], category: '6th Grade Prep' },
    statistics: { name: 'Data & Statistics', icon: '📊', description: 'Mean, median, mode, and range', difficulty: 'hard', problems: 6, topics: ['data and statistics'], category: '6th Grade Prep' },
    angles: { name: 'Angle Relationships', icon: '📏', description: 'Parallel lines, transversals, and angle sums', difficulty: 'challenge', problems: 6, topics: ['angle relationships'], category: '6th Grade Prep' },
    exponentsRoots: { name: 'Exponents & Roots', icon: '√', description: 'Perfect squares, roots, and scientific notation', difficulty: 'hard', problems: 7, topics: ['scientific notation', 'integer operations'], category: '6th Grade Prep' },
    mixedReview: { name: 'Mixed Review', icon: '🎲', description: 'Random mix of all topics', difficulty: 'medium', problems: 10, topics: null }
  };

  const CONCEPTS = [
    { id: 'addition', name: 'Addition', icon: '➕', description: 'Combining numbers together', relatedQuiz: 'addition' },
    { id: 'subtraction', name: 'Subtraction', icon: '➖', description: 'Taking away or finding the difference', relatedQuiz: 'subtraction' },
    { id: 'multiplication', name: 'Multiplication', icon: '✖️', description: 'Repeated addition and times tables', relatedQuiz: 'multiplication' },
    { id: 'division', name: 'Division', icon: '➗', description: 'Splitting into equal groups', relatedQuiz: 'division' },
    { id: 'fractions', name: 'Fractions', icon: '🍕', description: 'Parts of a whole', relatedQuiz: 'fractions' },
    { id: 'decimals', name: 'Decimals', icon: '🔢', description: 'Numbers with decimal points', relatedQuiz: 'decimals' },
    { id: 'equationsInequalities', name: 'Equations & Inequalities', icon: '⚖️', description: 'Balance equations and compare inequalities', relatedQuiz: 'equationsInequalities' },
    { id: 'geometryMeasurement', name: 'Geometry & Measurement', icon: '📐', description: 'Scale, area, volume, and angles', relatedQuiz: 'geometryMeasurement' },
    { id: 'statistics', name: 'Data & Statistics', icon: '📊', description: 'Mean, median, mode, and range', relatedQuiz: 'statistics' }
  ];

  const CONCEPT_EXPLANATIONS = {
    subtraction: `## What is Subtraction?
Subtraction means taking away or finding the difference between numbers. When you see the - sign, ask: what is left, or how far apart are these numbers?

## Real-World Examples
- Sarah has 12 stickers and gives away 5. She has \\(12 - 5 = 7\\) stickers left.
- A game score changes from 23 to 17. The difference is \\(23 - 17 = 6\\).

## Key Words to Know
- **Difference**: The answer when you subtract
- **Minus (-)**: The subtraction sign
- **Take away**: Remove some from the starting amount

## Quick Tips
- Count back for small numbers
- Count up from the smaller number to the bigger number to find the difference
- Use addition to check: if \\(15 - 7 = 8\\), then \\(8 + 7 = 15\\)

## Try It!
What is \\(18 - 9\\)?
Answer: \\(9\\)`
  };

  function json(data, init = {}) {
    return Promise.resolve(new Response(JSON.stringify(data), {
      status: init.status || 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  }

  function textResponse(text, init = {}) {
    return Promise.resolve(new Response(text, {
      status: init.status || 200,
      headers: { 'Content-Type': 'text/plain' }
    }));
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function choice(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function normalizeAnswer(answer) {
    return String(answer).toLowerCase().trim().replace(/\s+/g, ' ').replace(/[°$.]/g, '').replace(/×/g, 'x');
  }

  function parseToNumber(answer) {
    const cleaned = String(answer).toLowerCase().trim().replace(/dollars?|cents?|degrees?|°|\$/g, '').trim();
    if (/^-?\d*\.?\d+$/.test(cleaned)) return Number(cleaned);
    const fraction = cleaned.match(/^(-?\d+)\s*\/\s*(\d+)$/);
    if (fraction && Number(fraction[2]) !== 0) return Number(fraction[1]) / Number(fraction[2]);
    const mixed = cleaned.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixed && Number(mixed[3]) !== 0) {
      const whole = Number(mixed[1]);
      const part = Number(mixed[2]) / Number(mixed[3]);
      return whole >= 0 ? whole + part : whole - part;
    }
    return null;
  }

  function isCorrect(userAnswer, acceptableAnswers) {
    const normalized = normalizeAnswer(userAnswer);
    const numeric = parseToNumber(userAnswer);
    return acceptableAnswers.some(answer => {
      if (normalizeAnswer(answer) === normalized) return true;
      const answerNumber = parseToNumber(answer);
      return numeric !== null && answerNumber !== null && Math.abs(numeric - answerNumber) < 0.001;
    });
  }

  function multiplicationFact() {
    const hardPairs = [[6, 7], [6, 8], [6, 9], [7, 8], [7, 9], [8, 9], [8, 12], [9, 12], [11, 12], [12, 12], [4, 9], [6, 12]];
    const [a, b] = Math.random() < 0.65 ? choice(hardPairs) : [randomInt(2, 12), randomInt(2, 12)];
    const answer = a * b;
    return problem(`What is ${a} × ${b}?`, `${a} \\times ${b}`, answer, `Think ${a} groups of ${b}.`, `${a} × ${b} = ${answer}. Say the full fact out loud.`);
  }

  function divisionFact() {
    const a = randomInt(2, 12);
    const b = randomInt(2, 12);
    const total = a * b;
    return problem(`What is ${total} ÷ ${a}?`, `${total} \\div ${a}`, b, `Use the related fact: ${a} × ? = ${total}.`, `${a} × ${b} = ${total}, so ${total} ÷ ${a} = ${b}.`);
  }

  function missingFactor() {
    const a = randomInt(3, 12);
    const b = randomInt(3, 12);
    const total = a * b;
    const unknownFirst = Math.random() < 0.5;
    return problem(
      unknownFirst ? `? × ${b} = ${total}` : `${a} × ? = ${total}`,
      unknownFirst ? `? \\times ${b} = ${total}` : `${a} \\times ? = ${total}`,
      unknownFirst ? a : b,
      `Turn it into division: ${total} divided by the known factor.`,
      unknownFirst ? `${total} ÷ ${b} = ${a}.` : `${total} ÷ ${a} = ${b}.`
    );
  }

  function multiDigitMultiplication() {
    const a = randomInt(13, 49);
    const b = randomInt(3, 9);
    const tens = Math.floor(a / 10) * 10;
    const ones = a % 10;
    return problem(`What is ${a} × ${b}?`, `${a} \\times ${b}`, a * b, `Break ${a} into ${tens} + ${ones}.`, `${a} × ${b} = ${tens * b} + ${ones * b} = ${a * b}.`);
  }

  function foundationReview(kindOverride = null) {
    const kind = kindOverride || choice(['fractionOfNumber', 'decimalAdd', 'decimalSubtract', 'fractionSimplify', 'area', 'orderOps']);
    if (kind === 'fractionOfNumber') {
      const denominator = choice([3, 4, 5, 6, 8, 10, 12]);
      const multiplier = randomInt(2, 9);
      const whole = denominator * multiplier;
      const numerator = randomInt(1, denominator - 1);
      return problem(`What is ${numerator}/${denominator} of ${whole}?`, `\\frac{${numerator}}{${denominator}} \\times ${whole}`, numerator * multiplier, `Find 1/${denominator} first.`, `${whole} ÷ ${denominator} = ${multiplier}; ${multiplier} × ${numerator} = ${numerator * multiplier}.`);
    }
    if (kind === 'decimalAdd') {
      const a = randomInt(12, 89) / 10;
      const b = randomInt(11, 79) / 10;
      const answer = Number((a + b).toFixed(1));
      return problem(`What is ${a.toFixed(1)} + ${b.toFixed(1)}?`, `${a.toFixed(1)} + ${b.toFixed(1)}`, answer, 'Line up the decimal points.', `${a.toFixed(1)} + ${b.toFixed(1)} = ${answer.toFixed(1)}.`);
    }
    if (kind === 'decimalSubtract') {
      const a = randomInt(45, 99) / 10;
      const b = randomInt(11, Math.floor(a * 10) - 5) / 10;
      const answer = Number((a - b).toFixed(1));
      return problem(`What is ${a.toFixed(1)} - ${b.toFixed(1)}?`, `${a.toFixed(1)} - ${b.toFixed(1)}`, answer, 'Line up decimal points.', `${a.toFixed(1)} - ${b.toFixed(1)} = ${answer.toFixed(1)}.`);
    }
    if (kind === 'fractionSimplify') {
      const baseNum = randomInt(2, 8);
      const baseDen = randomInt(baseNum + 1, 12);
      const factor = choice([2, 3, 4, 5]);
      return {
        problem: `Simplify ${baseNum * factor}/${baseDen * factor}.`,
        problemLatex: `\\frac{${baseNum * factor}}{${baseDen * factor}}`,
        answer: `${baseNum}/${baseDen}`,
        acceptableAnswers: [`${baseNum}/${baseDen}`],
        hint: `Divide top and bottom by ${factor}.`,
        explanation: `${baseNum * factor} ÷ ${factor} = ${baseNum}; ${baseDen * factor} ÷ ${factor} = ${baseDen}.`
      };
    }
    if (kind === 'area') {
      const length = randomInt(6, 18);
      const width = randomInt(4, 12);
      return problem(`A rectangle is ${length} units long and ${width} units wide. What is its area?`, `${length} \\times ${width}`, length * width, 'Area is length times width.', `Area = ${length} × ${width} = ${length * width} square units.`);
    }
    const a = randomInt(3, 12);
    const b = randomInt(2, 9);
    const c = randomInt(4, 15);
    return problem(`Calculate: ${c} + ${a} × ${b}`, `${c} + ${a} \\times ${b}`, c + a * b, 'Multiply before adding.', `${a} × ${b} = ${a * b}; ${c} + ${a * b} = ${c + a * b}.`);
  }

  function fractionPractice(topic = 'fraction operations') {
    if (topic === 'basic fractions') return foundationReview(choice(['fractionOfNumber', 'fractionSimplify']));
    if (topic === 'mixed numbers') {
      const whole = randomInt(1, 5);
      const denominator = choice([3, 4, 5, 6, 8]);
      const numerator = randomInt(1, denominator - 1);
      const improper = whole * denominator + numerator;
      return {
        problem: `Convert ${whole} ${numerator}/${denominator} to an improper fraction.`,
        problemLatex: `${whole}\\frac{${numerator}}{${denominator}}`,
        answer: `${improper}/${denominator}`,
        acceptableAnswers: [`${improper}/${denominator}`],
        hint: `Multiply ${whole} by ${denominator}, then add ${numerator}.`,
        explanation: `${whole} × ${denominator} + ${numerator} = ${improper}, so the fraction is ${improper}/${denominator}.`
      };
    }
    const denominator = choice([4, 6, 8, 10, 12]);
    const a = randomInt(1, Math.floor(denominator / 2));
    const b = randomInt(1, denominator - a - 1);
    return {
      problem: `What is ${a}/${denominator} + ${b}/${denominator}?`,
      problemLatex: `\\frac{${a}}{${denominator}} + \\frac{${b}}{${denominator}}`,
      answer: `${a + b}/${denominator}`,
      acceptableAnswers: [`${a + b}/${denominator}`],
      hint: 'The denominators already match, so add the numerators.',
      explanation: `${a}/${denominator} + ${b}/${denominator} = ${a + b}/${denominator}.`
    };
  }

  function decimalPractice() {
    return foundationReview(choice(['decimalAdd', 'decimalSubtract']));
  }

  function percentagePractice() {
    const percent = choice([10, 20, 25, 50, 75]);
    const whole = choice([40, 60, 80, 100, 120, 200]);
    const answer = whole * percent / 100;
    return problem(`What is ${percent}% of ${whole}?`, `${percent}\\% \\times ${whole}`, answer, `${percent}% means ${percent} out of 100.`, `${whole} × ${percent / 100} = ${answer}.`);
  }

  function multiStepPractice() {
    return foundationReview('orderOps');
  }

  function integerOperations() {
    const kind = choice(['add', 'subtract', 'multiply']);
    if (kind === 'add') {
      const a = randomInt(3, 14);
      const b = randomInt(5, 18);
      const answer = b - a;
      return problem(`What is -${a} + ${b}?`, `-${a} + ${b}`, answer, `Start at -${a} and move ${b} spaces right.`, `-${a} + ${b} = ${answer}.`);
    }
    if (kind === 'subtract') {
      const a = randomInt(4, 16);
      const b = randomInt(2, 12);
      const answer = -a - b;
      return problem(`What is -${a} - ${b}?`, `-${a} - ${b}`, answer, `Subtracting ${b} moves ${b} more spaces left.`, `-${a} - ${b} = ${answer}.`);
    }
    const a = randomInt(3, 9);
    const b = randomInt(3, 8);
    return problem(`What is -${a} × ${b}?`, `-${a} \\times ${b}`, -a * b, 'A negative times a positive is negative.', `-${a} × ${b} = ${-a * b}.`);
  }

  function scientificNotation() {
    if (Math.random() < 0.5) {
      const coefficient = randomInt(12, 98) / 10;
      const exponent = randomInt(3, 6);
      const value = coefficient * (10 ** exponent);
      const answer = `${coefficient} x 10^${exponent}`;
      return {
        problem: `Write ${value.toLocaleString('en-US')} in scientific notation.`,
        problemLatex: `${value}`,
        answer,
        acceptableAnswers: [answer, `${coefficient} × 10^${exponent}`, `${coefficient}*10^${exponent}`, `${coefficient} times 10^${exponent}`],
        hint: 'Move the decimal until the first number is at least 1 and less than 10.',
        explanation: `${value.toLocaleString('en-US')} = ${coefficient} × 10^${exponent}.`
      };
    }
    const coefficient = randomInt(12, 98) / 10;
    const exponent = randomInt(2, 4);
    const zeros = '0'.repeat(exponent - 1);
    const value = `0.${zeros}${String(coefficient).replace('.', '')}`;
    const answer = `${coefficient} x 10^-${exponent}`;
    return {
      problem: `Write ${value} in scientific notation.`,
      problemLatex: value,
      answer,
      acceptableAnswers: [answer, `${coefficient} × 10^-${exponent}`, `${coefficient}*10^-${exponent}`, `${coefficient} times 10^-${exponent}`],
      hint: `Move the decimal ${exponent} places to make ${coefficient}.`,
      explanation: `${value} = ${coefficient} × 10^-${exponent}.`
    };
  }

  function percentChange() {
    const original = choice([20, 24, 30, 40, 50, 60, 80]);
    const percent = choice([10, 15, 20, 25, 50]);
    const increase = Math.random() < 0.6;
    const change = original * percent / 100;
    const newValue = increase ? original + change : original - change;
    return {
      problem: `A price ${increase ? 'increases' : 'decreases'} from $${original} to $${newValue}. What is the percent change?`,
      problemLatex: `\\frac{${Math.abs(newValue - original)}}{${original}} \\times 100\\%`,
      answer: String(percent),
      acceptableAnswers: [String(percent), `${percent}%`, `${percent} percent`, `${percent / 100}`],
      hint: 'Percent change is change divided by the original amount.',
      explanation: `The change is ${Math.abs(newValue - original)}. ${Math.abs(newValue - original)} ÷ ${original} = ${percent / 100} = ${percent}%.`
    };
  }

  function distributiveProperty() {
    const a = randomInt(2, 8);
    const b = randomInt(2, 7);
    const c = randomInt(2, 12);
    return {
      problem: `Expand: ${a}(${b}x + ${c})`,
      problemLatex: `${a}(${b}x + ${c})`,
      answer: `${a * b}x + ${a * c}`,
      acceptableAnswers: [`${a * b}x + ${a * c}`, `${a * b}x+${a * c}`],
      hint: `Multiply both terms inside the parentheses by ${a}.`,
      explanation: `${a} × ${b}x = ${a * b}x and ${a} × ${c} = ${a * c}, so the expanded form is ${a * b}x + ${a * c}.`
    };
  }

  function combineLikeTerms() {
    const a = randomInt(2, 9);
    const b = randomInt(2, 9);
    const c = randomInt(1, 12);
    const d = randomInt(1, 8);
    const constant = c - d;
    const expression = constant < 0
      ? `${a + b}x - ${Math.abs(constant)}`
      : `${a + b}x + ${constant}`;
    return {
      problem: `Simplify: ${a}x + ${c} + ${b}x - ${d}`,
      problemLatex: `${a}x + ${c} + ${b}x - ${d}`,
      answer: expression,
      acceptableAnswers: [expression, expression.replace(/\s+/g, '')],
      hint: 'Combine the x terms, then combine the plain numbers.',
      explanation: `${a}x + ${b}x = ${a + b}x and ${c} - ${d} = ${constant}.`
    };
  }

  function gcfFactoring() {
    const factor = choice([2, 3, 4, 5, 6]);
    const a = randomInt(2, 7);
    const b = randomInt(2, 9);
    return {
      problem: `Factor using the GCF: ${factor * a}x + ${factor * b}`,
      problemLatex: `${factor * a}x + ${factor * b}`,
      answer: `${factor}(${a}x + ${b})`,
      acceptableAnswers: [`${factor}(${a}x + ${b})`, `${factor}(${a}x+${b})`, `${factor} * (${a}x + ${b})`],
      hint: `The greatest common factor is ${factor}.`,
      explanation: `Factor out ${factor}: ${factor * a}x + ${factor * b} = ${factor}(${a}x + ${b}).`
    };
  }

  function slopeProblem() {
    const x1 = randomInt(-3, 3);
    const y1 = randomInt(-4, 5);
    const slope = choice([-3, -2, -1, 2, 3, 4]);
    const run = choice([2, 3, 4]);
    const x2 = x1 + run;
    const y2 = y1 + slope * run;
    return {
      problem: `What is the slope through (${x1}, ${y1}) and (${x2}, ${y2})?`,
      problemLatex: `m = \\frac{${y2} - ${y1}}{${x2} - ${x1}}`,
      answer: String(slope),
      acceptableAnswers: [String(slope), `m=${slope}`, `m = ${slope}`],
      hint: 'Slope is change in y divided by change in x.',
      explanation: `Change in y is ${y2 - y1}; change in x is ${x2 - x1}. Slope = ${y2 - y1} ÷ ${x2 - x1} = ${slope}.`
    };
  }

  function slopeInterceptForm() {
    const slope = choice([-3, -2, -1, 2, 3, 4]);
    const intercept = choice([-5, -3, -1, 2, 4, 6]);
    const sign = intercept < 0 ? '-' : '+';
    const absIntercept = Math.abs(intercept);
    const answer = `y = ${slope === -1 ? '-' : slope === 1 ? '' : slope}x ${sign} ${absIntercept}`;
    return {
      problem: `Write the line with slope ${slope} and y-intercept ${intercept} in slope-intercept form.`,
      problemLatex: `m = ${slope}, b = ${intercept}`,
      answer,
      acceptableAnswers: [answer, answer.replace(/\s+/g, ''), answer.replace('y = ', '')],
      hint: 'Use y = mx + b.',
      explanation: `Substitute m = ${slope} and b = ${intercept} into y = mx + b.`
    };
  }

  function surfaceAreaVolume() {
    const length = randomInt(3, 9);
    const width = randomInt(2, 8);
    const height = randomInt(2, 7);
    const volume = length * width * height;
    return problem(`A rectangular prism is ${length} cm long, ${width} cm wide, and ${height} cm tall. What is its volume?`, `${length} \\times ${width} \\times ${height}`, volume, 'Volume is length times width times height.', `V = ${length} × ${width} × ${height} = ${volume} cubic centimeters.`);
  }

  function pythagoreanTheorem() {
    const triples = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]];
    const [a, b, c] = choice(triples);
    return problem(`A right triangle has legs ${a} and ${b}. What is the hypotenuse?`, `${a}^2 + ${b}^2 = c^2`, c, 'Use a^2 + b^2 = c^2.', `${a}^2 + ${b}^2 = ${a * a + b * b}, so c = ${c}.`);
  }

  function grade6Bridge(topic) {
    const kind = topic && topic !== 'grade 6 bridge' ? topic : choice(['two-step equations', 'inequalities', 'ratios', 'data and statistics', 'scale factor', 'angle relationships', 'slope']);
    if (kind === 'two-step equations' || kind === 'algebra basics') {
      const x = randomInt(3, 12);
      const a = randomInt(2, 6);
      const b = randomInt(4, 15);
      const total = a * x + b;
      return algebraProblem(`Solve: ${a}x + ${b} = ${total}`, `${a}x + ${b} = ${total}`, x, `Undo +${b}, then divide by ${a}.`, `Subtract ${b}: ${a}x = ${total - b}. Divide by ${a}: x = ${x}.`);
    }
    if (kind === 'inequalities') {
      const boundary = randomInt(4, 12);
      const a = randomInt(2, 5);
      const b = randomInt(3, 10);
      const total = a * boundary + b;
      return {
        problem: `Solve: ${a}x + ${b} < ${total}`,
        problemLatex: `${a}x + ${b} < ${total}`,
        answer: `x < ${boundary}`,
        acceptableAnswers: [`x < ${boundary}`, `x<${boundary}`, `less than ${boundary}`],
        hint: `Subtract ${b}, then divide by ${a}.`,
        explanation: `${a}x + ${b} < ${total}; ${a}x < ${total - b}; x < ${boundary}.`
      };
    }
    if (kind === 'ratios') {
      const a = randomInt(2, 5);
      const b = randomInt(3, 8);
      const scale = randomInt(3, 7);
      return problem(`The ratio is ${a}:${b}. If the second amount is ${b * scale}, what is the first amount?`, `\\frac{${a}}{${b}} = \\frac{x}{${b * scale}}`, a * scale, `The second amount was multiplied by ${scale}.`, `${a} × ${scale} = ${a * scale}.`);
    }
    if (kind === 'data and statistics') {
      const mean = randomInt(8, 15);
      const values = [mean - 2, mean, mean + 3];
      const missing = mean * 4 - values.reduce((sum, value) => sum + value, 0);
      return problem(`The mean of ${values.join(', ')}, and one missing number is ${mean}. What is the missing number?`, `\\frac{${values.join(' + ')} + x}{4} = ${mean}`, missing, `The total must be ${mean * 4}.`, `Known total is ${values.reduce((sum, value) => sum + value, 0)}; missing is ${missing}.`);
    }
    if (kind === 'scale factor') {
      const original = randomInt(3, 9);
      const factor = choice([2, 3, 4, 5]);
      return problem(`A drawing side is ${original} cm. The scale factor is ${factor}. What is the real side?`, `${original} \\times ${factor}`, original * factor, 'Multiply by the scale factor.', `${original} × ${factor} = ${original * factor} cm.`);
    }
    if (kind === 'angle relationships') {
      const angle = choice([45, 55, 65, 75, 105, 115, 125, 135]);
      return problem(`Two angles form a straight line. One is ${angle}°. What is the other?`, `${angle}^\\circ + x = 180^\\circ`, 180 - angle, 'Straight-line angles add to 180°.', `180 - ${angle} = ${180 - angle}.`);
    }
    if (kind === 'percent change') return percentChange();
    if (kind === 'integer operations') return integerOperations();
    if (kind === 'scientific notation') return scientificNotation();
    if (kind === 'distributive property') return distributiveProperty();
    if (kind === 'combine like terms') return combineLikeTerms();
    if (kind === 'gcf factoring') return gcfFactoring();
    if (kind === 'slope') return slopeProblem();
    if (kind === 'slope-intercept form') return slopeInterceptForm();
    if (kind === 'surface area and volume') return surfaceAreaVolume();
    if (kind === 'pythagorean theorem') return pythagoreanTheorem();
    return foundationReview();
  }

  function problem(problemText, problemLatex, answer, hint, explanation) {
    return {
      problem: problemText,
      problemLatex,
      answer: String(answer),
      acceptableAnswers: [String(answer), `${answer}`],
      hint,
      explanation
    };
  }

  function algebraProblem(problemText, problemLatex, answer, hint, explanation) {
    return {
      problem: problemText,
      problemLatex,
      answer: String(answer),
      acceptableAnswers: [String(answer), `x=${answer}`, `x = ${answer}`],
      hint,
      explanation
    };
  }

  function generateProblem(difficulty = 'medium', topic = null) {
    const selectedTopic = topic || choice(TOPICS[difficulty] || TOPICS.medium);
    const generators = {
      addition: () => problem(`What is ${randomInt(8, 99)} + ${randomInt(6, 80)}?`, '', 0, 'Add by place value.', ''),
      subtraction: () => {
        const a = randomInt(40, 140);
        const b = randomInt(8, a - 5);
        return problem(`What is ${a} - ${b}?`, `${a} - ${b}`, a - b, 'Subtract by place value.', `${a} - ${b} = ${a - b}.`);
      },
      'simple multiplication': multiplicationFact,
      multiplication: multiplicationFact,
      'multiplication facts': multiplicationFact,
      division: divisionFact,
      'division facts': divisionFact,
      'missing factors': missingFactor,
      'multi-digit multiplication': multiDigitMultiplication,
      'foundation review': foundationReview,
      'basic fractions': () => fractionPractice('basic fractions'),
      'fraction operations': () => fractionPractice('fraction operations'),
      'mixed numbers': () => fractionPractice('mixed numbers'),
      decimals: decimalPractice,
      percentages: percentagePractice,
      'percent change': percentChange,
      'multi-step problems': multiStepPractice,
      'integer operations': integerOperations,
      'scientific notation': scientificNotation,
      'data and statistics': () => grade6Bridge('data and statistics'),
      ratios: () => grade6Bridge('ratios'),
      'two-step equations': () => grade6Bridge('two-step equations'),
      inequalities: () => grade6Bridge('inequalities'),
      'algebra basics': () => grade6Bridge('two-step equations'),
      'distributive property': distributiveProperty,
      'combine like terms': combineLikeTerms,
      'gcf factoring': gcfFactoring,
      slope: slopeProblem,
      'slope-intercept form': slopeInterceptForm,
      'scale factor': () => grade6Bridge('scale factor'),
      'angle relationships': () => grade6Bridge('angle relationships'),
      'surface area and volume': surfaceAreaVolume,
      'pythagorean theorem': pythagoreanTheorem,
      'grade 6 bridge': () => grade6Bridge('grade 6 bridge')
    };
    let generated = (generators[selectedTopic] || foundationReview)();
    if (generated.answer === '0' && selectedTopic === 'addition') {
      const a = randomInt(8, 99);
      const b = randomInt(6, 80);
      generated = problem(`What is ${a} + ${b}?`, `${a} + ${b}`, a + b, 'Add ones, then tens.', `${a} + ${b} = ${a + b}.`);
    }
    return { ...generated, difficulty, topic: selectedTopic };
  }

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        xp: 0,
        totalProblemsSolved: 0,
        totalCorrect: 0,
        bestStreak: 0,
        badges: []
      };
    } catch {
      return { xp: 0, totalProblemsSolved: 0, totalCorrect: 0, bestStreak: 0, badges: [] };
    }
  }

  function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function progressResponse() {
    const progress = loadProgress();
    const level = Math.max(1, LEVEL_THRESHOLDS.findIndex((threshold, index) => progress.xp < (LEVEL_THRESHOLDS[index + 1] || Infinity)) + 1);
    return {
      xp: progress.xp,
      level,
      levelName: LEVEL_NAMES[level - 1] || 'Math Rookie',
      nextLevelXP: LEVEL_THRESHOLDS[level] || null,
      totalProblemsSolved: progress.totalProblemsSolved,
      totalCorrect: progress.totalCorrect,
      accuracy: progress.totalProblemsSolved ? Math.round((progress.totalCorrect / progress.totalProblemsSolved) * 100) : 0,
      bestStreak: progress.bestStreak,
      dailyStreak: 0,
      badges: progress.badges || [],
      bestScores: []
    };
  }

  function formatProblem(problemData, number, total) {
    return {
      number,
      total: total === 999 ? null : total,
      text: problemData.problem,
      latex: problemData.problemLatex,
      difficulty: problemData.difficulty,
      hint: problemData.hint,
      topic: problemData.topic
    };
  }

  function startGame(body) {
    const gameId = `static-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let difficulty = 'medium';
    let maxProblems = 999;
    let topicPool = null;
    let topic = null;
    let quizName = null;

    if (LEGACY_MODE_CONFIGS[body.gameType]) {
      const modeConfig = LEGACY_MODE_CONFIGS[body.gameType];
      difficulty = modeConfig.difficulty;
      maxProblems = modeConfig.maxProblems || maxProblems;
      topicPool = modeConfig.topics;
    }
    if (body.gameType === 'quiz' && QUIZ_TOPICS[body.quizTopic]) {
      const quiz = QUIZ_TOPICS[body.quizTopic];
      difficulty = quiz.difficulty;
      maxProblems = quiz.problems;
      topicPool = quiz.topics;
      quizName = quiz.name;
    }
    if (body.gameType === 'custom') {
      difficulty = TOPICS[body.difficulty] ? body.difficulty : 'medium';
      maxProblems = Math.min(Math.max(Number(body.problemCount) || 12, 5), 36);
      topicPool = Array.isArray(body.topicPool) ? body.topicPool : null;
      quizName = body.customName || 'Custom Practice';
    }

    if (topicPool?.length) topic = choice(topicPool);
    const firstProblem = generateProblem(difficulty, topic);
    activeGames.set(gameId, {
      gameId,
      gameType: body.gameType,
      difficulty,
      maxProblems,
      topic,
      topicPool,
      quizName,
      currentProblem: firstProblem,
      problemNumber: 1,
      score: 0,
      problemsAttempted: 0,
      problemsCorrect: 0,
      currentStreak: 0,
      maxStreak: 0,
      startTime: Date.now()
    });

    return {
      success: true,
      gameId,
      gameType: body.gameType,
      quizTopic: body.quizTopic || null,
      quizName,
      problem: formatProblem(firstProblem, 1, maxProblems),
      score: 0,
      streak: 0
    };
  }

  function endGame(game, last = {}) {
    const progress = loadProgress();
    progress.xp += game.score;
    progress.totalProblemsSolved += game.problemsAttempted;
    progress.totalCorrect += game.problemsCorrect;
    progress.bestStreak = Math.max(progress.bestStreak || 0, game.maxStreak);
    saveProgress(progress);
    activeGames.delete(game.gameId);

    return {
      success: true,
      gameOver: true,
      correct: last.correct,
      correctAnswer: last.correctAnswer,
      explanation: last.explanation,
      xpEarned: game.score,
      score: game.score,
      streak: game.currentStreak,
      newBadges: [],
      stats: {
        score: game.score,
        problemsAttempted: game.problemsAttempted,
        problemsCorrect: game.problemsCorrect,
        accuracy: game.problemsAttempted ? Math.round((game.problemsCorrect / game.problemsAttempted) * 100) : 0,
        maxStreak: game.maxStreak,
        duration: Math.floor((Date.now() - game.startTime) / 1000)
      },
      levelUp: false,
      progress: progressResponse()
    };
  }

  function submitAnswer(body) {
    const game = activeGames.get(body.gameId);
    if (!game) return { success: false, error: 'Game not found' };

    const current = game.currentProblem;
    const correct = isCorrect(body.answer, current.acceptableAnswers);
    game.problemsAttempted++;

    let xpEarned = 0;
    if (correct) {
      game.problemsCorrect++;
      game.currentStreak++;
      game.maxStreak = Math.max(game.maxStreak, game.currentStreak);
      xpEarned = 10 + Math.max(0, game.currentStreak - 1) * 5;
      game.score += xpEarned;
    } else {
      if (game.gameType === 'streak') {
        return endGame(game, { correct, correctAnswer: current.answer, explanation: current.explanation });
      }
      game.currentStreak = 0;
    }

    if (game.problemNumber >= game.maxProblems || game.gameType === 'daily') {
      return endGame(game, { correct, correctAnswer: current.answer, explanation: current.explanation });
    }

    if (game.gameType === 'levelup' && correct) {
      const difficulties = ['easy', 'medium', 'hard', 'challenge'];
      const currentIndex = difficulties.indexOf(game.difficulty);
      game.difficulty = difficulties[Math.min(currentIndex + 1, difficulties.length - 1)];
    }

    if (game.topicPool?.length) {
      game.topic = choice(game.topicPool);
    }
    const nextProblem = generateProblem(game.difficulty, game.topic);
    game.problemNumber++;
    game.currentProblem = nextProblem;

    return {
      success: true,
      correct,
      correctAnswer: current.answer,
      explanation: current.explanation,
      xpEarned,
      score: game.score,
      streak: game.currentStreak,
      newBadges: [],
      nextProblem: formatProblem(nextProblem, game.problemNumber, game.maxProblems)
    };
  }

  async function parseBody(init) {
    if (!init?.body) return {};
    if (typeof init.body === 'string') {
      try {
        return JSON.parse(init.body);
      } catch {
        return {};
      }
    }
    return {};
  }

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const path = new URL(url, window.location.href).pathname;
    if (!path.startsWith('/api/')) return originalFetch(input, init);

    const body = await parseBody(init);

    if (path === '/api/tts-check') return json({ available: false });
    if (path === '/api/reset') return json({ success: true });
    if (path === '/api/transcribe') return json({ error: 'Voice input needs the full Math Buddy server. Use typing on this GitHub version.' }, { status: 200 });
    if (path === '/api/tts') return textResponse('', { status: 404 });
    if (path === '/api/chat') {
      return json({
        response: 'This GitHub version is for games and practice. The AI tutor, photo help, and voice features need the full Math Buddy server.',
        sessionId: body.sessionId || `static-${Date.now()}`
      });
    }
    if (path === '/api/analyze-homework') {
      return json({ error: 'Photo homework help needs the full Math Buddy server. The games work here.' });
    }
    if (path === '/api/game/progress') return json({ success: true, progress: progressResponse() });
    if (path === '/api/game/daily') return json({ alreadyCompleted: false });
    if (path === '/api/game/quiz-topics') {
      return json({
        success: true,
        topics: Object.entries(QUIZ_TOPICS).map(([id, config]) => ({
          id,
          name: config.name,
          icon: config.icon,
          description: config.description,
          difficulty: config.difficulty,
          problemCount: config.problems,
          category: config.category || 'Core Practice'
        }))
      });
    }
    if (path === '/api/concepts') return json({ success: true, concepts: CONCEPTS });
    if (path.startsWith('/api/concepts/') && path.endsWith('/explain')) {
      const conceptId = decodeURIComponent(path.split('/')[3] || '');
      const concept = CONCEPTS.find(item => item.id === conceptId);
      return json({
        success: Boolean(concept),
        name: concept?.name || 'Math Concept',
        icon: concept?.icon || '💡',
        relatedQuiz: concept?.relatedQuiz || null,
        explanation: CONCEPT_EXPLANATIONS[conceptId] || '## Quick explanation\nThis GitHub version keeps concepts simple. Pick a practice deck to build the skill with examples.'
      });
    }
    if (path === '/api/game/start') return json(startGame(body));
    if (path === '/api/game/answer') return json(submitAnswer(body));
    if (path === '/api/game/end') {
      const game = activeGames.get(body.gameId);
      if (game) activeGames.delete(body.gameId);
      return json({ success: true });
    }

    return json({ error: 'This feature needs the full Math Buddy server.' }, { status: 404 });
  };
})();
