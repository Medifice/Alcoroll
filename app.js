/*
  Alcoroll - Game Logic
  Beginner-safe, mode-based structure
*/

let currentMode = null;

/* ------------------ Utilities ------------------ */

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

/* ------------------ Mode Selection ------------------ */

function setMode(mode) {
    currentMode = mode;

    const instructions = document.getElementById("instructions");
    const output = document.getElementById("output");

    output.innerHTML = "";

    if (mode === "normal") {
        instructions.innerHTML = `
            <h2>🎲 Normal Game</h2>
            <p>
                Every player rolls the dice and solves the maths.<br>
                The slowest player takes a shot 🍺
            </p>
            <p>
                Roll order:<br>
                4d6 → 1d4 → 4d6
            </p>
        `;
    }

    if (mode === "count") {
        instructions.innerHTML = `
            <h2>🧮 Count-Dice</h2>
            <p>
                Dice are rolled one at a time to build an equation.<br>
                Players have one minute to get closest to the target.
            </p>
            <p>
                (Coming next!)
            </p>
        `;
    }
}

/* ------------------ Main Roll Button ------------------ */

function doRoll() {
    if (!currentMode) {
        alert("Please select a game mode first!");
        return;
    }

    if (currentMode === "normal") {
        playNormalGame();
    }

    if (currentMode === "count") {
        playCountDice();
    }
}

/* ------------------ Normal Game ------------------ */

function playNormalGame() {
    const firstRoll = roll4d6();
    const d4 = rollDie(4);
    const secondRoll = roll4d6();

    const firstTotal = firstRoll.reduce((a, b) => a + b, 0);
    const secondTotal = secondRoll.reduce((a, b) => a + b, 0);

    const output = document.getElementById("output");

    output.innerHTML = `
        <h2>🎲 Dice Rolls</h2>

        <p><strong>First 4d6:</strong> ${firstRoll.join(" + ")} = ${firstTotal}</p>
        <p><strong>1d4:</strong> ${d4}</p>
        <p><strong>Second 4d6:</strong> ${secondRoll.join(" + ")} = ${secondTotal}</p>

        <hr>

        <h3>🧠 Solve this:</h3>
        <p>
            (${firstTotal} + ${secondTotal}) × ${d4}
        </p>

        <p><strong>Slowest player takes a shot 🍺</strong></p>
    `;
}

/* ------------------ Count-Dice (placeholder) ------------------ */

function playCountDice() {
    const output = document.getElementById("output");

    output.innerHTML = `
        <h2>🧮 Count-Dice</h2>
        <p>This mode is wired up and ready.</p>
        <p>We’ll add sequential dice and timers next.</p>
    `;
}
