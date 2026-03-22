// =============================================================
// GameScene.js
// =============================================================

class GameScene extends Phaser.Scene {

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('tile_bg', 'assets/sprites/kenney_top-down-shooter/PNG/Tiles/tile_01.png');
        this.load.image('player',  'assets/sprites/kenney_top-down-shooter/PNG/Survivor 1/survivor1_gun.png');
        this.load.audio('gunshot', 'assets/audio/gunshot.mp3');
        this.load.audio('button',  'assets/audio/button.mp3');
    }

    create() {

        const W = this.scale.width;
        const H = this.scale.height;

        const WORLD_W = 2560;
        const WORLD_H = 1440;
        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

        // ---- FLOOR ----
        this.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'tile_bg')
            .setOrigin(0, 0)
            .setAlpha(0.4);

        // ---- BULLET TEXTURE ----
        // Draw once, reuse for all bullets
        const bulletGfx = this.add.graphics();
        bulletGfx.fillStyle(0xffff00, 1);
        bulletGfx.fillCircle(4, 4, 4);
        bulletGfx.generateTexture('bullet', 8, 8);
        bulletGfx.destroy();

        // ---- BULLET POOL ----
        // 20 bullets created up front, reused on each shot
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
        this.FIRE_DELAY    = 250;
        this.lastFiredTime = 0;

        // ---- SOUND ----
        this.gunshotSound = this.sound.add('gunshot', { volume: 0.6 });

        // ---- MOUSE CLICK TO FIRE ----
        this.input.on('pointerdown', (pointer) => {
            if (pointer.button === 0) this.fireWeapon();
        });

        // ---- MUZZLE FLASH ----
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

    }


    // ---------------------------------------------------------
    // FIRE WEAPON
    //
    // HOW THE BARREL OFFSET WORKS:
    //
    // The survivor1_gun.png sprite is 51x43 pixels.
    // The gun barrel tip is near the top-right of the image.
    // Phaser's origin is the sprite CENTER (25.5, 21.5).
    //
    // The barrel tip in local sprite space (before any rotation):
    //   x offset from center: +12.5px  (to the right)
    //   y offset from center: -17.5px  (upward)
    //   scaled by 2.5:        +31px, -44px
    //
    // Because the player rotates, these local offsets must be
    // rotated too. That's what the cos/sin math below does —
    // it converts the local offset into world-space coordinates
    // that follow the sprite as it rotates.
    //
    // The bullet then travels in the same direction the gun faces,
    // which is player.rotation - π/2 (undoing the +π/2 visual
    // correction applied to the sprite in update()).
    // ---------------------------------------------------------
    fireWeapon() {

        // Fire rate check
        const now = this.time.now;
        if (now - this.lastFiredTime < this.FIRE_DELAY) return;
        this.lastFiredTime = now;

        // Get an inactive bullet from the pool
        const bullet = this.bullets.getFirstDead(false);
        if (!bullet) return;

        // Convert local barrel offset to world coordinates by
        // rotating it by the player's current rotation angle
        const localOffsetX =  31;   // px right of sprite center, scaled
        const localOffsetY = -44;   // px above sprite center, scaled
        const cos = Math.cos(this.player.rotation);
        const sin = Math.sin(this.player.rotation);
        const barrelX = this.player.x + (localOffsetX * cos - localOffsetY * sin);
        const barrelY = this.player.y + (localOffsetX * sin + localOffsetY * cos);

        // Spawn bullet at the barrel tip
        bullet.setPosition(barrelX, barrelY);
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setDepth(3);

        // Fire direction: undo the +π/2 visual correction on the sprite
        // to get the true world-space aim angle
        const fireAngle = this.player.rotation - Math.PI / 2;
        bullet.setVelocity(
            Math.cos(fireAngle) * this.BULLET_SPEED,
            Math.sin(fireAngle) * this.BULLET_SPEED
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

        // Muzzle flash at barrel tip
        this.muzzleFlash.setPosition(barrelX, barrelY).setVisible(true);
        this.time.delayedCall(50, () => {
            this.muzzleFlash.setVisible(false);
        });

    }


    // ---------------------------------------------------------
    // UPDATE
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

        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707;
            moveY *= 0.707;
        }

        this.player.setVelocity(
            moveX * this.PLAYER_SPEED,
            moveY * this.PLAYER_SPEED
        );

        // ---- MOUSE AIM ----
        // Rotate player to face cursor.
        // +π/2 corrects for sprite facing up by default.
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

    }

}
