/*
  Alcoroll - Game Logic
  Normal + Count-Dice Mode
*/

let currentMode = null;

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
}





/* ---------- Roll Button ---------- */

function doRoll() {
    if (!currentMode) {
        alert("Select a game mode first!");
        return;
    }

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
    countTarget = Math.floor(Math.random() * 40) + 20; // 20–60

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
    let expression = "";

    for (let i = 0; i < countDiceRolls.length; i++) {
        expression += countDiceRolls[i];
        if (i < countOperators.length) {
            expression += " " + countOperators[i] + " ";
        }
    }

    document.getElementById("output").innerHTML = `
        <h2>🧮 Count-Dice</h2>
        <p><strong>🎯 Target:</strong> ${countTarget}</p>
        <h3>${expression}</h3>
        <p>Roll ${4 - rollIndex} dice remaining</p>
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
