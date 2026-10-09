const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const distanceValue = document.getElementById('distanceValue');
const startOverlay = document.getElementById('startOverlay');
const startButton = document.getElementById('startButton');
const questionPanel = document.getElementById('questionPanel');
const questionText = document.getElementById('questionText');
const questionCard = document.querySelector('.question-card');
const answerList = document.getElementById('answerList');
const checkpointBadge = document.getElementById('checkpointBadge');
const attemptCounter = document.getElementById('attemptCounter');
const questionFeedback = document.getElementById('questionFeedback');
const rewardOverlay = document.getElementById('rewardOverlay');
const rewardTitle = document.getElementById('rewardTitle');
const rewardMessage = document.getElementById('rewardMessage');
const rewardImage = document.getElementById('rewardImage');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const gameOverDistance = document.getElementById('gameOverDistance');
const victoryOverlay = document.getElementById('victoryOverlay');
const playerImageInput = document.getElementById('playerImageInput');
const restartButton = document.getElementById('restartButton');
const playAgainButton = document.getElementById('playAgainButton');

const checkpointQuestions = [
  {
    id: 'cp-100',
    distance: 100,
    title: '¿Cómo se llama el amor de la vida de Santiago?',
    options: ['NK 450 CF MOTO', 'XBOX', 'Lorena Gutierrez', 'La opción A y C son correctas'],
    answer: 3,
    reward: 'assets/reward-100.svg',
    rewardTitle: 'Cupón de amor',
    rewardMessage: 'Este cupón es válido para redimir cuando lo necesites. Toma una captura para que sea válido.',
    background: 'linear-gradient(135deg, rgba(255,245,205,0.8), rgba(244,114,182,0.4)), url("assets/bg-100.svg")'
  },
  {
    id: 'cp-200',
    distance: 200,
    title: '¿Cuándo comenzó tu último noviazgo?',
    options: ['01/01/2009', 'Con el gei', 'Con un bagre', '04/10/2026'],
    answer: 3,
    reward: 'assets/reward-200.svg',
    rewardTitle: 'Salida sorpresa',
    rewardMessage: 'Cupón válido para una salida sorpresa. Toma captura para que sea válido.',
    background: 'linear-gradient(135deg, rgba(253,242,248,0.85), rgba(244,114,182,0.45)), url("assets/bg-200.svg")'
  },
  {
    id: 'cp-300',
    distance: 300,
    title: '¿Cuál es tu postrecito favorito?',
    options: ['Fresas', 'Fresas con crema', 'Fresas con crema más rica', 'Torta de limón'],
    answer: 0,
    allCorrect: true,
    reward: 'assets/reward-300.svg',
    rewardTitle: 'Postre favorito',
    rewardMessage: 'Cupón válido para ir a comer tu postre favorito en donde tú digas.',
    background: 'linear-gradient(135deg, rgba(255,247,237,0.9), rgba(251,146,60,0.5)), url("assets/bg-300.svg")'
  },
  {
    id: 'cp-400',
    distance: 400,
    title: '¿Cuánto crees que te amo?',
    options: ['Nadita nadota pro max', 'Nadita pro', 'Un poquito', 'Con mi vida entera pro max plus 3 millones más uno'],
    answer: 3,
    reward: 'assets/reward-400.svg',
    rewardTitle: 'Te amo infinitamente',
    rewardMessage: 'Cupón válido para una tarde eterna a tu lado. Toma captura para que sea válido.',
    background: 'linear-gradient(135deg, rgba(238,242,255,0.9), rgba(168,85,247,0.45)), url("assets/bg-400.svg")'
  }
];

const config = {
  gravity: 0.82,
  jumpVelocity: 15.2,
  speed: 6.8,
  maxAttempts: 2
};

