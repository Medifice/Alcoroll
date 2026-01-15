/*
  Alcoroll - Host Game Logic
  Normal / Count-Dice / Numboard
*/

/* =========================================================
   GLOBAL STATE
========================================================= */

/* =========================================================
   NORMAL MODE — SINGLE PLAYER
========================================================= */

let normalSinglePlayer = false;
let spLevel = 1;
let spCorrectAnswer = null;
let spCombo = 0;
let currentMode = null;
let gamePhase = "idle";
let roundTimer = null;
let timeLeft = 0;
let spQuestionStartTime = 0;


let roomCode = generateRoomCode();

let spDifficulty = "easy";

const SP_DIFFICULTY = {
    easy: {
        baseTime: 14,
        minTime: 7,
        numberScale: 1,
        comboBonus: 0
    },
    hard: {
        baseTime: 10,
        minTime: 4,
        numberScale: 1.6,
        comboBonus: 1
    }
};

/* =========================================================
   UTILITIES
========================================================= */

function hideIfExists(id) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
}

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function triggerDiceShake() {
    const tray = document.getElementById("dice-tray");
    if (!tray) return;

    tray.classList.remove("shake");
    void tray.offsetWidth;
    tray.classList.add("shake");
}

function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

function roll4d6() {
    return [rollDie(6), rollDie(6), rollDie(6), rollDie(6)];
}

/* =========================================================
   MODE SELECTION
========================================================= */

function setMode(mode) {
    currentMode = mode;
    clearInterval(roundTimer);
	hideIfExists("sp-toggle-wrap");
    hideIfExists("sp-ui");
    hideIfExists("sp-difficulty");

normalSinglePlayer = false;
    document.getElementById("instructions").innerHTML = "";
    document.getElementById("output").innerHTML = "";

    if (mode === "normal") {
        renderNormalIntro();
    }

    if (mode === "count") {
        resetCountDice();
        renderCountIntro();
    }

    if (mode === "numboard") {
        renderNumboardIntro();
        startNumboardRound();
    }
}

/* =========================================================
   TIMER
========================================================= */

function startPhaseTimer(seconds, onEnd) {
    clearInterval(roundTimer);
    timeLeft = seconds;

    updateTimerDisplay();

    roundTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(roundTimer);
            onEnd();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timer = document.getElementById("timer");
    if (timer) {
        timer.textContent = `⏱ ${timeLeft}s`;
    }
}

/* =========================================================
   ROLL BUTTON
========================================================= */

function doRoll() {
    if (!currentMode) {
        alert("Select a game mode first!");
        return;
    }

    if (currentMode === "normal") {
        if (normalSinglePlayer) return;
        playNormalGame();
    }

    if (currentMode === "count") {
        rollNextCountDie();
    }
}

/* =========================================================
   NORMAL MODE
========================================================= */

function renderNormalIntro() {
    document.getElementById("instructions").innerHTML = `
        <h2>🎲 Normal Game</h2>
        <p>Roll: 4d6 → 1d4 → 4d6</p>
        <p><strong>Slowest drinks 🍺</strong></p>
    `;

    const toggleWrap = document.getElementById("sp-toggle-wrap");
    const toggle = document.getElementById("sp-toggle");
    const difficulty = document.getElementById("sp-difficulty");

    toggleWrap.hidden = false;
    difficulty.hidden = false;

    toggle.checked = false;
    normalSinglePlayer = false;

    difficulty.value = "easy";
    spDifficulty = "easy";

    difficulty.onchange = () => {
        spDifficulty = difficulty.value;
    };

    toggle.onchange = () => {
        normalSinglePlayer = toggle.checked;
        if (normalSinglePlayer) startNormalSinglePlayer();
        else stopNormalSinglePlayer();
    };
}

function playNormalGame() {
    const a = roll4d6();
    const b = rollDie(4);
    const c = roll4d6();

    const totalA = a.reduce((x, y) => x + y, 0);
    const totalC = c.reduce((x, y) => x + y, 0);

    document.getElementById("output").innerHTML = `
        <h2>🎲 Dice</h2>
        <p>${a.join(" + ")} = ${totalA}</p>
        <p>1d4 = ${b}</p>
        <p>${c.join(" + ")} = ${totalC}</p>
        <h3>🧠 Solve:</h3>
        <p>(${totalA} + ${totalC}) × ${b}</p>
    `;
}

function startNormalSinglePlayer() {
    spLevel = 1;
    spCombo = 0;

    document.getElementById("output").innerHTML = "";
    document.getElementById("sp-ui").hidden = false;

    document.body.classList.toggle("hard-mode", spDifficulty === "hard");

    updateComboGlow();
    nextSPQuestion();
}

function stopNormalSinglePlayer() {
    clearInterval(roundTimer);
    document.getElementById("sp-ui").hidden = true;
}

