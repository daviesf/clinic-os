export interface IRateLimiter {
  checkLimit(key: string): Promise<boolean>;
}