const game = {
  state: 'welcome',
  distance: 0,
  speed: config.speed,
  elapsed: 0,
  obstacles: [],
  nextSpawnAt: 700,
  lastTime: 0,
  currentQuestion: null,
  currentCheckpoint: null,
  currentReward: '',
  rewardUnlockAt: 0,
  popupLocked: false,
  checkpointFlags: new Set(),
  attempts: 0,
  player: {
    x: 84,
    y: 0,
    width: 56,
    height: 60,
    vy: 0,
    isGrounded: true,
    image: null
  }
};

const groundY = canvas.height - 50;

function loadDefaultPlayerImage() {
  const img = new Image();
  img.src = 'assets/runner.svg';
  img.onload = () => {
    game.player.image = img;
  };
}

function handlePlayerImageUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    alert('Selecciona un archivo PNG, JPG o WebP.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    const img = new Image();
    img.onload = () => {
      game.player.image = img;
      game.player.width = 64;
      game.player.height = 70;
      game.player.y = groundY - game.player.height;
    };
    img.src = loadEvent.target.result;
  };
  reader.readAsDataURL(file);
}

function resetPlayer() {
  game.player.y = groundY - game.player.height;
  game.player.vy = 0;
  game.player.isGrounded = true;
}

function resetGame() {
  game.state = 'welcome';
  game.distance = 0;
  game.speed = config.speed;
  game.elapsed = 0;
  game.obstacles = [];
  game.nextSpawnAt = 700;
  game.currentQuestion = null;
  game.currentCheckpoint = null;
  game.currentReward = '';
  game.rewardUnlockAt = 0;
  game.popupLocked = false;
  game.checkpointFlags.clear();
  game.attempts = 0;
  resetPlayer();
  updateDistance();
  hideAllOverlays();
  startOverlay.classList.remove('hidden');
}

function startGame() {
  game.state = 'running';
  game.distance = 0;
  game.speed = config.speed;
  game.elapsed = 0;
  game.obstacles = [];
  game.nextSpawnAt = 700;
  game.currentQuestion = null;
  game.currentCheckpoint = null;
  game.currentReward = '';
  game.rewardUnlockAt = 0;
  game.popupLocked = false;
  game.checkpointFlags.clear();
  game.attempts = 0;
  resetPlayer();
  hideAllOverlays();
  updateDistance();
}

function hideAllOverlays() {
  startOverlay.classList.add('hidden');
  questionPanel.classList.add('hidden');
  rewardOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  victoryOverlay.classList.add('hidden');
}

function updateDistance() {
  distanceValue.textContent = `${Math.min(Math.round(game.distance), 400)} m`;
}

function jumpPlayer() {
  if (game.state !== 'running' || !game.player.isGrounded) return;
  game.player.vy = -config.jumpVelocity;
  game.player.isGrounded = false;
}

function getRandomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnObstacle() {
  const height = getRandomRange(28, 62);
  const width = getRandomRange(20, 34);
  const obstacle = {
    x: canvas.width + 30,
    y: groundY - height,
    width,
    height,
    color: '#ef4444'
  };
  game.obstacles.push(obstacle);
}

function openQuestionForCheckpoint(checkpoint) {
  if (game.checkpointFlags.has(checkpoint.id)) return;

  game.checkpointFlags.add(checkpoint.id);
  game.currentCheckpoint = checkpoint;
  game.currentQuestion = checkpoint;
  game.state = 'question';
  game.attempts = 0;
  game.obstacles = [];
  const questionBackground = checkpoint.background || 'rgba(15, 23, 42, 0.9)';
  questionCard.style.setProperty('background', questionBackground);
  questionCard.style.setProperty('background-size', 'cover');
  questionCard.style.setProperty('background-position', 'center');
  questionPanel.classList.remove('hidden');
  questionText.textContent = checkpoint.title;
  checkpointBadge.textContent = `Punto de control ${checkpoint.distance} m`;
  attemptCounter.textContent = `Intento 1/${config.maxAttempts}`;
  questionFeedback.textContent = 'Elige una opción para continuar.';

  answerList.innerHTML = '';
  checkpoint.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-button';
    button.textContent = `${index + 1}. ${option}`;
    button.addEventListener('click', () => handleAnswer(index, checkpoint));
    answerList.appendChild(button);
  });
}

