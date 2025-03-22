// Global variables
let stars = [];
let gameManager;
let playerShootOsc, enemyShootOsc, explosionOsc;
let gameOverOsc1, gameOverOsc2; // Oscillators for game over theme
let gameOverSoundPlaying = false; // Track if game over sound is playing
let canvasSize; // Size of the square canvas
let offsetX, offsetY; // Offsets for centering the canvas
let alienSprite; // Add this variable to store the alien image
let shipSprite; // Add this variable to store the player ship image
let powerUpSprite; // Add this variable to store the power-up image
let bossSprite; // Add this variable to store the boss sprite
let specialAlienSprite; // Add this variable to store the special alien sprite
let particles = []; // Array for particle effects
let gameStarted = false; // Track if the game has started

// Preload function: Load assets before setup
function preload() {
  console.log("Preload started");
  // Simple load without try-catch to see basic errors
  try {
    alienSprite = loadImage('assets/alien.png', 
      img => console.log("Alien image loaded successfully"),
      err => console.error("Failed to load alien image:", err)
    );
    
    shipSprite = loadImage('assets/ship.png',
      img => console.log("Ship image loaded successfully"),
      err => console.error("Failed to load ship image:", err)
    );
    
    // Try to load boss sprite, but use alien sprite as fallback if it fails
    try {
      bossSprite = loadImage('assets/alien.png', 
        img => console.log("Boss image loaded (using alien image as fallback)"),
        err => console.error("Failed to load boss image, using alien as fallback")
      );
      
      // Use the same sprite for special alien (with glowing effect added in draw)
      specialAlienSprite = alienSprite;
    } catch (e) {
      bossSprite = alienSprite;
      specialAlienSprite = alienSprite;
      console.error("Using alien sprite as boss and special alien sprite");
    }
  } catch (e) {
    console.error("Error in preload:", e);
  }
  console.log("Preload completed");
}

// Setup function: Initialize canvas, stars, game manager, and sound oscillators
function setup() {
  console.log("Setup started");
  
  // Check if we're on a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Create a canvas size that works better on mobile
  if (isMobile) {
    canvasSize = min(windowWidth * 0.95, windowHeight * 0.7);
  } else {
    canvasSize = min(windowWidth * 0.4, windowHeight * 0.4);
  }
  
  // Create a square canvas
  const canvas = createCanvas(windowWidth, windowHeight);
  // Add touch events handling to canvas
  canvas.touchStarted(function() {
    // Forward touch events to p5.js
    return false;
  });
  console.log("Canvas created:", windowWidth, windowHeight);
  
  // Calculate offsets to center the game area
  offsetX = (windowWidth - canvasSize) / 2;
  offsetY = (windowHeight - canvasSize) / 2;
  
  // If on mobile, move the game area up slightly to make room for controls
  if (isMobile) {
    offsetY = max(10, offsetY - 40);
  }
  
  // Generate static stars for the background
  for (let i = 0; i < 100; i++) {
    stars.push({ 
      x: random(canvasSize), 
      y: random(canvasSize), 
      size: random(1, 3) 
    });
  }
  
  // Initialize sound oscillators
  try {
    // Player shoot sound - using sine wave for smoother laser sound
    playerShootOsc = new p5.Oscillator('sine');
    playerShootOsc.amp(0);
    
    // We don't need enemy shoot sound anymore
    // enemyShootOsc = new p5.Oscillator('square');
    
    // Explosion sound - using brown noise for more realistic explosion
    explosionOsc = new p5.Noise('brown');
    explosionOsc.amp(0);
    
    // Game over theme oscillators
    gameOverOsc1 = new p5.Oscillator('sine');
    gameOverOsc1.amp(0);
    
    gameOverOsc2 = new p5.Oscillator('triangle');
    gameOverOsc2.amp(0);
    
    console.log("Sound initialized successfully");
  } catch (e) {
    console.error("Sound initialization error:", e);
  }

  // Create the game manager after we're sure assets are loaded
  try {
    gameManager = new GameManager();
    // Expose gameManager to the window object for mobile controls
    window.gameManager = gameManager;
    console.log("Game manager created successfully and exposed to window");
    gameStarted = true;
  } catch (e) {
    console.error("Error creating game manager:", e);
  }
  
  console.log("Setup completed");
}

