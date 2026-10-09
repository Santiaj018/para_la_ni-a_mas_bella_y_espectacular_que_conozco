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

const terrainSpacing = 450;
const terrainWidth = terrainSpacing;
const startingTerrainWidth = 760;
const nextTerrainStart = startingTerrainWidth + 20;
const terrainScrollRate = 74;
const jumpBufferDuration = 220;
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
  speed: 5.8,
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
  checkpointDistance: 0,
  attempts: 0,
  player: {
    x: 84,
    y: 0,
    width: 56,
    height: 60,
    vy: 0,
    isGrounded: true,
    jumpRequestedUntil: 0,
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
  game.player.jumpRequestedUntil = 0;
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
  game.checkpointDistance = 0;
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
  game.checkpointDistance = 0;
  game.attempts = 0;
  resetPlayer();
  hideAllOverlays();
  updateDistance();
}

function resumeFromCheckpoint() {
  game.state = 'running';
  game.distance = game.checkpointDistance;
  game.speed = config.speed + Math.min(game.distance / 220, 2.8);
  game.elapsed = 0;
  game.obstacles = [];
  game.nextSpawnAt = 700;
  game.currentQuestion = null;
  game.currentCheckpoint = null;
  game.currentReward = '';
  game.rewardUnlockAt = 0;
  game.popupLocked = false;
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
  if (game.state !== 'running') return;
  game.player.jumpRequestedUntil = performance.now() + jumpBufferDuration;
  startPlayerJump();
}

function startPlayerJump() {
  if (!game.player.isGrounded) return;
  game.player.vy = -config.jumpVelocity;
  game.player.isGrounded = false;
  game.player.jumpRequestedUntil = 0;
}

function getRandomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnObstacle() {
  const height = 32;
  const width = 46;
  const safeZones = getVisibleTerrain().flatMap((segment) => {
    const edgeClearance = 95;
    const safeStart = segment.x + edgeClearance;
    const safeEnd = segment.x + segment.width - edgeClearance;
    if (segment.fakePatch) {
      const patchStart = segment.fakePatch.x - edgeClearance;
      const patchEnd = segment.fakePatch.x + segment.fakePatch.width + edgeClearance;
      return [
        { start: safeStart, end: Math.min(safeEnd, patchStart) },
        { start: Math.max(safeStart, patchEnd), end: safeEnd }
      ];
    }
    return [{ start: safeStart, end: safeEnd }];
  }).filter((zone) =>
    zone.end - width >= Math.max(zone.start, canvas.width + 30) &&
    zone.start <= canvas.width + terrainSpacing
  );

  if (safeZones.length === 0) return;
  const zone = safeZones[Math.floor(Math.random() * safeZones.length)];
  const minX = Math.max(zone.start, canvas.width + 30);
  const maxX = Math.min(zone.end - width, canvas.width + terrainSpacing);
  const obstacle = {
    x: getRandomRange(minX, Math.max(minX, maxX)),
    y: groundY - height,
    width,
    height,
    color: '#ef4444'
  };
  game.obstacles.push(obstacle);
}

function canStandOnTerrain(segment) {
  const footLeft = game.player.x + 8;
  const footRight = game.player.x + game.player.width - 8;
  const overlapsGround =
    footRight > segment.x + 8 &&
    footLeft < segment.x + segment.width - 8;
  const overlapsFakePatch = segment.fakePatch &&
    footRight > segment.fakePatch.x &&
    footLeft < segment.fakePatch.x + segment.fakePatch.width;

  return overlapsGround && !overlapsFakePatch;
}

