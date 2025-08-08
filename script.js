// Baker's percentage recipe definitions
const RECIPES = {
  pizza: {
    name: "Pizza Dough",
    percentages: [
      { name: "Flour (all-purpose)", percent: 100 },
      { name: "Water", percent: 65 },
      { name: "Salt", percent: 2 },
      { name: "Yeast (Instant)", percent: 1.5 },
      { name: "Olive Oil", percent: 4 }
    ],
    instructions: [
      { text: "Mix flour and salt in a bowl.", timer: null },
      { text: "Dissolve yeast in water, add olive oil.", timer: null },
      { text: "Combine wet and dry ingredients. Knead for 8 minutes.", timer: { minutes: 8 } },
      { text: "Cover and let rise for 2 hours.", timer: { hours: 2 } },
      { text: "Divide dough, shape into balls. Rest for 20 minutes.", timer: { minutes: 20 } },
      { text: "Roll out, add toppings, and bake at 250°C (480°F) for 12 minutes.", timer: { minutes: 12 } }
    ]
  },
  bread: {
    name: "Bread Dough",
    percentages: [
      { name: "Flour (bread)", percent: 100 },
      { name: "Water", percent: 63 },
      { name: "Salt", percent: 2 },
      { name: "Yeast (Instant)", percent: 1.2 },
      { name: "Sugar", percent: 3 }
    ],
    instructions: [
      { text: "Mix flour, salt, and sugar in a bowl.", timer: null },
      { text: "Dissolve yeast in water.", timer: null },
      { text: "Combine wet and dry ingredients. Knead for 10 minutes.", timer: { minutes: 10 } },
      { text: "Cover and let rise for 1 hour.", timer: { hours: 1 } },
      { text: "Shape into loaf, let rise for 40 minutes.", timer: { minutes: 40 } },
      { text: "Bake at 220°C (430°F) for 30 minutes.", timer: { minutes: 30 } }
    ]
  }
};

// Calculate ingredient weights from baker's percentages
function calculateIngredients(recipeKey, numItems, itemWeight) {
  const recipe = RECIPES[recipeKey];
  const percentages = recipe.percentages;
  const totalDough = numItems * itemWeight; // grams

  // Sum of all percentages as a factor of flour
  let percentSum = percentages.reduce((acc, ing) => acc + ing.percent, 0);

  // Total flour weight
  let flourWeight = totalDough / (percentSum / 100);

  // Calculate ingredient weights
  let ingredients = percentages.map(ing => ({
    name: ing.name,
    percent: ing.percent,
    weight: +(flourWeight * (ing.percent / 100)).toFixed(1) // rounded to 1 decimal
  }));

  return {
    totalDough: +(totalDough).toFixed(1),
    flourWeight: +(flourWeight).toFixed(1),
    ingredients
  };
}

function renderIngredients(recipeKey, numItems, itemWeight) {
  const recipe = RECIPES[recipeKey];
  const data = calculateIngredients(recipeKey, numItems, itemWeight);

  // Show total dough
  document.getElementById('total-dough').textContent = `(total dough: ${data.totalDough}g)`;

  // Show ingredient list
  const list = document.getElementById('ingredients-list');
  list.innerHTML = '';
  data.ingredients.forEach(ing => {
    const li = document.createElement('li');
    li.textContent = `${ing.name}: ${ing.weight} g (${ing.percent}%)`;
    list.appendChild(li);
  });

  // Show baker's percentage note
  document.getElementById('percentages-note').innerHTML =
    `All ingredient amounts are calculated using baker's percentages (flour = 100%).<br>
    The total dough weight is distributed among all ingredients.`;
}

function renderInstructions(recipeKey) {
  const recipe = RECIPES[recipeKey];
  const list = document.getElementById('instructions-list');
  list.innerHTML = '';
  recipe.instructions.forEach((step, i) => {
    const li = document.createElement('li');
    li.textContent = step.text;
    if (step.timer) {
      li.innerHTML += ` <button class="start-timer-btn" data-step="${i}">Start Timer</button>`;
    }
    list.appendChild(li);
  });
}

function formatTime(seconds) {
  let h = Math.floor(seconds / 3600);
  let m = Math.floor((seconds % 3600) / 60);
  let s = seconds % 60;
  return [
    h > 0 ? String(h).padStart(2, '0') : null,
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0')
  ].filter(Boolean).join(':');
}

function setupTimers(recipeKey) {
  const recipe = RECIPES[recipeKey];
  const timersDiv = document.getElementById('timers-list');
  timersDiv.innerHTML = '';
  recipe.instructions.forEach((step, i) => {
    if (step.timer) {
      const timerDiv = document.createElement('div');
      timerDiv.className = 'timer';
      timerDiv.dataset.step = i;

      let totalSeconds =
        (step.timer.hours || 0) * 3600 +
        (step.timer.minutes || 0) * 60 +
        (step.timer.seconds || 0);

      timerDiv.innerHTML = `
        <div><strong>Step ${i + 1}:</strong> ${step.text}</div>
        <div class="time-remaining" id="timer-${i}">${formatTime(totalSeconds)}</div>
        <div class="timer-controls">
          <button data-step="${i}" class="start-btn">Start</button>
          <button data-step="${i}" class="pause-btn" disabled>Pause</button>
          <button data-step="${i}" class="reset-btn" disabled>Reset</button>
        </div>
      `;
      timersDiv.appendChild(timerDiv);
    }
  });
}

