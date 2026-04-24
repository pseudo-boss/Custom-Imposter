// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────

let state = {
  players: [],          // [{ name }]
  unusedWords: [],      // [{ word, clue, addedBy }]
  usedWords: [],        // [{ word, clue }]
  newWordsStaging: [],  // [{ word, clue }] — collected this round, not yet in pool
  currentRound: 0,
  roundWord: null,      // { word, clue }
  imposterIndex: null,  // index into players[]
  wordEntryIndex: 0,    // which player is currently entering words
  roleRevealIndex: 0,   // which player is currently seeing their role
};

// ─────────────────────────────────────────────
//  PERSISTENCE
// ─────────────────────────────────────────────
const graceMessages = [
  'GENUINELY why tf do you look like that',
  'Scientists all over the world are STILL looking for that number',
  'Actually fat as hell',
  'why cant you look more like yo mum fr',
  'you were adopted from the whale section at seaworld',
  'even though you may be fat, ugly, dumb as hell, useless, never carries her luggage, always two steps behind intellectually, and the least valuable member of society.',
  'you peaked (aura wise, definitely NOT weight wise) at dj_katzV3',
  'you look like sabrina carpenter if she got horribly disfigured in a brutal car accident, and then proceeded to eat 6 newsxpresses (the entire store)',
  'kill yoursuzza mate',
  'ok lowk tho jane lookin kinda sus rn',
  'daaammmnnn she bad - no i think she looks quite good actually',
  'dolce gabana mega extra large family meal lookin ass'
];
const dylanMessages = [
  'Does anyone need some milk? 💛',
  'Bu Yong 😊',
  'that lasanga oil poured on noodles actually slapped tho fr',
  'you have a tell',
  'bad feeling about grace this round',
  'dont forget who you really are burp rattle',
  'when is that trip edit coming out',
  'she never carries her luggage tho fr'
];

const janeMessages = [
  'project hail mary was good',
  'lowk sus on grace this round',
  'lowk dylan look sus af ong',
  'me when i lie about dropping 50c under the table outside southport park newsxpress',
  'ok but fr why you ordering a kebab delivery on ubereats at 3:43pm on a thursday arvo',
  'classic project x at graces tonight - dont get too turnt',
  'ok but if youre not gonna grab the free noodles you shouldnt waste it',
  'china 2027 FOR SURE this time its HAPPENING'
];

function saveState() {
  localStorage.setItem('imposter_state', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('imposter_state');
  if (saved) {
    state = JSON.parse(saved);
    return true;
  }
  return false;
}

function clearState() {
  localStorage.removeItem('imposter_state');
}

// ─────────────────────────────────────────────
//  SCREEN MANAGEMENT
// ─────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ─────────────────────────────────────────────
//  SCREEN 1: PLAYER COUNT
// ─────────────────────────────────────────────

let playerCount = 4;

document.getElementById('btn-minus').addEventListener('click', () => {
  if (playerCount > 3) {
    playerCount--;
    document.getElementById('player-count-display').textContent = playerCount;
  }
});

document.getElementById('btn-plus').addEventListener('click', () => {
  if (playerCount < 20) {
    playerCount++;
    document.getElementById('player-count-display').textContent = playerCount;
  }
});

document.getElementById('btn-count-next').addEventListener('click', () => {
  buildNameFields(playerCount);
  showScreen('screen-names');
});

// ─────────────────────────────────────────────
//  SCREEN 2: PLAYER NAMES
// ─────────────────────────────────────────────

function buildNameFields(count) {
  const container = document.getElementById('name-fields');
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'name-input';
    input.placeholder = `Player ${i + 1}`;
    input.dataset.index = i;
    container.appendChild(input);
  }
}

document.getElementById('btn-names-next').addEventListener('click', () => {
  const inputs = document.querySelectorAll('#name-fields .name-input');
  const names = Array.from(inputs).map(i => i.value.trim());

  // Validate all filled
  if (names.some(n => n === '')) {
    showError('screen-names', 'Please enter a name for every player.');
    return;
  }

  // Check duplicates
  const unique = new Set(names.map(n => n.toLowerCase()));
  if (unique.size !== names.length) {
    showError('screen-names', 'Each player must have a unique name.');
    return;
  }

  clearError('screen-names');

  // New game — reset state
  state.players = names.map(name => ({ name }));
  state.unusedWords = [];
  state.usedWords = [];
  state.newWordsStaging = [];
  state.currentRound = 0;
  state.wordEntryIndex = 0;
  state.roleRevealIndex = 0;
  state.roundWord = null;
  state.imposterIndex = null;

  saveState();
  startWordEntryPhase();
});

