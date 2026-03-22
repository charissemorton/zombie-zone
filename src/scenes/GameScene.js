// =============================================================
// GameScene.js
// The main gameplay screen.
//
// Phase 4 features:
//   - Tiled floor, player movement, mouse aim (from Phase 3)
//   - Left click OR spacebar fires a bullet
//   - Bullets travel toward the mouse cursor
//   - Object pool of 20 bullets (reused, not recreated each shot)
//   - Muzzle flash on shoot
//   - Gunshot sound on every shot
//   - Bullets removed when they leave the world
// =============================================================

class GameScene extends Phaser.Scene {

    constructor() {
        super({ key: 'GameScene' });
    }

    // ---------------------------------------------------------
    // PRELOAD
    // ---------------------------------------------------------
    preload() {
        this.load.image('tile_bg', 'assets/sprites/kenney_top-down-shooter/PNG/Tiles/tile_01.png');
        this.load.image('player',  'assets/sprites/kenney_top-down-shooter/PNG/Survivor 1/survivor1_gun.png');
        this.load.audio('gunshot', 'assets/audio/gunshot.mp3');
        this.load.audio('button',  'assets/audio/button.mp3');
    }

    // ---------------------------------------------------------
    // CREATE
    // ---------------------------------------------------------
    create() {

        const W = this.scale.width;    // 1280
        const H = this.scale.height;   // 720

        // World is 2x the canvas size — camera scrolls around it
        const WORLD_W = 2560;
        const WORLD_H = 1440;
        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);


        // ---- FLOOR ----
        this.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'tile_bg')
            .setOrigin(0, 0)
            .setAlpha(0.4);


        // ---- BULLET TEXTURE ----
        // Draw a small yellow circle once, bake it into a texture
        // called 'bullet' that all bullet sprites will share.
        const bulletGfx = this.add.graphics();
        bulletGfx.fillStyle(0xffff00, 1);
        bulletGfx.fillCircle(4, 4, 4);
        bulletGfx.generateTexture('bullet', 8, 8);
        bulletGfx.destroy();


        // ---- BULLET POOL ----
        // Create 20 bullet sprites up front, all inactive.
        // fireWeapon() grabs one when needed and returns it when done.
        this.bullets = this.physics.add.group();
        for (let i = 0; i < 20; i++) {
            const b = this.physics.add.image(0, 0, 'bullet');
            b.setActive(false);
            b.setVisible(false);
            this.bullets.add(b);
        }


        // ---- PLAYER ----
        this.player = this.physics.add.sprite(WORLD_W / 2, WORLD_H / 2, 'player');
        this.player.setScale(2.5);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(30, 30);


        // ---- CAMERA ----
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);


        // ---- KEYBOARD ----
        this.cursors  = this.input.keyboard.createCursorKeys();
        this.keyW     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyESC   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);


        // ---- CONSTANTS ----
        this.PLAYER_SPEED  = 220;
        this.BULLET_SPEED  = 600;
        this.FIRE_DELAY    = 250;   // ms between shots (pistol = 4 shots/sec)
        this.lastFiredTime = 0;


        // ---- SOUND ----
        this.gunshotSound = this.sound.add('gunshot', { volume: 0.6 });


        // ---- MOUSE CLICK TO FIRE ----
        this.input.on('pointerdown', (pointer) => {
            if (pointer.button === 0) this.fireWeapon();
        });


        // ---- MUZZLE FLASH ----
        // Small bright circle, shown for 50ms at the barrel on each shot
        this.muzzleFlash = this.add.circle(0, 0, 10, 0xffff88, 1)
            .setVisible(false)
            .setDepth(5);


        // ---- HUD PLACEHOLDER ----
        this.add.text(20, 20, 'WAVE 1', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '22px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0);

        this.add.text(20, H - 30, 'WASD: Move   Mouse / Space: Shoot', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#888888'
        }).setScrollFactor(0);

    } // end create()


    // ---------------------------------------------------------
    // FIRE WEAPON
    // Called on left click or spacebar.
    // ---------------------------------------------------------
    fireWeapon() {

        // Fire rate check
        const now = this.time.now;
        if (now - this.lastFiredTime < this.FIRE_DELAY) return;
        this.lastFiredTime = now;

        // Calculate aim angle FIRST — everything else depends on it.
        // We calculate directly from player position to mouse cursor
        // in world coordinates. This is the true firing direction.
        const pointer    = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle      = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x,  worldPoint.y
        );

        // Get an inactive bullet from the pool
        const bullet = this.bullets.getFirstDead(false);
        if (!bullet) return;   // all 20 bullets in flight — skip

        // Spawn bullet slightly in front of the player (at the barrel)
        const barrelDist = 25;
        bullet.setPosition(
            this.player.x + Math.cos(angle) * barrelDist,
            this.player.y + Math.sin(angle) * barrelDist
        );
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setDepth(3);

        // Launch bullet in the aim direction
        bullet.setVelocity(
            Math.cos(angle) * this.BULLET_SPEED,
            Math.sin(angle) * this.BULLET_SPEED
        );

        // Auto-return bullet to pool after 1.5 seconds
        this.time.delayedCall(1500, () => {
            if (bullet.active) {
                bullet.setActive(false);
                bullet.setVisible(false);
                bullet.setVelocity(0, 0);
            }
        });

        // Gunshot sound
        this.gunshotSound.play();

        // Muzzle flash — appears 30px in front of player, hides after 50ms
        this.muzzleFlash.setPosition(
            this.player.x + Math.cos(angle) * 30,
            this.player.y + Math.sin(angle) * 30
        ).setVisible(true);

        this.time.delayedCall(50, () => {
            this.muzzleFlash.setVisible(false);
        });

    } // end fireWeapon()


    // ---------------------------------------------------------
    // UPDATE — runs 60 times per second
    // ---------------------------------------------------------
    update() {

        // ---- MOVEMENT ----
        this.player.setVelocity(0, 0);

        let moveX = 0;
        let moveY = 0;

        if (this.keyA.isDown || this.cursors.left.isDown)       moveX = -1;
        else if (this.keyD.isDown || this.cursors.right.isDown) moveX =  1;

        if (this.keyW.isDown || this.cursors.up.isDown)         moveY = -1;
        else if (this.keyS.isDown || this.cursors.down.isDown)  moveY =  1;

        // Keep diagonal speed equal to straight movement
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707;
            moveY *= 0.707;
        }

        this.player.setVelocity(
            moveX * this.PLAYER_SPEED,
            moveY * this.PLAYER_SPEED
        );


        // ---- MOUSE AIM ----
        // Rotate player sprite to face the cursor at all times.
        // +π/2 corrects for the sprite defaulting to face upward.
        const pointer    = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const aimAngle   = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x,  worldPoint.y
        );
        this.player.setRotation(aimAngle + Math.PI / 2);


        // ---- SPACEBAR FIRE ----
        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            this.fireWeapon();
        }


        // ---- CLEAN UP OUT-OF-BOUNDS BULLETS ----
        this.bullets.getChildren().forEach(bullet => {
            if (!bullet.active) return;
            const b = this.physics.world.bounds;
            if (bullet.x < b.x || bullet.x > b.x + b.width ||
                bullet.y < b.y || bullet.y > b.y + b.height) {
                bullet.setActive(false);
                bullet.setVisible(false);
                bullet.setVelocity(0, 0);
            }
        });


        // ---- PAUSE ----
        if (Phaser.Input.Keyboard.JustDown(this.keyESC)) {
            this.scene.pause();
            this.scene.launch('PauseScene');
        }

    } // end update()

} // end class GameScene