function handleAnswer(selectedIndex, checkpoint) {
  if (!game.currentQuestion || game.state !== 'question') return;

  const buttons = answerList.querySelectorAll('.answer-button');
  const isCorrect = checkpoint.allCorrect ? true : selectedIndex === checkpoint.answer;

  if (checkpoint.allCorrect) {
    buttons.forEach((button) => {
      button.disabled = true;
      button.classList.add('correct');
    });
  } else {
    buttons.forEach((button, index) => {
      button.disabled = true;
      if (index === checkpoint.answer) {
        button.classList.add('correct');
      }
      if (index === selectedIndex && selectedIndex !== checkpoint.answer) {
        button.classList.add('incorrect');
      }
    });
  }

  if (isCorrect) {
    questionFeedback.textContent = checkpoint.allCorrect ? '¡Todas son correctas! ¡Qué rico!' : '¡Respuesta correcta!';
    questionPanel.classList.add('hidden');
    showReward(checkpoint);
    return;
  }

  game.attempts += 1;
  const remaining = Math.max(config.maxAttempts - game.attempts, 0);
  questionFeedback.textContent = `Respuesta incorrecta. Te quedan ${remaining} intento(s).`;
  if (game.attempts >= config.maxAttempts) {
    questionFeedback.textContent = 'Sigue intentando hasta responder correctamente.';
  }

  buttons.forEach((button) => {
    button.disabled = false;
    button.classList.remove('correct', 'incorrect');
  });

  attemptCounter.textContent = `Intento ${Math.min(game.attempts + 1, config.maxAttempts)}/${config.maxAttempts}`;
}

function showReward(checkpoint) {
  game.currentReward = checkpoint.reward;
  rewardTitle.textContent = checkpoint.rewardTitle;
  rewardMessage.textContent = checkpoint.rewardMessage;
  rewardImage.src = checkpoint.reward;
  rewardOverlay.classList.remove('hidden');
  game.state = 'reward';
  game.rewardUnlockAt = performance.now() + 450;
}

function continueAfterReward() {
  if (game.state !== 'reward') return;
  if (performance.now() < game.rewardUnlockAt) return;

  rewardOverlay.classList.add('hidden');

  if (game.currentCheckpoint && game.currentCheckpoint.distance >= 400) {
    game.state = 'victory';
    victoryOverlay.classList.remove('hidden');
    return;
  }

  game.state = 'running';
  game.currentQuestion = null;
  game.currentCheckpoint = null;
}

function triggerGameOver() {
  if (game.state === 'gameover') return;
  game.state = 'gameover';
  gameOverDistance.textContent = `Distancia: ${Math.round(game.distance)} m`;
  gameOverOverlay.classList.remove('hidden');
}

function handleKeyDown(event) {
  const key = event.key;

  if (key === ' ' || key === 'ArrowUp') {
    event.preventDefault();
    if (game.state === 'running') jumpPlayer();
  }

  if (key === 'Enter') {
    event.preventDefault();
    if (game.state === 'welcome') {
      startGame();
      return;
    }

    if (game.state === 'reward') {
      continueAfterReward();
      return;
    }

    if (game.state === 'victory' || game.state === 'gameover') {
      startGame();
    }
  }
}

function handlePointer(event) {
  if (event.target instanceof HTMLElement && event.target.matches('button')) {
    return;
  }

  if (game.state === 'running') {
    jumpPlayer();
    return;
  }

  if (game.state === 'reward') {
    continueAfterReward();
  }
}

