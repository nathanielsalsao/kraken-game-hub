// ==========================================
// MAXED BESTIARY & CONFIG
// ==========================================
const ENEMY_TYPES = {
    normal:    { r: 15, hp: 12,  speed: 1.6, color: '#ff4757' },
    tank:      { r: 38, hp: 100, speed: 0.6, color: '#e74c3c' },
    ghost:     { r: 18, hp: 20,  speed: 1.3, color: 'rgba(100,255,255,0.4)', special: 'phase' },
    splitter:  { r: 25, hp: 30,  speed: 1.0, color: '#9b59b6', special: 'split' },
    mini:      { r: 10, hp: 8,   speed: 2.8, color: '#9b59b6' },
    medic:     { r: 22, hp: 35,  speed: 1.2, color: '#2ecc71', special: 'heal' },
    shielder:  { r: 24, hp: 60,  speed: 0.9, color: '#3498db', special: 'shield' },
    omega:     { r: 120, hp: 10000, speed: 0.2, color: '#ff003c', isBoss: true }
};

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let W, H;

let health = 100, paused = false, currentWave = 1, xp = 0, xpToNextLevel = 100;
let enemies = [], projectiles = [], particles = [], drops = []; 
let drones = { hunter: null, smasher: null };
let baseLevel = 1, coreRadius = 65, shieldHP = 100, maxShieldHP = 100, gameWon = false;
let shake = 0;

let skills = {
    1: { name: "EMP", cd: 0, maxCD: 600, active: 0 },
    2: { name: "OVERDRIVE", cd: 0, maxCD: 800, active: 0 },
    3: { name: "REPAIR", cd: 0, maxCD: 1000 },
    4: { name: "SINGULARITY", cd: 0, maxCD: 1500, active: 0 }
};

// ==========================================
// SYSTEMS: Particles & Drones
// ==========================================
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0; this.color = color;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= 0.02; }
    draw() {
        ctx.globalAlpha = this.life; ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 3, 3); ctx.globalAlpha = 1;
    }
}

class Drone {
    constructor(type) {
        this.type = type; this.x = W/2; this.y = H/2;
        this.angle = Math.random() * Math.PI * 2;
        this.color = type === 'smasher' ? '#ff00ff' : '#00ffaa';
    }
    update() {
        let target = null, minDist = 600;
        enemies.forEach(e => {
            let d = Math.hypot(e.x - this.x, e.y - this.y);
            if(d < minDist) { minDist = d; target = e; }
        });

        if (target) {
            let angle = Math.atan2(target.y - this.y, target.x - this.x);
            this.x += Math.cos(angle) * (skills[2].active > 0 ? 8 : 4);
            this.y += Math.sin(angle) * (skills[2].active > 0 ? 8 : 4);
            if (this.type === 'hunter' && Math.random() > 0.92) {
                projectiles.push({x:this.x, y:this.y, vx:Math.cos(angle)*12, vy:Math.sin(angle)*12, color:this.color});
            }
        } else { // Orbit core when idle
            this.angle += 0.05;
            this.x = W/2 + Math.cos(this.angle) * 120;
            this.y = H/2 + Math.sin(this.angle) * 120;
        }
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "white"; ctx.stroke();
    }
}

// ==========================================
// CORE ENGINE
// ==========================================
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

class Enemy {
    constructor(type, x, y, isBoss = false) {
        this.type = type; const cfg = ENEMY_TYPES[type];
        this.isBoss = isBoss; this.r = cfg.r;
        this.hp = cfg.hp; this.maxHp = this.hp;
        this.speed = cfg.speed; this.color = cfg.color;
        this.special = cfg.special;
        this.x = x || (Math.random() > 0.5 ? -100 : W + 100);
        this.y = y || Math.random() * H;
        this.timer = 0;
    }
    update() {
        if(skills[1].active > 0) return;
        this.timer++;

       
        if(this.isBoss && this.hp < this.maxHp / 2) {
            this.speed = 0.5; this.color = "#550000";
            if(this.timer % 60 === 0) enemies.push(new Enemy('mini', this.x, this.y));
        }

        if(this.special === 'heal' && this.timer % 60 === 0) {
            enemies.forEach(e => { if(Math.hypot(this.x-e.x, this.y-e.y) < 200) e.hp = Math.min(e.maxHp, e.hp + 2); });
        }

        let moveSpeed = (skills[4].active > 0) ? 8 : this.speed;
        const angle = Math.atan2(H/2 - this.y, W/2 - this.x);
        this.x += Math.cos(angle) * moveSpeed;
        this.y += Math.sin(angle) * moveSpeed;
    }
    draw() {
        ctx.save();
        if(this.special === 'phase') ctx.globalAlpha = Math.sin(Date.now()/150) > 0 ? 1 : 0.15;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.isBoss ? 40 : 0; ctx.shadowColor = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill();
        if(this.isBoss) { 
            ctx.fillStyle = "#222"; ctx.fillRect(this.x - 100, this.y - this.r - 30, 200, 15);
            ctx.fillStyle = "red"; ctx.fillRect(this.x - 100, this.y - this.r - 30, (this.hp/this.maxHp)*200, 15);
        }
        ctx.restore();
    }
}

