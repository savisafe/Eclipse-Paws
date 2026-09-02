import { parseSaveGame, type SaveGame } from '@core/index';
import type { SaveRepository } from '@application/ports/save-repository';

export class LocalStorageSaveRepository implements SaveRepository<SaveGame> {
  readonly #key: string;
  readonly #storage: Storage;

  constructor(storage: Storage, key = 'eclipse-paws-save') {
    this.#storage = storage;
    this.#key = key;
  }

  load(): Promise<SaveGame | null> {
    const raw = this.#storage.getItem(this.#key);
    if (!raw) return Promise.resolve(null);
    try {
      const save = parseSaveGame(JSON.parse(raw) as unknown);
      if (!save) this.#storage.removeItem(this.#key);
      return Promise.resolve(save);
    } catch {
      this.#storage.removeItem(this.#key);
      return Promise.resolve(null);
    }
  }

  save(data: SaveGame): Promise<void> {
    this.#storage.setItem(this.#key, JSON.stringify(data));
    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.#storage.removeItem(this.#key);
    return Promise.resolve();
  }
}
