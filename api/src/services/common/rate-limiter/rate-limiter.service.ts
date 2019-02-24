import { Injectable } from 'injection-js';
import { RateLimiter } from './rate-limiter';

@Injectable()
export class RateLimiterService {

  public instance(rate: number) {
    return new RateLimiter(rate);
  }
}
