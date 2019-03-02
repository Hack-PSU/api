import { PoolConnection } from 'mysql';

export interface IConnectionFactory {
  getConnection(): Promise<PoolConnection>;
}
