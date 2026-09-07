import Phaser from 'phaser';
import gardenMapUrl from '../../../content/levels/maps/garden-first-dawn.tmj?url';

export const GARDEN_MAP_KEY = 'garden-first-dawn-map';

export interface GardenMapObject {
  height: number;
  id: number;
  name: string;
  polygon?: readonly Phaser.Types.Math.Vector2Like[];
  polyline?: readonly Phaser.Types.Math.Vector2Like[];
  properties?: readonly { name: string; value: unknown }[];
  type: string;
  width: number;
  x: number;
  y: number;
}

export function preloadGardenMap(scene: Phaser.Scene): void {
  scene.load.tilemapTiledJSON(GARDEN_MAP_KEY, gardenMapUrl);
}

export function gardenMapObjects(
  scene: Phaser.Scene,
  layerName: string,
): readonly GardenMapObject[] {
  const map = scene.make.tilemap({ key: GARDEN_MAP_KEY });
  const layer = map.getObjectLayer(layerName);
  if (!layer) throw new Error(`Garden map is missing the "${layerName}" object layer`);
  return layer.objects as GardenMapObject[];
}
