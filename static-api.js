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
    hard: ['foundation review', 'fraction operations', 'mixed numbers', 'percentages', 'multi-step problems', 'data and statistics', 'multi-digit multiplication'],
    challenge: ['grade 6 bridge', 'ratios', 'two-step equations', 'inequalities', 'scale factor', 'angle relationships', 'surface area and volume']
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
    { id: 'multiplication', name: 'Multiplication', icon: '✖️', description: 'Repeated addition and times tables', relatedQuiz: 'multiplication' },
    { id: 'division', name: 'Division', icon: '➗', description: 'Splitting into equal groups', relatedQuiz: 'division' },
    { id: 'fractions', name: 'Fractions', icon: '🍕', description: 'Parts of a whole', relatedQuiz: 'fractions' },
    { id: 'decimals', name: 'Decimals', icon: '🔢', description: 'Numbers with decimal points', relatedQuiz: 'decimals' },
    { id: 'equationsInequalities', name: 'Equations & Inequalities', icon: '⚖️', description: 'Balance equations and compare inequalities', relatedQuiz: 'equationsInequalities' },
    { id: 'geometryMeasurement', name: 'Geometry & Measurement', icon: '📐', description: 'Scale, area, volume, and angles', relatedQuiz: 'geometryMeasurement' },
    { id: 'statistics', name: 'Data & Statistics', icon: '📊', description: 'Mean, median, mode, and range', relatedQuiz: 'statistics' }
  ];

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

  function foundationReview() {
    const kind = choice(['fractionOfNumber', 'decimalAdd', 'decimalSubtract', 'fractionSimplify', 'area', 'orderOps']);
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

  function grade6Bridge(topic) {
    const kind = topic && topic !== 'grade 6 bridge' ? topic : choice(['two-step equations', 'inequalities', 'ratios', 'data and statistics', 'scale factor', 'angle relationships']);
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
      'basic fractions': foundationReview,
      'fraction operations': foundationReview,
      'mixed numbers': foundationReview,
      decimals: foundationReview,
      percentages: foundationReview,
      'multi-step problems': foundationReview,
      'data and statistics': () => grade6Bridge('data and statistics'),
      ratios: () => grade6Bridge('ratios'),
      'two-step equations': () => grade6Bridge('two-step equations'),
      inequalities: () => grade6Bridge('inequalities'),
      'algebra basics': () => grade6Bridge('two-step equations'),
      'scale factor': () => grade6Bridge('scale factor'),
      'angle relationships': () => grade6Bridge('angle relationships'),
      'surface area and volume': foundationReview,
      'pythagorean theorem': () => grade6Bridge('scale factor'),
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

    if (body.gameType === 'levelup') difficulty = 'easy';
    if (body.gameType === 'speed') maxProblems = 10;
    if (body.gameType === 'daily') {
      difficulty = 'hard';
      maxProblems = 1;
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
      return json({
        success: true,
        name: 'Math Concept',
        icon: '💡',
        relatedQuiz: null,
        explanation: '## Quick explanation\nThis GitHub version keeps concepts simple. Pick a practice deck to build the skill with examples.'
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
