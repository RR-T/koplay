const GRAVITY = 0.4;
const SCALE = 0.4;
const GORILLA_RADIUS = 20;

export function drawSky(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, 720);
  grad.addColorStop(0, '#0a0a2e');
  grad.addColorStop(1, '#16213e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
}

export function drawBuildings(ctx, buildings) {
  for (const b of buildings) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, 720 - b.height, b.width, b.height);

    ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
    const winW = 8;
    const winH = 12;
    const gapX = 18;
    const gapY = 20;
    const startX = b.x + 8;
    const startY = 720 - b.height + 12;

    for (let wy = startY; wy < 720 - 15; wy += gapY) {
      for (let wx = startX; wx < b.x + b.width - 10; wx += gapX) {
        if (Math.random() > 0.3) {
          ctx.fillRect(wx, wy, winW, winH);
        }
      }
    }
  }
}

export function drawGorilla(ctx, x, y, colorIndex, name) {
  const colors = ['#ff8c00', '#4a9eff'];
  const color = colors[colorIndex] || colors[0];

  ctx.fillStyle = color;
  ctx.fillRect(x - 12, y - 5, 24, 25);

  ctx.beginPath();
  ctx.arc(x, y - 14, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(x - 20, y - 2, 8, 18);
  ctx.fillRect(x + 12, y - 2, 8, 18);

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - 4, y - 16, 3, 0, Math.PI * 2);
  ctx.arc(x + 4, y - 16, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x - 4, y - 16, 1.5, 0, Math.PI * 2);
  ctx.arc(x + 4, y - 16, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y - 32);
}

export function drawHUD(ctx, gameState, players) {
  const names = gameState.turnOrder.map(id => {
    const p = players.find(pl => pl.id === id);
    return p ? p.name : '?';
  });

  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ff8c00';
  ctx.fillText(`${names[0]}: ${gameState.scores[0]}`, 20, 35);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#4a9eff';
  ctx.fillText(`${names[1]}: ${gameState.scores[1]}`, 1260, 35);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#aaa';
  ctx.font = '16px sans-serif';
  const windStrength = Math.abs(gameState.wind);
  const windDir = gameState.wind > 0 ? 'right' : gameState.wind < 0 ? 'left' : 'none';
  const arrows = windDir === 'none' ? '-' :
    (windDir === 'right' ? '>' : '<').repeat(Math.ceil(windStrength * 30));
  ctx.fillText(`Wind: ${arrows}`, 640, 35);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText(`First to ${gameState.pointsToWin}`, 640, 55);
}

function drawBanana(ctx, x, y, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = '#ffdd00';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI, true);
  ctx.fill();
  ctx.restore();
}

function drawExplosion(ctx, x, y, progress) {
  const maxRadius = 30;
  const radius = maxRadius * progress;
  const alpha = 1 - progress;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.8})`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
  ctx.fill();
}

export function drawScene(ctx, gameState, players) {
  drawSky(ctx);
  drawBuildings(ctx, gameState.buildings);

  const names = gameState.turnOrder.map(id => {
    const p = players.find(pl => pl.id === id);
    return p ? p.name : '?';
  });

  for (let i = 0; i < gameState.gorillas.length; i++) {
    const g = gameState.gorillas[i];
    drawGorilla(ctx, g.x, g.y, i, names[i]);
  }

  drawHUD(ctx, gameState, players);
}

export function drawGameOver(ctx, gameState, players) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, 1280, 720);

  const winnerName = (() => {
    const id = gameState.turnOrder[gameState.winner];
    const p = players.find(pl => pl.id === id);
    return p ? p.name : '?';
  })();

  ctx.fillStyle = '#e94560';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${winnerName} Wins!`, 640, 320);

  ctx.fillStyle = '#aaa';
  ctx.font = '28px sans-serif';
  ctx.fillText(`${gameState.scores[0]} - ${gameState.scores[1]}`, 640, 380);
}

export function computeTrajectory(throwData) {
  const { playerIndex, angle, velocity, wind, startX, startY } = throwData;
  const radians = (angle * Math.PI) / 180;
  const direction = playerIndex === 0 ? 1 : -1;

  let vx = Math.cos(radians) * velocity * SCALE * direction;
  let vy = -Math.sin(radians) * velocity * SCALE;
  let x = startX;
  let y = startY;

  const points = [{ x, y }];

  for (let step = 0; step < 5000; step++) {
    vx += wind;
    vy += GRAVITY;
    x += vx;
    y += vy;
    points.push({ x, y });

    if (x < -50 || x > 1330 || y > 770) break;
  }

  return points;
}

export function animateThrow(ctx, throwData, snapshotState, players, onComplete) {
  const trajectory = computeTrajectory(throwData);
  let frame = 0;
  const stepsPerFrame = 3;

  const { playerIndex, angle, velocity, wind, startX, startY, result } = throwData;
  const radians = (angle * Math.PI) / 180;
  const direction = playerIndex === 0 ? 1 : -1;

  let vx = Math.cos(radians) * velocity * SCALE * direction;
  let vy = -Math.sin(radians) * velocity * SCALE;
  let bx = startX;
  let by = startY;

  const opponentIndex = playerIndex === 0 ? 1 : 0;
  const opponent = snapshotState.gorillas[opponentIndex];
  let collisionStep = trajectory.length;

  for (let step = 0; step < 5000; step++) {
    vx += wind;
    vy += GRAVITY;
    bx += vx;
    by += vy;

    if (bx < -50 || bx > 1330 || by > 770) {
      collisionStep = step + 1;
      break;
    }

    if (result === 'gorillaHit') {
      const dx = bx - opponent.x;
      const dy = by - opponent.y;
      if (Math.sqrt(dx * dx + dy * dy) < GORILLA_RADIUS * 2) {
        collisionStep = step + 1;
        break;
      }
    }

    if (result === 'buildingHit' && by > 0) {
      for (const b of snapshotState.buildings) {
        if (bx >= b.x && bx <= b.x + b.width && by >= 720 - b.height) {
          collisionStep = step + 1;
          break;
        }
      }
      if (collisionStep <= step + 1) break;
    }
  }

  const maxFrame = Math.ceil(collisionStep / stepsPerFrame);
  let explosionStart = null;
  const explosionDuration = 500;

  function tick(timestamp) {
    if (frame <= maxFrame) {
      drawScene(ctx, snapshotState, players);

      const pointIndex = Math.min(frame * stepsPerFrame, trajectory.length - 1);
      const pt = trajectory[pointIndex];
      if (pt) {
        drawBanana(ctx, pt.x, pt.y, frame * 0.3);
      }

      frame++;
      requestAnimationFrame(tick);
    } else if (result === 'gorillaHit' || result === 'buildingHit') {
      if (!explosionStart) explosionStart = timestamp;
      const elapsed = timestamp - explosionStart;
      const progress = Math.min(elapsed / explosionDuration, 1);

      drawScene(ctx, snapshotState, players);

      const hitPt = trajectory[Math.min(collisionStep, trajectory.length - 1)];
      if (hitPt) {
        drawExplosion(ctx, hitPt.x, hitPt.y, progress);
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    } else {
      onComplete();
    }
  }

  requestAnimationFrame(tick);
}
