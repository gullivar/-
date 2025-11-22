
type Task<T = any> = () => Promise<T>;

class ActionQueue {
  private queue: Task[] = [];
  private isProcessing: boolean = false;
  private listeners: ((isProcessing: boolean) => void)[] = [];

  // 큐에 작업 추가
  enqueue<T>(task: Task<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // 실제 실행될 래퍼 함수
      const wrappedTask = async () => {
        try {
          // 실제 DB 쓰기 느낌을 주기 위한 인위적 지연 (300ms)
          // 사용자가 작업이 처리되고 있음을 인지하게 함
          await new Promise(r => setTimeout(r, 500));
          
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      this.queue.push(wrappedTask);
      this.processNext();
    });
  }

  private async processNext() {
    if (this.isProcessing) return;
    if (this.queue.length === 0) {
      this.notifyListeners(false);
      return;
    }

    this.isProcessing = true;
    this.notifyListeners(true);

    const task = this.queue.shift();

    if (task) {
      try {
        await task();
      } catch (e) {
        console.error("Queue Task Error:", e);
      } finally {
        this.isProcessing = false;
        this.processNext(); // 다음 작업 실행 (재귀 호출 형태이나 비동기라 스택 오버플로우 없음)
      }
    }
  }

  // 상태 변경 구독
  subscribe(listener: (isProcessing: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(status: boolean) {
    this.listeners.forEach(listener => listener(status));
  }
}

export const actionQueue = new ActionQueue();
