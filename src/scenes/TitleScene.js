// TitleScene.js
// This is the first thing the player sees when they open the game.
// Right now it just shows the title and waits for SPACE.
// We will replace this with real art and a "How to Play" panel in Phase 2.

class TitleScene extends Phaser.Scene {
  constructor() {
    // 'TitleScene' is the key used to start this scene from anywhere in the game
    super({ key: 'TitleScene' });
  }

  create() {
    // Title text — centered on screen
    this.add.text(640, 280, 'ZOMBIE ZONE', {
      fontSize: '72px',
      color: '#00ff00',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(640, 370, 'SURVIVE THE WAVES', {
      fontSize: '28px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Prompt — we will animate this blinking in Phase 2
    this.add.text(640, 460, 'Press SPACE to Start', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // When the player presses SPACE, move to the main game
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}
