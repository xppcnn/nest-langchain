import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from './drizzle.constants';
import type { DrizzleDB } from './drizzle.types';

@Injectable()
export class DrizzleService {
  constructor(@Inject(DRIZZLE) private readonly _db: DrizzleDB) {}

  /**
   * 获取原始的 Drizzle 数据库实例
   * 用于直接执行数据库操作
   */
  get db(): DrizzleDB {
    return this._db;
  }

  /**
   * 获取 Drizzle Query API
   * 用于更简洁的关系查询
   */
  get query() {
    return this._db.query;
  }
}
