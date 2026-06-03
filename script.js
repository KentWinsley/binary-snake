const restartBtn = document.getElementById("restartBtn");
const homeBtn = document.getElementById("homeBtn");
const pauseBtn = document.getElementById("pauseBtn");

const startBtn = document.getElementById("startBtn");
const menu = document.getElementById("menu");
const gameContainer = document.getElementById("gameContainer");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 500;

const GRID = 25;
let SIZE = 20;

let snake;
let direction;
let foods;
let score;
let stream = "0";

let running = false;
let paused = false;

let lastMove = 0;
let moveDelay = 110;

/* =========================
   TIMER
========================= */
let time = 0;
let timerInterval = null;

/* =========================
   INIT BUTTONS
========================= */
window.onload = () => {
    startBtn.onclick = startGame;
    restartBtn.onclick = restartGame;
    homeBtn.onclick = goHome;
    pauseBtn.onclick = togglePause;
	resizeCanvas();
};

/* =========================
   BINARY DICTIONARY
========================= */
const BINARY_DICT = {
"00000000":"␀","00000001":"␁","00000010":"␂","00000011":"␃",
"00000100":"␄","00000101":"␅","00000110":"␆","00000111":"␇",
"00001000":"␈","00001001":"␉","00001010":"␊","00001011":"␋",
"00001100":"␌","00001101":"␍","00001110":"␎","00001111":"␏",

"00010000":"␐","00010001":"␑","00010010":"␒","00010011":"␓",
"00010100":"␔","00010101":"␕","00010110":"␖","00010111":"␗",
"00011000":"␘","00011001":"␙","00011010":"␚","00011011":"␛",
"00011100":"␜","00011101":"␝","00011110":"␞","00011111":"␟",

"00100000":" ","00100001":"!","00100010":"\"","00100011":"#",
"00100100":"$","00100101":"%","00100110":"&","00100111":"'","00101000":"(",
"00101001":")","00101010":"*","00101011":"+","00101100":",",
"00101101":"-","00101110":".","00101111":"/",

"00110000":"0","00110001":"1","00110010":"2","00110011":"3",
"00110100":"4","00110101":"5","00110110":"6","00110111":"7",
"00111000":"8","00111001":"9","00111010":":","00111011":";",
"00111100":"<","00111101":"=","00111110":">","00111111":"?",

"01000000":"@","01000001":"A","01000010":"B","01000011":"C",
"01000100":"D","01000101":"E","01000110":"F","01000111":"G",
"01001000":"H","01001001":"I","01001010":"J","01001011":"K",
"01001100":"L","01001101":"M","01001110":"N","01001111":"O",

"01010000":"P","01010001":"Q","01010010":"R","01010011":"S",
"01010100":"T","01010101":"U","01010110":"V","01010111":"W",
"01011000":"X","01011001":"Y","01011010":"Z","01011011":"[",
"01011100":"\\","01011101":"]","01011110":"^","01011111":"_",

"01100000":"`","01100001":"a","01100010":"b","01100011":"c",
"01100100":"d","01100101":"e","01100110":"f","01100111":"g",
"01101000":"h","01101001":"i","01101010":"j","01101011":"k",
"01101100":"l","01101101":"m","01101110":"n","01101111":"o",

"01110000":"p","01110001":"q","01110010":"r","01110011":"s",
"01110100":"t","01110101":"u","01110110":"v","01110111":"w",
"01111000":"x","01111001":"y","01101110":"z","01111011":"{",
"01111100":"|","01111101":"}","01111110":"~","01111111":" "
};

/* =========================
   START GAME
========================= */
function startGame() {
    running = true;
    paused = false;
    pauseBtn.innerText = "Pause";

    menu.hidden = true;
    gameContainer.hidden = false;

    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };

    foods = [];
    score = 0;
    stream = "0";

    lastMove = 0;

    document.getElementById("score").innerText = 0;

    /* TIMER RESET */
    time = 0;
    document.getElementById("timer").innerText = 0;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!running || paused) return;
        time++;
        document.getElementById("timer").innerText = time;
    }, 1000);

    spawnFood();
    requestAnimationFrame(loop);
}

/* =========================
   FOOD
========================= */
function spawnFood() {
    let x, y;
    let safe = false;

    while (!safe) {
        x = Math.floor(Math.random() * GRID);
        y = Math.floor(Math.random() * GRID);

        safe = true;

        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === x && snake[i].y === y) safe = false;
        }

        for (let i = 0; i < foods.length; i++) {
            if (foods[i].x === x && foods[i].y === y) safe = false;
        }
    }

    const rand = Math.random();

    let value;
    let color;

    if (rand < 0.45) {
        value = "0";
        color = "#00ff00";
    } else if (rand < 0.9) {
        value = "1";
        color = "#00ff00";
    } else {
        value = "2";
        color = "red";
    }

    foods.push({ x, y, value, color, life: 140 });
}

