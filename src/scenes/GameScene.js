// =============================================================
// GameScene.js
// The main gameplay screen — this is where the actual game happens.
//
// Phase 3 delivers:
//   - Tiled floor background
//   - Player sprite that appears in the center of the screen
//   - WASD keyboard movement
//   - Mouse aim — the player rotates to always face the cursor
//   - World bounds — the player can't walk off the edge
//
// Later phases will add: zombies, shooting, weapons, waves, UI
// =============================================================

class GameScene extends Phaser.Scene {

    constructor() {
        super({ key: 'GameScene' });
    }

    // ---------------------------------------------------------
    // PRELOAD
    // Load everything this scene needs before it starts.
    // ---------------------------------------------------------
    preload() {

        // --- Floor tile (same one used on the title screen) ---
        // We'll tile this across the whole game world as the floor
        this.load.image(
            'tile_bg',
            'assets/sprites/kenney_top-down-shooter/PNG/Tiles/tile_01.png'
        );

        // --- Player sprite ---
        // survivor1_gun.png is the top-down character holding a pistol
        this.load.image(
            'player',
            'assets/sprites/kenney_top-down-shooter/PNG/Survivor 1/survivor1_gun.png'
        );
    }

    // ---------------------------------------------------------
    // CREATE
    // Build the scene — runs once when GameScene starts.
    // ---------------------------------------------------------
    create() {

        // Store canvas size in easy variables
        const W = this.scale.width;   // 1280
        const H = this.scale.height;  // 720

        // =====================================================
        // STEP 1: WORLD SIZE
        // The "world" is bigger than the visible screen.
        // The camera will follow the player around this world.
        // Think of it like a large map — the camera is a window
        // that moves around showing only part of it at a time.
        // =====================================================
        const WORLD_W = 2560;   // world is 2x the canvas width
        const WORLD_H = 1440;   // world is 2x the canvas height

        // Tell Phaser how big the world is so it knows where the edges are
        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);