// Draw function: Main game loop
function draw() {
  try {
    background(50); // Dark gray background for the whole window
    
    // Draw the game screen (black background with a subtle border)
    fill(0); // Black game area
    stroke(100);
    strokeWeight(2);
    rect(offsetX, offsetY, canvasSize, canvasSize);
    
    if (!gameStarted) {
      // Show loading or error message
      fill(255);
      textSize(24);
      textAlign(CENTER);
      text("Loading game...", windowWidth/2, windowHeight/2);
      return;
    }
    
    // Set up translation to draw all game elements within the game area
    push();
    translate(offsetX, offsetY);
    
    // Draw stars
    drawStars();
    
    if (gameManager) {
      // Draw game elements
      gameManager.update();
      gameManager.draw();
    } else {
      console.error("Game manager is not initialized");
      fill(255, 0, 0);
      textSize(20);
      text("ERROR: Game not initialized", canvasSize/2, canvasSize/2);
    }
    
    // Reset translation
    pop();
    
    // Draw title - adjust for mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    fill(255);
    noStroke();
    textAlign(CENTER);
    
    if (isMobile) {
      textSize(18);
      text("INVADED BY ALIENS", windowWidth/2, offsetY - 15);
    } else {
      textSize(24);
      text("INVADED BY ALIENS", windowWidth/2, offsetY - 40);
    }
  } catch (e) {
    console.error("Error in draw loop:", e);
    // Basic error display
    background(0);
    fill(255, 0, 0);
    textSize(24);
    textAlign(CENTER);
    text("Game Error - Check Console", windowWidth/2, windowHeight/2);
  }
}

// Draw the starry background
function drawStars() {
  fill(255); // White stars
  noStroke();
  for (let star of stars) {
    ellipse(star.x, star.y, star.size, star.size);
  }
}

// Adjust mouse coordinates to game coordinates
function getGameCoordinates(x, y) {
  return {
    x: x - offsetX,
    y: y - offsetY
  };
}

// Handle key presses for player movement and shooting
function keyPressed() {
  try {
    // Check if leaderboard modal is open - don't process keyboard events if it is
    if (document.getElementById('leaderboardModal').style.display === 'block') {
      return; // Ignore all key presses when modal is open
    }
    
    // Check for restart on 'R' key press if game is over
    if (gameManager && gameManager.gameIsOver && (key === 'r' || key === 'R')) {
      restartGame();
      return;
    }
    
    if (!gameManager || !gameManager.player) return;
    
    if (keyCode === LEFT_ARROW) {
      gameManager.player.movingLeft = true;
    } else if (keyCode === RIGHT_ARROW) {
      gameManager.player.movingRight = true;
    } else if (keyCode === 32) { // Space bar
      gameManager.player.shoot();
    }
  } catch (e) {
    console.error("Error in keyPressed:", e);
  }
}

// Handle key releases to stop movement
function keyReleased() {
  try {
    if (!gameManager || !gameManager.player) return;
    
    if (keyCode === LEFT_ARROW) {
      gameManager.player.movingLeft = false;
    } else if (keyCode === RIGHT_ARROW) {
      gameManager.player.movingRight = false;
    }
  } catch (e) {
    console.error("Error in keyReleased:", e);
  }
}

// Resize the canvas and update game dimensions when window is resized
function windowResized() {
  // Check if we're on a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    canvasSize = min(windowWidth * 0.95, windowHeight * 0.7);
  } else {
    canvasSize = min(windowWidth * 0.4, windowHeight * 0.4);
  }
  
  resizeCanvas(windowWidth, windowHeight);
  offsetX = (windowWidth - canvasSize) / 2;
  offsetY = (windowHeight - canvasSize) / 2;
  
  // If on mobile, move the game area up slightly to make room for controls
  if (isMobile) {
    offsetY = max(10, offsetY - 40);
  }
  
  // Update player position
  if (gameManager && gameManager.player) {
    gameManager.player.y = canvasSize - 50;
    gameManager.player.x = constrain(gameManager.player.x, 0, canvasSize);
  }
}

