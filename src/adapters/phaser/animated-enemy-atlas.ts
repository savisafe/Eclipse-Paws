import Phaser from 'phaser';

export interface AnimatedEnemyFrames {
  attack: number;
  idle: number;
  move: number;
  texture: string;
}

interface Component {
  area: number;
  cx: number;
  id: number;
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
}

interface Bbox {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
}

function isWhiteBackground(data: Uint8ClampedArray, offset: number): boolean {
  const red = data[offset] ?? 0;
  const green = data[offset + 1] ?? 0;
  const blue = data[offset + 2] ?? 0;
  const alpha = data[offset + 3] ?? 0;
  return (
    alpha < 8 ||
    (Math.min(red, green, blue) >= 242 &&
      Math.max(red, green, blue) - Math.min(red, green, blue) <= 14)
  );
}

/**
 * Groups a row's non-background pixels into `columns` clusters by connected-component
 * position instead of a fixed grid, so an attack effect (fireball, lightning) that spills
 * past its nominal column boundary stays attached to its own frame instead of bleeding
 * into the neighboring one.
 */
function buildRowClusterMap(
  image: ImageData,
  columns: number,
): { bboxes: readonly (Bbox | null)[]; pixelCluster: Int32Array } {
  const { data, width, height } = image;
  const size = width * height;
  const background = new Uint8Array(size);
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;
  const enqueueBackground = (index: number) => {
    if (background[index] === 1 || !isWhiteBackground(data, index * 4)) return;
    background[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < width; x += 1) {
    enqueueBackground(x);
    enqueueBackground((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueueBackground(y * width);
    enqueueBackground(y * width + width - 1);
  }
  while (head < tail) {
    const index = queue[head++] ?? 0;
    const x = index % width;
    if (x > 0) enqueueBackground(index - 1);
    if (x < width - 1) enqueueBackground(index + 1);
    if (index >= width) enqueueBackground(index - width);
    if (index < size - width) enqueueBackground(index + width);
  }

  const labels = new Int32Array(size).fill(-1);
  const components: Component[] = [];
  const stack = new Int32Array(size);
  for (let index = 0; index < size; index += 1) {
    if (background[index] === 1 || labels[index] !== -1) continue;
    const id = components.length;
    let stackTop = 0;
    stack[stackTop++] = index;
    labels[index] = id;
    let minX = index % width;
    let maxX = minX;
    let minY = Math.floor(index / width);
    let maxY = minY;
    let area = 0;
    let sumX = 0;
    while (stackTop > 0) {
      const current = stack[--stackTop] ?? 0;
      const x = current % width;
      const y = (current - x) / width;
      area += 1;
      sumX += x;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nIndex = ny * width + nx;
          if (background[nIndex] === 1 || labels[nIndex] !== -1) continue;
          labels[nIndex] = id;
          stack[stackTop++] = nIndex;
        }
      }
    }
    components.push({ area, cx: sumX / area, id, maxX, maxY, minX, minY });
  }

  const MIN_AREA = 24;
  const real = components.filter((component) => component.area >= MIN_AREA);
  real.sort((a, b) => a.cx - b.cx);

  const groups: Component[][] = [];
  if (real.length === 0) {
    for (let i = 0; i < columns; i += 1) groups.push([]);
  } else {
    const gaps = real
      .slice(1)
      .map((component, i) => ({ gap: component.cx - real[i]!.cx, index: i + 1 }))
      .sort((a, b) => b.gap - a.gap);
    const splitIndices = new Set(gaps.slice(0, Math.max(0, columns - 1)).map((gap) => gap.index));
    let current: Component[] = [];
    real.forEach((component, i) => {
      if (splitIndices.has(i)) {
        groups.push(current);
        current = [];
      }
      current.push(component);
    });
    groups.push(current);
    while (groups.length < columns) groups.push([]);
    while (groups.length > columns) groups[groups.length - 2]!.push(...groups.pop()!);
  }

  const clusterOfComponent = new Int32Array(components.length).fill(-1);
  const bboxes: (Bbox | null)[] = groups.map((group, clusterIndex) => {
    if (group.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    group.forEach((component) => {
      clusterOfComponent[component.id] = clusterIndex;
      minX = Math.min(minX, component.minX);
      minY = Math.min(minY, component.minY);
      maxX = Math.max(maxX, component.maxX);
      maxY = Math.max(maxY, component.maxY);
    });
    return { maxX, maxY, minX, minY };
  });

  const pixelCluster = new Int32Array(size).fill(-1);
  for (let index = 0; index < size; index += 1) {
    const label = labels[index];
    if (label === undefined || label === -1) continue;
    pixelCluster[index] = clusterOfComponent[label] ?? -1;
  }

  return { bboxes, pixelCluster };
}

export function prepareAnimatedEnemyAtlas(
  scene: Phaser.Scene,
  sourceKey: string,
  textureKey: string,
  columns = 4,
): void {
  if (scene.textures.exists(textureKey)) return;
  const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
  const sourceWidth = source.naturalWidth || source.width;
  const sourceHeight = source.naturalHeight || source.height;
  const output = document.createElement('canvas');
  output.width = columns * 256;
  output.height = 768;
  const outputContext = output.getContext('2d');
  if (!outputContext) throw new Error('Canvas 2D is required for animated enemy sprites.');
  outputContext.imageSmoothingEnabled = true;
  outputContext.imageSmoothingQuality = 'high';

  for (let row = 0; row < 3; row += 1) {
    const sourceY = Math.round((row * sourceHeight) / 3);
    const nextY = Math.round(((row + 1) * sourceHeight) / 3);
    const rowHeight = nextY - sourceY;

    const rowCanvas = document.createElement('canvas');
    rowCanvas.width = sourceWidth;
    rowCanvas.height = rowHeight;
    const rowContext = rowCanvas.getContext('2d', { willReadFrequently: true });
    if (!rowContext) throw new Error('Canvas 2D is required for enemy frame cleanup.');
    rowContext.drawImage(source, 0, sourceY, sourceWidth, rowHeight, 0, 0, sourceWidth, rowHeight);
    const rowImage = rowContext.getImageData(0, 0, sourceWidth, rowHeight);
    const { bboxes, pixelCluster } = buildRowClusterMap(rowImage, columns);

    for (let column = 0; column < columns; column += 1) {
      const bbox = bboxes[column];
      const cropX = bbox ? bbox.minX : Math.round((column * sourceWidth) / columns);
      const cropY = bbox ? bbox.minY : 0;
      const cropWidth = bbox
        ? bbox.maxX - bbox.minX + 1
        : Math.round(((column + 1) * sourceWidth) / columns) -
          Math.round((column * sourceWidth) / columns);
      const cropHeight = bbox ? bbox.maxY - bbox.minY + 1 : rowHeight;

      const cell = document.createElement('canvas');
      cell.width = cropWidth;
      cell.height = cropHeight;
      const cellContext = cell.getContext('2d', { willReadFrequently: true });
      if (!cellContext) throw new Error('Canvas 2D is required for enemy frame cleanup.');
      cellContext.drawImage(
        rowCanvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );

      if (bbox) {
        const cellImage = cellContext.getImageData(0, 0, cropWidth, cropHeight);
        for (let y = 0; y < cropHeight; y += 1) {
          for (let x = 0; x < cropWidth; x += 1) {
            const globalIndex = (cropY + y) * sourceWidth + (cropX + x);
            if (pixelCluster[globalIndex] !== column) {
              cellImage.data[(y * cropWidth + x) * 4 + 3] = 0;
            }
          }
        }
        cellContext.putImageData(cellImage, 0, 0);
      }

      const maxSize = 226;
      const scale = Math.min(maxSize / cell.width, maxSize / cell.height, 1);
      const drawWidth = cell.width * scale;
      const drawHeight = cell.height * scale;
      const destX = column * 256 + (256 - drawWidth) / 2;
      const destY = row * 256 + (256 - drawHeight) / 2;
      outputContext.drawImage(
        cell,
        0,
        0,
        cell.width,
        cell.height,
        destX,
        destY,
        drawWidth,
        drawHeight,
      );
    }
  }

  const texture = scene.textures.addCanvas(textureKey, output);
  if (!texture) throw new Error(`Could not register animated enemy atlas: ${textureKey}`);
  for (let frame = 0; frame < columns * 3; frame += 1) {
    texture.add(frame, 0, (frame % columns) * 256, Math.floor(frame / columns) * 256, 256, 256);
  }
  scene.textures.remove(sourceKey);
}

export function createEnemyAnimations(
  scene: Phaser.Scene,
  entries: Readonly<Record<string, AnimatedEnemyFrames>>,
): void {
  Object.entries(entries).forEach(([enemyId, frames]) => {
    const moveKey = `${enemyId}-move`;
    const attackKey = `${enemyId}-attack`;
    if (!scene.anims.exists(moveKey)) {
      scene.anims.create({
        key: moveKey,
        frames: [frames.idle, frames.move].map((frame) => ({ key: frames.texture, frame })),
        frameRate: 5,
        repeat: -1,
        yoyo: true,
      });
    }
    if (!scene.anims.exists(attackKey)) {
      scene.anims.create({
        key: attackKey,
        frames: [frames.attack, frames.idle].map((frame) => ({ key: frames.texture, frame })),
        frameRate: 7,
        repeat: 0,
      });
    }
  });
}