function damageEnemy(i, amt) {
    let e = enemies[i]; if(!e) return;
    
    e.hp -= (e.special === 'shield' ? amt * 0.4 : amt);
    for(let j=0; j<3; j++) particles.push(new Particle(e.x, e.y, e.color));

    if(e.hp <= 0) {
        if(e.type === 'omega') gameWon = true; 
        if(e.special === 'split') {
            enemies.push(new Enemy('mini', e.x+15, e.y), new Enemy('mini', e.x-15, e.y));
        }
        if(Math.random() > 0.6) drops.push({x: e.x, y: e.y, type: Math.random() > 0.5 ? 'shield' : 'xp'});
        enemies.splice(i, 1); gainXP(40);
    }
}

// ==========================================
// LOOP & RENDER
// ==========================================
function loop() {
    if(paused) return;
    ctx.save();
    if(shake > 0) { ctx.translate(Math.random()*shake-shake/2, Math.random()*shake-shake/2); shake *= 0.9; }
    
    ctx.fillStyle = 'rgba(5, 10, 20, 0.4)'; ctx.fillRect(0,0,W,H);
    

    document.getElementById('hp').innerText = health;
    document.getElementById('xp-fill').style.width = (xp/xpToNextLevel)*100 + "%";


    ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(W/2, H/2, coreRadius, 0, Math.PI*2); ctx.stroke();
    if(shieldHP > 0) {
        ctx.strokeStyle = 'cyan'; ctx.setLineDash([10, 5]);
        ctx.beginPath(); ctx.arc(W/2, H/2, coreRadius + 20, Date.now()/200, Date.now()/200 + 4); ctx.stroke();
        ctx.setLineDash([]);
    }

    [...particles, ...drops, ...projectiles, ...enemies].forEach((ent, i) => {
        ent.update ? ent.update() : null; 
        ent.draw ? ent.draw() : null;
    });

    
    projectiles.forEach((p, pi) => {
        p.x += p.vx; p.y += p.vy;
        ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 5, 5);
        enemies.forEach((e, ei) => {
            if(Math.hypot(p.x-e.x, p.y-e.y) < e.r) { projectiles.splice(pi, 1); damageEnemy(ei, 10); }
        });
    });

    particles = particles.filter(p => p.life > 0);
    
  
    enemies.forEach((e, i) => {
        if(Math.hypot(W/2-e.x, H/2-e.y) < coreRadius + 10) {
            shake = 15;
            if(shieldHP > 0) shieldHP -= 20; else health -= 15;
            enemies.splice(i, 1);
            if(health <= 0) location.reload();
        }
    });

    if(drones.hunter) { drones.hunter.update(); drones.hunter.draw(); }
    if(drones.smasher) { drones.smasher.update(); drones.smasher.draw(); }

    Object.keys(skills).forEach(k => { skills[k].cd = Math.max(0, skills[k].cd-1); skills[k].active = Math.max(0, skills[k].active-1); });

    ctx.restore();
    if(!gameWon) requestAnimationFrame(loop);
    else { ctx.fillStyle = "cyan"; ctx.font = "bold 60px monospace"; ctx.textAlign="center"; ctx.fillText("SYSTEM SECURED", W/2, H/2); }
}



setInterval(() => {
    if(!paused && baseLevel < 10) {
        const keys = Object.keys(ENEMY_TYPES).filter(k => !ENEMY_TYPES[k].isBoss && k !== 'mini');
        enemies.push(new Enemy(keys[Math.floor(Math.random()*keys.length)]));
    }
}, 1000);

loop();