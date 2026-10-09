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
const portalOverlay = document.getElementById('portalOverlay');
const portalCard = document.getElementById('portalCard');
const restartButton = document.getElementById('restartButton');
const playAgainButton = document.getElementById('playAgainButton');

const planetSpacing = 330;
const planetWidth = 245;
const planetScrollRate = 74;
const stars = Array.from({ length: 110 }, (_, index) => ({
  x: (index * 137.508) % canvas.width,
  y: (index * 83.17 + 19) % canvas.height,
  radius: 0.6 + ((index * 17) % 12) / 10,
  depth: 0.12 + ((index * 29) % 70) / 100,
  phase: index * 0.81
}));

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
  img.src = 'assets/lorem.jpg';
  img.onload = () => {
    game.player.image = img;
  };
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
  portalOverlay.classList.add('hidden');
  portalCard.classList.remove('message-visible', 'coupon-visible');
  playAgainButton.classList.add('hidden');
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
    game.state = 'portal';
    portalOverlay.classList.remove('hidden');
    window.setTimeout(() => {
      if (game.state === 'portal') portalCard.classList.add('message-visible');
    }, 1900);
    window.setTimeout(() => {
      if (game.state !== 'portal') return;
      portalCard.classList.add('coupon-visible');
      playAgainButton.classList.remove('hidden');
    }, 4400);
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

    if (game.state === 'gameover') {
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

    const hasPlanetSupport = getVisiblePlanets().some((planet) =>
      game.player.x + game.player.width > planet.x + 20 &&
      game.player.x < planet.x + planetWidth - 20 &&
      Math.abs(game.player.y + game.player.height - planet.top) < 2
    );
    if (game.player.isGrounded && !hasPlanetSupport) {
      game.player.isGrounded = false;
    }

    const previousBottom = game.player.y + game.player.height;
    game.player.vy += config.gravity * (deltaMs / 16.67);
    game.player.y += game.player.vy * (deltaMs / 16.67);

    if (game.player.vy >= 0) {
      const landingPlanet = getVisiblePlanets().find((planet) =>
        game.player.x + game.player.width > planet.x + 20 &&
        game.player.x < planet.x + planetWidth - 20 &&
        previousBottom <= planet.top &&
        game.player.y + game.player.height >= planet.top
      );

      if (landingPlanet) {
        game.player.y = landingPlanet.top - game.player.height;
        game.player.vy = 0;
        game.player.isGrounded = true;
      }
    }

    if (game.player.y > canvas.height) {
      triggerGameOver();
      updateDistance();
      return;
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
  const space = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  space.addColorStop(0, '#100b2e');
  space.addColorStop(0.48, '#180b35');
  space.addColorStop(1, '#050612');
  ctx.fillStyle = space;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const nebula = ctx.createRadialGradient(canvas.width * 0.7, 100, 8, canvas.width * 0.7, 100, 360);
  nebula.addColorStop(0, 'rgba(133, 56, 190, 0.32)');
  nebula.addColorStop(1, 'rgba(52, 20, 96, 0)');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const blueNebula = ctx.createRadialGradient(180, 230, 4, 180, 230, 290);
  blueNebula.addColorStop(0, 'rgba(49, 91, 190, 0.22)');
  blueNebula.addColorStop(1, 'rgba(49, 91, 190, 0)');
  ctx.fillStyle = blueNebula;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach((star) => {
    const x = (star.x - game.distance * star.depth * 9 + canvas.width * 2) % canvas.width;
    const twinkle = 0.55 + Math.sin(game.elapsed * 0.003 + star.phase) * 0.35;
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = star.radius > 1.4 ? '#e9d5ff' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  drawDistantPlanet(760 - ((game.distance * 2) % 1120), 112, 58, '#6d3ca8', '#bc78e8');
  drawDistantPlanet(350 - ((game.distance * 0.8) % 1460), 238, 27, '#315ca7', '#6f9de8');
}

function drawDistantPlanet(x, y, radius, shadowColor, lightColor) {
  if (x < -radius * 2 || x > canvas.width + radius * 2) return;

  const planet = ctx.createRadialGradient(
    x - radius * 0.35,
    y - radius * 0.4,
    radius * 0.08,
    x,
    y,
    radius
  );
  planet.addColorStop(0, lightColor);
  planet.addColorStop(1, shadowColor);
  ctx.fillStyle = planet;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `${lightColor}99`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y + 3, radius * 1.55, radius * 0.32, -0.18, 0, Math.PI * 2);
  ctx.stroke();
}

function getVisiblePlanets() {
  const offset = game.distance * planetScrollRate;
  const firstIndex = Math.max(0, Math.floor((offset - planetSpacing) / planetSpacing));
  const lastIndex = Math.ceil((offset + canvas.width + planetSpacing) / planetSpacing);
  const planets = [];

  for (let index = firstIndex; index <= lastIndex; index += 1) {
    const x = 20 + index * planetSpacing - offset;
    const variation = index === 0 ? 0 : Math.sin(index * 2.17) * 17;
    planets.push({ index, x, top: groundY + variation });
  }

  return planets;
}

function drawPlanetSurface() {
  const palettes = [
    ['#7545c2', '#bd88ff', '#41216f'],
    ['#2768a9', '#75c6f0', '#163e76'],
    ['#b84e97', '#f49bd6', '#6c245a'],
    ['#b77339', '#ffd27a', '#704321']
  ];

  getVisiblePlanets().forEach((planet) => {
    const centerX = planet.x + planetWidth / 2;
    const centerY = planet.top + 77;
    const [shadow, highlight, deep] = palettes[planet.index % palettes.length];
    const surface = ctx.createRadialGradient(
      centerX - 54,
      planet.top + 18,
      8,
      centerX,
      centerY,
      155
    );
    surface.addColorStop(0, highlight);
    surface.addColorStop(0.58, shadow);
    surface.addColorStop(1, deep);
    ctx.save();
    ctx.shadowColor = `${highlight}88`;
    ctx.shadowBlur = 20;
    ctx.fillStyle = surface;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 154, 98, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = `${highlight}99`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(centerX, planet.top + 19, 119, 18, 0, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();

    ctx.fillStyle = `${deep}99`;
    ctx.beginPath();
    ctx.ellipse(planet.x + 82, planet.top + 57, 17, 7, -0.24, 0, Math.PI * 2);
    ctx.ellipse(planet.x + 170, planet.top + 89, 10, 5, 0.18, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayer() {
  const player = game.player;
  const x = player.x;
  const y = player.y + (player.isGrounded ? Math.sin(game.elapsed * 0.006) * 3 : 0);

  if (player.image) {
    const imageAspect = player.image.width / player.image.height;
    const playerAspect = player.width / player.height;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = player.image.width;
    let sourceHeight = player.image.height;

    if (imageAspect < playerAspect) {
      sourceHeight = player.image.width / playerAspect;
      sourceY = (player.image.height - sourceHeight) / 2;
    } else {
      sourceWidth = player.image.height * playerAspect;
      sourceX = (player.image.width - sourceWidth) / 2;
    }

    ctx.drawImage(
      player.image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      x,
      y,
      player.width,
      player.height
    );
    return;
  }

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y, player.width, player.height);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x + 12, y + 8, 32, 18);
}

function drawObstacles() {
  game.obstacles.forEach((obstacle) => {
    const centerX = obstacle.x + obstacle.width / 2;
    const centerY = obstacle.y + obstacle.height / 2;
    ctx.fillStyle = '#b6a4cc';
    ctx.beginPath();
    ctx.moveTo(obstacle.x + obstacle.width * 0.18, obstacle.y + obstacle.height * 0.12);
    ctx.lineTo(obstacle.x + obstacle.width * 0.8, obstacle.y);
    ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height * 0.55);
    ctx.lineTo(obstacle.x + obstacle.width * 0.62, obstacle.y + obstacle.height);
    ctx.lineTo(obstacle.x, obstacle.y + obstacle.height * 0.78);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#70518c';
    ctx.beginPath();
    ctx.arc(centerX + 2, centerY + 2, Math.min(obstacle.width, obstacle.height) * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0d9ff';
    ctx.beginPath();
    ctx.arc(centerX - 5, centerY - 6, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawCheckpointMarkers() {
  checkpointQuestions.forEach((checkpoint) => {
    const x = game.player.x + (checkpoint.distance - game.distance) * planetScrollRate;
    if (x < canvas.width - 20) {
      const reached = game.checkpointFlags.has(checkpoint.id);
      ctx.fillStyle = reached ? '#a78bfa' : '#f0abfc';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(x, groundY - 54, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f5d0fe';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${checkpoint.distance} m`, x - 15, groundY - 70);
    }
  });
}

function drawHUDText() {
  ctx.fillStyle = '#f5d0fe';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`${Math.min(Math.round(game.distance), 400)} m`, 18, 30);
}

function render() {
  drawBackground();
  drawPlanetSurface();
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

loadDefaultPlayerImage();
resetGame();
requestAnimationFrame(gameLoop);
