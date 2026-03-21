// PauseScene.js
// This scene sits on top of GameScene when the player presses ESC.
// The game is still running underneath — it's just paused.
// We will flesh this out with a real menu in Phase 2.

class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create() {
    // Semi-transparent dark overlay so the game is still visible behind it
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6);

    this.add.text(640, 280, 'PAUSED', {
      fontSize: '72px',
      color: '#ffff00',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(640, 400, 'Press ESC to resume', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(640, 460, 'Press Q to quit to title', {
      fontSize: '22px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // ESC resumes the game
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.resume('GameScene');
      this.scene.stop('PauseScene');
    });

    // Q quits to title screen
    this.input.keyboard.once('keydown-Q', () => {
      this.scene.stop('PauseScene');
      this.scene.stop('GameScene');
      this.scene.start('TitleScene');
    });
  }
}
