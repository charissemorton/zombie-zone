// =============================================================
// GameScene.js
// The main gameplay screen.
//
// Phase 4 adds on top of Phase 3:
//   - Bullets fired by left mouse click OR spacebar
//   - Bullets travel in the direction the player is aiming
//   - Bullet pool (reuses bullets instead of creating new ones
//     every shot — better for performance)
//   - Muzzle flash effect on shoot
//   - Gunshot sound plays on every shot
//   - Bullets are destroyed when they leave the world
// =============================================================

class GameScene extends Phaser.Scene {

    constructor() {
        super({ key: 'GameScene' });
    }

    // ---------------------------------------------------------
    // PRELOAD
    // ---------------------------------------------------------
    preload() {

        // Floor tile
        this.load.image(
            'tile_bg',
            'assets/sprites/kenney_top-down-shooter/PNG/Tiles/tile_01.png'
        );

        // Player sprite
        this.load.image(
            'player',
            'assets/sprites/kenney_top-down-shooter/PNG/Survivor 1/survivor1_gun.png'
        );

        // Gunshot sound — plays every time the player fires
        this.load.audio('gunshot', 'assets/audio/gunshot.mp3');

        // Button sound — used for UI clicks
        this.load.audio('button', 'assets/audio/button.mp3');
    }

    // ---------------------------------------------------------
    // CREATE
    // ---------------------------------------------------------
    create() {

        const W = this.scale.width;   // 1280
        const H = this.scale.height;  // 720

        // =====================================================
        // WORLD SIZE
        // =====================================================
        const WORLD_W = 2560;
        const WORLD_H = 1440;

        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);