function openQuestionForCheckpoint(checkpoint) {
  if (game.checkpointFlags.has(checkpoint.id)) return;

  game.checkpointFlags.add(checkpoint.id);
  game.checkpointDistance = checkpoint.distance;
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
  restartButton.textContent = game.checkpointDistance > 0
    ? `Continuar desde ${game.checkpointDistance} m`
    : 'Jugar otra vez';
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
      resumeFromCheckpoint();
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
    game.speed = config.speed + Math.min(game.distance / 220, 2.8);

    if (game.elapsed >= game.nextSpawnAt) {
      spawnObstacle();
      game.nextSpawnAt = game.elapsed + getRandomRange(700, 1200);
    }

    const hasTerrainSupport = getVisibleTerrain().some((segment) =>
      canStandOnTerrain(segment) &&
      Math.abs(game.player.y + game.player.height - segment.top) < 2
    );
    if (game.player.isGrounded && !hasTerrainSupport) {
      game.player.isGrounded = false;
    }

    const previousBottom = game.player.y + game.player.height;
    game.player.vy += config.gravity * (deltaMs / 16.67);
    game.player.y += game.player.vy * (deltaMs / 16.67);

    if (game.player.vy >= 0) {
      const landingTerrain = getVisibleTerrain().find((segment) =>
        canStandOnTerrain(segment) &&
        previousBottom <= segment.top &&
        game.player.y + game.player.height >= segment.top
      );

      if (landingTerrain) {
        game.player.y = landingTerrain.top - game.player.height;
        game.player.vy = 0;
        game.player.isGrounded = true;
        if (performance.now() <= game.player.jumpRequestedUntil) {
          startPlayerJump();
        }
      }
    }

    if (game.player.y > groundY + game.player.height * 0.35) {
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

function drawCastle() {
  const x = canvas.width - 278;
  const baseY = groundY;

  ctx.save();
  ctx.shadowColor = 'rgba(255, 208, 112, 0.55)';
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#6b4d83';
  ctx.strokeStyle = '#f2c879';
  ctx.lineWidth = 3;
  ctx.fillRect(x + 42, baseY - 115, 194, 115);
  ctx.fillRect(x + 12, baseY - 160, 58, 160);
  ctx.fillRect(x + 208, baseY - 160, 58, 160);
  ctx.fillRect(x + 91, baseY - 190, 96, 190);
  ctx.strokeRect(x + 42, baseY - 115, 194, 115);
  ctx.strokeRect(x + 12, baseY - 160, 58, 160);
  ctx.strokeRect(x + 208, baseY - 160, 58, 160);
  ctx.strokeRect(x + 91, baseY - 190, 96, 190);
  ctx.restore();

  ctx.fillStyle = '#8a6ca1';
  [x + 12, x + 208].forEach((towerX) => {
    ctx.fillRect(towerX, baseY - 174, 15, 16);
    ctx.fillRect(towerX + 22, baseY - 174, 15, 16);
    ctx.fillRect(towerX + 43, baseY - 174, 15, 16);
  });
  [x + 91, x + 132, x + 173].forEach((towerX) => {
    ctx.fillRect(towerX, baseY - 204, 15, 16);
  });

  ctx.fillStyle = '#f5d0fe';
  ctx.fillRect(x + 31, baseY - 129, 16, 28);
  ctx.fillRect(x + 227, baseY - 129, 16, 28);
  ctx.fillRect(x + 122, baseY - 87, 34, 87);
  ctx.beginPath();
  ctx.arc(x + 139, baseY - 87, 17, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#34213d';
  ctx.fillRect(x + 126, baseY - 70, 26, 70);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x + 38, baseY - 84, 4, 4);
  ctx.fillRect(x + 234, baseY - 84, 4, 4);
  ctx.fillRect(x + 137, baseY - 144, 5, 5);
  ctx.fillStyle = '#e8b875';
  ctx.fillRect(x + 61, baseY - 105, 8, 8);
  ctx.fillRect(x + 205, baseY - 105, 8, 8);

  ctx.strokeStyle = '#d8b4fe';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 138, baseY - 190);
  ctx.lineTo(x + 138, baseY - 226);
  ctx.stroke();
  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.moveTo(x + 140, baseY - 225);
  ctx.lineTo(x + 168, baseY - 216);
  ctx.lineTo(x + 140, baseY - 207);
  ctx.closePath();
  ctx.fill();
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

function getVisibleTerrain() {
  const offset = game.distance * terrainScrollRate;
  const firstIndex = Math.max(0, Math.floor((offset - nextTerrainStart) / terrainSpacing));
  const lastIndex = Math.ceil((offset + canvas.width - nextTerrainStart) / terrainSpacing) + 1;
  const segments = [];

  for (let index = firstIndex; index <= lastIndex; index += 1) {
    const x = (index === 0
      ? 20
      : nextTerrainStart + (index - 1) * terrainSpacing) - offset;
    const width = index === 0 ? startingTerrainWidth : terrainWidth;
    const fakePatch = index >= 3 && index % 3 === 0
      ? { x: x + 168, width: 86 }
      : null;
    segments.push({ index, x, width, top: groundY, fakePatch });
  }

  return segments;
}

function drawTerrainSurface() {
  const terrainGradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
  terrainGradient.addColorStop(0, '#62bd68');
  terrainGradient.addColorStop(0.12, '#367a43');
  terrainGradient.addColorStop(1, '#302345');

  getVisibleTerrain().forEach((segment) => {
    const patches = segment.fakePatch
      ? [
          { x: segment.x, width: segment.fakePatch.x - segment.x },
          {
            x: segment.fakePatch.x + segment.fakePatch.width,
            width: segment.x + segment.width - segment.fakePatch.x - segment.fakePatch.width
          }
        ]
      : [{ x: segment.x, width: segment.width }];

    ctx.fillStyle = terrainGradient;
    patches.forEach((patch) => {
      if (patch.width <= 0) return;
      ctx.fillRect(patch.x, segment.top, patch.width, canvas.height - segment.top);
      ctx.fillStyle = '#8ddd79';
      ctx.fillRect(patch.x, segment.top, patch.width, 7);
      ctx.fillStyle = terrainGradient;
    });

    if (segment.fakePatch) {
      const { x, width } = segment.fakePatch;
      ctx.fillStyle = '#564535';
      ctx.fillRect(x, segment.top + 5, width, 12);
      ctx.fillStyle = '#20242d';
      ctx.fillRect(x, segment.top + 17, width, canvas.height - segment.top);
      ctx.fillStyle = '#60965b';
      ctx.fillRect(x, segment.top, width, 5);
      ctx.strokeStyle = '#c4a56a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 12, segment.top + 3);
      ctx.lineTo(x + 30, segment.top + 13);
      ctx.lineTo(x + 25, segment.top + 22);
      ctx.moveTo(x + 48, segment.top + 2);
      ctx.lineTo(x + 41, segment.top + 11);
      ctx.lineTo(x + 61, segment.top + 18);
      ctx.moveTo(x + 74, segment.top + 4);
      ctx.lineTo(x + 66, segment.top + 12);
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', x + width / 2, segment.top - 10);
      ctx.textAlign = 'left';
    }
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
    if (game.state === 'portal') drawPlayerCrown(x, y);
    return;
  }

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y, player.width, player.height);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x + 12, y + 8, 32, 18);
  if (game.state === 'portal') drawPlayerCrown(x, y);
}

function drawPlayerCrown(x, y) {
  ctx.save();
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#fff1a8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 10);
  ctx.lineTo(x + 12, y - 5);
  ctx.lineTo(x + 22, y + 2);
  ctx.lineTo(x + 29, y - 10);
  ctx.lineTo(x + 36, y + 2);
  ctx.lineTo(x + 45, y - 5);
  ctx.lineTo(x + 42, y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawObstacles() {
  game.obstacles.forEach((obstacle) => {
    const centerX = obstacle.x + obstacle.width / 2;
    const bodyY = obstacle.y + obstacle.height * 0.38;
    ctx.fillStyle = '#79513e';
    ctx.beginPath();
    ctx.ellipse(centerX - 5, bodyY + 7, obstacle.width * 0.38, obstacle.height * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#a87958';
    ctx.beginPath();
    ctx.arc(centerX + obstacle.width * 0.27, bodyY + 1, obstacle.height * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#a87958';
    ctx.beginPath();
    ctx.arc(centerX + obstacle.width * 0.13, bodyY - 8, 5, 0, Math.PI * 2);
    ctx.arc(centerX + obstacle.width * 0.34, bodyY - 7, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e9a8a8';
    ctx.beginPath();
    ctx.arc(centerX + obstacle.width * 0.13, bodyY - 8, 2.5, 0, Math.PI * 2);
    ctx.arc(centerX + obstacle.width * 0.34, bodyY - 7, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff4dc';
    ctx.beginPath();
    ctx.arc(centerX + obstacle.width * 0.37, bodyY, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#241527';
    ctx.beginPath();
    ctx.arc(centerX + obstacle.width * 0.39, bodyY, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#a87958';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(obstacle.x + 4, bodyY + 8);
    ctx.quadraticCurveTo(obstacle.x - 8, bodyY + 5, obstacle.x - 2, bodyY - 2);
    ctx.stroke();

    ctx.strokeStyle = '#3d2a25';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 13, obstacle.y + obstacle.height - 2);
    ctx.lineTo(centerX - 15, obstacle.y + obstacle.height + 2);
    ctx.moveTo(centerX + 1, obstacle.y + obstacle.height - 2);
    ctx.lineTo(centerX + 3, obstacle.y + obstacle.height + 2);
    ctx.stroke();
  });
}

function drawCheckpointMarkers() {
  checkpointQuestions.forEach((checkpoint) => {
    const x = game.player.x + (checkpoint.distance - game.distance) * terrainScrollRate;
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
  if (game.state === 'portal') drawCastle();
  drawTerrainSurface();
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
restartButton.addEventListener('click', resumeFromCheckpoint);
playAgainButton.addEventListener('click', startGame);
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('pointerdown', handlePointer);

loadDefaultPlayerImage();
resetGame();
requestAnimationFrame(gameLoop);