// ─────────────────────────────────────────────
//  SCREEN 3 & 4: WORD ENTRY PHASE
// ─────────────────────────────────────────────

function startWordEntryPhase() {
  state.wordEntryIndex = 0;
  saveState();
  showWordEntryForCurrentPlayer();
}

function showWordEntryForCurrentPlayer() {
  const player = state.players[state.wordEntryIndex];
  const isFirstRound = state.currentRound === 0;
  const wordCount = isFirstRound ? 3 : 1;

  document.getElementById('word-entry-label').textContent = player.name;
  document.getElementById('word-entry-subtitle').textContent =
    isFirstRound
      ? 'Enter 3 words and a clue for each'
      : 'Add a new word and clue';

  buildWordFields(wordCount);
  buildWordFields(wordCount);

  // Show skip button only from round 2 onwards
  const existingSkip = document.getElementById('btn-skip-word');
  if (existingSkip) existingSkip.remove();

  if (state.currentRound > 0) {
    const skipBtn = document.createElement('button');
    skipBtn.addEventListener('click', () => {
  // Clear all word fields so next player starts fresh
  document.querySelectorAll('#word-fields [data-role="word"]').forEach(i => i.value = '');
  document.querySelectorAll('#word-fields [data-role="clue"]').forEach(i => i.value = '');
  clearError('screen-words');

  skipBtn.remove();
  state.wordEntryIndex++;
  if (state.wordEntryIndex === 1) {
    prepareRound(true);
  }
  state.roleRevealIndex = state.wordEntryIndex - 1;
  saveState();
  showRoleRevealForCurrentPlayer();
});
    skipBtn.className = 'btn-secondary';
    skipBtn.id = 'btn-skip-word';
    skipBtn.textContent = 'Skip — just show my role';
    skipBtn.addEventListener('click', () => {
      skipBtn.remove();
      state.wordEntryIndex++;
      if (state.wordEntryIndex === 1) {
        prepareRound(true);
      }
      state.roleRevealIndex = state.wordEntryIndex - 1;
      saveState();
      showRoleRevealForCurrentPlayer();
    });
    document.getElementById('btn-words-submit').insertAdjacentElement('afterend', skipBtn);
  }

  showScreen('screen-words');
}

function buildWordFields(count) {
  const container = document.getElementById('word-fields');
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const group = document.createElement('div');
    group.className = 'word-group';

    const wordLabel = document.createElement('span');
    wordLabel.className = 'field-label';
    wordLabel.textContent = count > 1 ? `Word ${i + 1}` : 'Word';

    const wordInput = document.createElement('input');
    wordInput.type = 'text';
    wordInput.placeholder = 'Enter a word';
    wordInput.dataset.role = 'word';
    wordInput.dataset.index = i;
    wordInput.maxLength = 25;

    const clueLabel = document.createElement('span');
    clueLabel.className = 'field-label';
    clueLabel.textContent = 'Clue / Industry';

    const clueInput = document.createElement('input');
    clueInput.type = 'text';
    clueInput.placeholder = 'e.g. Technology, Sports, Food…';
    clueInput.dataset.role = 'clue';
    clueInput.dataset.index = i;

    group.appendChild(wordLabel);
    group.appendChild(wordInput);
    group.appendChild(clueLabel);
    group.appendChild(clueInput);
    container.appendChild(group);
  }
}

