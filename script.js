
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const HUD_H = 76;

const imgs = {
  playerWalk: new Image(),
  playerAttack: new Image(),
  enemyWalk: new Image(),
  enemyAttack: new Image(),
  bossWalk: new Image(),
  bossAttack: new Image()
};

imgs.playerWalk.src = "images/player_walk.png";
imgs.playerAttack.src = "images/player_attack.png";
imgs.enemyWalk.src = "images/enemy_walk.png";
imgs.enemyAttack.src = "images/enemy_attack.png";
imgs.bossWalk.src = "images/boss_walk.png";
imgs.bossAttack.src = "images/boss_attack.png";

const keys = {};
let currentMap = 0;
let gameState = "playing";
let particles = [];
let cameraShake = 0;
let coins = 0;
let gems = 0;

const player = {
  x: 650,
  y: 390,
  frameW: 64,
  frameH: 64,
  drawW: 108,
  drawH: 108,
  speed: 4.2,
  direction: "down",
  attacking: false,
  attackDamage: 35,
  frameIndex: 0,
  frameTimer: 0,
  walkFrameSpeed: 6,
  attackFrameSpeed: 4,
  vida: 100,
  vidaMax: 100,
  invincibleTimer: 0,
  stepBob: 0
};

function createEnemy(x, y, boss = false) {
  return {
    x, y, boss,
    frameW: 64,
    frameH: 64,
    drawW: boss ? 180 : 96,
    drawH: boss ? 180 : 96,
    speed: boss ? 1.2 : 1.75,
    direction: "left",
    attacking: false,
    hasHitThisAttack: false,
    attackFrameHit: 3,
    attackCooldown: 0,
    frameIndex: 0,
    frameTimer: 0,
    walkFrameSpeed: boss ? 9 : 7,
    attackFrameSpeed: boss ? 6 : 5,
    vida: boss ? 460 : 70,
    vidaMax: boss ? 460 : 70,
    damage: boss ? 24 : 12,
    hitFlash: 0
  };
}

const maps = [
  {
    name: "Bosque da Vila",
    theme: "village",
    enemies: [createEnemy(350,260), createEnemy(850,280), createEnemy(300,570), createEnemy(820,590)],
    exits: [{x:1320,y:360,w:80,h:160,target:1,spawnX:80,spawnY:420}],
    obstacles: [
      {x:0,y:HUD_H,w:1400,h:28},{x:0,y:772,w:1400,h:28},{x:0,y:HUD_H,w:28,h:724},{x:1372,y:HUD_H,w:28,h:724},
      {x:0,y:HUD_H,w:255,h:92},{x:0,y:705,w:255,h:67},{x:1175,y:HUD_H,w:225,h:105},{x:1185,y:680,w:215,h:92},
      {x:965,y:170,w:210,h:120}, {x:105,y:420,w:88,h:66}, {x:250,y:190,w:55,h:40},
      {x:1230,y:390,w:70,h:105}, {x:1000,y:645,w:165,h:78}, {x:510,y:88,w:110,h:55},
      {x:705,y:645,w:90,h:40}
    ]
  },
  {
    name: "Lago da Ponte",
    theme: "lake",
    enemies: [createEnemy(520,260), createEnemy(850,435), createEnemy(1110,250)],
    exits: [{x:0,y:360,w:60,h:160,target:0,spawnX:1260,spawnY:420},{x:1320,y:360,w:80,h:160,target:2,spawnX:90,spawnY:420}],
    obstacles: [
      {x:0,y:HUD_H,w:1400,h:28},{x:0,y:772,w:1400,h:28},{x:0,y:HUD_H,w:28,h:724},{x:1372,y:HUD_H,w:28,h:724},
      {x:80,y:600,w:390,h:145},{x:860,y:535,w:430,h:170},
      {x:475,y:HUD_H,w:140,h:250},{x:475,y:552,w:140,h:220},
      {x:1120,y:HUD_H,w:120,h:260},{x:1120,y:555,w:120,h:217},
      {x:670,y:165,w:135,h:75},{x:690,y:620,w:145,h:75}
    ]
  },
  {
    name: "Vale Rochoso",
    theme: "valley",
    enemies: [createEnemy(440,250), createEnemy(720,300), createEnemy(980,235), createEnemy(940,560)],
    exits: [{x:0,y:360,w:60,h:160,target:1,spawnX:1260,spawnY:420},{x:1320,y:360,w:80,h:160,target:3,spawnX:90,spawnY:420}],
    obstacles: [
      {x:0,y:HUD_H,w:1400,h:28},{x:0,y:772,w:1400,h:28},{x:0,y:HUD_H,w:28,h:724},{x:1372,y:HUD_H,w:28,h:724},
      {x:210,y:145,w:240,h:100},{x:560,y:330,w:190,h:110},{x:850,y:150,w:250,h:90},{x:940,y:595,w:240,h:82},
      {x:270,y:610,w:220,h:80},{x:1090,y:350,w:140,h:140}
    ]
  },
  {
    name: "Ruínas do Chefão",
    theme: "boss",
    enemies: [createEnemy(1030,385,true)],
    exits: [{x:0,y:360,w:60,h:160,target:2,spawnX:1260,spawnY:420}],
    obstacles: [
      {x:0,y:HUD_H,w:1400,h:28},{x:0,y:772,w:1400,h:28},{x:0,y:HUD_H,w:28,h:724},{x:1372,y:HUD_H,w:28,h:724},
      {x:230,y:145,w:220,h:90},{x:950,y:145,w:220,h:90},{x:230,y:610,w:220,h:90},{x:950,y:610,w:220,h:90},
      {x:590,y:340,w:230,h:120}
    ]
  }
];