/* =========================
   INPUT
========================= */
document.addEventListener("keydown", e => {
    if ((e.key === "w" || e.key === "ArrowUp") && direction.y !== 1)
        direction = { x: 0, y: -1 };

    if ((e.key === "s" || e.key === "ArrowDown") && direction.y !== -1)
        direction = { x: 0, y: 1 };

    if ((e.key === "a" || e.key === "ArrowLeft") && direction.x !== 1)
        direction = { x: -1, y: 0 };

    if ((e.key === "d" || e.key === "ArrowRight") && direction.x !== -1)
        direction = { x: 1, y: 0 };
});

/* =========================
   LOOP
========================= */
function loop(timeStamp) {
    if (!running) return;

    requestAnimationFrame(loop);
    if (paused) return;

    if (!lastMove) lastMove = timeStamp;
    if (timeStamp - lastMove < moveDelay) return;

    lastMove = timeStamp;

    update();
    draw();
}

/* =========================
   STREAM
========================= */
function byteToChar(byte) {
    return String.fromCharCode(parseInt(byte, 2));
}

function processStream() {
    const match = stream.match(/([01]+)$/);
    if (!match) return;

    let binary = match[1];

    while (binary.length >= 8) {
        const byte = binary.slice(0, 8);
        binary = binary.slice(8);

        const char = byteToChar(byte);
        const prefix = stream.slice(0, stream.length - match[1].length);

        stream = prefix + char + "0" + binary;

        const newMatch = stream.match(/([01]+)$/);
        if (!newMatch) break;

        binary = newMatch[1];
    }
}

/* =========================
   UPDATE
========================= */
function update() {
    const head = {
        x: (snake[0].x + direction.x + GRID) % GRID,
        y: (snake[0].y + direction.y + GRID) % GRID
    };

    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    foods = foods.filter(food => {
        food.life--;

        if (food.life <= 0) return false;

        if (food.x === head.x && food.y === head.y) {
            if (food.value === "2") {
                gameOver();
                return false;
            }

            stream += food.value;
            score++;
            document.getElementById("score").innerText = score;
            processStream();
            return false;
        }

        return true;
    });

    const targetLength = stream.length;

    while (snake.length > targetLength) snake.pop();

    while (snake.length < targetLength) {
        const tail = snake[snake.length - 1];
        snake.push({ x: tail.x, y: tail.y });
    }

    if (foods.length < 5 && Math.random() < 0.06) {
        spawnFood();
    }
}

/* =========================
   DRAW
========================= */
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "20px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.fillText(f.value, f.x * SIZE + SIZE / 2, f.y * SIZE + SIZE / 2);
    });

    snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? "white" : "gray";
        ctx.fillText(stream[i] || "0", s.x * SIZE + SIZE / 2, s.y * SIZE + SIZE / 2);
    });
}

/* =========================
   PAUSE
========================= */
function togglePause() {
    if (!running) return;

    paused = !paused;
    pauseBtn.innerText = paused ? "Resume" : "Pause";
}

/* =========================
   RESTART
========================= */
function restartGame() {
    running = false;
    paused = false;

    pauseBtn.innerText = "Pause";

    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    foods = [];
    score = 0;
    stream = "0";
    lastMove = 0;

    document.getElementById("score").innerText = 0;

    time = 0;
    document.getElementById("timer").innerText = 0;

    clearInterval(timerInterval);

    spawnFood();
    running = true;

    timerInterval = setInterval(() => {
        if (!running || paused) return;
        time++;
        document.getElementById("timer").innerText = time;
    }, 1000);

    requestAnimationFrame(loop);
}

/* =========================
   HOME
========================= */
function goHome() {
    running = false;
    paused = false;

    pauseBtn.innerText = "Pause";

    clearInterval(timerInterval);

    gameContainer.hidden = true;
    menu.hidden = false;
}

/* =========================
   GAME OVER
========================= */
function gameOver() {
    running = false;

    clearInterval(timerInterval);

    alert("GAME OVER\nScore: " + score + "\nTime: " + time + "s");
    location.reload();
}


let touchStartX = 0;
let touchStartY = 0;

document.addEventListener("touchstart", e => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

document.addEventListener("touchmove", e => {
    e.preventDefault(); // stop scrolling while playing
}, { passive: false });

document.addEventListener("touchend", e => {
    const touch = e.changedTouches[0];

    let dx = touch.clientX - touchStartX;
    let dy = touch.clientY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        // horizontal swipe
        if (dx > 0 && direction.x !== -1) {
            direction = { x: 1, y: 0 }; // right
        } else if (dx < 0 && direction.x !== 1) {
            direction = { x: -1, y: 0 }; // left
        }
    } else {
        // vertical swipe
        if (dy > 0 && direction.y !== -1) {
            direction = { x: 0, y: 1 }; // down
        } else if (dy < 0 && direction.y !== 1) {
            direction = { x: 0, y: -1 }; // up
        }
    }
});




function resizeCanvas() {
    const size = Math.min(window.innerWidth, window.innerHeight * 0.7);

    canvas.width = size;
    canvas.height = size;

    SIZE = Math.floor(size / GRID);
}


window.addEventListener("resize", resizeCanvas);