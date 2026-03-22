// =============================================================
// TitleScene.js
// The first screen the player sees when the game loads.
//
// What this file does:
//   1. Loads all the assets we need (images, music)
//   2. Draws the title screen using those real assets
//   3. Plays the dark ambient background music
//   4. Shows a PLAY button that starts the game
//   5. Shows a HOW TO PLAY button that opens a rules panel
//
// Phaser scenes have three main functions:
//   preload() → load files from disk before anything is shown
//   create()  → build the scene once loading is done
//   update()  → runs 60 times per second (we don't need it here)
// =============================================================

class TitleScene extends Phaser.Scene {

    constructor() {
        // This name is how other scenes refer to this scene
        super({ key: 'TitleScene' });
    }

    // ---------------------------------------------------------
    // PRELOAD
    // Phaser calls this automatically before create().
    // Everything we load here will be ready to use in create().
    // ---------------------------------------------------------
    preload() {

        // --- Background tile ---
        // We'll stamp this tile across the whole background like a floor
        this.load.image(
            'tile_bg',   // the key we'll use to reference this image later
            'assets/sprites/kenney_top-down-shooter/PNG/Tiles/tile_01.png'
        );

        // --- Player character (survivor standing still) ---
        this.load.image(
            'survivor_stand',
            'assets/sprites/kenney_top-down-shooter/PNG/Survivor 1/survivor1_stand.png'
        );

        // --- Zombie character (standing still) ---
        // Note: Kenney's file has a typo — "zoimbie" not "zombie"
        this.load.image(
            'zombie_stand',
            'assets/sprites/kenney_top-down-shooter/PNG/Zombie 1/zoimbie1_stand.png'
        );

        // --- Background music ---
        // This is the dark ambient loop that plays on the title screen
        this.load.audio(
            'title_music',
            'assets/audio/Iwan Gabovitch - Dark Ambience Loop.mp3'
        );
    }

    // ---------------------------------------------------------
    // CREATE
    // Phaser calls this once all assets from preload() are ready.
    // This is where we build everything visible on screen.
    // ---------------------------------------------------------
    create() {

        // Grab the canvas size so we can position things in the center
        const W = this.scale.width;   // total width  (e.g. 800)
        const H = this.scale.height;  // total height (e.g. 600)

        // =====================================================
        // STEP 1: TILED BACKGROUND
        // We tile the floor tile across the whole canvas.
        // createStaticLayer isn't available without a tilemap,
        // so we use a TileSprite — it repeats an image like wallpaper.
        // =====================================================
        this.add.tileSprite(
            0, 0,        // position: top-left corner
            W, H,        // size: fill the whole canvas
            'tile_bg'    // the image key we loaded above
        ).setOrigin(0, 0)   // anchor point = top-left
         .setAlpha(0.35);   // dim it so it reads as a dark background


        // =====================================================
        // STEP 2: DARK OVERLAY
        // A semi-transparent black rectangle on top of the tiles
        // to give the screen a moody, dark atmosphere.
        // =====================================================
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6);


        // =====================================================
        // STEP 3: SURVIVOR SPRITE (left side)
        // The player character stands on the left, slightly
        // offset from center so it doesn't overlap the title.
        // =====================================================
        const survivor = this.add.image(
            W * 0.18,    // 18% from the left edge
            H * 0.58,    // a little below center
            'survivor_stand'
        );
        // Scale it up — the source image is quite small (about 48px)
        survivor.setScale(3.5);
        // Slightly rotate for a "ready to fight" feel
        survivor.setAngle(-8);


        // =====================================================
        // STEP 4: ZOMBIE SPRITE (right side, mirrored)
        // The zombie faces the survivor by flipping horizontally.
        // =====================================================
        const zombie = this.add.image(
            W * 0.82,    // 82% from the left (right side of screen)
            H * 0.58,
            'zombie_stand'
        );
        zombie.setScale(3.5);
        zombie.setFlipX(true);   // mirror so it faces left (toward survivor)
        zombie.setAngle(8);
        // Tint it a sickly green colour
        zombie.setTint(0x88ff88);


        // =====================================================
        // STEP 5: TITLE TEXT
        // Big bold title in the upper-center of the screen.
        // We use Phaser's built-in text — no font file needed.
        // =====================================================