function map(){ return maps[currentMap]; }

document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.code === "Space") {
    e.preventDefault();
    playerAttack();
  }
  if (e.key.toLowerCase() === "r" && gameState !== "playing") location.reload();
});

document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function rectsCollide(a,b){
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

function getPlayerHitbox(x=player.x,y=player.y){
  // Hitbox mais precisa no corpo do personagem
  return {
    x:x+34,
    y:y+52,
    w:38,
    h:44
  };
}

function getEnemyHitbox(e,x=e.x,y=e.y){

  if(e.boss){
    return {
      x:x+48,
      y:y+82,
      w:82,
      h:88
    };
  }

  return {
    x:x+26,
    y:y+46,
    w:42,
    h:46
  };
}

function hitObstacle(box){
  return map().obstacles.some(o => rectsCollide(box,o));
}

function isPlayerMoving(){
  return keys["w"] || keys["a"] || keys["s"] || keys["d"];
}

function getFrames(img,w){
  return (!img.complete || img.naturalWidth === 0) ? 1 : Math.max(1, Math.floor(img.naturalWidth / w));
}

function getPlayerRow(d){ return {down:0,left:1,right:2,up:3}[d]; }
function getEnemyRow(d){
  // Correção definitiva dos sprites:
  // linha 0 = cima
  // linha 1 = baixo/frente
  // linha 2 = esquerda
  // linha 3 = direita

  if(d === "up") return 0;
  if(d === "down") return 1;
  if(d === "left") return 2;
  return 3;
}

function movePlayer(){
  if(gameState !== "playing") return;

  let dx=0, dy=0;
  if(keys["w"]){dy-=player.speed;player.direction="up";}
  if(keys["s"]){dy+=player.speed;player.direction="down";}
  if(keys["a"]){dx-=player.speed;player.direction="left";}
  if(keys["d"]){dx+=player.speed;player.direction="right";}

  if(dx && dy){dx*=0.707;dy*=0.707;}

  const nx=player.x+dx, ny=player.y+dy;

  if(!hitObstacle(getPlayerHitbox(nx,player.y))) player.x=nx;
  if(!hitObstacle(getPlayerHitbox(player.x,ny))) player.y=ny;

  checkTransitions();

  if(player.invincibleTimer > 0) player.invincibleTimer--;
  if(isPlayerMoving() && Math.random() < .12) spawnDust(player.x+54, player.y+98);
}

function checkTransitions(){
  const p = getPlayerHitbox();
  for(const exit of map().exits){
    if(rectsCollide(p, exit)){
      currentMap = exit.target;
      player.x = exit.spawnX;
      player.y = exit.spawnY;
      player.attacking = false;
      player.frameIndex = 0;
      player.frameTimer = 0;
      particles = [];
      cameraShake = 12;
      break;
    }
  }
}

function playerAttack(){
  if(player.attacking || gameState !== "playing") return;

  player.attacking = true;
  player.frameIndex = 0;
  player.frameTimer = 0;

  const area = getPlayerAttackArea();
  map().enemies.forEach(e => {
    if(rectsCollide(area, getEnemyHitbox(e))){
      e.vida -= player.attackDamage;
      e.hitFlash = 12;
      cameraShake = e.boss ? 10 : 5;
      spawnHit(e.x + (e.boss ? 90 : 50), e.y + (e.boss ? 90 : 50));
      if(e.vida <= 0){
        coins += e.boss ? 10 : 1;
        gems += e.boss ? 1 : 0;
      }
    }
  });

  map().enemies = map().enemies.filter(e => e.vida > 0);
}

function getPlayerAttackArea(){

  const h = getPlayerHitbox();

  // Ataque mais justo e preciso
  if(player.direction==="down"){
    return {
      x:h.x-12,
      y:h.y+h.h-8,
      w:62,
      h:58
    };
  }

  if(player.direction==="up"){
    return {
      x:h.x-12,
      y:h.y-54,
      w:62,
      h:58
    };
  }

  if(player.direction==="right"){
    return {
      x:h.x+h.w-6,
      y:h.y-6,
      w:58,
      h:56
    };
  }

  return {
    x:h.x-58,
    y:h.y-6,
    w:58,
    h:56
  };
}

function getEnemyAttackArea(e){

  const h = getEnemyHitbox(e);

  const size = e.boss ? 92 : 56;

  if(e.direction==="down"){
    return {
      x:h.x-8,
      y:h.y+h.h-6,
      w:size,
      h:size
    };
  }

  if(e.direction==="up"){
    return {
      x:h.x-8,
      y:h.y-size+20,
      w:size,
      h:size
    };
  }

  if(e.direction==="right"){
    return {
      x:h.x+h.w-6,
      y:h.y-4,
      w:size,
      h:size
    };
  }

  return {
    x:h.x-size+20,
    y:h.y-4,
    w:size,
    h:size
  };
}

function updateEnemy(e){
  if(gameState !== "playing") return;

  if(e.hitFlash>0) e.hitFlash--;
  if(e.attackCooldown>0) e.attackCooldown--;

  const eh = getEnemyHitbox(e), ph = getPlayerHitbox();
  const ex=eh.x+eh.w/2, ey=eh.y+eh.h/2, px=ph.x+ph.w/2, py=ph.y+ph.h/2;
  let dx=px-ex, dy=py-ey;
  const dist=Math.hypot(dx,dy);

  if(!e.attacking){
    if(Math.abs(dx)>Math.abs(dy)) e.direction = dx>0 ? "right" : "left";
    else e.direction = dy>0 ? "down" : "up";
  }

  const detect=e.boss?760:560, stop=e.boss?126:74, atk=e.boss?168:88;

  if(!e.attacking){
    if(dist<detect && dist>stop){
      dx/=dist; dy/=dist;
      tryMoveEnemy(e, dx*e.speed, dy*e.speed);
      if(Math.random() < .04) spawnDust(e.x+(e.boss?86:46), e.y+(e.boss?150:86));
    }
    if(dist<=atk && e.attackCooldown<=0){

      // trava direção antes do ataque
      if(Math.abs(dx)>Math.abs(dy)){
        e.direction = dx>0 ? "right" : "left";
      }else{
        e.direction = dy>0 ? "down" : "up";
      }

      startEnemyAttack(e);
    }
  }

  updateEnemyAnimation(e);

  if(e.attacking && e.frameIndex >= e.attackFrameHit && !e.hasHitThisAttack){
    e.hasHitThisAttack = true;
    if(rectsCollide(getEnemyAttackArea(e), getPlayerHitbox()) && player.invincibleTimer <= 0){
      player.vida -= e.damage;
      player.invincibleTimer = 45;
      cameraShake = e.boss ? 16 : 8;
      spawnHit(player.x+55, player.y+64);
      if(player.vida <= 0){ player.vida = 0; gameState = "dead"; }
    }
  }
}

function tryMoveEnemy(e,mx,my){
  const nx=e.x+mx, ny=e.y+my;
  if(!hitObstacle(getEnemyHitbox(e,nx,e.y))) e.x=nx;
  if(!hitObstacle(getEnemyHitbox(e,e.x,ny))) e.y=ny;
}

function startEnemyAttack(e){
  e.attacking = true;
  e.hasHitThisAttack = false;
  e.frameIndex = 0;
  e.frameTimer = 0;
  e.attackCooldown = e.boss ? 92 : 65;
}

function updateEnemyAnimation(e){
  const img = e.attacking ? (e.boss ? imgs.bossAttack : imgs.enemyAttack) : (e.boss ? imgs.bossWalk : imgs.enemyWalk);
  const speed = e.attacking ? e.attackFrameSpeed : e.walkFrameSpeed;
  const total = getFrames(img, e.frameW);

  e.frameTimer++;
  if(e.frameTimer >= speed){
    e.frameTimer = 0;
    e.frameIndex++;
    if(e.frameIndex >= total){
      e.frameIndex = 0;
      if(e.attacking){ e.attacking = false; e.hasHitThisAttack = false; }
    }
  }
}

function updatePlayerAnimation(){
  const img = player.attacking ? imgs.playerAttack : imgs.playerWalk;
  const speed = player.attacking ? player.attackFrameSpeed : player.walkFrameSpeed;
  const total = getFrames(img, player.frameW);

  if(player.attacking){
    player.frameTimer++;
    if(player.frameTimer >= speed){
      player.frameTimer = 0;
      player.frameIndex++;
      if(player.frameIndex >= total){ player.frameIndex = 0; player.attacking = false; }
    }
    return;
  }

  if(isPlayerMoving()){
    player.frameTimer++;
    if(player.frameTimer >= speed){
      player.frameTimer = 0;
      player.frameIndex = (player.frameIndex+1) % total;
    }
    player.stepBob += .22;
  }else{
    player.frameIndex = 0;
    player.frameTimer = 0;
    player.stepBob = 0;
  }
}

function drawMap(){
  if(map().theme==="village") drawVillageMap();
  if(map().theme==="lake") drawLakeMap();
  if(map().theme==="valley") drawValleyMap();
  if(map().theme==="boss") drawBossArena();

  drawExits();
  drawVignette();
}

function drawGrassBase(c1,c2){
  const g=ctx.createLinearGradient(0,HUD_H,0,canvas.height);
  g.addColorStop(0,c1); g.addColorStop(1,c2);
  ctx.fillStyle=g;
  ctx.fillRect(0,HUD_H,canvas.width,canvas.height-HUD_H);

  for(let y=HUD_H;y<canvas.height;y+=32){
    for(let x=0;x<canvas.width;x+=32){
      ctx.fillStyle=(x/32+y/32)%2===0 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.045)";
      ctx.fillRect(x,y,32,32);
      if((x+y)%128===0) drawGrassTuft(x+12,y+20);
    }
  }
}

