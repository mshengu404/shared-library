import knex, { Knex } from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

export class KnexService {
  public readonly knex: Knex;

  constructor() {
    const config: Knex.Config = {
      client: process.env.DB_CLIENT || 'pg',
      connection: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl:
          process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
      pool: {
        min: parseInt(process.env.DB_POOL_MIN || '2'),
        max: parseInt(process.env.DB_POOL_MAX || '10'),
      },
    };

    this.knex = knex(config);
  }

  async onModuleInit() {
    await this.testConnection();
  }

  async onModuleDestroy() {
    await this.knex.destroy();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.knex.raw('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async create<T>(tableName: string, data: Partial<T>): Promise<number> {
    const [result] = await this.knex(tableName).insert(data);
    return result;
  }

  async findByid<T>(tableName: string, id: number | string): Promise<T | null> {
    const result = await this.knex(tableName).select('*').where({ id }).first();
    return result;
  }

  async update<T>(
    tableName: string,
    id: string | number,
    data: Partial<T>
  ): Promise<number | null> {
    const result = await this.knex(tableName).where({ id }).update(data);
    return result || null;
  }

  async delete(tableName: string, id: string | number): Promise<number> {
    return this.knex(tableName).where({ id }).del();
  }

  async softDelete(tableName: string, id: string | number): Promise<number> {
    return this.knex(tableName)
      .where({ id })
      .update({ deleted_at: this.knex.fn.now() });
  }

  async exists(
    tableName: string,
    conditions: ((builder: Knex.QueryBuilder) => void)[] = []
  ): Promise<boolean> {
    const result = await this.knex(tableName)
      .where((builder) => {
        if (conditions.length > 0) {
          conditions.forEach((condition) => condition(builder));
        }
      })
      .count('* as count')
      .first();
    return Number((result as { count: number }).count) > 0;
  }

  async transaction<T>(
    callback: (trx: Knex.Transaction) => Promise<T>
  ): Promise<T> {
    return this.knex.transaction(callback);
  }

  async batchInsert<T>(
    tableName: string,
    data: Partial<T>[],
    transaction?: Knex.Transaction
  ): Promise<number[]> {
    const connection = transaction || this.knex;

    if (data.length === 0) {
      return [];
    }

    const result = await connection(tableName).insert(data);
    return result;
  }

  async findOneWhere<T>(
    tableName: string,
    fields: (string | Knex.Raw)[],
    where: ((builder: Knex.QueryBuilder) => void)[] = [],
    joins: ((builder: Knex.QueryBuilder) => void)[] = []
  ): Promise<T | null> {
    const task = await this.knex(tableName)
      .select(fields || '*')
      .modify((builder: Knex.QueryBuilder) => {
        if (joins.length > 0) {
          joins.forEach((join) => join(builder));
        }
      })
      .where((builder) => {
        if (where.length > 0) {
          where.forEach((condition) => condition(builder));
        }
      })
      .first();

    return task;
  }

  async migrateLatest(): Promise<void> {
    await this.knex.migrate.latest();
  }

  async migrateRollback(): Promise<void> {
    await this.knex.migrate.rollback();
  }

  async seedRun(): Promise<void> {
    await this.knex.seed.run();
  }

  async batchUpdate<T extends Record<string, any>>(
    tableName: string,
    data: Partial<T>[],
    key: keyof T = 'id' as keyof T,
    transaction?: Knex.Transaction
  ): Promise<number> {
    const connection = transaction || this.knex;

    if (data.length === 0) {
      return 0;
    }

    return connection.transaction(async (trx) => {
      let updatedCount = 0;

      for (const item of data) {
        const keyValue = item[key];
        if (keyValue === undefined || keyValue === null) {
          continue;
        }

        const result = await trx(tableName)
          .where({ [key]: keyValue } as any)
          .update(item);

        updatedCount += result;
      }

      return updatedCount;
    });
  }

  async paginate<T>(
    tableName: string,
    page: number,
    limit: number,
    fields: (string | Knex.Raw)[],
    where: ((builder: Knex.QueryBuilder) => void)[] = [],
    joins: ((builder: Knex.QueryBuilder) => void)[] = [],
    column?: string,
    order?: string
  ): Promise<
    | {
        data: T[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }
    | T[]
  > {
    const offset = (page - 1) * limit;

    const query = this.knex(tableName);
    const countQuery = this.knex(tableName);

    query
      .select(fields || '*')
      .modify((builder: Knex.QueryBuilder) => {
        if (joins.length > 0) {
          joins.forEach((join) => join(builder));
        }
      })
      .where((builder) => {
        if (where.length > 0) {
          where.forEach((condition) => condition(builder));
        }
      });

    if (column && order) {
      query.orderBy(column, order);
    }

    countQuery
      .modify((builder: Knex.QueryBuilder) => {
        if (joins.length > 0) {
          joins.forEach((join) => join(builder));
        }
      })
      .where((builder) => {
        if (where.length > 0) {
          where.forEach((condition) => condition(builder));
        }
      });

    const [data, totalResult] = await Promise.all([
      query.clone().offset(offset).limit(limit),
      countQuery.clone().count('* as total').first(),
    ]);

    const total = totalResult
      ? Number((totalResult as { total: number }).total)
      : 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async testConnection(): Promise<void> {
    await this.knex.raw('SELECT 1');
  }
}