const timerStates = {}; // {step: {interval, remaining, running, original}}

function initTimers(recipeKey) {
  // Re-init all timer states
  const recipe = RECIPES[recipeKey];
  recipe.instructions.forEach((step, i) => {
    if (step.timer) {
      let totalSeconds =
        (step.timer.hours || 0) * 3600 +
        (step.timer.minutes || 0) * 60 +
        (step.timer.seconds || 0);
      timerStates[i] = {
        interval: null,
        remaining: totalSeconds,
        running: false,
        original: totalSeconds
      };
    }
  });
}

function attachTimerEvents(recipeKey) {
  const timersDiv = document.getElementById('timers-list');
  timersDiv.addEventListener('click', function(e) {
    if (e.target.classList.contains('start-btn')) {
      const step = e.target.dataset.step;
      startTimer(step);
    }
    if (e.target.classList.contains('pause-btn')) {
      const step = e.target.dataset.step;
      pauseTimer(step);
    }
    if (e.target.classList.contains('reset-btn')) {
      const step = e.target.dataset.step;
      resetTimer(step);
    }
  });
}

function updateTimerDisplay(step) {
  const timeDiv = document.getElementById(`timer-${step}`);
  if (timeDiv) timeDiv.textContent = formatTime(timerStates[step].remaining);
}

function startTimer(step) {
  if (timerStates[step].running) return;
  timerStates[step].running = true;
  document.querySelector(`.start-btn[data-step="${step}"]`).disabled = true;
  document.querySelector(`.pause-btn[data-step="${step}"]`).disabled = false;
  document.querySelector(`.reset-btn[data-step="${step}"]`).disabled = false;
  timerStates[step].interval = setInterval(() => {
    if (timerStates[step].remaining > 0) {
      timerStates[step].remaining -= 1;
      updateTimerDisplay(step);
    } else {
      clearInterval(timerStates[step].interval);
      timerStates[step].running = false;
      updateTimerDisplay(step);
      document.querySelector(`.pause-btn[data-step="${step}"]`).disabled = true;
      alert(`Step ${parseInt(step) + 1} timer finished!`);
    }
  }, 1000);
}

function pauseTimer(step) {
  if (!timerStates[step].running) return;
  clearInterval(timerStates[step].interval);
  timerStates[step].running = false;
  document.querySelector(`.start-btn[data-step="${step}"]`).disabled = false;
  document.querySelector(`.pause-btn[data-step="${step}"]`).disabled = true;
}

function resetTimer(step) {
  clearInterval(timerStates[step].interval);
  timerStates[step].remaining = timerStates[step].original;
  timerStates[step].running = false;
  updateTimerDisplay(step);
  document.querySelector(`.start-btn[data-step="${step}"]`).disabled = false;
  document.querySelector(`.pause-btn[data-step="${step}"]`).disabled = true;
  document.querySelector(`.reset-btn[data-step="${step}"]`).disabled = true;
}

function updateAll(recipeKey, numItems, itemWeight) {
  renderIngredients(recipeKey, numItems, itemWeight);
  renderInstructions(recipeKey);
  setupTimers(recipeKey);
  initTimers(recipeKey);
  attachTimerEvents(recipeKey);
}

document.addEventListener('DOMContentLoaded', () => {
  const recipeSelect = document.getElementById('recipe-select');
  const numItemsInput = document.getElementById('num-items');
  const itemWeightInput = document.getElementById('item-weight');
  const updateBtn = document.getElementById('update-btn');

  let currentRecipe = recipeSelect.value;
  let numItems = parseInt(numItemsInput.value, 10);
  let itemWeight = parseInt(itemWeightInput.value, 10);

  updateAll(currentRecipe, numItems, itemWeight);

  updateBtn.addEventListener('click', () => {
    currentRecipe = recipeSelect.value;
    numItems = Math.max(1, parseInt(numItemsInput.value, 10));
    itemWeight = Math.max(50, parseInt(itemWeightInput.value, 10)); // Minimum 50g
    updateAll(currentRecipe, numItems, itemWeight);
  });

  recipeSelect.addEventListener('change', () => {
    currentRecipe = recipeSelect.value;
    updateAll(currentRecipe, numItems, itemWeight);
  });

  numItemsInput.addEventListener('input', () => {
    numItems = Math.max(1, parseInt(numItemsInput.value, 10));
  });

  itemWeightInput.addEventListener('input', () => {
    itemWeight = Math.max(50, parseInt(itemWeightInput.value, 10));
  });
});