document.getElementById('btn-words-submit').addEventListener('click', () => {
  const container = document.getElementById('word-fields');
  const wordInputs = container.querySelectorAll('[data-role="word"]');
  const clueInputs = container.querySelectorAll('[data-role="clue"]');

  const entries = [];
  let valid = true;

  wordInputs.forEach((wi, i) => {
    const word = wi.value.trim();
    const clue = clueInputs[i].value.trim();
    if (!word || !clue) valid = false;
    entries.push({ word, clue, addedBy: state.wordEntryIndex });
  });

  if (!valid) {
    showError('screen-words', 'Please fill in every word and clue.');
    return;
  }

// Check for duplicate words against existing pool
  const allExistingWords = [
    ...state.unusedWords,
    ...state.usedWords,
    ...state.newWordsStaging,
  ].map(e => e.word.toLowerCase().trim());

  const newWords = entries.map(e => e.word.toLowerCase().trim());

  // Check duplicates within what's being submitted right now
  const newWordsUnique = new Set(newWords);
  if (newWordsUnique.size !== newWords.length) {
    showError('screen-words', 'You have duplicate words in your submission.');
    return;
  }

  // Check against existing pool
const nonEmptyNewWords = newWords.filter(w => w !== '');
  const clash = nonEmptyNewWords.find(w => allExistingWords.includes(w));
  if (clash) {
    showError('screen-words', `"${clash}" word has already been added. Try a different word.`);
    return;
  }

  clearError('screen-words');

  const isFirstRound = state.currentRound === 0;

  if (isFirstRound) {
    // Add directly to unused pool
    state.unusedWords.push(...entries);
  } else {
    // Stage new words — they enter the pool after the round
    state.newWordsStaging.push(...entries);
  }

  state.wordEntryIndex++;
  saveState();

  if (state.currentRound === 0) {
    if (state.wordEntryIndex < state.players.length) {
      showPassScreen(
        state.players[state.wordEntryIndex].name,
        'Pass the phone to them. They should enter their word privately.',
        'screen-words',
        showWordEntryForCurrentPlayer
      );
    } else {
      prepareRound();
    }
  } else {
    // Round 2+: prepare round after first player submits, then show roles inline
    if (state.wordEntryIndex === 1) {
      prepareRound(true); // true = don't reset roleRevealIndex yet
    }
    state.roleRevealIndex = state.wordEntryIndex - 1;
    saveState();
    showRoleRevealForCurrentPlayer();
  }
});

// ─────────────────────────────────────────────
//  PASS SCREEN
// ─────────────────────────────────────────────

let passCallback = null;

function showPassScreen(playerName, subtitle, fromScreen, callback) {
  document.getElementById('pass-title').textContent = `Pass to ${playerName}`;
  document.getElementById('pass-subtitle').textContent = subtitle;
  passCallback = callback;
  showScreen('screen-pass');
}

document.getElementById('btn-pass-ready').addEventListener('click', () => {
  if (passCallback) {
    const cb = passCallback;
    passCallback = null;
    cb();
  }
});

// ─────────────────────────────────────────────
//  ROUND PREPARATION
// ─────────────────────────────────────────────

function prepareRound(keepRevealIndex = false) {
  if (state.unusedWords.length === 0) {
    alert('No unused words left! The game cannot continue.');
    return;
  }

  const wordIndex = Math.floor(Math.random() * state.unusedWords.length);
  state.roundWord = state.unusedWords[wordIndex];
  state.unusedWords.splice(wordIndex, 1);
  state.imposterIndex = Math.floor(Math.random() * state.players.length);

  if (!keepRevealIndex) {
    state.roleRevealIndex = 0;
  }

  saveState();

  if (!keepRevealIndex) {
    showPassScreen(
      state.players[0].name,
      'Time to find out your role. Pass the phone to each player privately.',
      null,
      showRoleRevealForCurrentPlayer
    );
  }
}

// ─────────────────────────────────────────────
//  SCREEN 5: ROLE REVEAL (per player)
// ─────────────────────────────────────────────

function showRoleRevealForCurrentPlayer() {
  const player = state.players[state.roleRevealIndex];
  document.getElementById('role-player-label').textContent = player.name;

  // Reset reveal UI
  document.getElementById('btn-reveal-role').classList.remove('hidden');
  document.getElementById('role-result').classList.add('hidden');
  document.getElementById('role-content').innerHTML = '';

  showScreen('screen-role');
}

