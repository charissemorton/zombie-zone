// main.js
// This is the entry point for the game.
// It tells Phaser what size the game is, what physics to use, and which scenes exist.

const config = {
  type: Phaser.AUTO,        // Automatically use WebGL if available, otherwise Canvas
  width: 1280,              // Game width in pixels
  height: 720,              // Game height in pixels
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,               // Scale to fit whatever screen size is used
    autoCenter: Phaser.Scale.CENTER_BOTH  // Keep the game centered
  },
  physics: {
    default: 'arcade',      // Arcade physics — simple, fast, perfect for shooters
    arcade: {
      gravity: { y: 0 },   // No gravity pulling things down by default
      debug: false          // Change to true if you want to see collision boxes while testing
    }
  },
  // All scenes registered here — the first one in the list is what loads on startup
  scene: [
    TitleScene,
    GameScene,
    PauseScene,
    GameOverScene
  ]
};

// This one line starts the entire game
const game = new Phaser.Game(config);
