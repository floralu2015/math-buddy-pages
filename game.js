// Math Buddy Game Module
const GameModule = (() => {
  const CUSTOM_LEVELS = [
    {
      id: 'grade4',
      name: 'Grade 4 warm-up',
      shortName: 'Warm-up',
      difficulty: 'easy',
      problemCount: 10,
      description: 'Rebuild confidence'
    },
    {
      id: 'grade5',
      name: 'Grade 5 repair',
      shortName: '5th grade',
      difficulty: 'hard',
      problemCount: 12,
      description: 'Fix weak spots'
    },
    {
      id: 'grade6',
      name: 'Grade 6 ready',
      shortName: '6th grade',
      difficulty: 'challenge',
      problemCount: 12,
      description: 'Prepare for next semester'
    },
    {
      id: 'stretch',
      name: 'Brain stretch',
      shortName: 'Stretch',
      difficulty: 'challenge',
      problemCount: 15,
      description: 'Make it harder'
    }
  ];

  const CUSTOM_SUBJECTS = [
    { id: 'factMix', name: 'Fact mix', icon: '⚔️', topics: ['multiplication facts', 'division facts', 'missing factors'] },
    { id: 'multiplication', name: 'Multiplication', icon: '✖️', topics: ['multiplication facts', 'multi-digit multiplication'] },
    { id: 'division', name: 'Division', icon: '➗', topics: ['division facts'] },
    { id: 'fractions', name: 'Fractions', icon: '🍕', topics: ['fraction operations', 'basic fractions', 'mixed numbers'] },
    { id: 'decimals', name: 'Decimals', icon: '🔢', topics: ['decimals'] },
    { id: 'equations', name: 'Equations', icon: '⚖️', topics: ['two-step equations', 'inequalities'] },
    { id: 'ratios', name: 'Ratios', icon: '📏', topics: ['ratios'] },
    { id: 'geometry', name: 'Geometry', icon: '📐', topics: ['scale factor', 'angle relationships', 'surface area and volume'] },
    { id: 'data', name: 'Data', icon: '📊', topics: ['data and statistics'] }
  ];

  // Game state
  let currentGame = null;
  let userIdentifier = null;
  let timerInterval = null;
  let problemStartTime = null;
  let isSubmitting = false;
  let lastGameType = 'speed';
  let lastQuizTopic = null;
  let lastCustomOptions = null;
  let selectedCustomLevelId = 'grade5';
  let selectedCustomSubjectId = 'factMix';
  let quizTopics = [];
  let concepts = [];

  // DOM elements (will be set after DOM loads)
  let gameContainer, gameSelection, gamePlay, gameResults, customPractice, quizPicker, conceptPicker, conceptDisplay;
  let answerInput;

  // Initialize the game module
  function init() {
    // Get or create user identifier
    userIdentifier = localStorage.getItem('mathBuddyUserId');
    if (!userIdentifier) {
      userIdentifier = generateUUID();
      localStorage.setItem('mathBuddyUserId', userIdentifier);
    }

    createGameUI();
    loadProgress();
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Create game UI elements
  function createGameUI() {
    gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.className = 'game-container hidden';
    gameContainer.innerHTML = `
      <!-- Game Selection Screen -->
      <div id="game-selection" class="game-screen">
        <button class="back-to-tutor" onclick="GameModule.hide()">← Back to Tutor</button>
        <div class="game-hero">
          <span class="game-hero-kicker">6th grade launch pad</span>
          <h2>Train Your Math Brain</h2>
          <p>Short rounds. Real thinking. Lots of reps on the facts and skills Sarah needs next.</p>
        </div>

        <div class="game-progress-bar">
          <div id="level-display" class="level-display">Level 1: Math Rookie</div>
          <div class="xp-bar-container">
            <div id="xp-bar" class="xp-bar" style="width: 0%"></div>
          </div>
          <div id="xp-display" class="xp-display">0 XP</div>
        </div>

        <div class="practice-lanes">
          <div class="practice-lane">
            <span class="lane-label">Fact fluency</span>
            <strong>Know facts cold</strong>
          </div>
          <div class="practice-lane">
            <span class="lane-label">Foundation repair</span>
            <strong>Fix shaky 5th grade skills</strong>
          </div>
          <div class="practice-lane">
            <span class="lane-label">Bridge work</span>
            <strong>Think like a 6th grader</strong>
          </div>
        </div>

        <button class="practice-builder-entry" onclick="GameModule.showCustomPractice()">
          <span class="builder-entry-icon">🎛️</span>
          <span class="builder-entry-copy">
            <span class="builder-entry-kicker">Choose practice</span>
            <strong>Pick level + subject</strong>
            <small>Make a custom round for exactly what Sarah needs today.</small>
          </span>
          <span class="builder-entry-arrow">→</span>
        </button>

        <div class="game-modes">
          <button class="game-mode-btn featured times-arena" onclick="GameModule.startQuiz('multiplicationTables')">
            <span class="mode-icon">⚔️</span>
            <span class="mode-title">Times Table Arena</span>
            <span class="mode-desc">36 facts: multiply, divide, missing factors</span>
          </button>

          <button class="game-mode-btn featured tune-up" onclick="GameModule.startQuiz('fifthGradeTuneUp')">
            <span class="mode-icon">🛠️</span>
            <span class="mode-title">5th Grade Tune-Up</span>
            <span class="mode-desc">Fractions, decimals, division, word thinking</span>
          </button>

          <button class="game-mode-btn featured bridge" onclick="GameModule.startQuiz('grade6Bridge')">
            <span class="mode-icon">🌉</span>
            <span class="mode-title">6th Grade Bridge</span>
            <span class="mode-desc">Equations, ratios, data, geometry</span>
          </button>

          <button class="game-mode-btn" onclick="GameModule.startGame('speed')">
            <span class="mode-icon">⚡</span>
            <span class="mode-title">Speed Challenge</span>
            <span class="mode-desc">10 problems, beat the clock!</span>
          </button>

          <button class="game-mode-btn" onclick="GameModule.startGame('streak')">
            <span class="mode-icon">🔥</span>
            <span class="mode-title">Streak Challenge</span>
            <span class="mode-desc">How many in a row?</span>
          </button>

          <button class="game-mode-btn daily" onclick="GameModule.startGame('daily')">
            <span class="mode-icon">📅</span>
            <span class="mode-title">Daily Challenge</span>
            <span class="mode-desc" id="daily-status">Today's special problem!</span>
          </button>

          <button class="game-mode-btn" onclick="GameModule.startGame('levelup')">
            <span class="mode-icon">📈</span>
            <span class="mode-title">Level Up</span>
            <span class="mode-desc">Problems get harder!</span>
          </button>

          <button class="game-mode-btn quiz-btn" onclick="GameModule.showQuizPicker()">
            <span class="mode-icon">📚</span>
            <span class="mode-title">Practice Quiz</span>
            <span class="mode-desc">Pick a topic to practice!</span>
          </button>

          <button class="game-mode-btn concept-btn" onclick="GameModule.showConceptPicker()">
            <span class="mode-icon">💡</span>
            <span class="mode-title">Learn Concepts</span>
            <span class="mode-desc">Understand how math works!</span>
          </button>
        </div>

        <div id="badges-display" class="badges-display">
          <h3>Your Badges</h3>
          <div id="badges-list" class="badges-list">
            <span class="no-badges">Play games to earn badges!</span>
          </div>
        </div>
      </div>

      <!-- Custom Practice Builder Screen -->
      <div id="custom-practice" class="game-screen hidden">
        <button class="back-btn" onclick="GameModule.showSelection()">← Back</button>
        <div class="builder-hero">
          <span class="builder-hero-kicker">custom round</span>
          <h2>Choose Level + Subject</h2>
          <p>Pick the level first, then choose exactly what Sarah should practice.</p>
        </div>

        <section class="builder-start-panel">
          <div>
            <span class="custom-kicker">ready</span>
            <strong id="custom-practice-summary">12 questions • Fact mix</strong>
          </div>
          <button class="custom-start-btn" onclick="GameModule.startCustomPractice()">
            Start practice
          </button>
        </section>

        <section class="builder-step">
          <div class="builder-step-header">
            <span class="step-number">1</span>
            <div>
              <h3>Choose level</h3>
              <p>Warm up, repair 5th grade, or push into 6th grade.</p>
            </div>
          </div>
          <div id="custom-level-options" class="custom-option-row"></div>
        </section>

        <section class="builder-step">
          <div class="builder-step-header">
            <span class="step-number">2</span>
            <div>
              <h3>Choose subject</h3>
              <p>Fact fluency is first, but every bridge skill is available.</p>
            </div>
          </div>
          <div id="custom-subject-options" class="custom-subject-grid"></div>
        </section>
      </div>

      <!-- Quiz Topic Picker Screen -->
      <div id="quiz-picker" class="game-screen hidden">
        <button class="back-btn" onclick="GameModule.showSelection()">← Back</button>
        <h2>📚 Practice Quiz</h2>
        <p class="quiz-subtitle">Pick a topic to practice!</p>
        <div id="quiz-topics" class="quiz-topics">
          <!-- Topics will be loaded dynamically -->
        </div>
      </div>

      <!-- Concept Picker Screen -->
      <div id="concept-picker" class="game-screen hidden">
        <button class="back-btn" onclick="GameModule.showSelection()">← Back</button>
        <h2>💡 Learn Concepts</h2>
        <p class="quiz-subtitle">Pick a concept to learn about!</p>
        <div id="concept-list" class="quiz-topics">
          <!-- Concepts will be loaded dynamically -->
        </div>
      </div>

      <!-- Concept Display Screen -->
      <div id="concept-display" class="game-screen hidden">
        <button class="back-btn" onclick="GameModule.showConceptPicker()">← Back to Concepts</button>
        <div id="concept-header" class="concept-header">
          <span id="concept-icon" class="concept-icon"></span>
          <h2 id="concept-title"></h2>
        </div>
        <div id="concept-content" class="concept-content">
          <!-- Explanation will be loaded here -->
        </div>
        <div id="concept-actions" class="concept-actions hidden">
          <button class="game-btn primary" onclick="GameModule.practiceConceptQuiz()">
            Practice This Topic
          </button>
        </div>
      </div>

      <!-- In-Game Screen -->
      <div id="game-play" class="game-screen hidden">
        <div class="game-header">
          <div class="game-info-left">
            <span id="game-type-display" class="game-type">⚡ Speed Challenge</span>
            <span id="problem-number" class="problem-number">1 of 10</span>
          </div>
          <div class="game-info-right">
            <span id="timer-display" class="timer">⏱️ 00:00</span>
            <span id="streak-display" class="streak">🔥 0</span>
          </div>
        </div>

        <div class="problem-container">
          <div class="problem-label">Solve this:</div>
          <div id="problem-topic" class="problem-topic hidden"></div>
          <div id="problem-text" class="problem-text"></div>
          <div id="problem-latex" class="problem-latex"></div>
        </div>

        <div class="answer-section">
          <input type="text" id="game-answer" class="game-answer-input" placeholder="Type your answer..." autocomplete="off">
          <div class="game-buttons">
            <button id="submit-answer-btn" class="game-btn primary" onclick="GameModule.submitAnswer()">
              Submit ✓
            </button>
            <button id="next-btn" class="game-btn primary hidden" onclick="GameModule.nextQuestion()">
              Next →
            </button>
            <button id="hint-btn" class="game-btn secondary" onclick="GameModule.showHint()">
              💡 Hint
            </button>
            <button id="quit-btn" class="game-btn danger" onclick="GameModule.quitGame()">
              Quit
            </button>
          </div>
        </div>

        <div id="feedback-display" class="feedback-display hidden"></div>
        <div id="score-display" class="score-display">Score: <span id="current-score">0</span></div>
      </div>

      <!-- Results Screen -->
      <div id="game-results" class="game-screen hidden">
        <div class="results-header">
          <span id="results-emoji" class="results-emoji">🎉</span>
          <h2 id="results-title">Great Job!</h2>
        </div>

        <div class="results-stats">
          <div class="stat-item">
            <span class="stat-value" id="result-score">0</span>
            <span class="stat-label">Score</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" id="result-correct">0/0</span>
            <span class="stat-label">Correct</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" id="result-accuracy">0%</span>
            <span class="stat-label">Accuracy</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" id="result-streak">0</span>
            <span class="stat-label">Best Streak</span>
          </div>
        </div>

        <div class="xp-earned" id="xp-earned">
          <span class="xp-amount">+0 XP</span>
        </div>

        <div id="new-badges" class="new-badges hidden">
          <h3>New Badges Earned!</h3>
          <div id="new-badges-list" class="badges-list"></div>
        </div>

        <div id="practice-prescription" class="practice-prescription"></div>

        <div id="level-up-display" class="level-up-display hidden">
          <span class="level-up-text">🎊 LEVEL UP! 🎊</span>
          <span id="new-level-name" class="new-level-name"></span>
        </div>

        <div class="results-buttons">
          <button class="game-btn primary large" onclick="GameModule.playAgain()">
            Play Again 🎮
          </button>
          <button class="game-btn secondary large" onclick="GameModule.showSelection()">
            Back to Menu
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(gameContainer);

    // Cache DOM elements
    gameSelection = document.getElementById('game-selection');
    gamePlay = document.getElementById('game-play');
    gameResults = document.getElementById('game-results');
    customPractice = document.getElementById('custom-practice');
    quizPicker = document.getElementById('quiz-picker');
    conceptPicker = document.getElementById('concept-picker');
    conceptDisplay = document.getElementById('concept-display');
    answerInput = document.getElementById('game-answer');

    // Load quiz topics and concepts
    renderCustomPracticeControls();
    loadQuizTopics();
    loadConcepts();

    // Add enter key listener for answer input
    answerInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !isSubmitting) {
        // Check if Next button is visible
        const nextBtn = document.getElementById('next-btn');
        if (!nextBtn.classList.contains('hidden')) {
          nextQuestion();
        } else {
          submitAnswer();
        }
      }
    });
  }

  // Load player progress
  async function loadProgress() {
    try {
      console.log('Loading progress for:', userIdentifier);
      const response = await fetch(`/api/game/progress?userIdentifier=${userIdentifier}`);
      const data = await response.json();
      console.log('Progress data:', data);

      if (data.success && data.progress) {
        updateProgressDisplay(data.progress);
      }

      // Check daily challenge status
      checkDailyStatus();
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }

  // Update progress display
  function updateProgressDisplay(progress) {
    const levelDisplay = document.getElementById('level-display');
    const xpBar = document.getElementById('xp-bar');
    const xpDisplay = document.getElementById('xp-display');
    const badgesList = document.getElementById('badges-list');

    if (levelDisplay) {
      levelDisplay.textContent = `Level ${progress.level}: ${progress.levelName}`;
    }

    if (xpDisplay) {
      xpDisplay.textContent = `${progress.xp} XP`;
    }

    if (xpBar && progress.nextLevelXP) {
      // Extended level thresholds matching server (20 levels)
      const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, 13000, 18000, 25000, 35000, 50000, 70000, 100000, 150000, 200000, 300000];
      const prevLevelXP = levelThresholds[progress.level - 1] || 0;
      const currentLevelXP = progress.xp - prevLevelXP;
      const neededXP = progress.nextLevelXP - prevLevelXP;
      const percentage = Math.min((currentLevelXP / neededXP) * 100, 100);
      xpBar.style.width = `${percentage}%`;
    }

    if (badgesList && progress.badges) {
      if (progress.badges.length > 0) {
        badgesList.innerHTML = progress.badges.map(badge =>
          `<span class="badge" title="${badge.name}: ${badge.requirement || ''}">${badge.emoji || '🏆'}</span>`
        ).join('');
      } else {
        badgesList.innerHTML = '<span class="no-badges">Play games to earn badges!</span>';
      }
    }
  }

  // Check daily challenge status
  async function checkDailyStatus() {
    try {
      const response = await fetch(`/api/game/daily?userIdentifier=${userIdentifier}`);
      const data = await response.json();

      const dailyStatus = document.getElementById('daily-status');
      const dailyBtn = document.querySelector('.game-mode-btn.daily');

      if (data.alreadyCompleted) {
        if (dailyStatus) dailyStatus.textContent = '✓ Completed today!';
        if (dailyBtn) dailyBtn.classList.add('completed');
      } else {
        if (dailyStatus) dailyStatus.textContent = "Today's special problem!";
        if (dailyBtn) dailyBtn.classList.remove('completed');
      }
    } catch (error) {
      console.error('Error checking daily status:', error);
    }
  }

  // Load available quiz topics
  async function loadQuizTopics() {
    try {
      const response = await fetch('/api/game/quiz-topics');
      const data = await response.json();

      if (data.success && data.topics) {
        quizTopics = data.topics;
        renderQuizTopics();
      }
    } catch (error) {
      console.error('Error loading quiz topics:', error);
    }
  }

  // Render quiz topics in the picker
  function renderQuizTopics() {
    const container = document.getElementById('quiz-topics');
    if (!container || quizTopics.length === 0) return;

    const categoryOrder = ['Fluency', 'Foundations', '6th Grade Prep', 'Core Practice'];
    const grouped = quizTopics.reduce((groups, topic) => {
      const category = topic.category || 'Core Practice';
      if (!groups[category]) groups[category] = [];
      groups[category].push(topic);
      return groups;
    }, {});

    container.innerHTML = categoryOrder
      .filter(category => grouped[category]?.length)
      .map(category => `
        <section class="quiz-topic-group">
          <div class="topic-group-header">
            <span>${category}</span>
            <small>${formatDeckCount(grouped[category].length)}</small>
          </div>
          <div class="topic-group-grid">
            ${grouped[category].map(topic => `
              <button class="quiz-topic-btn ${topic.category === 'Fluency' ? 'fact-heavy' : ''}" onclick="GameModule.startQuiz('${topic.id}')">
                <span class="topic-icon">${topic.icon}</span>
                <span class="topic-name">${topic.name}</span>
                <span class="topic-desc">${topic.description}</span>
                <span class="topic-info">${topic.problemCount} problems • ${topic.difficulty}</span>
              </button>
            `).join('')}
          </div>
        </section>
      `).join('');
  }

  function formatDeckCount(count) {
    return `${count} ${count === 1 ? 'deck' : 'decks'}`;
  }

  function renderCustomPracticeControls() {
    const levelContainer = document.getElementById('custom-level-options');
    const subjectContainer = document.getElementById('custom-subject-options');
    const summary = document.getElementById('custom-practice-summary');
    const level = getSelectedCustomLevel();
    const subject = getSelectedCustomSubject();

    if (levelContainer) {
      levelContainer.innerHTML = CUSTOM_LEVELS.map(option => `
        <button
          type="button"
          class="custom-choice ${option.id === selectedCustomLevelId ? 'selected' : ''}"
          data-level-id="${option.id}"
          onclick="GameModule.selectCustomLevel('${option.id}')"
        >
          <span>${option.shortName}</span>
          <small>${option.description}</small>
        </button>
      `).join('');
    }

    if (subjectContainer) {
      subjectContainer.innerHTML = CUSTOM_SUBJECTS.map(option => `
        <button
          type="button"
          class="custom-subject-choice ${option.id === selectedCustomSubjectId ? 'selected' : ''}"
          data-subject-id="${option.id}"
          onclick="GameModule.selectCustomSubject('${option.id}')"
        >
          <span class="subject-icon">${option.icon}</span>
          <span>${option.name}</span>
        </button>
      `).join('');
    }

    if (summary && level && subject) {
      summary.textContent = `${level.problemCount} questions • ${subject.name}`;
    }
  }

  function getSelectedCustomLevel() {
    return CUSTOM_LEVELS.find(level => level.id === selectedCustomLevelId) || CUSTOM_LEVELS[1];
  }

  function getSelectedCustomSubject() {
    return CUSTOM_SUBJECTS.find(subject => subject.id === selectedCustomSubjectId) || CUSTOM_SUBJECTS[0];
  }

  function selectCustomLevel(levelId) {
    if (!CUSTOM_LEVELS.some(level => level.id === levelId)) return;
    selectedCustomLevelId = levelId;
    renderCustomPracticeControls();
  }

  function selectCustomSubject(subjectId) {
    if (!CUSTOM_SUBJECTS.some(subject => subject.id === subjectId)) return;
    selectedCustomSubjectId = subjectId;
    renderCustomPracticeControls();
  }

  function startCustomPractice() {
    const level = getSelectedCustomLevel();
    const subject = getSelectedCustomSubject();
    const customOptions = {
      difficulty: level.difficulty,
      problemCount: level.problemCount,
      topicPool: subject.topics,
      customName: `${level.name}: ${subject.name}`
    };

    startGame('custom', null, customOptions);
  }

  // Show quiz topic picker
  function showQuizPicker() {
    gameSelection.classList.add('hidden');
    gamePlay.classList.add('hidden');
    gameResults.classList.add('hidden');
    if (customPractice) customPractice.classList.add('hidden');
    quizPicker.classList.remove('hidden');
  }

  function showCustomPractice() {
    gameSelection.classList.add('hidden');
    gamePlay.classList.add('hidden');
    gameResults.classList.add('hidden');
    if (quizPicker) quizPicker.classList.add('hidden');
    if (conceptPicker) conceptPicker.classList.add('hidden');
    if (conceptDisplay) conceptDisplay.classList.add('hidden');
    customPractice.classList.remove('hidden');
    renderCustomPracticeControls();
  }

  // Start a quiz with specific topic
  async function startQuiz(topicId) {
    lastQuizTopic = topicId;
    await startGame('quiz', topicId);
  }

  // Load available concepts
  async function loadConcepts() {
    try {
      const response = await fetch('/api/concepts');
      const data = await response.json();

      if (data.success && data.concepts) {
        concepts = data.concepts;
        renderConcepts();
      }
    } catch (error) {
      console.error('Error loading concepts:', error);
    }
  }

  // Render concepts in the picker
  function renderConcepts() {
    const container = document.getElementById('concept-list');
    if (!container || concepts.length === 0) return;

    container.innerHTML = concepts.map(concept => `
      <button class="quiz-topic-btn concept-item" onclick="GameModule.showConcept('${concept.id}')">
        <span class="topic-icon">${concept.icon}</span>
        <span class="topic-name">${concept.name}</span>
        <span class="topic-desc">${concept.description}</span>
      </button>
    `).join('');
  }

  // Show concept picker
  function showConceptPicker() {
    gameSelection.classList.add('hidden');
    gamePlay.classList.add('hidden');
    gameResults.classList.add('hidden');
    if (customPractice) customPractice.classList.add('hidden');
    if (quizPicker) quizPicker.classList.add('hidden');
    if (conceptDisplay) conceptDisplay.classList.add('hidden');
    conceptPicker.classList.remove('hidden');
  }

  // Current concept being viewed
  let currentConceptId = null;

  // Show explanation for a specific concept
  async function showConcept(conceptId) {
    currentConceptId = conceptId;

    // Hide other screens, show concept display
    conceptPicker.classList.add('hidden');
    conceptDisplay.classList.remove('hidden');

    // Show loading state
    const contentEl = document.getElementById('concept-content');
    contentEl.innerHTML = '<p class="loading">Loading explanation...</p>';

    // Update header
    const concept = concepts.find(c => c.id === conceptId);
    if (concept) {
      document.getElementById('concept-icon').textContent = concept.icon;
      document.getElementById('concept-title').textContent = concept.name;
    }

    try {
      const response = await fetch(`/api/concepts/${conceptId}/explain`);
      const data = await response.json();

      if (data.success && data.explanation) {
        // Convert markdown to HTML and render
        contentEl.innerHTML = renderMarkdown(data.explanation);

        // Trigger MathJax to render LaTeX
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
          MathJax.typesetPromise([contentEl]);
        }

        // Show practice button if there's a related quiz
        const actionsEl = document.getElementById('concept-actions');
        if (data.relatedQuiz) {
          currentConceptId = data.relatedQuiz; // Store for practice button
          actionsEl.classList.remove('hidden');
        } else {
          actionsEl.classList.add('hidden');
        }
      }
    } catch (error) {
      console.error('Error loading concept:', error);
      contentEl.innerHTML = '<p class="error">Could not load explanation. Please try again.</p>';
    }
  }

  // Simple markdown to HTML converter
  function renderMarkdown(text) {
    return text
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, (match) => {
        if (match.startsWith('<')) return match;
        return match;
      });
  }

  // Start practice quiz for current concept
  function practiceConceptQuiz() {
    if (currentConceptId) {
      startQuiz(currentConceptId);
    }
  }

  // Show game container
  function show() {
    gameContainer.classList.remove('hidden');
    document.querySelector('.container').classList.add('hidden');
    showSelection();
    loadProgress();
  }

  // Hide game container
  function hide() {
    gameContainer.classList.add('hidden');
    document.querySelector('.container').classList.remove('hidden');
    if (currentGame) {
      quitGame();
    }
  }

  // Show game selection screen
  function showSelection() {
    gameSelection.classList.remove('hidden');
    gamePlay.classList.add('hidden');
    gameResults.classList.add('hidden');
    if (customPractice) customPractice.classList.add('hidden');
    if (quizPicker) quizPicker.classList.add('hidden');
    if (conceptPicker) conceptPicker.classList.add('hidden');
    if (conceptDisplay) conceptDisplay.classList.add('hidden');
    stopTimer();
    loadProgress(); // Refresh progress when returning to menu
  }

  // Start a game
  async function startGame(gameType, quizTopicId = null, customOptions = null) {
    try {
      lastGameType = gameType; // Store for play again
      if (quizTopicId) {
        lastQuizTopic = quizTopicId;
        lastCustomOptions = null;
      }

      const requestBody = { gameType, userIdentifier };
      if (gameType === 'quiz' && quizTopicId) {
        requestBody.quizTopic = quizTopicId;
      }
      if (gameType === 'custom' && customOptions) {
        Object.assign(requestBody, customOptions);
        lastQuizTopic = null;
        lastCustomOptions = customOptions;
      }

      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!data.success) {
        alert('Could not start game. Please try again.');
        return;
      }

      currentGame = {
        gameId: data.gameId,
        gameType: data.gameType,
        quizTopic: data.quizTopic,
        quizName: data.quizName,
        score: 0,
        streak: 0,
        currentHint: data.problem?.hint || null,
        currentTopic: data.problem?.topic || null,
        pendingProblem: null
      };

      // Update UI
      gameSelection.classList.add('hidden');
      if (customPractice) customPractice.classList.add('hidden');
      if (quizPicker) quizPicker.classList.add('hidden');
      gamePlay.classList.remove('hidden');
      gameResults.classList.add('hidden');

      // Reset score display
      document.getElementById('current-score').textContent = '0';

      // Set game type display
      const typeLabels = {
        speed: '⚡ Speed Challenge',
        streak: '🔥 Streak Challenge',
        daily: '📅 Daily Challenge',
        levelup: '📈 Level Up',
        quiz: `📚 ${data.quizName || 'Practice Quiz'}`,
        custom: `🎛️ ${data.quizName || 'Custom Practice'}`
      };
      document.getElementById('game-type-display').textContent = typeLabels[gameType] || typeLabels.quiz;

      // Display first problem
      displayProblem(data.problem);

      // Start timer
      startTimer();

      // Reset buttons state
      resetButtonsForNewQuestion();

    } catch (error) {
      console.error('Error starting game:', error);
      alert('Could not start game. Please try again.');
    }
  }

  // Reset buttons for a new question
  function resetButtonsForNewQuestion() {
    const submitBtn = document.getElementById('submit-answer-btn');
    const nextBtn = document.getElementById('next-btn');
    const hintBtn = document.getElementById('hint-btn');

    submitBtn.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit ✓';
    nextBtn.classList.add('hidden');
    hintBtn.disabled = false;
    answerInput.disabled = false;
    answerInput.value = '';
    answerInput.focus();
    isSubmitting = false;
  }

  // Display a problem
  function displayProblem(problem) {
    const problemText = document.getElementById('problem-text');
    const problemLatex = document.getElementById('problem-latex');
    const problemNumber = document.getElementById('problem-number');
    const problemTopic = document.getElementById('problem-topic');

    problemText.textContent = problem.text;
    currentGame.currentHint = problem.hint || null;
    currentGame.currentTopic = problem.topic || null;

    if (problemTopic && problem.topic) {
      problemTopic.textContent = formatTopicLabel(problem.topic);
      problemTopic.classList.remove('hidden');
    } else if (problemTopic) {
      problemTopic.classList.add('hidden');
    }

    // Render LaTeX if available
    if (problem.latex) {
      problemLatex.innerHTML = `\\[${problem.latex}\\]`;
      problemLatex.classList.remove('hidden');
      if (window.MathJax) {
        MathJax.typesetPromise([problemLatex]).catch(err => console.log('MathJax error:', err));
      }
    } else {
      problemLatex.classList.add('hidden');
    }

    // Update problem number
    if (problem.total) {
      problemNumber.textContent = `${problem.number} of ${problem.total}`;
    } else {
      problemNumber.textContent = `Problem ${problem.number}`;
    }

    // Update streak display
    document.getElementById('streak-display').textContent = `🔥 ${currentGame.streak}`;

    // Record problem start time
    problemStartTime = Date.now();

    // Hide feedback
    document.getElementById('feedback-display').classList.add('hidden');

    // Reset buttons
    resetButtonsForNewQuestion();
  }

  function formatTopicLabel(topic) {
    return topic
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Submit answer
  async function submitAnswer() {
    if (isSubmitting || !currentGame) return;

    const answer = answerInput.value.trim();
    if (!answer) {
      answerInput.focus();
      return;
    }

    isSubmitting = true;
    const timeMs = Date.now() - problemStartTime;

    // Disable input and submit button while processing
    answerInput.disabled = true;
    const submitBtn = document.getElementById('submit-answer-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '...';

    try {
      const response = await fetch('/api/game/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: currentGame.gameId,
          answer,
          timeMs
        })
      });

      const data = await response.json();

      if (!data.success) {
        console.error('Answer error:', data.error);
        isSubmitting = false;
        answerInput.disabled = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit ✓';
        return;
      }

      // Show feedback
      showFeedback(data);

      // Update score and streak
      currentGame.score = data.score || currentGame.score;
      currentGame.streak = data.streak || 0;
      document.getElementById('current-score').textContent = currentGame.score;
      document.getElementById('streak-display').textContent = `🔥 ${currentGame.streak}`;

      // Check if game is over
      if (data.gameOver) {
        // Show results quickly
        setTimeout(() => showResults(data), 600);
      } else if (data.nextProblem) {
        // Store next problem and show Next button
        currentGame.pendingProblem = data.nextProblem;
        showNextButton();
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
      isSubmitting = false;
      answerInput.disabled = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit ✓';
    }
  }

  // Show Next button after answer feedback
  function showNextButton() {
    const submitBtn = document.getElementById('submit-answer-btn');
    const nextBtn = document.getElementById('next-btn');

    submitBtn.classList.add('hidden');
    nextBtn.classList.remove('hidden');
    nextBtn.focus();
  }

  // Go to next question
  function nextQuestion() {
    if (!currentGame || !currentGame.pendingProblem) return;

    const problem = currentGame.pendingProblem;
    currentGame.pendingProblem = null;
    displayProblem(problem);
  }

  // Show feedback for answer
  function showFeedback(data) {
    const feedback = document.getElementById('feedback-display');
    feedback.classList.remove('hidden');

    if (data.correct) {
      feedback.className = 'feedback-display correct';
      feedback.innerHTML = `
        <span class="feedback-icon">✓</span>
        <span class="feedback-text">Correct! +${data.xpEarned} XP</span>
        <span class="feedback-explanation">${data.explanation || 'Lock that pattern in and keep going.'}</span>
      `;
      // Play celebration for streaks
      if (typeof celebrate === 'function' && currentGame && currentGame.streak >= 3) {
        celebrate();
      }
    } else {
      feedback.className = 'feedback-display incorrect';
      feedback.innerHTML = `
        <span class="feedback-icon">✗</span>
        <span class="feedback-text">The answer was: ${data.correctAnswer}</span>
        <span class="feedback-explanation">${data.explanation || ''}</span>
      `;
    }
  }

  // Show hint
  function showHint() {
    const feedback = document.getElementById('feedback-display');
    feedback.classList.remove('hidden');
    feedback.className = 'feedback-display hint';
    feedback.innerHTML = `
      <span class="feedback-icon">💡</span>
      <span class="feedback-text">${currentGame?.currentHint || 'Take your time. Name the operation first, then do the arithmetic.'}</span>
    `;
  }

  // Quit game
  async function quitGame() {
    if (!currentGame) return;

    try {
      await fetch('/api/game/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: currentGame.gameId })
      });
    } catch (error) {
      console.error('Error ending game:', error);
    }

    currentGame = null;
    isSubmitting = false;
    stopTimer();
    showSelection();
  }

  // Show results screen
  function showResults(data) {
    stopTimer();
    currentGame = null;
    isSubmitting = false;

    gamePlay.classList.add('hidden');
    gameResults.classList.remove('hidden');

    // Set results data
    const stats = data.stats || {};
    document.getElementById('result-score').textContent = stats.score || 0;
    document.getElementById('result-correct').textContent =
      `${stats.problemsCorrect || 0}/${stats.problemsAttempted || 0}`;
    document.getElementById('result-accuracy').textContent = `${stats.accuracy || 0}%`;
    document.getElementById('result-streak').textContent = stats.maxStreak || 0;

    // XP earned
    const xpEarned = document.getElementById('xp-earned');
    xpEarned.querySelector('.xp-amount').textContent = `+${data.xpEarned || 0} XP`;

    // Check for new badges
    const newBadgesContainer = document.getElementById('new-badges');
    const newBadgesList = document.getElementById('new-badges-list');
    if (data.newBadges && data.newBadges.length > 0) {
      newBadgesContainer.classList.remove('hidden');
      newBadgesList.innerHTML = data.newBadges.map(badge =>
        `<div class="badge-earned">
          <span class="badge-emoji">${badge.emoji}</span>
          <span class="badge-name">${badge.name}</span>
        </div>`
      ).join('');
    } else {
      newBadgesContainer.classList.add('hidden');
    }

    // Check for level up
    const levelUpDisplay = document.getElementById('level-up-display');
    if (data.levelUp) {
      levelUpDisplay.classList.remove('hidden');
      document.getElementById('new-level-name').textContent =
        `Level ${data.newLevel}: ${data.progress?.levelName || 'Math Champion'}`;
      // Big celebration!
      if (typeof celebrate === 'function') {
        celebrate();
        setTimeout(celebrate, 500);
      }
    } else {
      levelUpDisplay.classList.add('hidden');
    }

    // Set emoji and title based on performance
    const resultsEmoji = document.getElementById('results-emoji');
    const resultsTitle = document.getElementById('results-title');

    if (stats.accuracy >= 90) {
      resultsEmoji.textContent = '🌟';
      resultsTitle.textContent = 'Amazing!';
      if (typeof celebrate === 'function') celebrate();
    } else if (stats.accuracy >= 70) {
      resultsEmoji.textContent = '🎉';
      resultsTitle.textContent = 'Great Job!';
    } else if (stats.accuracy >= 50) {
      resultsEmoji.textContent = '👍';
      resultsTitle.textContent = 'Good Effort!';
    } else {
      resultsEmoji.textContent = '💪';
      resultsTitle.textContent = 'Keep Practicing!';
    }

    const prescription = document.getElementById('practice-prescription');
    if (prescription) {
      if (stats.accuracy >= 90) {
        prescription.textContent = 'Next move: try a harder deck or repeat this one tomorrow for speed.';
      } else if (stats.accuracy >= 70) {
        prescription.textContent = 'Next move: replay this deck once. The goal is 90% before moving on.';
      } else {
        prescription.textContent = 'Next move: slow round. Use hints, say each fact out loud, then replay.';
      }
    }

    // Refresh progress after short delay to ensure DB has updated
    setTimeout(() => loadProgress(), 500);
  }

  // Play again (same game type)
  function playAgain() {
    if (lastGameType === 'quiz' && lastQuizTopic) {
      startGame('quiz', lastQuizTopic);
    } else if (lastGameType === 'custom' && lastCustomOptions) {
      startGame('custom', null, lastCustomOptions);
    } else {
      startGame(lastGameType);
    }
  }

  // Timer functions
  let elapsedSeconds = 0;

  function startTimer() {
    elapsedSeconds = 0;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      elapsedSeconds++;
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const display = document.getElementById('timer-display');
    if (display) {
      display.textContent = `⏱️ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  // Public API
  return {
    init,
    show,
    hide,
    startGame,
    submitAnswer,
    nextQuestion,
    showHint,
    quitGame,
    playAgain,
    showSelection,
    showQuizPicker,
    startQuiz,
    showCustomPractice,
    selectCustomLevel,
    selectCustomSubject,
    startCustomPractice,
    showConceptPicker,
    showConcept,
    practiceConceptQuiz
  };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  GameModule.init();
});