document.getElementById('btn-reveal-role').addEventListener('click', () => {
  const isImposter = state.roleRevealIndex === state.imposterIndex;
  const contentEl = document.getElementById('role-content');

  const card = document.createElement('div');
  card.className = 'role-card' + (isImposter ? ' imposter' : '');

  if (isImposter) {
    card.innerHTML = `
      <span class="role-tag">Your role</span>
      <span class="role-main">🕵️ Imposter</span>
      <span class="role-clue">Clue: ${state.roundWord.clue}</span>
    `;
  } else {
    card.innerHTML = `
      <span class="role-tag">The word is</span>
      <span class="role-main">${state.roundWord.word}</span>
    `;
  }

  contentEl.appendChild(card);

    const currentPlayer = state.players[state.roleRevealIndex];
  if (currentPlayer.name.toLowerCase() === 'grace') {
    const msg = document.createElement('p');
    msg.className = 'subtitle';
    msg.style.textAlign = 'center';
    msg.style.marginTop = '4px';
    msg.textContent = graceMessages[Math.floor(Math.random() * graceMessages.length)];
    contentEl.appendChild(msg);
    
  }
  if (currentPlayer.name.toLowerCase() === 'dylan') {
  const msg = document.createElement('p');
  msg.className = 'subtitle';
  msg.style.textAlign = 'center';
  msg.style.marginTop = '4px';
  msg.textContent = dylanMessages[Math.floor(Math.random() * dylanMessages.length)];
  contentEl.appendChild(msg);
}

if (currentPlayer.name.toLowerCase() === 'jane') {
  const msg = document.createElement('p');
  msg.className = 'subtitle';
  msg.style.textAlign = 'center';
  msg.style.marginTop = '4px';
  msg.textContent = janeMessages[Math.floor(Math.random() * janeMessages.length)];
  contentEl.appendChild(msg);
}

  document.getElementById('btn-reveal-role').classList.add('hidden');
  document.getElementById('role-result').classList.remove('hidden');
});

document.getElementById('btn-role-next').addEventListener('click', () => {
  state.roleRevealIndex++;
  saveState();

  if (state.currentRound === 0) {
    // Round 1 — pure role reveal loop
    if (state.roleRevealIndex < state.players.length) {
      showPassScreen(
        state.players[state.roleRevealIndex].name,
        'Pass the phone to them for their role.',
        null,
        showRoleRevealForCurrentPlayer
      );
    } else {
      showRoundReveal();
    }
  } else {
    // Round 2+ — next player does word entry then sees role
    if (state.wordEntryIndex < state.players.length) {
      showPassScreen(
        state.players[state.wordEntryIndex].name,
        'Pass the phone to them. They will add a new word privately.',
        null,
        showWordEntryForCurrentPlayer
      );
    } else {
      showRoundReveal();
    }
  }
});

// ─────────────────────────────────────────────
//  SCREEN 6: ROUND REVEAL
// ─────────────────────────────────────────────

function showRoundReveal() {
  document.getElementById('btn-show-reveal').classList.remove('hidden');
  document.getElementById('reveal-result').classList.add('hidden');
  showScreen('screen-round-reveal');
}

document.getElementById('btn-show-reveal').addEventListener('click', () => {
  document.getElementById('reveal-imposter').textContent =
    state.players[state.imposterIndex].name;
  document.getElementById('reveal-word').textContent = state.roundWord.word;

  document.getElementById('btn-show-reveal').classList.add('hidden');
  document.getElementById('reveal-result').classList.remove('hidden');
});

document.getElementById('btn-play-again').addEventListener('click', () => {
  // Archive used word
  state.usedWords.push(state.roundWord);
  state.roundWord = null;
  state.imposterIndex = null;

  // Graduate staged new words into unused pool
  state.unusedWords.push(...state.newWordsStaging);
  state.newWordsStaging = [];

  state.currentRound++;
  state.wordEntryIndex = 0;

  saveState();

  // Go straight to word entry for next round (names already saved)
  showPassScreen(
    state.players[0].name,
    'Pass the phone to them. They will add a new word privately.',
    null,
    showWordEntryForCurrentPlayer
  );
});

// ─────────────────────────────────────────────
//  ERROR HELPERS
// ─────────────────────────────────────────────

function showError(screenId, message) {
  const screen = document.getElementById(screenId);
  clearError(screenId);
  const err = document.createElement('p');
  err.className = 'error-msg';
  err.textContent = message;
  err.dataset.error = 'true';
  screen.appendChild(err);
}

function clearError(screenId) {
  const existing = document.querySelector(`#${screenId} [data-error]`);
  if (existing) existing.remove();
}

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────

// Always start fresh at launch (don't auto-resume)
showScreen('screen-count');