        // =====================================================
        // STEP 2: TILED FLOOR BACKGROUND
        // TileSprite repeats an image like wallpaper.
        // We make it the full world size so the floor covers everything.
        // =====================================================
        this.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'tile_bg')
            .setOrigin(0, 0)
            .setAlpha(0.4);   // dim it slightly so it reads as a floor


        // =====================================================
        // STEP 3: PLAYER
        // We create the player using Phaser's physics system.
        // this.physics.add.sprite() is like this.add.image() but
        // it also gives the sprite a physics body — which means
        // Phaser tracks its velocity, handles collisions, etc.
        // =====================================================

        // Spawn the player in the center of the world
        this.player = this.physics.add.sprite(
            WORLD_W / 2,   // center X of the world
            WORLD_H / 2,   // center Y of the world
            'player'       // the image key we loaded above
        );

        // Scale the player up — the source image is small (~48px)
        this.player.setScale(2.5);

        // Keep the player inside the world boundaries
        // If this is true, the player bounces off the edges of the world
        this.player.setCollideWorldBounds(true);

        // The player's physics body is a rectangle by default.
        // We make it slightly smaller than the sprite so collisions
        // feel fair — called "hitbox adjustment"
        this.player.body.setSize(30, 30);


        // =====================================================
        // STEP 4: CAMERA
        // The camera follows the player around the world.
        // startFollow() locks the camera to a target sprite.
        // setBounds() stops the camera from showing empty space
        // beyond the edges of the world.
        // =====================================================
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        //                                           ^^^^^^^^^^^
        //   The 0.1 values are "lerp" — short for linear interpolation.
        //   Instead of snapping to the player instantly, the camera
        //   smoothly catches up. Lower = smoother but more lag.

        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);


        // =====================================================
        // STEP 5: KEYBOARD INPUT
        // Phaser's createCursorKeys() gives us arrow keys.
        // addKey() lets us also listen for individual keys like W/A/S/D.
        // =====================================================

        // Arrow keys (up/down/left/right)
        this.cursors = this.input.keyboard.createCursorKeys();

        // WASD keys — each one is stored separately
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        // ESC key — for pausing the game
        this.keyESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);


        // =====================================================
        // STEP 6: PLAYER SPEED
        // How many pixels per second the player moves.
        // Stored as a property so we can change it later
        // (e.g. a speed boost power-up just changes this number).
        // =====================================================
        this.PLAYER_SPEED = 220;


        // =====================================================
        // STEP 7: SIMPLE HUD (placeholder)
        // A basic wave label in the top-left so the screen
        // doesn't look completely empty. Full HUD comes later.
        // setScrollFactor(0) pins it to the camera so it
        // doesn't move when the player walks around.
        // =====================================================
        this.add.text(20, 20, 'WAVE 1', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '22px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0);   // ← this makes it stick to the screen, not the world

        // Small controls reminder in bottom-left
        this.add.text(20, H - 30, 'WASD: Move   Mouse: Aim', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#888888'
        }).setScrollFactor(0);

    } // end create()


    // ---------------------------------------------------------
    // UPDATE
    // Runs 60 times per second while the scene is active.
    // This is where we check for input and move the player.
    // ---------------------------------------------------------
    update() {

        // =====================================================
        // MOVEMENT
        // We reset velocity every frame, then apply it based
        // on which keys are held down.
        //
        // Velocity = speed in a direction.
        // X velocity: negative = left, positive = right
        // Y velocity: negative = up,   positive = down
        // =====================================================

        // Reset both axes to zero (player stops if no key is held)
        this.player.setVelocity(0, 0);

        // Track whether we're moving diagonally
        // (so we can normalise speed — diagonal shouldn't be faster)
        let moveX = 0;
        let moveY = 0;

        // Check left movement (A key or left arrow)
        if (this.keyA.isDown || this.cursors.left.isDown) {
            moveX = -1;
        }
        // Check right movement (D key or right arrow)
        else if (this.keyD.isDown || this.cursors.right.isDown) {
            moveX = 1;
        }

        // Check up movement (W key or up arrow)
        if (this.keyW.isDown || this.cursors.up.isDown) {
            moveY = -1;
        }
        // Check down movement (S key or down arrow)
        else if (this.keyS.isDown || this.cursors.down.isDown) {
            moveY = 1;
        }

        // DIAGONAL SPEED FIX
        // If moving in both X and Y at the same time, the total speed
        // would be faster than moving in one direction (Pythagoras).
        // Normalising keeps speed consistent in all directions.
        if (moveX !== 0 && moveY !== 0) {
            // Divide by √2 (≈0.707) to keep diagonal speed equal to straight
            moveX *= 0.707;
            moveY *= 0.707;
        }

        // Apply the final velocity to the player's physics body
        this.player.setVelocity(
            moveX * this.PLAYER_SPEED,
            moveY * this.PLAYER_SPEED
        );


        // =====================================================
        // MOUSE AIM
        // The player sprite rotates to always point toward
        // the mouse cursor.
        //
        // Phaser's Math.Angle.Between() calculates the angle
        // (in radians) between two points.
        //
        // We use getWorldPoint() to convert the mouse's screen
        // position into world coordinates — important because
        // the camera is moving around a larger world.
        // =====================================================

        // Get the mouse position in WORLD coordinates
        // (not screen coordinates — they're different when camera moves)
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

        // Calculate the angle from the player to the mouse
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,   // from: player position
            worldPoint.x,  worldPoint.y     // to:   mouse position
        );

        // Apply the rotation to the player sprite
        // We add 90 degrees (π/2 radians) because the sprite
        // faces UP by default, but Phaser's angle 0 points RIGHT.
        // Adding 90° corrects this offset.
        this.player.setRotation(angle + Math.PI / 2);


        // =====================================================
        // PAUSE
        // If ESC is pressed, launch the PauseScene on top of
        // this scene (the game keeps running underneath,
        // but we'll fix that in the PauseScene).
        // Phaser.Input.Keyboard.JustDown() fires only once
        // per keypress — not every frame while held.
        // =====================================================
        if (Phaser.Input.Keyboard.JustDown(this.keyESC)) {
            this.scene.pause();              // freeze this scene
            this.scene.launch('PauseScene'); // open pause menu on top
        }

    } // end update()

} // end class GameScene
