/**
 * TimeoutDuration - タイムアウト時間を表現するValue Object
 * 
 * タイムアウト時間を型安全に扱うための不変オブジェクト。
 * ミリ秒単位で管理し、秒・分への変換機能を提供。
 */
export class TimeoutDuration {
  private readonly milliseconds: number;
  
  /**
   * 最小タイムアウト時間（100ミリ秒）
   */
  public static readonly MIN_MILLISECONDS = 100;
  
  /**
   * 最大タイムアウト時間（10分）
   */
  public static readonly MAX_MILLISECONDS = 600_000;
  
  /**
   * デフォルトタイムアウト時間（30秒）
   */
  public static readonly DEFAULT_MILLISECONDS = 30_000;
  
  private constructor(milliseconds: number) {
    this.milliseconds = milliseconds;
  }
  
  /**
   * ミリ秒からTimeoutDurationを生成
   */
  public static fromMilliseconds(milliseconds: number): TimeoutDuration {
    if (!Number.isInteger(milliseconds)) {
      throw new Error(`TimeoutDuration must be an integer: ${milliseconds}`);
    }
    
    if (milliseconds < this.MIN_MILLISECONDS) {
      throw new Error(
        `TimeoutDuration must be at least ${this.MIN_MILLISECONDS}ms: ${milliseconds}`
      );
    }
    
    if (milliseconds > this.MAX_MILLISECONDS) {
      throw new Error(
        `TimeoutDuration must not exceed ${this.MAX_MILLISECONDS}ms: ${milliseconds}`
      );
    }
    
    return new TimeoutDuration(milliseconds);
  }
  
  /**
   * 秒からTimeoutDurationを生成
   */
  public static fromSeconds(seconds: number): TimeoutDuration {
    if (!Number.isFinite(seconds) || seconds < 0) {
      throw new Error(`Invalid seconds value: ${seconds}`);
    }
    
    return this.fromMilliseconds(Math.floor(seconds * 1000));
  }
  
  /**
   * 分からTimeoutDurationを生成
   */
  public static fromMinutes(minutes: number): TimeoutDuration {
    if (!Number.isFinite(minutes) || minutes < 0) {
      throw new Error(`Invalid minutes value: ${minutes}`);
    }
    
    return this.fromMilliseconds(Math.floor(minutes * 60 * 1000));
  }
  
  /**
   * デフォルトのTimeoutDurationを生成
   */
  public static default(): TimeoutDuration {
    return new TimeoutDuration(this.DEFAULT_MILLISECONDS);
  }
  
  /**
   * 無限タイムアウト（実際には最大値）を生成
   */
  public static infinite(): TimeoutDuration {
    return new TimeoutDuration(this.MAX_MILLISECONDS);
  }
  
  /**
   * ミリ秒単位の値を取得
   */
  public toMilliseconds(): number {
    return this.milliseconds;
  }
  
  /**
   * 秒単位の値を取得
   */
  public toSeconds(): number {
    return Math.floor(this.milliseconds / 1000);
  }
  
  /**
   * 分単位の値を取得
   */
  public toMinutes(): number {
    return Math.floor(this.milliseconds / 60_000);
  }
  
  /**
   * 人間が読みやすい形式で文字列化
   */
  public toHumanReadable(): string {
    if (this.milliseconds < 1000) {
      return `${this.milliseconds}ms`;
    }
    
    const seconds = this.toSeconds();
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }
    
    return `${minutes}m${remainingSeconds}s`;
  }
  
  /**
   * 等価性の比較
   */
  public equals(other: TimeoutDuration): boolean {
    return this.milliseconds === other.milliseconds;
  }
  
  /**
   * 大小比較
   */
  public isGreaterThan(other: TimeoutDuration): boolean {
    return this.milliseconds > other.milliseconds;
  }
  
  public isLessThan(other: TimeoutDuration): boolean {
    return this.milliseconds < other.milliseconds;
  }
  
  public isGreaterThanOrEqualTo(other: TimeoutDuration): boolean {
    return this.milliseconds >= other.milliseconds;
  }
  
  public isLessThanOrEqualTo(other: TimeoutDuration): boolean {
    return this.milliseconds <= other.milliseconds;
  }
  
  /**
   * 加算
   */
  public add(other: TimeoutDuration): TimeoutDuration {
    const sum = this.milliseconds + other.milliseconds;
    if (sum > TimeoutDuration.MAX_MILLISECONDS) {
      return TimeoutDuration.infinite();
    }
    return new TimeoutDuration(sum);
  }
  
  /**
   * 減算
   */
  public subtract(other: TimeoutDuration): TimeoutDuration {
    const diff = this.milliseconds - other.milliseconds;
    if (diff < TimeoutDuration.MIN_MILLISECONDS) {
      return TimeoutDuration.fromMilliseconds(TimeoutDuration.MIN_MILLISECONDS);
    }
    return new TimeoutDuration(diff);
  }
  
  /**
   * スケーリング
   */
  public scale(factor: number): TimeoutDuration {
    if (!Number.isFinite(factor) || factor < 0) {
      throw new Error(`Invalid scale factor: ${factor}`);
    }
    
    const scaled = Math.floor(this.milliseconds * factor);
    
    if (scaled < TimeoutDuration.MIN_MILLISECONDS) {
      return TimeoutDuration.fromMilliseconds(TimeoutDuration.MIN_MILLISECONDS);
    }
    
    if (scaled > TimeoutDuration.MAX_MILLISECONDS) {
      return TimeoutDuration.infinite();
    }
    
    return new TimeoutDuration(scaled);
  }
  
  /**
   * JSON形式への変換
   */
  public toJSON(): { milliseconds: number; humanReadable: string } {
    return {
      milliseconds: this.milliseconds,
      humanReadable: this.toHumanReadable(),
    };
  }
  
  /**
   * 文字列表現
   */
  public toString(): string {
    return `TimeoutDuration(${this.toHumanReadable()})`;
  }
}