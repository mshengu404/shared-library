import { Knex } from 'knex';

export interface KnexConfig extends Knex.Config {
  connection: Knex.ConnectionConfig;
  pool?: {
    min?: number;
    max?: number;
    idleTimeoutMillis?: number;
  };
}