function drawVillageMap(){
  drawGrassBase("#5cad2f","#2f7d24");

  drawCliffs();
  drawPathNetwork();
  drawPond(980,620,245,120);
  drawHouse(970,120);
  drawBridge(990,700,140,38);

  drawTree(55,120); drawTree(250,105); drawTree(1290,120);
  drawTree(65,320); drawTree(1120,410); drawTree(1245,410);
  drawTree(470,620); drawTree(700,650); drawTree(1260,680);
  drawBush(150,185); drawBush(820,220); drawBush(880,360); drawBush(440,360);
  drawCrates(95,410); drawSign(230,455); drawStoneTablet(250,220);

  for(let i=0;i<22;i++) drawFlower(110 + (i*61)%1160, 155 + (i*97)%520);
  map().obstacles.forEach(drawRockObstacle);
}

function drawLakeMap(){
  drawGrassBase("#4e9f32","#286b2a");
  drawCliffs();
  drawPathNetwork();

  ctx.fillStyle="#0b5f86";
  ctx.fillRect(320,HUD_H,180,canvas.height-HUD_H);
  ctx.fillRect(920,HUD_H,180,canvas.height-HUD_H);
  for(let y=HUD_H+20;y<canvas.height;y+=54){ drawWave(365,y); drawWave(965,y+18); }

  drawBridge(320,300,180,170);
  drawBridge(920,300,180,170);

  drawHouse(90,120);
  drawTree(1200,125); drawTree(1180,570); drawTree(100,620);
  drawBush(690,260); drawBush(785,570); drawBush(1240,360);
  drawRock(650,180); drawRock(690,620); drawRock(1200,350);
  for(let i=0;i<18;i++) drawFlower(530 + (i*47)%760, 170 + (i*83)%510);
  map().obstacles.forEach(drawRockObstacle);
}

