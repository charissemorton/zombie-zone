// GameScene.js
// This is the main gameplay scene — where everything happens.
// Right now it is a placeholder. Player, zombies, weapons, and waves
// will all be built into this scene starting in Phase 3.

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Placeholder message — this will be replaced with the actual game in Phase 3
    this.add.text(640, 340, 'Game goes here — Phase 3 coming soon!', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(640, 400, 'Press ESC to pause', {
      fontSize: '20px',
      color: '#888888',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // ESC key to open the pause menu
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.pause('GameScene');
      this.scene.launch('PauseScene');
    });
  }
}
