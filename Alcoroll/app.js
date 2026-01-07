/* 
  Alcoroll - Dice Drinking Game
  Beginner-safe JavaScript
*/

/* Roll a single die */
function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

/* Roll four six-sided dice */
function roll4d6() {
    return [
        rollDie(6),
        rollDie(6),
        rollDie(6),
        rollDie(6)
    ];
}

/* Roll one four-sided die */
function roll1d4() {
    return rollDie(4);
}

/* Pick a random maths rule */
function getRule(d6Total, d4) {
    const rules = [
        {
            text: "Multiply",
            result: d6Total * d4
        },
        {
            text: "Add",
            result: d6Total + d4
        },
        {
            text: "Subtract",
            result: Math.abs(d6Total - d4)
        },
        {
            text: "Divide (rounded up)",
            result: Math.ceil(d6Total / d4)
        }
    ];

    return rules[Math.floor(Math.random() * rules.length)];
}

/* Main game roll */
function doRoll() {
    const d6Rolls = roll4d6();
    const d4 = roll1d4();

    const d6Total = d6Rolls.reduce((a, b) => a + b, 0);
    const rule = getRule(d6Total, d4);

    const output = document.getElementById("output");

    output.innerHTML = `
        <h2>🎲 Dice Results</h2>

        <p><strong>4d6:</strong> ${d6Rolls.join(" + ")} = ${d6Total}</p>
        <p><strong>1d4:</strong> ${d4}</p>

        <h3>🧮 Rule: ${rule.text}</h3>

        <h2>🍺 Drink ${rule.result} sips!</h2>
    `;
}