        // =====================================================
        // TILED FLOOR BACKGROUND
        // =====================================================
        this.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'tile_bg')
            .setOrigin(0, 0)
            .setAlpha(0.4);


        // =====================================================
        // BULLET TEXTURE
        // We draw a small yellow circle using Graphics, then
        // bake it into a reusable texture called 'bullet'.
        // This only needs to happen once.
        // =====================================================
        const bulletGfx = this.add.graphics();
        bulletGfx.fillStyle(0xffff00, 1);      // yellow
        bulletGfx.fillCircle(4, 4, 4);          // 4px radius at center of 8x8
        bulletGfx.generateTexture('bullet', 8, 8);
        bulletGfx.destroy();   // texture is saved, we don't need the graphics object anymore


        // =====================================================
        // BULLET GROUP (Object Pool)
        //
        // Object pooling = create all bullets up front, reuse them.
        // Much faster than creating/destroying a new object each shot.
        //
        // How it works:
        //   - 20 bullet sprites are created right now
        //   - All start inactive (invisible, not moving)
        //   - When player shoots: grab an inactive one, launch it
        //   - When bullet expires: deactivate it back into the pool
        // =====================================================
        this.bullets = this.physics.add.group();

        for (let i = 0; i < 20; i++) {
            const bullet = this.physics.add.image(0, 0, 'bullet');
            bullet.setActive(false);
            bullet.setVisible(false);
            this.bullets.add(bullet);
        }


        // =====================================================
        // PLAYER
        // =====================================================
        this.player = this.physics.add.sprite(
            WORLD_W / 2,
            WORLD_H / 2,
            'player'
        );
        this.player.setScale(2.5);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(30, 30);


        // =====================================================
        // CAMERA
        // =====================================================
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);


        // =====================================================
        // KEYBOARD INPUT
        // =====================================================
        this.cursors  = this.input.keyboard.createCursorKeys();
        this.keyW     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyESC   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);


        // =====================================================
        // PLAYER SPEED & FIRE RATE
        // =====================================================
        this.PLAYER_SPEED = 220;
        this.BULLET_SPEED = 600;   // pixels per second

        // Fire rate limiting — stops the player from firing
        // hundreds of bullets per second by holding the button.
        // lastFiredTime = when we last shot (in milliseconds)
        // FIRE_DELAY    = minimum gap between shots (ms)
        this.lastFiredTime = 0;
        this.FIRE_DELAY    = 250;   // 250ms = max 4 shots/second (pistol)


        // =====================================================
        // GUNSHOT SOUND
        // =====================================================
        this.gunshotSound = this.sound.add('gunshot', { volume: 0.6 });


        // =====================================================
        // MOUSE CLICK — fire on left click
        // pointer.button === 0 means left mouse button
        // =====================================================
        this.input.on('pointerdown', (pointer) => {
            if (pointer.button === 0) {
                this.fireWeapon();
            }
        });


        // =====================================================
        // MUZZLE FLASH
        // A bright circle that appears at the gun barrel for
        // a split second when firing.
        // Created once, shown briefly on each shot.
        // =====================================================
        this.muzzleFlash = this.add.circle(0, 0, 10, 0xffff88, 1);
        this.muzzleFlash.setVisible(false);
        this.muzzleFlash.setDepth(5);


        // =====================================================
        // PLACEHOLDER HUD
        // =====================================================
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
    // Called when the player clicks or presses spacebar.
    // ---------------------------------------------------------
    fireWeapon() {

        // Enforce fire rate — exit if we fired too recently
        const now = this.time.now;
        if (now - this.lastFiredTime < this.FIRE_DELAY) return;
        this.lastFiredTime = now;

        // Get an inactive bullet from the pool
        // getFirstDead() returns null if all bullets are in flight
        const bullet = this.bullets.getFirstDead(false);
        if (!bullet) return;

        // Offset spawn position to the gun barrel
        // instead of the player's center point
        const barrelDist = 25;   // pixels from center to barrel tip
        bullet.setPosition(
            this.player.x + Math.cos(angle) * barrelDist,
            this.player.y + Math.sin(angle) * barrelDist
        );
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setDepth(3);

        // Calculate the firing angle from the player's current rotation.
        // We subtract π/2 because the sprite was rotated +π/2 to face
        // the cursor, so we undo that to get the true aim direction.
        const angle = this.player.rotation;

        // Convert angle to X/Y velocity
        // cos(angle) = horizontal component
        // sin(angle) = vertical component
        bullet.setVelocity(
            Math.cos(angle) * this.BULLET_SPEED,
            Math.sin(angle) * this.BULLET_SPEED
        );

        // Auto-deactivate bullet after 1.5 seconds as a safety net
        this.time.delayedCall(1500, () => {
            if (bullet.active) {
                bullet.setActive(false);
                bullet.setVisible(false);
                bullet.setVelocity(0, 0);
            }
        });

        // Play gunshot sound
        this.gunshotSound.play();

        // Show muzzle flash slightly in front of the player
        const flashDist = 30;
        this.muzzleFlash.setPosition(
            this.player.x + Math.cos(angle) * flashDist,
            this.player.y + Math.sin(angle) * flashDist
        );
        this.muzzleFlash.setVisible(true);

        // Hide flash after 50ms
        this.time.delayedCall(50, () => {
            this.muzzleFlash.setVisible(false);
        });

    } // end fireWeapon()


    // ---------------------------------------------------------
    // UPDATE — runs 60 times per second
    // ---------------------------------------------------------
    update() {

        // =====================================================
        // PLAYER MOVEMENT
        // =====================================================
        this.player.setVelocity(0, 0);

        let moveX = 0;
        let moveY = 0;

        if (this.keyA.isDown || this.cursors.left.isDown)       moveX = -1;
        else if (this.keyD.isDown || this.cursors.right.isDown) moveX =  1;

        if (this.keyW.isDown || this.cursors.up.isDown)         moveY = -1;
        else if (this.keyS.isDown || this.cursors.down.isDown)  moveY =  1;

        // Diagonal speed normalisation
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707;
            moveY *= 0.707;
        }

        this.player.setVelocity(
            moveX * this.PLAYER_SPEED,
            moveY * this.PLAYER_SPEED
        );


        // =====================================================
        // MOUSE AIM
        // =====================================================
        const pointer    = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle      = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x,  worldPoint.y
        );
        this.player.setRotation(angle + Math.PI / 2);


        // =====================================================
        // SPACEBAR FIRE
        // JustDown = fires once per keypress, not every frame
        // =====================================================
        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            this.fireWeapon();
        }


        // =====================================================
        // CLEAN UP OUT-OF-BOUNDS BULLETS
        // Any bullet that has left the world gets returned
        // to the pool so it can be reused.
        // =====================================================
        this.bullets.getChildren().forEach(bullet => {
            if (!bullet.active) return;

            const b = this.physics.world.bounds;
            if (
                bullet.x < b.x ||
                bullet.x > b.x + b.width ||
                bullet.y < b.y ||
                bullet.y > b.y + b.height
            ) {
                bullet.setActive(false);
                bullet.setVisible(false);
                bullet.setVelocity(0, 0);
            }
        });


        // =====================================================
        // PAUSE
        // =====================================================
        if (Phaser.Input.Keyboard.JustDown(this.keyESC)) {
            this.scene.pause();
            this.scene.launch('PauseScene');
        }

    } // end update()

} // end class GameScene
