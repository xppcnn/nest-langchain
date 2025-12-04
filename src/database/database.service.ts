import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from './drizzle.constants';
import type { DrizzleDB } from './drizzle.types';
import { users, posts, NewUser, NewPost, User, Post } from './schema/index';

@Injectable()
export class DatabaseService {
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

  // 用户相关操作
  async createUser(data: NewUser): Promise<User> {
    const result = await this._db.insert(users).values(data).returning();
    return result[0];
  }

  async findAllUsers(): Promise<User[]> {
    return this._db.select().from(users);
  }

  async findUserById(id: number): Promise<User | undefined> {
    const result = await this._db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    const result = await this._db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return result[0];
  }

  async updateUser(
    id: number,
    data: Partial<NewUser>,
  ): Promise<User | undefined> {
    const result = await this._db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this._db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }

  // 文章相关操作
  async createPost(data: NewPost): Promise<Post> {
    const result = await this._db.insert(posts).values(data).returning();
    return result[0];
  }

  async findAllPosts(): Promise<Post[]> {
    return this._db.select().from(posts);
  }

  async findPostById(id: number): Promise<Post | undefined> {
    const result = await this._db.select().from(posts).where(eq(posts.id, id));
    return result[0];
  }

  async findPostsByAuthor(authorId: number): Promise<Post[]> {
    return this._db.select().from(posts).where(eq(posts.authorId, authorId));
  }

  // 带关联查询
  async findPostsWithAuthor() {
    return this._db
      .select({
        post: posts,
        author: users,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id));
  }
}
