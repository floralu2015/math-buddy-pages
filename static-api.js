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
    medium: ['multiplication facts', 'division facts', 'missing factors', 'basic fractions', 'decimals', 'integer number lines', 'measurement conversions'],
    hard: ['foundation review', 'fraction operations', 'mixed numbers', 'percentages', 'percent change', 'multi-step problems', 'integer operations', 'scientific notation', 'data and statistics', 'multi-digit multiplication', 'rates and averages', 'probability', 'perimeter and area', 'powers and roots'],
    challenge: ['grade 6 bridge', 'ratios', 'proportions', 'two-step equations', 'properties of equality', 'inequalities', 'distributive property', 'combine like terms', 'gcf factoring', 'functions', 'coordinate plane', 'lines and angles', 'polygons', 'circles', 'laws of exponents', 'transformations', 'slope', 'slope-intercept form', 'scale factor', 'angle relationships', 'surface area and volume', 'pythagorean theorem']
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
      topics: ['grade 6 bridge', 'two-step equations', 'inequalities', 'ratios', 'data and statistics', 'scale factor', 'angle relationships', 'coordinate plane']
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
    multiplicationSprint: { name: 'Multiplication Sprint', icon: '⚡', description: 'Facts, missing factors, and smart fact strategies', difficulty: 'medium', problems: 16, topics: ['multiplication facts', 'missing factors'], category: 'Fluency' },
    divisionDash: { name: 'Division Dash', icon: '➗', description: 'Build instant recall with related division facts', difficulty: 'medium', problems: 14, topics: ['division facts', 'missing factors'], category: 'Fluency' },
    addSubtractRelay: { name: 'Add & Subtract Relay', icon: '🏃', description: 'Place-value accuracy with quick mental checks', difficulty: 'easy', problems: 14, topics: ['addition', 'subtraction'], category: 'Fluency' },
    multiDigitPower: { name: 'Multi-Digit Power', icon: '💥', description: 'Partial products and larger multiplication', difficulty: 'hard', problems: 12, topics: ['multi-digit multiplication', 'multiplication facts'], category: 'Fluency' },
    fractionFluency: { name: 'Fraction Fluency', icon: '🍕', description: 'Equivalent fractions, operations, and mixed numbers', difficulty: 'hard', problems: 12, topics: ['basic fractions', 'fraction operations', 'mixed numbers'], category: 'Fluency' },
    decimalFluency: { name: 'Decimal Fluency', icon: '🔢', description: 'Fast, accurate decimal operations and place value', difficulty: 'medium', problems: 12, topics: ['decimals', 'percentages'], category: 'Fluency' },
    integerFluency: { name: 'Integer Fluency', icon: '↔️', description: 'Signed numbers, comparisons, and number-line moves', difficulty: 'hard', problems: 12, topics: ['integer number lines', 'integer operations'], category: 'Fluency' },
    operationMix: { name: 'Operation Mix-Up', icon: '🎛️', description: 'Choose the right operation under pressure', difficulty: 'hard', problems: 14, topics: ['foundation review', 'multi-step problems', 'division facts', 'multi-digit multiplication'], category: 'Fluency' },
    mentalMathLab: { name: 'Mental Math Lab', icon: '🧠', description: 'Flexible strategies across whole numbers, fractions, and decimals', difficulty: 'hard', problems: 14, topics: ['addition', 'subtraction', 'multiplication facts', 'division facts', 'basic fractions', 'decimals'], category: 'Fluency' },
    fifthGradeTuneUp: { name: '5th Grade Tune-Up', icon: '🛠️', description: 'Repair weak spots before 6th grade', difficulty: 'hard', problems: 22, topics: ['foundation review', 'division facts', 'fraction operations', 'decimals', 'multi-step problems'], category: 'Foundations' },
    placeValueFoundation: { name: 'Place Value Workshop', icon: '🔟', description: 'Whole-number and decimal place-value reasoning', difficulty: 'medium', problems: 12, topics: ['addition', 'subtraction', 'decimals', 'scientific notation'], category: 'Foundations' },
    fourOperationsFoundation: { name: 'Four Operations', icon: '➕', description: 'Add, subtract, multiply, and divide with confidence', difficulty: 'medium', problems: 14, topics: ['addition', 'subtraction', 'multi-digit multiplication', 'division facts'], category: 'Foundations' },
    fractionFoundation: { name: 'Fraction Foundations', icon: '🍰', description: 'Parts, equivalence, operations, and mixed numbers', difficulty: 'hard', problems: 14, topics: ['basic fractions', 'fraction operations', 'mixed numbers'], category: 'Foundations' },
    decimalPercentFoundation: { name: 'Decimals & Percents', icon: '%', description: 'Connect place value, decimals, and percent benchmarks', difficulty: 'hard', problems: 12, topics: ['decimals', 'percentages', 'percent change'], category: 'Foundations' },
    measurementFoundation: { name: 'Measurement Builder', icon: '📏', description: 'Convert units and reason about measured quantities', difficulty: 'medium', problems: 12, topics: ['measurement conversions', 'perimeter and area'], category: 'Foundations' },
    geometryFoundation: { name: 'Geometry Foundations', icon: '📐', description: 'Perimeter, area, polygons, and angle basics', difficulty: 'hard', problems: 12, topics: ['perimeter and area', 'polygons', 'lines and angles'], category: 'Foundations' },
    dataFoundation: { name: 'Data Detective', icon: '📊', description: 'Read data and understand averages and probability', difficulty: 'hard', problems: 12, topics: ['data and statistics', 'rates and averages', 'probability'], category: 'Foundations' },
    orderOperationsFoundation: { name: 'Order of Operations', icon: '🧮', description: 'Solve multi-step expressions in the right order', difficulty: 'hard', problems: 12, topics: ['multi-step problems', 'foundation review', 'distributive property'], category: 'Foundations' },
    problemSolvingFoundation: { name: 'Problem-Solving Toolkit', icon: '🧰', description: 'Translate words, choose operations, and check answers', difficulty: 'hard', problems: 14, topics: ['word problems', 'multi-step problems', 'rates and averages', 'perimeter and area'], category: 'Foundations' },
    grade6Bridge: { name: '6th Grade Bridge', icon: '🌉', description: 'Integers, equations, ratios, data, geometry, and thinking problems', difficulty: 'challenge', problems: 24, topics: ['grade 6 bridge', 'integer number lines', 'two-step equations', 'inequalities', 'ratios', 'data and statistics', 'scale factor', 'angle relationships', 'coordinate plane'], category: '6th Grade Prep' },
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
    exponentsRoots: { name: 'Exponents & Roots', icon: '√', description: 'Powers, roots, exponent laws, and scientific notation', difficulty: 'hard', problems: 7, topics: ['powers and roots', 'laws of exponents', 'scientific notation'], category: '6th Grade Prep' },
    course3NumberSense: { name: 'Course 3 Number Sense', icon: '↔️', description: 'Integer lines, measures, rates, averages, and rational numbers', difficulty: 'hard', problems: 10, topics: ['integer number lines', 'measurement conversions', 'rates and averages', 'basic fractions'], category: 'Saxon Course 3 Stretch' },
    course3FractionsDecimals: { name: 'Fractions, Decimals & Percents', icon: '🍕', description: 'Operations with fractions, mixed numbers, decimals, and percents', difficulty: 'hard', problems: 12, topics: ['fraction operations', 'mixed numbers', 'decimals', 'percentages', 'percent change'], category: 'Saxon Course 3 Stretch' },
    course3Algebra: { name: 'Algebra Lab', icon: '🧩', description: 'Distribute, combine terms, solve equations, and use functions', difficulty: 'challenge', problems: 12, topics: ['distributive property', 'combine like terms', 'properties of equality', 'two-step equations', 'functions'], category: 'Saxon Course 3 Stretch' },
    course3Geometry: { name: 'Geometry Studio', icon: '📐', description: 'Lines, angles, polygons, circles, solids, and transformations', difficulty: 'challenge', problems: 12, topics: ['lines and angles', 'polygons', 'circles', 'surface area and volume', 'coordinate plane', 'transformations'], category: 'Saxon Course 3 Stretch' },
    probabilityFunctions: { name: 'Probability & Functions', icon: '🎲', description: 'Experimental probability, statistics, and input-output rules', difficulty: 'hard', problems: 10, topics: ['probability', 'data and statistics', 'functions'], category: 'Saxon Course 3 Stretch' },
    proportionsRates: { name: 'Ratios, Rates & Proportions', icon: '📏', description: 'Use ratio tables, cross products, rates, and scale factors', difficulty: 'challenge', problems: 10, topics: ['ratios', 'proportions', 'rates and averages', 'scale factor'], category: 'Saxon Course 3 Stretch' },
    course3PowersRadicals: { name: 'Powers, Roots & Radicals', icon: '√', description: 'Powers, roots, exponent laws, radicals, and right-triangle thinking', difficulty: 'challenge', problems: 10, topics: ['powers and roots', 'laws of exponents', 'scientific notation', 'pythagorean theorem'], category: 'Saxon Course 3 Stretch' },
    course3InequalityGraphing: { name: 'Inequality Graphing', icon: '≤', description: 'Number-line inequalities, integer comparisons, and coordinate-plane moves', difficulty: 'challenge', problems: 10, topics: ['inequalities', 'integer number lines', 'coordinate plane', 'transformations'], category: 'Saxon Course 3 Stretch' },
    course3CumulativeChallenge: { name: 'Course 3 Cumulative Challenge', icon: '🏁', description: 'A mixed Saxon-style review across algebra, ratios, geometry, data, and number sense', difficulty: 'challenge', problems: 16, topics: ['integer number lines', 'rates and averages', 'proportions', 'functions', 'circles', 'probability', 'powers and roots', 'transformations', 'two-step equations', 'surface area and volume'], category: 'Saxon Course 3 Stretch' },
    coordinateTransformations: { name: 'Coordinate Plane & Transformations', icon: '🧭', description: 'Ordered pairs, translations, reflections, and rotations', difficulty: 'challenge', problems: 9, topics: ['coordinate plane', 'transformations'], category: '6th Grade Prep' },
    ratiosPercentsPrep: { name: 'Ratios, Rates & Percents', icon: '⚖️', description: 'Equivalent ratios, unit rates, proportions, and percent reasoning', difficulty: 'hard', problems: 12, topics: ['ratios', 'rates and averages', 'proportions', 'percentages', 'scale factor'], category: '6th Grade Prep' },
    course3IntegerOperations: { name: 'Integers & Rational Numbers', icon: '➖', description: 'Signed operations, rational values, and number-line reasoning', difficulty: 'hard', problems: 12, topics: ['integer number lines', 'integer operations', 'basic fractions', 'decimals'], category: 'Saxon Course 3 Stretch' },
    mixedReview: { name: 'Mixed Review', icon: '🎲', description: 'Random mix of all topics', difficulty: 'medium', problems: 10, topics: null }
  };

  function getQuizDifficultyMix(config) {
    const mixes = {
      easy: ['easy', 'medium', 'easy', 'hard'],
      medium: ['easy', 'medium', 'medium', 'hard', 'challenge'],
      hard: ['medium', 'hard', 'hard', 'challenge'],
      challenge: ['medium', 'hard', 'challenge', 'challenge']
    };
    return config.difficultyMix || mixes[config.difficulty] || mixes.medium;
  }

  const CONCEPTS = [
    { id: 'addition', name: 'Addition', icon: '➕', description: 'Combining numbers together', relatedQuiz: 'addition' },
    { id: 'subtraction', name: 'Subtraction', icon: '➖', description: 'Taking away or finding the difference', relatedQuiz: 'subtraction' },
    { id: 'multiplication', name: 'Multiplication', icon: '✖️', description: 'Repeated addition and times tables', relatedQuiz: 'multiplication' },
    { id: 'division', name: 'Division', icon: '➗', description: 'Splitting into equal groups', relatedQuiz: 'division' },
    { id: 'fractions', name: 'Fractions', icon: '🍕', description: 'Parts of a whole', relatedQuiz: 'fractions' },
    { id: 'decimals', name: 'Decimals', icon: '🔢', description: 'Numbers with decimal points', relatedQuiz: 'decimals' },
    { id: 'equationsInequalities', name: 'Equations & Inequalities', icon: '⚖️', description: 'Balance equations and compare inequalities', relatedQuiz: 'equationsInequalities' },
    { id: 'geometryMeasurement', name: 'Geometry & Measurement', icon: '📐', description: 'Scale, area, volume, and angles', relatedQuiz: 'geometryMeasurement' },
    { id: 'statistics', name: 'Data & Statistics', icon: '📊', description: 'Mean, median, mode, and range', relatedQuiz: 'statistics' },
    { id: 'course3NumberSense', name: 'Course 3 Number Sense', icon: '↔️', description: 'Integer lines, measures, rates, and averages', relatedQuiz: 'course3NumberSense' },
    { id: 'coordinateTransformations', name: 'Coordinate Plane & Transformations', icon: '🧭', description: 'Plot, translate, and reflect points', relatedQuiz: 'coordinateTransformations' },
    { id: 'probabilityFunctions', name: 'Probability & Functions', icon: '🎲', description: 'Outcomes, data, and input-output rules', relatedQuiz: 'probabilityFunctions' }
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

  const SOLUTION_GUIDE_GROUPS = [
    {
      topics: ['addition', 'subtraction', 'counting', 'foundation review', 'multi-step problems'],
      method: 'Work by place value and complete one operation at a time in the correct order.',
      metric: 'Each digit has a place value, and the final quantity must match the operation and the problem context.',
      check: 'Estimate first, then use an inverse operation to verify the exact result.'
    },
    {
      topics: ['multiplication', 'simple multiplication', 'multiplication facts', 'division', 'division facts', 'missing factors', 'multi-digit multiplication'],
      method: 'Use equal groups and related facts; for larger products, split a factor into place-value parts.',
      metric: 'Factors describe equal groups, the product is the total, and the quotient describes group size or group count.',
      check: 'Use the related inverse fact: multiplication checks division, and division checks multiplication.'
    },
    {
      topics: ['basic fractions', 'fraction operations', 'mixed numbers', 'complex fractions'],
      method: 'Interpret the denominator first, then use equivalent fractions or convert forms before operating.',
      metric: 'The denominator names equal-size parts; the numerator counts the selected parts.',
      check: 'Estimate with 0, 1/2, and 1, or convert to a decimal to test reasonableness.'
    },
    {
      topics: ['decimals', 'percentages', 'percent change', 'scientific notation'],
      method: 'Use base-ten place value; line up decimal points and rewrite percents as decimals or fractions over 100.',
      metric: 'Decimals show tenths and smaller base-ten units; percent means parts per 100; exponents track powers of ten.',
      check: 'Compare with a whole-number or benchmark-percent estimate, then reverse the conversion.'
    },
    {
      topics: ['integer number lines', 'integer operations'],
      method: 'Use direction for the sign and distance from zero for the absolute value.',
      metric: 'Signed numbers encode direction relative to zero; absolute value measures distance from zero.',
      check: 'Picture the movement on a number line and confirm the sign and approximate size.'
    },
    {
      topics: ['measurement conversions', 'rates and averages', 'ratios', 'proportions', 'scale factor'],
      method: 'Write the units and the multiplicative relationship, then use a unit rate, scale factor, or equal ratios.',
      metric: 'Units describe what is measured; rates compare unlike units; ratios and scale factors compare multiplicatively.',
      check: 'Multiply back, convert back, or test a second pair of equivalent quantities.'
    },
    {
      topics: ['algebra basics', 'two-step equations', 'properties of equality', 'inequalities', 'distributive property', 'combine like terms', 'gcf factoring', 'functions'],
      method: 'Preserve equality while simplifying: distribute, combine like terms, then undo operations in reverse order.',
      metric: 'A variable represents a value; an equation has equal sides; an inequality represents a range; a function maps inputs to outputs.',
      check: 'Substitute the answer into the original statement and verify that it is true.'
    },
    {
      topics: ['coordinate plane', 'transformations', 'slope', 'slope-intercept form'],
      method: 'Track horizontal x before vertical y; use coordinate rules and change in y divided by change in x.',
      metric: 'Coordinates measure position, while slope measures vertical change per one unit of horizontal change.',
      check: 'Plot or substitute the result, then apply the inverse move when possible.'
    },
    {
      topics: ['data and statistics', 'probability'],
      method: 'Organize all outcomes or data values before computing the requested statistic or fraction.',
      metric: 'Statistics describe center, frequency, or spread; probability is favorable outcomes divided by total outcomes.',
      check: 'Recount the data and confirm probabilities stay between 0 and 1.'
    },
    {
      topics: ['lines and angles', 'angle relationships', 'polygons', 'perimeter and area', 'circles', 'surface area and volume', 'pythagorean theorem'],
      method: 'Identify the geometric property and formula before substituting measurements.',
      metric: 'Angles use degrees, perimeter uses linear units, area and surface area use square units, and volume uses cubic units.',
      check: 'Confirm the formula, dimensions, unit type, and whether the size is reasonable.'
    },
    {
      topics: ['powers and roots', 'laws of exponents'],
      method: 'Interpret powers as repeated multiplication and roots as the inverse question.',
      metric: 'The base is the repeated factor and the exponent counts how many factors are used.',
      check: 'Expand a small power or raise the root to its matching power.'
    },
    {
      topics: ['word problems', 'grade 6 bridge'],
      method: 'Name the unknown, translate each relationship into math, solve, then return to the story.',
      metric: 'The answer represents a real quantity, so its units and size must fit the context.',
      check: 'Substitute the result into the story and ask whether it answers the exact question.'
    }
  ];

  function createSolutionGuide(problemData, difficulty, topic) {
    const group = SOLUTION_GUIDE_GROUPS.find(item => item.topics.includes(topic)) || SOLUTION_GUIDE_GROUPS[0];
    const worked = String(problemData.explanation || `The correct answer is ${problemData.answer}.`).replace(/\s+/g, ' ').trim();
    return {
      concept: String(topic || 'mixed math').replace(/\b\w/g, letter => letter.toUpperCase()),
      difficulty,
      method: group.method,
      steps: [
        `Identify the goal and the given values in this ${String(topic || 'math')} problem.`,
        group.method,
        worked,
        `State the result clearly: ${problemData.answer}.`
      ],
      metric: group.metric,
      check: group.check
    };
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

  function integerNumberLine() {
    const a = randomInt(-12, 8);
    const b = randomInt(a + 1, 14);
    if (Math.random() < 0.5) return problem(`Which integer is greater: ${a} or ${b}?`, `${a}\\ ?\\ ${b}`, b, 'Farther right on the number line is greater.', `${b} is to the right of ${a}, so ${b} is greater.`);
    return problem(`What is the distance between ${a} and ${b} on a number line?`, `|${b} - (${a})|`, Math.abs(b - a), 'Distance is positive space between the numbers.', `${b} - (${a}) = ${Math.abs(b - a)}.`);
  }

  function measurementConversion() {
    const conversions = [
      { from: 'feet', to: 'inches', factor: 12 },
      { from: 'yards', to: 'feet', factor: 3 },
      { from: 'hours', to: 'minutes', factor: 60 },
      { from: 'weeks', to: 'days', factor: 7 }
    ];
    const item = choice(conversions);
    const amount = randomInt(2, 9);
    return problem(`Convert ${amount} ${item.from} to ${item.to}.`, `${amount} \\times ${item.factor}`, amount * item.factor, `1 ${item.from.slice(0, -1)} = ${item.factor} ${item.to}.`, `${amount} × ${item.factor} = ${amount * item.factor}.`);
  }

  function ratesAverages() {
    if (Math.random() < 0.5) {
      const miles = randomInt(60, 240);
      const hours = choice([2, 3, 4, 5, 6]);
      return problem(`A club rides ${miles} miles in ${hours} hours. What is the average rate?`, `${miles} \\div ${hours}`, miles / hours, 'Rate is distance divided by time.', `${miles} ÷ ${hours} = ${miles / hours} miles per hour.`);
    }
    const values = [randomInt(7, 15), randomInt(7, 15), randomInt(7, 15), randomInt(7, 15)];
    const total = values.reduce((sum, value) => sum + value, 0);
    return problem(`Find the average of ${values.join(', ')}.`, `\\frac{${values.join(' + ')}}{4}`, total / 4, 'Add all values, then divide by 4.', `${values.join(' + ')} = ${total}; ${total} ÷ 4 = ${total / 4}.`);
  }

  function proportionProblem() {
    const a = randomInt(2, 7);
    const b = randomInt(a + 1, 10);
    const scale = randomInt(3, 9);
    return algebraProblem(`Solve the proportion: ${a}/${b} = x/${b * scale}.`, `\\frac{${a}}{${b}} = \\frac{x}{${b * scale}}`, a * scale, `${b} was multiplied by ${scale}.`, `x = ${a} × ${scale} = ${a * scale}.`);
  }

  function propertiesEquality() {
    const x = randomInt(4, 14);
    const add = randomInt(3, 12);
    return algebraProblem(`Solve: x + ${add} = ${x + add}`, `x + ${add} = ${x + add}`, x, `Subtract ${add} from both sides.`, `x = ${x + add} - ${add} = ${x}.`);
  }

  function functionRule() {
    const multiplier = randomInt(2, 5);
    const add = randomInt(1, 9);
    const input = randomInt(2, 12);
    const output = multiplier * input + add;
    return problem(`A function rule is y = ${multiplier}x + ${add}. What is y when x = ${input}?`, `y = ${multiplier}(${input}) + ${add}`, output, `Substitute ${input} for x.`, `${multiplier} × ${input} + ${add} = ${output}.`);
  }

  function coordinatePlane() {
    const x = randomInt(-5, 5);
    const y = randomInt(-5, 5);
    const dx = randomInt(-4, 4) || 2;
    const dy = randomInt(-4, 4) || -2;
    return {
      problem: `Point A is at (${x}, ${y}). It moves ${Math.abs(dx)} ${dx >= 0 ? 'right' : 'left'} and ${Math.abs(dy)} ${dy >= 0 ? 'up' : 'down'}. What is the new ordered pair?`,
      problemLatex: `(${x} ${dx >= 0 ? '+' : '-'} ${Math.abs(dx)}, ${y} ${dy >= 0 ? '+' : '-'} ${Math.abs(dy)})`,
      answer: `(${x + dx}, ${y + dy})`,
      acceptableAnswers: [`(${x + dx}, ${y + dy})`, `${x + dx},${y + dy}`, `${x + dx}, ${y + dy}`],
      hint: 'Change x for left/right and y for up/down.',
      explanation: `The new point is (${x + dx}, ${y + dy}).`
    };
  }

  function probabilityProblem() {
    const red = randomInt(2, 8);
    const blue = randomInt(2, 8);
    const total = red + blue;
    return {
      problem: `A bag has ${red} red tiles and ${blue} blue tiles. What is the probability of picking red?`,
      problemLatex: `\\frac{${red}}{${total}}`,
      answer: `${red}/${total}`,
      acceptableAnswers: [`${red}/${total}`, String(red / total)],
      hint: 'Probability is favorable outcomes over total outcomes.',
      explanation: `${red} red out of ${total} total gives ${red}/${total}.`
    };
  }

  function linesAngles() {
    const angle = choice([35, 42, 58, 63, 74, 115, 128, 146]);
    return problem(`Two angles form a straight line. One angle is ${angle}°. What is the other?`, `${angle}^\\circ + x = 180^\\circ`, 180 - angle, 'Straight-line angles add to 180°.', `180 - ${angle} = ${180 - angle}.`);
  }

  function polygonProblem() {
    const [name, sides] = choice([['triangle', 3], ['quadrilateral', 4], ['pentagon', 5], ['hexagon', 6], ['octagon', 8]]);
    return problem(`How many sides does a ${name} have?`, name, sides, 'Use the polygon name.', `A ${name} has ${sides} sides.`);
  }

  function perimeterArea() {
    const length = randomInt(5, 18);
    const width = randomInt(3, 12);
    if (Math.random() < 0.5) return problem(`A rectangle is ${length} units by ${width} units. What is its area?`, `${length} \\times ${width}`, length * width, 'Area is length times width.', `Area = ${length} × ${width} = ${length * width}.`);
    return problem(`A rectangle is ${length} units by ${width} units. What is its perimeter?`, `2(${length} + ${width})`, 2 * (length + width), 'Perimeter goes around all sides.', `2(${length} + ${width}) = ${2 * (length + width)}.`);
  }

  function circleProblem() {
    const radius = choice([3, 4, 5, 6, 7, 8, 10]);
    if (Math.random() < 0.5) {
      const circumference = Number((2 * 3.14 * radius).toFixed(2));
      return problem(`Use 3.14 for pi. What is the circumference of a circle with radius ${radius}?`, `2 \\times 3.14 \\times ${radius}`, circumference, 'Circumference is 2πr.', `C = 2 × 3.14 × ${radius} = ${circumference}.`);
    }
    const area = Number((3.14 * radius * radius).toFixed(2));
    return problem(`Use 3.14 for pi. What is the area of a circle with radius ${radius}?`, `3.14 \\times ${radius}^2`, area, 'Area is πr².', `A = 3.14 × ${radius}² = ${area}.`);
  }

  function powersRoots() {
    if (Math.random() < 0.5) {
      const base = randomInt(2, 9);
      const exponent = choice([2, 3]);
      return problem(`Evaluate ${base}^${exponent}.`, `${base}^{${exponent}}`, base ** exponent, `Use ${base} as a factor ${exponent} times.`, exponent === 2 ? `${base}² = ${base * base}.` : `${base}³ = ${base ** 3}.`);
    }
    const root = randomInt(4, 15);
    return problem(`What is the square root of ${root * root}?`, `\\sqrt{${root * root}}`, root, `Find the number that times itself equals ${root * root}.`, `${root} × ${root} = ${root * root}.`);
  }

  function exponentLaw() {
    const base = choice(['x', 'm', 'a']);
    const first = randomInt(2, 5);
    const second = randomInt(2, 5);
    return {
      problem: `Simplify: ${base}^${first} × ${base}^${second}`,
      problemLatex: `${base}^{${first}} \\times ${base}^{${second}}`,
      answer: `${base}^${first + second}`,
      acceptableAnswers: [`${base}^${first + second}`, `${base}${first + second}`],
      hint: 'When multiplying same bases, add exponents.',
      explanation: `${base}^${first} × ${base}^${second} = ${base}^${first + second}.`
    };
  }

  function transformationProblem() {
    const x = randomInt(-5, 5) || 3;
    const y = randomInt(-5, 5) || -2;
    if (Math.random() < 0.5) {
      return {
        problem: `Reflect (${x}, ${y}) across the y-axis. What is the image point?`,
        problemLatex: `(${x}, ${y}) \\rightarrow (?, ?)`,
        answer: `(${-x}, ${y})`,
        acceptableAnswers: [`(${-x}, ${y})`, `${-x},${y}`, `${-x}, ${y}`],
        hint: 'Across the y-axis changes x and keeps y.',
        explanation: `The image point is (${-x}, ${y}).`
      };
    }
    const dx = randomInt(-4, 4) || 2;
    const dy = randomInt(-4, 4) || 3;
    return {
      problem: `Translate (${x}, ${y}) by (${dx}, ${dy}). What is the image point?`,
      problemLatex: `(${x} + ${dx}, ${y} + ${dy})`,
      answer: `(${x + dx}, ${y + dy})`,
      acceptableAnswers: [`(${x + dx}, ${y + dy})`, `${x + dx},${y + dy}`, `${x + dx}, ${y + dy}`],
      hint: 'Add the translation to x and y.',
      explanation: `(${x} + ${dx}, ${y} + ${dy}) = (${x + dx}, ${y + dy}).`
    };
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
    if (kind === 'proportions') return proportionProblem();
    if (kind === 'integer number lines') return integerNumberLine();
    if (kind === 'measurement conversions') return measurementConversion();
    if (kind === 'rates and averages') return ratesAverages();
    if (kind === 'properties of equality') return propertiesEquality();
    if (kind === 'functions') return functionRule();
    if (kind === 'coordinate plane') return coordinatePlane();
    if (kind === 'probability') return probabilityProblem();
    if (kind === 'lines and angles') return linesAngles();
    if (kind === 'polygons') return polygonProblem();
    if (kind === 'perimeter and area') return perimeterArea();
    if (kind === 'circles') return circleProblem();
    if (kind === 'powers and roots') return powersRoots();
    if (kind === 'laws of exponents') return exponentLaw();
    if (kind === 'transformations') return transformationProblem();
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
      'integer number lines': integerNumberLine,
      'measurement conversions': measurementConversion,
      'rates and averages': ratesAverages,
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
      proportions: proportionProblem,
      'two-step equations': () => grade6Bridge('two-step equations'),
      'properties of equality': propertiesEquality,
      inequalities: () => grade6Bridge('inequalities'),
      'algebra basics': () => grade6Bridge('two-step equations'),
      'distributive property': distributiveProperty,
      'combine like terms': combineLikeTerms,
      'gcf factoring': gcfFactoring,
      functions: functionRule,
      'coordinate plane': coordinatePlane,
      probability: probabilityProblem,
      'lines and angles': linesAngles,
      polygons: polygonProblem,
      'perimeter and area': perimeterArea,
      circles: circleProblem,
      'powers and roots': powersRoots,
      'laws of exponents': exponentLaw,
      transformations: transformationProblem,
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
    return {
      ...generated,
      difficulty,
      topic: selectedTopic,
      solutionGuide: createSolutionGuide(generated, difficulty, selectedTopic)
    };
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
    let difficultyMix = null;

    if (LEGACY_MODE_CONFIGS[body.gameType]) {
      const modeConfig = LEGACY_MODE_CONFIGS[body.gameType];
      difficulty = modeConfig.difficulty;
      maxProblems = modeConfig.maxProblems || maxProblems;
      topicPool = modeConfig.topics;
    }
    if (body.gameType === 'quiz' && QUIZ_TOPICS[body.quizTopic]) {
      const quiz = QUIZ_TOPICS[body.quizTopic];
      difficultyMix = getQuizDifficultyMix(quiz);
      difficulty = difficultyMix[0];
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
      difficultyMix,
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
      solutionGuide: game.currentProblem?.solutionGuide || createSolutionGuide(game.currentProblem, game.currentProblem?.difficulty, game.currentProblem?.topic),
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

    if (game.gameType === 'quiz' && game.difficultyMix?.length) {
      game.difficulty = game.difficultyMix[game.problemNumber % game.difficultyMix.length];
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
      solutionGuide: current.solutionGuide || createSolutionGuide(current, current.difficulty, current.topic),
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
    if (path === '/api/transcribe') return json({ error: 'Voice input needs the full Math Club server. Use typing on this GitHub version.' }, { status: 200 });
    if (path === '/api/tts') return textResponse('', { status: 404 });
    if (path === '/api/chat') {
      return json({
        response: 'This GitHub version is for Math Club games and practice. The live AI coach and voice features need the full Math Club server.',
        sessionId: body.sessionId || `static-${Date.now()}`
      });
    }
    if (path === '/api/analyze-homework') {
      return json({ error: 'Photo help is not part of this Math Club page. The games work here.' });
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
          difficultyMix: getQuizDifficultyMix(config),
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

    return json({ error: 'This feature needs the full Math Club server.' }, { status: 404 });
  };
})();
