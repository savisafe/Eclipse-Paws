export interface SaveRepository<TSave> {
  load(): Promise<TSave | null>;
  save(data: TSave): Promise<void>;
  clear(): Promise<void>;
}