// Sound effect for player shooting - more pleasant laser sound
function playerShootSound() {
  try {
    if (playerShootOsc) {
      // Create a laser-like sound
      playerShootOsc.freq(880); // A5 note
      playerShootOsc.amp(0.1); // Lower volume
      playerShootOsc.start();
      
      // Create a frequency sweep for a laser effect
      setTimeout(() => playerShootOsc.freq(440), 30); // Drop to A4
      setTimeout(() => playerShootOsc.amp(0, 0.05), 60); // Quick fade out
      setTimeout(() => playerShootOsc.stop(), 80); // Stop after 80ms
    }
  } catch (e) {
    console.error("Player shoot sound error:", e);
  }
}

// Sound effect for explosions - more realistic and less intrusive
function explosionSound() {
  try {
    if (explosionOsc) {
      // Create a more natural explosion sound with quick attack and decay
      explosionOsc.amp(0.2, 0.01); // Lower volume (0.2 instead of 0.5) with fast attack
      explosionOsc.start();
      
      // Create a decay envelope for the explosion
      setTimeout(() => explosionOsc.amp(0.1, 0.1), 50);
      setTimeout(() => explosionOsc.amp(0.05, 0.2), 150);
      setTimeout(() => explosionOsc.amp(0, 0.2), 300);
      setTimeout(() => explosionOsc.stop(), 500); // Shorter duration (500ms instead of 600ms)
    }
  } catch (e) {
    console.error("Explosion sound error:", e);
  }
}

// Play game over space theme
function playGameOverTheme() {
  if (gameOverSoundPlaying) return; // Prevent multiple instances
  
  gameOverSoundPlaying = true;
  
  try {
    // Start with both oscillators
    gameOverOsc1.start();
    gameOverOsc2.start();
    
    // Base volume
    const baseVolume = 0.15;
    
    // Set initial amplitude
    gameOverOsc1.amp(baseVolume);
    gameOverOsc2.amp(baseVolume * 0.5);
    
    // Store the current note index
    let noteIndex = 0;
    
    // Note sequence for a repeating melody that loops cleanly
    const notes = [
      { freq1: 196,    freq2: 392,    duration: 700 },  // G3 & G4
      { freq1: 233.08, freq2: 466.16, duration: 700 },  // Bb3 & Bb4
      { freq1: 261.63, freq2: 523.25, duration: 700 },  // C4 & C5
      { freq1: 196,    freq2: 392,    duration: 700 },  // G3 & G4
      { freq1: 174.61, freq2: 349.23, duration: 700 },  // F3 & F4
      { freq1: 196,    freq2: 392,    duration: 700 },  // G3 & G4
      { freq1: 233.08, freq2: 466.16, duration: 700 }   // Bb3 & Bb4
    ];
    
    // Play the initial note
    gameOverOsc1.freq(notes[0].freq1);
    gameOverOsc2.freq(notes[0].freq2);
    
    // Set interval to continuously play the melody
    const playNextNote = function() {
      // Only proceed if we're still playing the game over theme
      if (!gameOverSoundPlaying) return;
      
      // Move to next note
      noteIndex = (noteIndex + 1) % notes.length;
      
      // Set new frequencies
      gameOverOsc1.freq(notes[noteIndex].freq1);
      gameOverOsc2.freq(notes[noteIndex].freq2);
      
      // Schedule the next note
      setTimeout(playNextNote, notes[noteIndex].duration);
    };
    
    // Start the loop by scheduling the first transition
    setTimeout(playNextNote, notes[0].duration);
    
  } catch (e) {
    console.error("Game over theme error:", e);
  }
}

// Stop game over space theme
function stopGameOverTheme() {
  gameOverSoundPlaying = false;
  
  try {
    // Fade out the oscillators
    gameOverOsc1.amp(0, 0.5);
    gameOverOsc2.amp(0, 0.5);
    
    // Stop after fade out
    setTimeout(() => {
      gameOverOsc1.stop();
      gameOverOsc2.stop();
    }, 500);
  } catch (e) {
    console.error("Error stopping game over theme:", e);
  }
}

