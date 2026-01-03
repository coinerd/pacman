export class DebugOverlay {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.frameCount = 0;
    this.lastTime = 0;
    this.fps = 0;

    this.createUI();
  }

  createUI() {
    const padding = 10;
    const fontSize = '14px';

    this.fpsText = this.scene.add.text(
      padding,
      padding,
      'FPS: 0',
      {
        fontSize,
        fontFamily: 'Arial',
        color: '#00FF00',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: { x: 8, y: 4 }
      }
    );

    this.fpsText.setOrigin(0, 0);
    this.fpsText.setDepth(1000);
    this.fpsText.setVisible(false);

    this.debugText = this.scene.add.text(
      padding,
      padding + 25,
      '',
      {
        fontSize,
        fontFamily: 'Arial',
        color: '#00FF00',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: { x: 8, y: 4 }
      }
    );

    this.debugText.setOrigin(0, 0);
    this.debugText.setDepth(1000);
    this.debugText.setVisible(false);
  }

  setVisible(visible) {
    this.visible = visible;
    this.fpsText.setVisible(visible);
    this.debugText.setVisible(visible);
  }

  updateFPS(fps) {
    this.fps = fps;
    this.fpsText.setText(`FPS: ${fps.toFixed(0)}`);
  }

  updateDebugInfo(info) {
    const infoText = Object.entries(info)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    this.debugText.setText(infoText);
  }

  update(time, delta) {
    if (!this.visible) return;

    this.frameCount++;

    if (time - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.updateFPS(this.fps);
      this.frameCount = 0;
      this.lastTime = time;
    }
  }

  toggle() {
    this.setVisible(!this.visible);
  }

  cleanup() {
    this.setVisible(false);
  }
}
