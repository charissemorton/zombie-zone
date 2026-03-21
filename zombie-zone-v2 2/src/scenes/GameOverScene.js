// GameOverScene.js
// Shows when the player dies.
// In Phase 2 we will pass in the player's wave number and kill count
// and display them here along with the high score from localStorage.

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data) {
    // data will be passed in from GameScene once we wire it up in Phase 3
    // For example: { wave: 5, kills: 23 }
    const wave  = data?.wave  || 0;
    const kills = data?.kills || 0;

    this.add.text(640, 240, 'GAME OVER', {
      fontSize: '80px',
      color: '#ff0000',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(640, 360, `Wave Reached: ${wave}`, {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(640, 410, `Total Kills: ${kills}`, {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(640, 510, 'Press SPACE to play again', {
      fontSize: '26px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // SPACE starts a fresh game
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });

    // T goes back to title
    this.add.text(640, 560, 'Press T for title screen', {
      fontSize: '22px',
      color: '#666666',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-T', () => {
      this.scene.start('TitleScene');
    });
  }
}