// Player class: Represents the player's spaceship
class Player {
  constructor() {
    this.x = canvasSize / 2;
    this.y = canvasSize - 50;
    this.width = 20;
    this.height = 20;
    this.speed = 5;
    this.movingLeft = false;
    this.movingRight = false;
    this.lastShot = 0;
    this.shootCooldown = 500; // 0.5 seconds cooldown
  }

  move() {
    if (this.movingLeft && this.x > this.width / 2) {
      this.x -= this.speed;
    }
    if (this.movingRight && this.x < canvasSize - this.width / 2) {
      this.x += this.speed;
    }
  }

  shoot() {
    let currentTime = millis();
    if (currentTime - this.lastShot > this.shootCooldown) {
      let bullet = new Bullet(this.x, this.y - this.height, -10, 'player');
      gameManager.bullets.push(bullet);
      playerShootSound();
      this.lastShot = currentTime;
    }
  }

  draw() {
    if (shipSprite) {
      imageMode(CENTER);
      image(shipSprite, this.x, this.y, this.width * 2, this.height * 2);
    } else {
      // Fallback to a simple shape
      fill(255);
      rectMode(CENTER);
      rect(this.x, this.y, this.width, this.height);
    }
  }
}

// Enemy class: Represents alien ships
class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.speed = 0.5;
    this.type = type;
  }

  move() {
    this.y += this.speed;
  }

  draw() {
    if (alienSprite) {
      imageMode(CENTER);
      image(alienSprite, this.x, this.y, this.size * 2, this.size * 2);
    } else {
      // Fallback
      fill(255, 0, 0);
      ellipse(this.x, this.y, this.size, this.size);
    }
  }
}

// Bullet class: Represents player projectiles
class Bullet {
  constructor(x, y, speed, type) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.type = type;
  }

  move() {
    this.y += this.speed;
  }

  draw() {
    fill(255);
    ellipse(this.x, this.y, 5, 5);
  }
}

// Explosion class: Animated explosion effect
class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 0;
    this.maxSize = 50;
    this.fade = 255;
    this.color = [255, 255, 255]; // Default white, can be changed for special effects
  }

  update() {
    this.size += 2;
    this.fade -= 5;
    if (this.size > this.maxSize) this.size = this.maxSize;
    if (this.fade < 0) this.fade = 0;
  }

  draw() {
    noStroke();
    fill(this.color[0], this.color[1], this.color[2], this.fade);
    ellipse(this.x, this.y, this.size, this.size);
  }

  isDone() {
    return this.fade <= 0;
  }
}

// PowerUp class: Represents collectible power-ups
class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.speed = 2;
    this.type = 'shield'; // Just one type for now
  }

  move() {
    this.y += this.speed;
  }

  draw() {
    // Simple yellow circle for all power-ups
    fill(255, 255, 0); // Yellow
    noStroke();
    ellipse(this.x, this.y, this.size, this.size);
  }
}

// Boss class: Represents a boss enemy
class Boss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 50; // Bosses are bigger than regular enemies
    this.speed = 0.3; // Bosses move slower than regular enemies
    this.health = 5; // Reduced from 10 to 5 hits to destroy
    this.moveDirection = 1; // 1 for right, -1 for left
    this.moveTimer = 0;
    this.shootTimer = 0;
    this.descentSpeed = 20; // How much the boss descends when changing direction (increased from 10)
    this.directionChangeTime = 80; // Frames between direction changes (decreased from 100)
  }

  move() {
    // Boss moves horizontally back and forth, and slowly descends
    this.moveTimer++;
    
    // Change direction more frequently
    if (this.moveTimer > this.directionChangeTime) {
      this.moveDirection *= -1;
      this.moveTimer = 0;
      // Move down more when changing direction
      this.y += this.descentSpeed;
    }
    
    // Move horizontally
    this.x += this.speed * this.moveDirection;
    
    // Keep within bounds
    if (this.x < this.size/2) {
      this.x = this.size/2;
      this.moveDirection = 1;
    } else if (this.x > canvasSize - this.size/2) {
      this.x = canvasSize - this.size/2;
      this.moveDirection = -1;
    }
  }

  draw() {
    if (bossSprite) {
      imageMode(CENTER);
      image(bossSprite, this.x, this.y, this.size * 2, this.size * 2);
      
      // Draw health bar
      this.drawHealthBar();
    } else {
      // Fallback
      fill(255, 0, 0);
      ellipse(this.x, this.y, this.size, this.size);
      this.drawHealthBar();
    }
  }
  
  drawHealthBar() {
    // Draw boss health bar
    const barWidth = this.size * 2;
    const barHeight = 5;
    const xPos = this.x - barWidth/2;
    const yPos = this.y - this.size - 10;
    
    // Background (red)
    fill(255, 0, 0);
    rect(xPos, yPos, barWidth, barHeight);
    
    // Health (green)
    fill(0, 255, 0);
    const healthWidth = (this.health / 5) * barWidth; // Changed from 10 to 5
    rect(xPos, yPos, healthWidth, barHeight);
  }
  
  hit() {
    this.health--;
    // Return true if boss is destroyed
    return this.health <= 0;
  }
}

