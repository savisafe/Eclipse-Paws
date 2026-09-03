import Phaser from 'phaser';

interface Poolable extends Phaser.GameObjects.GameObject {
  setActive(value: boolean): this;
  setVisible(value: boolean): this;
}

export class GameObjectPool<T extends Poolable> {
  readonly #all: T[];
  readonly #available: T[];

  constructor(size: number, factory: () => T) {
    this.#all = Array.from({ length: size }, factory);
    this.#all.forEach((object) => object.setActive(false).setVisible(false));
    this.#available = [...this.#all];
  }

  acquire(): T | null {
    const object = this.#available.pop() ?? null;
    return object?.setActive(true).setVisible(true) ?? null;
  }

  release(object: T): void {
    object.setActive(false).setVisible(false);
    if (!this.#available.includes(object)) this.#available.push(object);
  }

  destroy(): void {
    this.#all.forEach((object) => object.destroy());
    this.#available.length = 0;
  }
}
