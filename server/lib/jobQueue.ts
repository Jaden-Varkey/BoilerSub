export class JobQueue<T> {
  private readonly queue: T[] = [];
  private processing = false;

  async add(job: T): Promise<void> {
    this.queue.push(job);
    if (!this.processing) {
      void this.process();
    }
  }

  protected async execute(_job: T): Promise<void> {
    // Override in subclasses or provide composition around JobQueue.
  }

  private async process(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) {
        continue;
      }

      try {
        await this.execute(job);
      } catch (error) {
        console.error("Job failed", error);
      }
    }

    this.processing = false;
  }
}