// Special Alien class: Represents a fast-moving special alien worth bonus points
class SpecialAlien {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 15; // Slightly smaller than regular enemies
    this.speed = 2.4; // 20% faster than before (was 2)
    this.horizontalSpeed = 3.6; // 20% faster horizontal movement (was 3)
    this.glowIntensity = 255; // Full glow to start
    this.glowDirection = -5; // Decrease glow by this amount each frame
  }

  move() {
    // Fast descending movement with horizontal zigzag
    this.y += this.speed;
    this.x += Math.sin(this.y / 20) * this.horizontalSpeed;
    
    // Update glow effect for pulsating appearance
    this.glowIntensity += this.glowDirection;
    if (this.glowIntensity <= 100 || this.glowIntensity >= 255) {
      this.glowDirection *= -1; // Reverse direction
    }
  }

  draw() {
    // Draw outer glow
    push();
    noStroke();
    fill(255, 255, 0, this.glowIntensity * 0.5); // Yellow glow with pulsating alpha
    ellipse(this.x, this.y, this.size * 3, this.size * 3);
    
    // Draw inner glow
    fill(255, 255, 0, this.glowIntensity * 0.7); // Brighter inner glow
    ellipse(this.x, this.y, this.size * 2, this.size * 2);
    pop();
    
    // Draw the sprite
    if (specialAlienSprite) {
      imageMode(CENTER);
      // Apply a yellow tint to the sprite
      tint(255, 255, this.glowIntensity); 
      image(specialAlienSprite, this.x, this.y, this.size * 2, this.size * 2);
      noTint(); // Reset tint
    } else {
      // Fallback
      fill(255, 255, 0); // Yellow special alien
      ellipse(this.x, this.y, this.size, this.size);
    }
  }
}

// Modify GameManager to include special aliens and track kills
class GameManager {
  constructor() {
    this.level = 1;
    this.score = 0;
    this.lives = 3;
    this.player = new Player();
    this.enemies = [];
    this.bullets = [];
    this.explosions = [];
    this.powerUps = [];
    this.boss = null; // Reference to the current boss
    this.specialAlien = null; // Reference to the special alien
    this.isBossLevel = false;
    this.aliensKilled = 0; // Track how many aliens have been killed
    this.specialAlienThreshold = 20; // Show special alien after this many aliens killed
    this.gameIsOver = false; // Track if the game is over
    this.startLevel();
  }

  startLevel() {
    this.enemies = [];
    
    // Every 3rd level is a boss level
    if (this.level % 3 === 0) {
      this.isBossLevel = true;
      this.spawnBoss();
    } else {
      this.isBossLevel = false;
      let numEnemies = 2 + Math.floor(this.level / 2);
      for (let i = 0; i < numEnemies; i++) {
        let x = random(50, canvasSize - 50);
        let y = random(-100, 0);
        this.enemies.push(new Enemy(x, y, 'alien'));
      }
    }
  }
  
  spawnBoss() {
    // Create a boss at the top center of the screen
    this.boss = new Boss(canvasSize / 2, 50);
    
    // Flash warning text
    this.showBossWarning();
  }
  
  showBossWarning() {
    // The warning is shown in the update/draw methods using a timer
    this.bossWarningTime = 120; // Show warning for 120 frames (2 seconds at 60 FPS)
  }