/* =========================================================
   COUNT-DICE MODE (HOST)
========================================================= */

let countDiceRolls = [];
let countOperators = [];
let countTarget = null;
let rollIndex = 0;
let countdownTimer = null;

const COUNT_OPERATORS_POOL = ["+", "+", "+", "×", "-", "÷"];

function generateCountOperators(count) {
    return Array.from({ length: count }, () =>
        COUNT_OPERATORS_POOL[
            Math.floor(Math.random() * COUNT_OPERATORS_POOL.length)
        ]
    );
}

function renderCountIntro() {
    document.getElementById("instructions").innerHTML = `
        <h2>🧮 Count-Dice</h2>
        <p>📱 Join at <strong>alcoroll.party</strong></p>
        <h1>🔑 Room Code: ${roomCode}</h1>
        <p>Closest answer wins</p>
    `;
}

function resetCountDice() {
    countDiceRolls = [];
    rollIndex = 0;
    countTarget = Math.floor(Math.random() * 40) + 20;
    countOperators = generateCountOperators(3);

    clearInterval(countdownTimer);

    document.getElementById("output").innerHTML = `
        <p><strong>🎯 Target:</strong> ${countTarget}</p>
        <p>Tap <strong>Roll Dice</strong> to begin</p>
    `;
}

function rollNextCountDie() {
    if (rollIndex >= 4) return;

    const dieType = rollIndex === 1 ? 4 : 6;
    countDiceRolls.push(rollDie(dieType));
    rollIndex++;

    renderCountEquation();

    if (rollIndex === 4) startCountdown();
}

function renderCountEquation() {
    let html = "";

    for (let i = 0; i < countDiceRolls.length; i++) {
        html += `<span class="count-num">${countDiceRolls[i]}</span>`;

        if (i < countOperators.length && i < countDiceRolls.length - 1) {
            html += `<span class="count-op">${countOperators[i]}</span>`;
        }
    }

    document.getElementById("output").innerHTML = `
        <p><strong>🎯 Target:</strong> ${countTarget}</p>
        <div class="count-equation">${html}</div>
        <p>🎲 Rolls remaining: ${4 - rollIndex}</p>
    `;
}