function update(deltaMs) {
  if (game.state === 'running') {
    game.elapsed += deltaMs;
    game.distance += deltaMs * 0.0027 * game.speed;
    game.speed = config.speed + Math.min(game.distance / 160, 3.6);

    if (game.elapsed >= game.nextSpawnAt) {
      spawnObstacle();
      game.nextSpawnAt = game.elapsed + getRandomRange(700, 1200);
    }

    game.player.vy += config.gravity * (deltaMs / 16.67);
    game.player.y += game.player.vy * (deltaMs / 16.67);

    if (game.player.y >= groundY - game.player.height) {
      game.player.y = groundY - game.player.height;
      game.player.vy = 0;
      game.player.isGrounded = true;
    }

    const scrollSpeed = deltaMs * 0.2 * game.speed;
    for (let i = game.obstacles.length - 1; i >= 0; i -= 1) {
      const obstacle = game.obstacles[i];
      obstacle.x -= scrollSpeed;

      const isColliding =
        game.player.x < obstacle.x + obstacle.width &&
        game.player.x + game.player.width > obstacle.x &&
        game.player.y < obstacle.y + obstacle.height &&
        game.player.y + game.player.height > obstacle.y;

      if (isColliding) {
        triggerGameOver();
        break;
      }

      if (obstacle.x + obstacle.width < -20) {
        game.obstacles.splice(i, 1);
      }
    }

    for (const checkpoint of checkpointQuestions) {
      if (game.distance >= checkpoint.distance && !game.checkpointFlags.has(checkpoint.id)) {
        openQuestionForCheckpoint(checkpoint);
        break;
      }
    }
  }

  updateDistance();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#8ec5fc');
  sky.addColorStop(1, '#dbeafe');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(canvas.width - 120, 90, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#86efac';
  ctx.beginPath();
  ctx.moveTo(0, 250);
  ctx.quadraticCurveTo(180, 170, 340, 250);
  ctx.quadraticCurveTo(540, 170, 760, 250);
  ctx.quadraticCurveTo(900, 175, canvas.width, 240);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, groundY + 14, canvas.width, canvas.height - groundY);

  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, groundY, canvas.width, 14);

  for (let x = -40; x < canvas.width + 60; x += 42) {
    const offset = (game.distance * 5) % 42;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x - offset, groundY + 3, 20, 8);
  }
}

function drawPlayer() {
  const player = game.player;
  const x = player.x;
  const y = player.y;

  if (player.image) {
    ctx.drawImage(player.image, x, y, player.width, player.height);
    return;
  }

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y, player.width, player.height);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x + 12, y + 8, 32, 18);
}

function drawObstacles() {
  game.obstacles.forEach((obstacle) => {
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(obstacle.x + 5, obstacle.y + 8, 4, 6);
    ctx.fillRect(obstacle.x + obstacle.width - 9, obstacle.y + 8, 4, 6);
  });
}

function drawCheckpointMarkers() {
  checkpointQuestions.forEach((checkpoint) => {
    const x = 120 + checkpoint.distance * 1.8;
    if (x < canvas.width - 20) {
      const reached = game.checkpointFlags.has(checkpoint.id);
      ctx.fillStyle = reached ? '#16a34a' : '#cbd5e1';
      ctx.fillRect(x, groundY - 70, 10, 52);
      ctx.fillStyle = '#0f172a';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${checkpoint.distance}`, x - 8, groundY - 76);
    }
  });
}

function drawHUDText() {
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`${Math.min(Math.round(game.distance), 400)} m`, 18, 30);
}

function render() {
  drawBackground();
  drawCheckpointMarkers();
  drawObstacles();
  drawPlayer();
  drawHUDText();
}

function gameLoop(timestamp) {
  if (!game.lastTime) game.lastTime = timestamp;
  const delta = timestamp - game.lastTime;
  game.lastTime = timestamp;

  update(delta);
  render();
  requestAnimationFrame(gameLoop);
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
playAgainButton.addEventListener('click', startGame);
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('pointerdown', handlePointer);
playerImageInput.addEventListener('change', handlePlayerImageUpload);

loadDefaultPlayerImage();
resetGame();
requestAnimationFrame(gameLoop);
