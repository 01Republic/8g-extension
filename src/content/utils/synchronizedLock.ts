class SynchronizedLock {
  private isLocked = false;
  private waitQueue: Array<() => void> = [];

  async getLock(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isLocked) {
        this.isLocked = true;
        resolve();
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }

  releaseLock(): void {
    if (!this.isLocked) {
      console.warn('[SynchronizedLock] Attempting to release an unlocked lock');
      return;
    }

    this.isLocked = false;

    if (this.waitQueue.length > 0) {
      const nextResolve = this.waitQueue.shift();
      if (nextResolve) {
        this.isLocked = true;
        nextResolve();
      }
    }
  }

  isCurrentlyLocked(): boolean {
    return this.isLocked;
  }

  getQueueLength(): number {
    return this.waitQueue.length;
  }
}

export const synchronizedLock = new SynchronizedLock();