function startCountdown() {
    let timeLeft = 60;

    document.getElementById("output").innerHTML += `
        <p id="countdown">⏱ ${timeLeft}s</p>
    `;

    countdownTimer = setInterval(() => {
        timeLeft--;
        document.getElementById("countdown").textContent =
            `⏱ ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            document.getElementById("output").innerHTML += `
                <h3>⏱ Time’s up!</h3>
            `;
        }
    }, 1000);
}

/* =========================================================
   NUMBOARD MODE
========================================================= */

let numboardDice = [];
let numboardOperators = [];
let numboardTarget = null;

const AVAILABLE_OPERATORS = ["+", "-", "×", "÷"];

function renderNumboardIntro() {
    document.getElementById("instructions").innerHTML = `
        <h2>🧩 Numboard</h2>
        <p>Build an equation closest to the target</p>
    `;
}

function startNumboardRound() {
    numboardDice = [];
    numboardOperators = [];
    numboardTarget = Math.floor(Math.random() * 60) + 30;
    gamePhase = "setup";
    renderNumboard();
}

function beginThinking() {
    gamePhase = "thinking";
    renderNumboard();
    startPhaseTimer(60, lockNumboard);
}

function lockNumboard() {
    gamePhase = "locked";
    renderNumboard();
    setTimeout(revealNumboard, 2000);
}

function revealNumboard() {
    gamePhase = "reveal";
    renderNumboard();
}

function renderNumboard() {
    let eq = "";

    for (let i = 0; i < numboardDice.length; i++) {
        eq += `<span class="num">${numboardDice[i]}</span>`;
        if (i < numboardOperators.length) {
            const op = numboardOperators[i] ?? "?";
            eq += `<span class="op">${op}</span>`;
        }
    }

    let controls = "";

    if (gamePhase === "setup") {
        controls = `
            <button onclick="addNumboardDie(6)">🎲 Roll First Die</button>
            <button onclick="beginThinking()">▶ Start</button>
        `;
    }

    if (gamePhase === "thinking") {
        controls = `
            <div id="timer"></div>
            <button onclick="addNumboardDie(6)">➕ d6</button>
            <button onclick="addNumboardDie(4)">➕ d4</button>
            <button onclick="removeNumboardDie()">➖ Remove</button>
        `;
    }

    if (gamePhase === "reveal") {
        const result = evaluateNumboard();
        controls = `
            <h3>🎉 Result: ${result ?? "Invalid"}</h3>
            <p>🎯 Target: ${numboardTarget}</p>
            <button onclick="startNumboardRound()">🔁 Next Round</button>
        `;
    }

    document.getElementById("output").innerHTML = `
        <p>🎯 Target: <strong>${numboardTarget}</strong></p>
        <div class="equation">${eq || "Waiting..."}</div>
        ${controls}
    `;
}

function addNumboardDie(sides) {
    if (gamePhase !== "setup" && gamePhase !== "thinking") return;
    if (numboardDice.length >= 6) return;

    numboardDice.push(rollDie(sides));
    if (numboardDice.length > 1) numboardOperators.push(null);

    triggerDiceShake();
    renderNumboard();
}

function removeNumboardDie() {
    if (gamePhase !== "thinking") return;
    numboardDice.pop();
    numboardOperators.pop();
    renderNumboard();
}

function nextSPQuestion() {
    const q = generateSPQuestion(spLevel);
    spCorrectAnswer = q.answer;

    document.getElementById("sp-question").textContent = q.text;
    document.getElementById("sp-input").value = "";

    spQuestionStartTime = Date.now(); // ⏱ start timing here

    const cfg = SP_DIFFICULTY[spDifficulty];
    const time = Math.max(
        cfg.minTime,
        cfg.baseTime - Math.floor(spLevel / 2)
    );

    startPhaseTimer(time, endSinglePlayer);
}

function generateSPQuestion(level) {
    const scale = SP_DIFFICULTY[spDifficulty].numberScale;

    let a, b, text, answer;

    if (level < 3) {
        a = Math.ceil(rollDie(10) * scale);
        b = Math.ceil(rollDie(10) * scale);
        answer = a + b;
        text = `${a} + ${b}`;

    } else if (level < 6) {
        a = Math.ceil(rollDie(20) * scale);
        b = Math.ceil(rollDie(10) * scale);
        answer = a - b;
        text = `${a} − ${b}`;

    } else if (level < 9) {
        a = Math.ceil(rollDie(6 + level) * scale);
        b = Math.ceil(rollDie(6 + level) * scale);
        answer = a * b;
        text = `${a} × ${b}`;

    } else {
        b = Math.ceil((rollDie(9) + 1) * scale);
        answer = rollDie(10);
        a = answer * b;
        text = `${a} ÷ ${b}`;
    }

    return { text, answer };
}

function evaluateNumboard() {
    if (numboardOperators.includes(null)) return null;

    let expr = "";

    for (let i = 0; i < numboardDice.length; i++) {
        expr += numboardDice[i];
        if (i < numboardOperators.length) {
            expr += numboardOperators[i]
                .replace("×", "*")
                .replace("÷", "/");
        }
    }

    try {
        return Math.round(eval(expr));
    } catch {
        return null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.getElementById("sp-submit");
    const input = document.getElementById("sp-input");

    if (submitBtn) submitBtn.onclick = submitSPAnswer;

    if (input) {
        input.addEventListener("keydown", e => {
            if (e.key === "Enter") submitSPAnswer();
        });
    }
});

function breakCombo() {
    spCombo = 0;
    updateComboGlow();
}

function submitSPAnswer() {
    const val = Number(document.getElementById("sp-input").value);
    const ui = document.getElementById("sp-ui");

    if (val === spCorrectAnswer) {
        const responseTime =
            (Date.now() - spQuestionStartTime) / 1000;

        // Combo only if answered fast enough
        if (responseTime <= 3) {
            spCombo += 1 + SP_DIFFICULTY[spDifficulty].comboBonus;
        } else {
            spCombo = 1; // correct, but slow
        }

        updateComboGlow();
        flashCorrectUI();

        spLevel++;
        nextSPQuestion();
    } else {
        breakCombo();
        endSinglePlayer();
    }
}

function updateComboGlow() {
    const ui = document.getElementById("sp-ui");
	const comboText = document.getElementById("sp-combo");

	if (spCombo >= 2) {
    	comboText.hidden = false;
    	comboText.textContent = `🔥 COMBO x${spCombo}`;
	} else {
    	comboText.hidden = true;
	}
    ui.classList.remove(
        "combo-0",
        "combo-1",
        "combo-3",
        "combo-6",
        "combo-10"
    );

    if (spCombo >= 10) ui.classList.add("combo-10");
    else if (spCombo >= 6) ui.classList.add("combo-6");
    else if (spCombo >= 3) ui.classList.add("combo-3");
    else if (spCombo >= 1) ui.classList.add("combo-1");
    else ui.classList.add("combo-0");
}

function flashCorrectUI() {
    const ui = document.getElementById("sp-ui");
    if (!ui) return;

    ui.classList.remove("sp-correct", "shake");
    void ui.offsetWidth; // force reflow
    ui.classList.add("sp-correct", "shake");
}

function endSinglePlayer() {
    clearInterval(roundTimer);
    breakCombo();

    alert(`Game Over!\nLevel reached: ${spLevel}`);

    stopNormalSinglePlayer();
    document.getElementById("sp-toggle").checked = false;
}
