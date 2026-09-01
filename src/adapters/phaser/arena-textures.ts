import Phaser from 'phaser';
import { createAtlasAnimations, prepareSpriteAtlas } from './sprite-atlas';

export function createArenaTextures(scene: Phaser.Scene): void {
  prepareSpriteAtlas(scene);
  createAtlasAnimations(scene);

  const checkpoint = scene.add.graphics();
  checkpoint.lineStyle(6, 0x6ae2dc, 0.9);
  checkpoint.strokeCircle(46, 46, 34);
  checkpoint.lineStyle(2, 0xfff3b0, 0.8);
  checkpoint.strokeCircle(46, 46, 22);
  checkpoint.fillStyle(0x6ae2dc, 0.3);
  checkpoint.fillCircle(46, 46, 15);
  checkpoint.generateTexture('checkpoint', 92, 92);
  checkpoint.destroy();
}