function drawValleyMap(){
  drawGrassBase("#6b8f2f","#334d22");
  drawCliffs();
  drawPathNetwork();

  ctx.fillStyle="rgba(120,113,108,.25)";
  ctx.fillRect(190,110,1010,600);

  for(let i=0;i<24;i++) drawCrack(210 + (i*53)%950, 140 + (i*89)%520);
  drawBigRock(310,170); drawBigRock(620,390); drawBigRock(940,210); drawBigRock(1060,580); drawBigRock(370,610);
  drawDeadTree(150,140); drawDeadTree(1180,130); drawDeadTree(150,590); drawDeadTree(1190,590);
  drawPortal(1340,420);
  map().obstacles.forEach(drawRockObstacle);
}

function drawBossArena(){
  drawGrassBase("#4a6a1f","#1f2937");

  ctx.fillStyle="rgba(115,105,92,.46)";
  ctx.fillRect(170,110,1060,610);
  ctx.strokeStyle="rgba(250,204,21,.34)";
  ctx.lineWidth=6;
  ctx.strokeRect(170,110,1060,610);

  drawPath("#8b5a1f",700,440,660,115,165,365);
  for(let i=0;i<18;i++){ drawTorch(220+i*58,130); drawTorch(220+i*58,690); }
  for(let i=0;i<8;i++) drawPillar(260+i*130,180+(i%2)*360);

  ctx.fillStyle="rgba(250,204,21,.15)";
  ctx.beginPath(); ctx.arc(700,440,195,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="rgba(250,204,21,.35)";
  ctx.lineWidth=4;
  ctx.beginPath(); ctx.arc(700,440,195,0,Math.PI*2); ctx.stroke();

  drawPortal(65,420);
  map().obstacles.forEach(drawRockObstacle);
}

function drawCliffs(){
  ctx.fillStyle="#3d3325";
  const cliffRects = [
    [0,HUD_H,280,70], [520,HUD_H,210,70], [1090,HUD_H,310,70],
    [0,705,250,67], [820,705,210,67], [1240,705,160,67],
    [0,520,95,120], [1280,420,120,150]
  ];

  for(const r of cliffRects){
    ctx.fillRect(...r);
    ctx.fillStyle="#6b5a39";
    for(let x=r[0]; x<r[0]+r[2]; x+=26){
      ctx.fillRect(x,r[1]+6,18,10);
      ctx.fillRect(x+8,r[1]+32,18,10);
    }
    ctx.fillStyle="#3d3325";
    ctx.fillStyle="#62b536";
    ctx.fillRect(r[0],r[1],r[2],14);
    ctx.fillStyle="#3d3325";
  }
}

function drawPathNetwork(){
  drawPath("#b68b52",650,438,120,350,0,0);
  drawPath("#b68b52",760,520,520,62,0,0);
  drawPath("#b68b52",560,260,62,190,0,0);
  drawPath("#b68b52",360,520,190,50,0,0);

  ctx.fillStyle="rgba(255,255,255,.08)";
  for(let i=0;i<60;i++){
    ctx.beginPath();
    ctx.arc(250+(i*37)%850, 250+(i*59)%390, 2, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawPath(color,cx,cy,rx,ry){
  ctx.save();
  ctx.fillStyle=color;
  ctx.globalAlpha=.72;
  ctx.beginPath();
  ctx.ellipse(cx,cy,rx,ry,.05,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawPond(x,y,rx,ry){
  ctx.fillStyle="#075985";
  ctx.beginPath();
  ctx.ellipse(x,y,rx,ry,-.15,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle="#164e63";
  ctx.lineWidth=8;
  ctx.stroke();
  for(let i=0;i<8;i++) drawWave(x-rx+40+i*56, y-20+Math.sin(i)*25);
  for(let i=0;i<7;i++) drawLily(x-rx+70+i*58, y-25+Math.sin(i*2)*70);
}

function drawHouse(x,y){
  ctx.fillStyle="#1e3a5f";
  ctx.fillRect(x+8,y,190,72);
  ctx.fillStyle="#254b78";
  for(let i=0;i<9;i++) ctx.fillRect(x+15+i*20,y+8,14,48);

  ctx.fillStyle="#d6c193";
  ctx.fillRect(x+25,y+72,155,96);
  ctx.strokeStyle="#5c4326";
  ctx.lineWidth=4;
  ctx.strokeRect(x+25,y+72,155,96);

  ctx.fillStyle="#5c3216";
  ctx.fillRect(x+60,y+108,40,60);
  ctx.strokeStyle="#221407";
  ctx.strokeRect(x+60,y+108,40,60);

  ctx.fillStyle="#1f2937";
  ctx.fillRect(x+120,y+102,35,35);
  ctx.strokeStyle="#5c4326";
  ctx.strokeRect(x+120,y+102,35,35);

  ctx.fillStyle="#8b5a2b";
  ctx.fillRect(x+205,y+95,54,54);
  ctx.strokeStyle="#3a2412";
  ctx.strokeRect(x+205,y+95,54,54);
}

function drawTree(x,y){
  ctx.fillStyle="rgba(0,0,0,.25)";
  ctx.beginPath(); ctx.ellipse(x+44,y+95,46,16,0,0,Math.PI*2); ctx.fill();

  ctx.fillStyle="#5b351b";
  ctx.fillRect(x+35,y+52,24,48);

  ctx.fillStyle="#0f6b2a";
  ctx.beginPath(); ctx.arc(x+45,y+42,52,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#238a36";
  ctx.beginPath(); ctx.arc(x+20,y+55,35,0,Math.PI*2); ctx.arc(x+70,y+55,35,0,Math.PI*2); ctx.arc(x+45,y+22,32,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="rgba(255,255,255,.09)";
  ctx.beginPath(); ctx.arc(x+25,y+28,15,0,Math.PI*2); ctx.fill();
}

function drawBush(x,y){
  ctx.fillStyle="#1f7a2e";
  ctx.beginPath(); ctx.arc(x,y,24,0,Math.PI*2); ctx.arc(x+25,y+2,24,0,Math.PI*2); ctx.arc(x+12,y-15,20,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="rgba(255,255,255,.08)";
  ctx.beginPath(); ctx.arc(x+3,y-10,7,0,Math.PI*2); ctx.fill();
}

function drawRock(x,y){
  ctx.fillStyle="#6b7280";
  ctx.beginPath(); ctx.ellipse(x,y,34,24,.2,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#374151"; ctx.lineWidth=3; ctx.stroke();
}

function drawBigRock(x,y){
  ctx.fillStyle="#4b5563";
  ctx.beginPath(); ctx.ellipse(x,y,65,45,.2,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#9ca3af"; ctx.lineWidth=3; ctx.stroke();
}

function drawRockObstacle(o){
  ctx.fillStyle="rgba(0,0,0,.18)";
  ctx.fillRect(o.x,o.y,o.w,o.h);
  ctx.strokeStyle="rgba(255,255,255,.08)";
  ctx.strokeRect(o.x+4,o.y+4,o.w-8,o.h-8);
}

function drawCrates(x,y){
  ctx.fillStyle="#8b5a2b";
  ctx.fillRect(x,y,50,50); ctx.fillRect(x+50,y,50,50);
  ctx.strokeStyle="#3a2412"; ctx.lineWidth=3;
  ctx.strokeRect(x,y,50,50); ctx.strokeRect(x+50,y,50,50);
  ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+50,y+50); ctx.moveTo(x+50,y); ctx.lineTo(x,y+50);
  ctx.moveTo(x+50,y); ctx.lineTo(x+100,y+50); ctx.moveTo(x+100,y); ctx.lineTo(x+50,y+50); ctx.stroke();
}

function drawSign(x,y){
  ctx.fillStyle="#5c3216";
  ctx.fillRect(x+28,y+28,8,42);
  ctx.fillStyle="#8b5a2b";
  ctx.fillRect(x,y,60,32);
  ctx.strokeStyle="#3a2412";
  ctx.strokeRect(x,y,60,32);
}

function drawStoneTablet(x,y){
  ctx.fillStyle="#6b7280";
  ctx.fillRect(x,y,55,44);
  ctx.strokeStyle="#374151";
  ctx.strokeRect(x,y,55,44);
  ctx.fillStyle="#1f2937";
  ctx.fillRect(x+10,y+12,35,5);
  ctx.fillRect(x+10,y+25,25,4);
}

function drawFlower(x,y){
  ctx.fillStyle="#f8fafc";
  ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.arc(x+8,y+2,4,0,Math.PI*2); ctx.arc(x+4,y+8,4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#facc15";
  ctx.fillRect(x+3,y+3,3,3);
}

function drawGrassTuft(x,y){
  ctx.fillStyle="rgba(187,247,208,.30)";
  ctx.fillRect(x,y,4,12);
  ctx.fillRect(x+7,y-5,4,17);
}

function drawWave(x,y){
  ctx.strokeStyle="rgba(186,230,253,.45)";
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.arc(x,y,22,.1,2.8);
  ctx.stroke();
}

function drawLily(x,y){
  ctx.fillStyle="#65a30d";
  ctx.beginPath();
  ctx.ellipse(x,y,18,11,.2,0,Math.PI*2);
  ctx.fill();
}

function drawBridge(x,y,w,h){
  ctx.fillStyle="#8b5a2b";
  ctx.fillRect(x,y,w,h);
  ctx.strokeStyle="#3a2412";
  ctx.lineWidth=4;
  ctx.strokeRect(x,y,w,h);
  for(let xx=x+12;xx<x+w;xx+=26){
    ctx.fillStyle="#6b3f1f";
    ctx.fillRect(xx,y+4,8,h-8);
  }
}

function drawDeadTree(x,y){
  ctx.strokeStyle="#78350f";
  ctx.lineWidth=8;
  ctx.beginPath(); ctx.moveTo(x,y+80); ctx.lineTo(x+22,y+15); ctx.stroke();
  ctx.lineWidth=5;
  ctx.beginPath(); ctx.moveTo(x+16,y+40); ctx.lineTo(x-10,y+18); ctx.moveTo(x+16,y+38); ctx.lineTo(x+48,y+18); ctx.stroke();
}

function drawTorch(x,y){
  ctx.fillStyle="#78350f";
  ctx.fillRect(x,y,8,26);
  ctx.fillStyle="#facc15";
  ctx.beginPath(); ctx.arc(x+4,y-4,8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="rgba(250,204,21,.18)";
  ctx.beginPath(); ctx.arc(x+4,y-4,24,0,Math.PI*2); ctx.fill();
}

function drawPillar(x,y){
  ctx.fillStyle="#52525b";
  ctx.fillRect(x,y,45,95);
  ctx.fillStyle="#71717a";
  ctx.fillRect(x-5,y,55,12);
  ctx.fillRect(x-5,y+83,55,12);
}

function drawCrack(x,y){
  ctx.strokeStyle="rgba(0,0,0,.26)";
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.lineTo(x+12,y+18);
  ctx.lineTo(x+4,y+38);
  ctx.lineTo(x+18,y+55);
  ctx.stroke();
}

function drawPortal(x,y){
  ctx.save();
  ctx.strokeStyle="#facc15";
  ctx.lineWidth=6;
  ctx.shadowColor="#facc15";
  ctx.shadowBlur=18;
  ctx.beginPath();
  ctx.ellipse(x,y,38,82,0,0,Math.PI*2);
  ctx.stroke();
  ctx.fillStyle="rgba(250,204,21,.14)";
  ctx.beginPath();
  ctx.ellipse(x,y,28,68,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawExits(){
  map().exits.forEach(exit=>{
    ctx.save();
    ctx.fillStyle="rgba(250,204,21,.24)";
    ctx.fillRect(exit.x,exit.y,exit.w,exit.h);
    ctx.strokeStyle="#facc15";
    ctx.lineWidth=3;
    ctx.strokeRect(exit.x+3,exit.y+3,exit.w-6,exit.h-6);
    ctx.fillStyle="#fff";
    ctx.font="bold 14px Arial";
    ctx.textAlign="center";
    ctx.fillText("SAÍDA", exit.x+exit.w/2, exit.y-8);
    ctx.restore();
  });
}

function drawPlayer(){
  updatePlayerAnimation();
  const img=player.attacking ? imgs.playerAttack : imgs.playerWalk;
  const sx=player.frameIndex*player.frameW;
  const sy=getPlayerRow(player.direction)*player.frameH;
  const bob=isPlayerMoving() && !player.attacking ? Math.sin(player.stepBob)*2.5 : 0;

  if(player.invincibleTimer > 0 && Math.floor(player.invincibleTimer/5)%2===0) ctx.globalAlpha=.45;

  if(img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img,sx,sy,player.frameW,player.frameH,player.x,player.y+bob,player.drawW,player.drawH);
  }

  ctx.globalAlpha=1;
}

function drawEnemy(e){
  const img=e.attacking ? (e.boss ? imgs.bossAttack : imgs.enemyAttack) : (e.boss ? imgs.bossWalk : imgs.enemyWalk);
  const sx=e.frameIndex*e.frameW;
  const sy=getEnemyRow(e.direction)*e.frameH;

  ctx.save();
  if(e.hitFlash>0){
    ctx.globalAlpha=.55;
    ctx.translate(Math.random()*4-2,Math.random()*4-2);
  }

  if(img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img,sx,sy,e.frameW,e.frameH,e.x,e.y,e.drawW,e.drawH);
  }
  ctx.restore();

  ctx.fillStyle="#450a0a";
  ctx.fillRect(e.x+20,e.y-10,e.boss?126:62,10);
  ctx.fillStyle=e.boss ? "#facc15" : "#ef4444";
  ctx.fillRect(e.x+20,e.y-10,(e.boss?126:62)*(e.vida/e.vidaMax),10);
}

function spawnDust(x,y){
  particles.push({x,y,vx:(Math.random()*2-1)*.6,vy:-Math.random()*.7,life:18,color:"rgba(226,232,240,.38)",size:4});
}

function spawnHit(x,y){
  for(let i=0;i<10;i++){
    particles.push({x,y,vx:(Math.random()*2-1)*2.5,vy:(Math.random()*2-1)*2.5,life:18,color:"rgba(250,204,21,.9)",size:4});
  }
}

function updateParticles(){
  particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.life--; });
  particles=particles.filter(p=>p.life>0);
}

function drawParticles(){
  particles.forEach(p=>{
    ctx.fillStyle=p.color;
    ctx.globalAlpha=p.life/18;
    ctx.fillRect(p.x,p.y,p.size,p.size);
    ctx.globalAlpha=1;
  });
}

function drawHUD(){
  ctx.fillStyle="#05070d";
  ctx.fillRect(0,0,canvas.width,HUD_H);
  ctx.strokeStyle="rgba(255,255,255,.12)";
  ctx.lineWidth=2;
  ctx.strokeRect(0,HUD_H-2,canvas.width,2);

  const hearts = Math.ceil(player.vida / 20);
  for(let i=0;i<5;i++){
    drawHeart(30+i*43,30, i < hearts);
  }

  ctx.fillStyle="#fff";
  ctx.font="bold 30px monospace";
  ctx.fillText(`Vida: ${Math.floor(player.vida)}`, 220, 47);

  drawGem(600,34);
  ctx.fillText(`x ${gems}`, 628,47);

  drawCoin(760,34);
  ctx.fillText(`x ${coins}`, 790,47);

  ctx.strokeStyle="rgba(255,255,255,.20)";
  ctx.strokeRect(970,15,390,44);
  ctx.fillText("WASD: Mover | Espaço: Atacar", 990,47);

  ctx.fillStyle="#facc15";
  ctx.font="bold 18px monospace";
  ctx.fillText(map().name, 30, 70);
}

function drawHeart(x,y,full){
  ctx.fillStyle=full ? "#ef4444" : "#4b5563";
  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.bezierCurveTo(x-18,y-18,x-35,y+8,x,y+28);
  ctx.bezierCurveTo(x+35,y+8,x+18,y-18,x,y);
  ctx.fill();
  ctx.strokeStyle="#7f1d1d";
  ctx.stroke();
}

function drawGem(x,y){
  ctx.fillStyle="#22c55e";
  ctx.beginPath();
  ctx.moveTo(x,y-16); ctx.lineTo(x+13,y); ctx.lineTo(x,y+18); ctx.lineTo(x-13,y); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle="#86efac";
  ctx.stroke();
}

function drawCoin(x,y){
  ctx.fillStyle="#facc15";
  ctx.beginPath(); ctx.arc(x,y,16,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#a16207"; ctx.lineWidth=4; ctx.stroke();
}

function drawVignette(){
  const g=ctx.createRadialGradient(canvas.width/2,canvas.height/2,200,canvas.width/2,canvas.height/2,800);
  g.addColorStop(0,"rgba(0,0,0,0)");
  g.addColorStop(1,"rgba(0,0,0,.28)");
  ctx.fillStyle=g;
  ctx.fillRect(0,HUD_H,canvas.width,canvas.height-HUD_H);
}

function updateHUDText(){
  // Nesta versão, a HUD é desenhada direto no canvas pela função drawHUD().
  // Esta função foi mantida vazia para evitar erro de elementos HTML inexistentes.
}

function drawGameOver(){
  if(gameState==="playing") return;
  ctx.fillStyle="rgba(2,6,23,.78)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.textAlign="center";
  ctx.font="bold 64px Arial";
  ctx.fillStyle="#ef4444";
  ctx.fillText("GAME OVER",canvas.width/2,canvas.height/2-20);
  ctx.font="28px Arial";
  ctx.fillStyle="#fff";
  ctx.fillText("Aperte R para reiniciar",canvas.width/2,canvas.height/2+35);
  ctx.textAlign="left";
}

function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  if(cameraShake>0){
    ctx.translate(Math.random()*cameraShake-cameraShake/2, Math.random()*cameraShake-cameraShake/2);
    cameraShake *= .86;
    if(cameraShake < .5) cameraShake = 0;
  }

  drawMap();
  movePlayer();
  map().enemies.forEach(updateEnemy);
  map().enemies.forEach(drawEnemy);
  drawPlayer();
  updateParticles();
  drawParticles();

  ctx.restore();

  drawHUD();
  updateHUDText();
  drawGameOver();
  requestAnimationFrame(loop);
}

loop();