  update() {
    this.player.move();

    // Update boss warning time if active
    if (this.bossWarningTime > 0) {
      this.bossWarningTime--;
    }

    // Update enemies or boss depending on level type
    if (this.isBossLevel) {
      if (this.boss) {
        this.boss.move();
        
        // Check if boss has reached the bottom of the screen
        if (this.boss.y > canvasSize) {
          this.lives--;
          this.boss = null;
          // End boss level
          this.level++;
          this.startLevel();
        }
      } else {
        // Boss was defeated, move to next level
        this.level++;
        this.startLevel();
      }
    } else {
      // Update regular enemies
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        let enemy = this.enemies[i];
        enemy.move();
        if (enemy.y > canvasSize) {
          this.lives--;
          this.enemies.splice(i, 1);
        }
      }
    }

    // Update special alien if it exists
    if (this.specialAlien) {
      this.specialAlien.move();
      
      // Remove if it goes off-screen
      if (this.specialAlien.y > canvasSize || 
          this.specialAlien.x < -20 || 
          this.specialAlien.x > canvasSize + 20) {
        this.specialAlien = null;
      }
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      let bullet = this.bullets[i];
      bullet.move();
      if (bullet.y < 0 || bullet.y > canvasSize) {
        this.bullets.splice(i, 1);
      }
    }