        // Shadow/glow layer behind the main title (slightly offset, red)
        this.add.text(W / 2 + 4, H * 0.22 + 4, 'ZOMBIE', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '96px',
            color: '#660000',   // dark red shadow
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Main title word 1: ZOMBIE
        this.add.text(W / 2, H * 0.22, 'ZOMBIE', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '96px',
            color: '#ff2222',   // bright red
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Shadow for ZONE
        this.add.text(W / 2 + 4, H * 0.37 + 4, 'ZONE', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '96px',
            color: '#004400',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Main title word 2: ZONE
        this.add.text(W / 2, H * 0.37, 'ZONE', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '96px',
            color: '#44ff44',   // bright green
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Tagline below the title
        this.add.text(W / 2, H * 0.49, 'SURVIVE THE HORDE', {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#aaaaaa',
            letterSpacing: 6
        }).setOrigin(0.5);


        // =====================================================
        // STEP 6: PLAY BUTTON
        // A Phaser Graphics rectangle + text label.
        // We make it interactive so clicking/tapping starts the game.
        // =====================================================

        // The container zone that catches clicks
        // setInteractive needs a rectangle shape aligned to where we draw
        const playBtnX = W / 2;
        const playBtnY = H * 0.68;
        const playBtnW = 220;
        const playBtnH = 60;

        // Draw the button background using Graphics
        const playGfx = this.add.graphics();
        playGfx.fillStyle(0xcc0000, 1);       // red fill
        playGfx.fillRoundedRect(
            playBtnX - playBtnW / 2,
            playBtnY - playBtnH / 2,
            playBtnW,
            playBtnH,
            12   // corner radius
        );
        playGfx.lineStyle(3, 0xff6666, 1);    // lighter red border
        playGfx.strokeRoundedRect(
            playBtnX - playBtnW / 2,
            playBtnY - playBtnH / 2,
            playBtnW,
            playBtnH,
            12
        );

        // The text label on top of the button
        const playLabel = this.add.text(playBtnX, playBtnY, '▶  PLAY', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Invisible rectangle that actually catches the pointer events
        // (Graphics objects aren't interactive directly)
        const playHitArea = this.add.zone(playBtnX, playBtnY, playBtnW, playBtnH)
            .setInteractive({ useHandCursor: true });

        // When the player clicks/taps PLAY...
        playHitArea.on('pointerdown', () => {
            // Stop the music before leaving this scene
            if (this.music) this.music.stop();
            // Start the main game scene
            this.scene.start('GameScene');
        });

        // Hover effect: brighten the button on mouse-over
        playHitArea.on('pointerover', () => {
            playGfx.clear();
            playGfx.fillStyle(0xff2222, 1);   // brighter red on hover
            playGfx.fillRoundedRect(
                playBtnX - playBtnW / 2,
                playBtnY - playBtnH / 2,
                playBtnW, playBtnH, 12
            );
            playGfx.lineStyle(3, 0xff9999, 1);
            playGfx.strokeRoundedRect(
                playBtnX - playBtnW / 2,
                playBtnY - playBtnH / 2,
                playBtnW, playBtnH, 12
            );
        });

        playHitArea.on('pointerout', () => {
            playGfx.clear();
            playGfx.fillStyle(0xcc0000, 1);   // back to normal red
            playGfx.fillRoundedRect(
                playBtnX - playBtnW / 2,
                playBtnY - playBtnH / 2,
                playBtnW, playBtnH, 12
            );
            playGfx.lineStyle(3, 0xff6666, 1);
            playGfx.strokeRoundedRect(
                playBtnX - playBtnW / 2,
                playBtnY - playBtnH / 2,
                playBtnW, playBtnH, 12
            );
        });


        // =====================================================
        // STEP 7: HOW TO PLAY BUTTON
        // Smaller, sits below the play button.
        // =====================================================
        const howBtnX = W / 2;
        const howBtnY = H * 0.80;
        const howBtnW = 220;
        const howBtnH = 48;

        const howGfx = this.add.graphics();
        howGfx.fillStyle(0x224422, 1);        // dark green fill
        howGfx.fillRoundedRect(
            howBtnX - howBtnW / 2,
            howBtnY - howBtnH / 2,
            howBtnW, howBtnH, 12
        );
        howGfx.lineStyle(2, 0x44aa44, 1);
        howGfx.strokeRoundedRect(
            howBtnX - howBtnW / 2,
            howBtnY - howBtnH / 2,
            howBtnW, howBtnH, 12
        );

        this.add.text(howBtnX, howBtnY, '?  HOW TO PLAY', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '20px',
            color: '#88ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const howHitArea = this.add.zone(howBtnX, howBtnY, howBtnW, howBtnH)
            .setInteractive({ useHandCursor: true });

        // When clicked, open the how-to-play panel
        howHitArea.on('pointerdown', () => {
            this.showHowToPlay();
        });


        // =====================================================
        // STEP 8: HOW TO PLAY PANEL (hidden at start)
        // We build the panel now but hide it.
        // showHowToPlay() and hideHowToPlay() toggle its visibility.
        // =====================================================
        this.buildHowToPlayPanel(W, H);


        // =====================================================
        // STEP 9: BACKGROUND MUSIC
        // Plays immediately, loops forever.
        // We store it in this.music so we can stop it later.
        // =====================================================
        this.music = this.sound.add('title_music', {
            loop: true,    // keep looping until we stop it
            volume: 0.5    // 50% volume — not too loud
        });
        this.music.play();


        // =====================================================
        // STEP 10: BREATHING ANIMATION on characters
        // A gentle up-and-down tween makes the sprites feel alive.
        // A tween is an automated animation — we tell Phaser where
        // to move something and it handles the smooth motion.
        // =====================================================
        this.tweens.add({
            targets: survivor,      // what to animate
            y: survivor.y - 8,      // move 8 pixels up
            duration: 1800,         // over 1.8 seconds
            yoyo: true,             // then reverse back down
            repeat: -1,             // repeat forever (-1 = infinite)
            ease: 'Sine.easeInOut' // smooth wave motion
        });

        this.tweens.add({
            targets: zombie,
            y: zombie.y - 8,
            duration: 2200,         // slightly different speed — feels more natural
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

    } // end create()


    // ---------------------------------------------------------
    // BUILD HOW TO PLAY PANEL
    // Called once during create() to build the panel.
    //
    // IMPORTANT: We do NOT use a Phaser Container here.
    // Containers hide their visual children but Zones (invisible
    // hit areas) inside them still receive pointer events even
    // when the container is invisible. That's what caused the
    // panel to appear open on load.
    //
    // Instead, we store each element in this.panelItems[] and
    // toggle their visibility individually. The close Zone is
    // enabled/disabled separately with setActive().
    // ---------------------------------------------------------
    buildHowToPlayPanel(W, H) {

        // We'll store every visual element in this array so
        // showHowToPlay / hideHowToPlay can loop through them
        this.panelItems = [];

        // We store the close hit zone separately because
        // it also needs setActive(true/false) to block/allow clicks
        this.panelCloseZone = null;

        // --- Dark overlay (covers whole screen behind panel) ---
        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.80)
            .setDepth(10);   // depth makes sure panel draws on top of everything
        this.panelItems.push(overlay);

        // --- Panel box ---
        // Centered, slightly above middle so it fits on screen
        const panelCenterY = H * 0.54;
        const panel = this.add.rectangle(W / 2, panelCenterY, 580, 440, 0x111111, 0.97)
            .setDepth(11);
        panel.setStrokeStyle(2, 0x44ff44);
        this.panelItems.push(panel);

        // --- Panel title ---
        const title = this.add.text(W / 2, panelCenterY - 155, 'HOW TO PLAY', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '26px',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(12);
        this.panelItems.push(title);

        // --- Controls section ---
        const controls = this.add.text(
            W / 2,
            panelCenterY - 70,
            '— CONTROLS —\n\n' +
            'WASD / Arrow Keys    Move\n' +
            'Mouse Aim + Click    Shoot\n' +
            'Q                   Switch Weapon\n' +
            'ESC                 Pause',
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#cccccc',
                lineSpacing: 9,
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(12);
        this.panelItems.push(controls);

        // --- Weapons section ---
        const weapons = this.add.text(
            W / 2,
            panelCenterY + 70,
            '— WEAPONS —\n\n' +
            'Pistol  ·  Assault Rifle  ·  Knife\n' +
            'Crossbow  ·  Grenade  ·  Flashbang\n\n' +
            'Unlock weapons by collecting power-ups!',
            {
                fontFamily: 'Arial',
                fontSize: '15px',
                color: '#cccccc',
                lineSpacing: 8,
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(12);
        this.panelItems.push(weapons);

        // --- Close button ---
        const closeBtnX = W / 2;
        const closeBtnY = panelCenterY + 170;

        const closeGfx = this.add.graphics().setDepth(12);
        closeGfx.fillStyle(0x333333, 1);
        closeGfx.fillRoundedRect(closeBtnX - 80, closeBtnY - 22, 160, 44, 10);
        closeGfx.lineStyle(2, 0x888888, 1);
        closeGfx.strokeRoundedRect(closeBtnX - 80, closeBtnY - 22, 160, 44, 10);
        this.panelItems.push(closeGfx);

        const closeLabel = this.add.text(closeBtnX, closeBtnY, '✕  CLOSE', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(13);
        this.panelItems.push(closeLabel);

        // The zone is NOT added to panelItems — we handle it separately
        // because setVisible doesn't disable its interactivity
        this.panelCloseZone = this.add.zone(closeBtnX, closeBtnY, 160, 44)
            .setDepth(13)
            .setInteractive({ useHandCursor: true });

        this.panelCloseZone.on('pointerdown', () => {
            this.hideHowToPlay();
        });

        // --- Start hidden ---
        // Hide all visuals and deactivate the click zone
        this.panelItems.forEach(item => item.setVisible(false));
        this.panelCloseZone.setActive(false).setVisible(false);
    }


    // ---------------------------------------------------------
    // SHOW HOW TO PLAY
    // Makes every panel element visible and re-enables the
    // close button's hit zone so it can receive clicks.
    // ---------------------------------------------------------
    showHowToPlay() {
        this.panelItems.forEach(item => item.setVisible(true));
        this.panelCloseZone.setActive(true).setVisible(true);
    }

    // ---------------------------------------------------------
    // HIDE HOW TO PLAY
    // Hides every panel element and disables the close zone
    // so it can't accidentally catch clicks while invisible.
    // ---------------------------------------------------------
    hideHowToPlay() {
        this.panelItems.forEach(item => item.setVisible(false));
        this.panelCloseZone.setActive(false).setVisible(false);
    }


    // ---------------------------------------------------------
    // UPDATE
    // Runs 60 times per second. We don't need it on the title
    // screen — Phaser's tweens handle all animation automatically.
    // ---------------------------------------------------------
    update() {
        // Nothing here for now — tweens do all the work
    }

} // end class TitleScene
