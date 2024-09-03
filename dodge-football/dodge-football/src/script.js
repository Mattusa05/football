// Start Scene
class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        this.load.image('playButton', 'assets/play_button.png'); // Load a play button image
    }

    create() {
        // Game Title
        this.add.text(this.cameras.main.centerX, 100, 'SANA', {
            fontSize: '64px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Play Button
        const playButton = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'playButton')
            .setInteractive()
            .on('pointerdown', () => this.startGame());

        // Make the play button a bit larger on hover
        playButton.on('pointerover', () => playButton.setScale(1.1));
        playButton.on('pointerout', () => playButton.setScale(1));
    }

    startGame() {
        this.scene.start('GameScene'); // Switch to the main game scene
    }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalTime = data.finalTime;
        this.highScore = data.highScore;
    }

    create() {
        // Game Over Text
        this.add.text(this.cameras.main.centerX, 150, 'Game Over', {
            fontSize: '64px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Display Time and High Score
        this.add.text(this.cameras.main.centerX, 250, `Time Survived: ${this.finalTime} seconds`, {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(this.cameras.main.centerX, 300, `High Score: ${this.highScore} seconds`, {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Play Again Button
        const playAgainButton = this.add.text(this.cameras.main.centerX, 400, 'Play Again', {
            fontSize: '32px',
            fill: '#0f0'
        }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
            this.scene.start('GameScene');  // Restart the game scene
        });

        // Exit Button
        const exitButton = this.add.text(this.cameras.main.centerX, 450, 'Exit', {
            fontSize: '32px',
            fill: '#f00'
        }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
            this.scene.start('StartScene');  // Go back to the start scene
        });
    }
}

// Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('player', 'assets/player.png');  // Load player sprite
        this.load.image('skeleton', 'assets/skeleton.png');  // Load skeleton (blue dot) sprite
        this.load.image('powerUp', 'assets/sana.png');  // Load power-up sprite
    }

    create() {
        // Initialize Player
        this.player = this.physics.add.sprite(this.cameras.main.width / 2, this.cameras.main.height / 2, 'player');
        this.player.setCollideWorldBounds(true);

        // Timer and Score
        this.startTime = 0;
        this.score = 0;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.timerText = this.add.text(16, 16, 'Time: 0', { fontSize: '32px', fill: '#fff' });
        this.highScoreText = this.add.text(16, 50, 'High Score: ' + this.highScore, { fontSize: '32px', fill: '#fff' });

        // Initialize skeleton group
        this.skeletons = this.physics.add.group();

        // Set up controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Start Timer
        this.timerEvent = this.time.addEvent({ delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true });

        // Spawn Skeletons
        this.spawnSkeletons();

        // Power-ups
        this.time.addEvent({ delay: 5000, callback: this.spawnPowerUp, callbackScope: this, loop: true });

        // Collision detection for player and skeletons
        this.physics.add.overlap(this.player, this.skeletons, this.gameOver, null, this);
    }

    update() {
        this.handlePlayerMovement(this.cursors);

        // Update timer and score
        this.timerText.setText('Time: ' + Math.floor(this.score));

        // Update chasing skeletons to follow the player
        this.skeletons.children.iterate((skeleton) => {
            if (skeleton && skeleton.chase) {
                this.physics.moveToObject(skeleton, this.player, 100 + this.score * 2); // Increase speed over time
            }
        });
    }

    handlePlayerMovement(cursors) {
        if (!this.player) return;

        if (cursors.left.isDown) {
            this.player.setVelocityX(-200);
        } else if (cursors.right.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }
        if (cursors.up.isDown) {
            this.player.setVelocityY(-200);
        } else if (cursors.down.isDown) {
            this.player.setVelocityY(200);
        } else {
            this.player.setVelocityY(0);
        }
    }

    updateTimer() {
        this.score++;
    }

    spawnSkeletons() {
        // Static Skeletons
        for (let i = 0; i < 5; i++) {
            let skeleton = this.skeletons.create(Phaser.Math.Between(0, this.cameras.main.width), Phaser.Math.Between(100, this.cameras.main.height), 'skeleton');  // Ensure not spawning near timer
            skeleton.setVelocity(0, 100); // Move downward then stop
            skeleton.setCollideWorldBounds(true);
            skeleton.body.onWorldBounds = true;
            skeleton.body.world.on('worldbounds', () => {
                skeleton.setVelocity(0); // Stop when reaching the bounds
            });
            skeleton.chase = false;
        }

        // Randomly Moving Skeletons
        for (let i = 0; i < 5; i++) {
            let skeleton = this.skeletons.create(Phaser.Math.Between(0, this.cameras.main.width), Phaser.Math.Between(100, this.cameras.main.height), 'skeleton');  // Ensure not spawning near timer
            this.physics.add.existing(skeleton);
            skeleton.body.velocity.setTo(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
            skeleton.setBounce(1);
            skeleton.setCollideWorldBounds(true);
            skeleton.chase = false;
        }

        // Chasing Skeletons
        for (let i = 0; i < 5; i++) {
            let skeleton = this.skeletons.create(Phaser.Math.Between(0, this.cameras.main.width), Phaser.Math.Between(100, this.cameras.main.height), 'skeleton');  // Ensure not spawning near timer
            skeleton.chase = true;  // Mark to chase the player
        }
    }

    spawnPowerUp() {
        let powerUp = this.physics.add.sprite(Phaser.Math.Between(0, this.cameras.main.width), Phaser.Math.Between(0, this.cameras.main.height), 'powerUp');
        powerUp.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
        powerUp.setCollideWorldBounds(true);
        powerUp.setBounce(1);
        
        // Collision detection with the player
        this.physics.add.overlap(this.player, powerUp, () => {
            powerUp.destroy();
            this.score += 10;  // Increase score
        }, null, this);
    }

    gameOver() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
        this.scene.start('GameOverScene', { finalTime: Math.floor(this.score), highScore: this.highScore });
    }
}

// Game Configuration
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [StartScene, GameScene, GameOverScene]  // Correct order
};

// Initialize Game
const game = new Phaser.Game(config);