    // Update explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      let explosion = this.explosions[i];
      explosion.update();
      if (explosion.isDone()) {
        this.explosions.splice(i, 1);
      }
    }

    // Check collisions
    this.checkCollisions();

    // Level complete
    if (!this.isBossLevel && this.enemies.length === 0) {
      this.level++;
      this.startLevel();
    }

    // Game over
    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  draw() {
    // Don't draw anything if game is over (except game over screen)
    if (this.gameIsOver) {
      this.drawGameOverScreen();
      return;
    }
    
    this.player.draw();
    
    // Draw regular enemies or boss
    if (this.isBossLevel) {
      if (this.boss) {
        this.boss.draw();
      }
    } else {
      for (let enemy of this.enemies) enemy.draw();
    }
    
    // Draw special alien if it exists
    if (this.specialAlien) {
      this.specialAlien.draw();
    }
    
    // Draw bullets and explosions
    for (let bullet of this.bullets) bullet.draw();
    for (let explosion of this.explosions) explosion.draw();
    
    // Draw UI
    this.drawUI();
    
    // Draw boss warning if active
    if (this.bossWarningTime > 0 && this.bossWarningTime % 20 < 10) {
      fill(255, 0, 0);
      textSize(30);
      textAlign(CENTER);
      text("BOSS APPROACHING!", canvasSize / 2, canvasSize / 2);
    }
  }

  drawUI() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Adjust text size for mobile
    const textSz = isMobile ? 16 : 20;
    fill(255);
    textSize(textSz);
    textAlign(LEFT);
    
    text(`Score: ${this.score}`, 10, 20);
    text(`Lives: ${this.lives}`, 10, 20 + textSz);
    text(`Level: ${this.level}`, 10, 20 + textSz * 2);
    
    // Show boss health in UI if in boss level
    if (this.isBossLevel && this.boss) {
      text(`Boss: ${this.boss.health}/5`, 10, 20 + textSz * 3);
    }
  }

  checkCollisions() {
    // Player bullets hitting enemies, boss, or special alien
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      let bullet = this.bullets[i];
      if (bullet.type === 'player') {
        // Check collision with special alien
        if (this.specialAlien) {
          let d = dist(bullet.x, bullet.y, this.specialAlien.x, this.specialAlien.y);
          if (d < this.specialAlien.size) {
            // Remove bullet
            this.bullets.splice(i, 1);
            
            // Special alien hit - award bonus points
            this.score += 50;
            
            // Create a bigger, more colorful explosion
            for (let j = 0; j < 3; j++) {
              let explosion = new Explosion(this.specialAlien.x, this.specialAlien.y);
              explosion.color = [255, 255, 0]; // Yellow explosion
              this.explosions.push(explosion);
            }
            explosionSound();
            
            // Remove the special alien
            this.specialAlien = null;
            break;
          }
        }
        
        // Check collision with boss
        if (this.isBossLevel && this.boss) {
          let d = dist(bullet.x, bullet.y, this.boss.x, this.boss.y);
          let hitSize = this.boss.size;
          if (d < hitSize) {
            // Remove bullet
            this.bullets.splice(i, 1);
            
            // Damage boss
            if (this.boss.hit()) {
              // Boss defeated
              this.score += 50; // Boss is worth more points
              this.explosions.push(new Explosion(this.boss.x, this.boss.y));
              explosionSound();
              
              // Create multiple explosions for boss death
              for (let j = 0; j < 5; j++) {
                let offsetX = random(-this.boss.size/2, this.boss.size/2);
                let offsetY = random(-this.boss.size/2, this.boss.size/2);
                this.explosions.push(new Explosion(this.boss.x + offsetX, this.boss.y + offsetY));
                setTimeout(explosionSound, j * 100); // Staggered explosion sounds
              }
              
              this.boss = null;
            } else {
              // Boss hit but not defeated
              // Small explosion effect
              let smallExplosion = new Explosion(bullet.x, bullet.y);
              smallExplosion.maxSize = 20; // Smaller explosion
              this.explosions.push(smallExplosion);
            }
            break;
          }
        }
        
        // Check collision with regular enemies
        else {
          for (let j = this.enemies.length - 1; j >= 0; j--) {
            let enemy = this.enemies[j];
            let d = dist(bullet.x, bullet.y, enemy.x, enemy.y);
            let hitSize = enemy.size;
            if (d < hitSize) {
              this.score += 10;
              this.enemies.splice(j, 1);
              this.bullets.splice(i, 1);
              this.explosions.push(new Explosion(enemy.x, enemy.y));
              explosionSound();
              
              // Increment alien kill counter
              this.aliensKilled++;
              
              // Check if we should spawn a special alien
              if (this.aliensKilled >= this.specialAlienThreshold && !this.specialAlien && !this.isBossLevel) {
                // Reset counter but keep some progress
                this.aliensKilled = 0;
                
                // Random chance to spawn special alien (75% chance)
                if (random() < 0.75) {
                  this.spawnSpecialAlien();
                }
              }
              
              break;
            }
          }
        }
      }
    }
  }
  
  spawnSpecialAlien() {
    // Create special alien at the top of the screen
    let x = random(20, canvasSize - 20);
    this.specialAlien = new SpecialAlien(x, -20);
  }

  gameOver() {
    this.gameIsOver = true; // Set game over flag
    noLoop();
    
    // Make gameManager accessible globally for the leaderboard
    window.gameManager = this;
    
    // Play game over theme
    playGameOverTheme();
    
    // Show leaderboard modal after a short delay
    setTimeout(() => {
      showLeaderboardModal(this.score, this.level);
    }, 1000);
    
    // No need to draw game over screen here as it will be drawn by the draw method
  }

  // Modify the drawGameOverScreen method to add a leaderboard button
  drawGameOverScreen() {
    // Game over text
    textSize(40);
    fill(255, 0, 0);
    textAlign(CENTER);
    text("GAME OVER", canvasSize / 2, canvasSize / 2 - 20);
    
    // Display final score
    textSize(30);
    fill(255, 215, 0); // Gold color for the score
    text(`Final Score: ${this.score}`, canvasSize / 2, canvasSize / 2 + 20);
    
    // Add restart instructions
    textSize(24);
    fill(255);
    text("Press 'R' to restart", canvasSize / 2, canvasSize / 2 + 60);
    
    // Add leaderboard submission instruction
    textSize(20);
    fill(0, 255, 255); // Cyan color
    text("Submit your score to the leaderboard!", canvasSize / 2, canvasSize / 2 + 100);
  }
}

// Modify the restart function to close the leaderboard modal
function restartGame() {
  try {
    // Stop the game over theme
    stopGameOverTheme();
    
    // Close leaderboard modal if it's open
    document.getElementById('leaderboardModal').style.display = 'none';
    
    // Create a new game manager
    gameManager = new GameManager();
    window.gameManager = gameManager;
    gameStarted = true;
    // Restart the game loop if it was stopped
    loop();
    console.log("Game restarted");
  } catch (e) {
    console.error("Error restarting game:", e);
  }
}