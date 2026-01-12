/*
  Alcoroll - Game Logic
  Normal + Count-Dice Mode
*/

let currentMode = null;
let gamePhase = "idle";
let roundTimer = null;
let timeLeft = 0;


/* ---------- Utilities ---------- */

function triggerDiceShake() {
    const tray = document.getElementById("dice-tray");
    if (!tray) return;

    tray.classList.remove("shake"); // reset
    void tray.offsetWidth;          // force reflow
    tray.classList.add("shake");
}


function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

function roll4d6() {
    return [
        rollDie(6),
        rollDie(6),
        rollDie(6),
        rollDie(6)
    ];
}

const COUNT_OPERATORS_POOL = ["+", "+", "+", "×", "-", "÷"]; 
// weighted: more +, fewer ÷

function generateCountOperators(count) {
    const ops = [];
    for (let i = 0; i < count; i++) {
        ops.push(
            COUNT_OPERATORS_POOL[
                Math.floor(Math.random() * COUNT_OPERATORS_POOL.length)
            ]
        );
    }
    return ops;
}

/* ---------- Mode Selection ---------- */

function setMode(mode) {
    currentMode = mode;

    document.getElementById("output").innerHTML = "";
    document.getElementById("instructions").innerHTML = "";

    if (mode === "normal") {
        document.getElementById("instructions").innerHTML = `
            <h2>🎲 Normal Game</h2>
            <p>Roll: 4d6 → 1d4 → 4d6</p>
            <p>Solve the maths.</p>
            <p><strong>Slowest player drinks 🍺</strong></p>
        `;
    }

    if (mode === "count") {
        resetCountDice();
        document.getElementById("instructions").innerHTML = `
            <h2>🧮 Count-Dice</h2>
            <p>Dice roll one at a time to build an equation.</p>
            <p>Everyone has <strong>60 seconds</strong>.</p>
            <p><strong>Closest answer wins.</strong></p>
        `;
    }

if (mode === "numboard") {
    document.getElementById("instructions").innerHTML = `
        <h2>🧩 Numboard</h2>
        <p>Build an equation closest to the target.</p>
        <p><strong>Closest wins 🍻</strong></p>
    `;

    startNumboardRound();
}
}

/* ------- Countdown Logic ---------*/

function startPhaseTimer(seconds, onEnd) {
    clearInterval(roundTimer);
    timeLeft = seconds;

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
    if (!timer) return;

    timer.textContent = `⏱ ${timeLeft}s`;
}



/* ---------- Roll Button ---------- */

function doRoll() {
    if (!currentMode) {
        alert("Select a game mode first!");
        return;
    }

    if (currentMode === "numboard") return;

    triggerDiceShake();

    if (currentMode === "normal") playNormalGame();
    if (currentMode === "count") rollNextCountDie();
}

/* ---------- Normal Game ---------- */

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

        <p><strong>Slowest drinks 🍺</strong></p>
    `;
}

/* =========================================================
   NUMBOARD MODE
========================================================= */

let numboardDice = [];
let numboardOperators = [];
let numboardTarget = null;

const AVAILABLE_OPERATORS = ["+", "-", "×", "÷"];

/* ---------- Numboard Phase Flow ---------- */

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

/* ---------- Render UI ---------- */

function renderNumboard() {
    let equationHTML = "";

    for (let i = 0; i < numboardDice.length; i++) {
        equationHTML += `<span class="num">${numboardDice[i]}</span>`;

        if (i < numboardOperators.length) {
            const op = numboardOperators[i] ?? "?";
            equationHTML += `
                <span class="op ${gamePhase !== "thinking" ? "locked" : ""}"
                      onclick="cycleOperator(${i})">
                    ${op}
                </span>
            `;
        }
    }

    let controls = "";

    if (gamePhase === "setup") {
        controls = `
            <button onclick="addNumboardDie(6)">🎲 Roll First Die</button>
            <button onclick="beginThinking()">▶ Start Round</button>
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

    if (gamePhase === "locked") {
        controls = `<p>🔒 Pens down!</p>`;
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
        <h3>🧩 Numboard</h3>
        <p>🎯 Target: <strong>${numboardTarget}</strong></p>

        <div class="equation">
            ${equationHTML || "Waiting to start"}
        </div>

        ${controls}
    `;
}

/* ---------- Interaction ---------- */

function addNumboardDie(sides) {
    if (gamePhase !== "setup" && gamePhase !== "thinking") return;
    if (numboardDice.length >= 6) return;

    numboardDice.push(rollDie(sides));

    if (numboardDice.length > 1) {
        numboardOperators.push(null);
    }

    triggerDiceShake();
    renderNumboard();
}

function removeNumboardDie() {
    if (gamePhase !== "thinking") return;
    if (numboardDice.length === 0) return;

    numboardDice.pop();
    numboardOperators.pop();
    renderNumboard();
}

function cycleOperator(index) {
    if (gamePhase !== "thinking") return;

    const current = numboardOperators[index];
    const nextIndex = current
        ? (AVAILABLE_OPERATORS.indexOf(current) + 1) % AVAILABLE_OPERATORS.length
        : 0;

    numboardOperators[index] = AVAILABLE_OPERATORS[nextIndex];
    renderNumboard();
}

/* ---------- Evaluation ---------- */

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
/* =========================================================
   COUNT-DICE MODE
========================================================= */

let countDiceRolls = [];
let countOperators = ["+", "×", "+", "+"]; // structure
let countTarget = null;
let rollIndex = 0;
let countdownTimer = null;

/* Reset game */
function resetCountDice() {
    countDiceRolls = [];
    rollIndex = 0;
    countTarget = Math.floor(Math.random() * 40) + 20;
    countOperators = generateCountOperators(3); // 4 dice → 3 operators

    clearInterval(countdownTimer);

    document.getElementById("output").innerHTML = `
        <h2>🧮 Count-Dice</h2>
        <p><strong>🎯 Target:</strong> ${countTarget}</p>
        <p>Tap <strong>Roll Dice</strong> to begin.</p>
    `;
}

/* Roll next die */
function rollNextCountDie() {
    if (rollIndex >= 4) return;

    const dieType = rollIndex === 1 ? 4 : 6;
    const roll = rollDie(dieType);
    countDiceRolls.push(roll);
    rollIndex++;

    updateCountDiceDisplay();

    if (rollIndex === 4) startCountdown();
}

/* Update display */
function updateCountDiceDisplay() {
    let expressionHTML = "";

    for (let i = 0; i < countDiceRolls.length; i++) {
        expressionHTML += `<span class="count-num">${countDiceRolls[i]}</span>`;

        if (i < countOperators.length && i < countDiceRolls.length - 1) {
            expressionHTML += `
                <span class="count-op">
                    ${countOperators[i]}
                </span>
            `;
        }
    }

    document.getElementById("output").innerHTML = `
        <h2>🧮 Count-Dice</h2>
        <p><strong>🎯 Target:</strong> ${countTarget}</p>

        <div class="count-equation">
            ${expressionHTML}
        </div>

        <p>🎲 Rolls remaining: ${4 - rollIndex}</p>
    `;
}

/* Start 60s timer */
function startCountdown() {
    let timeLeft = 60;

    countdownTimer = setInterval(() => {
        timeLeft--;

        document.getElementById("output").innerHTML += `
            <p>⏱ Time left: ${timeLeft}s</p>
        `;

        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            document.getElementById("output").innerHTML += `
                <h3>⏱ Time’s up!</h3>
                <p>Closest answer wins.</p>
                <p><strong>Losers drink 🍺</strong></p>
            `;
        }
    }, 1000);
}















