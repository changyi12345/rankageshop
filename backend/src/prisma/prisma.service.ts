import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool, PoolConfig } from 'pg';

function createPgPool(rawConnectionString: string): Pool {
  const connectionString = rawConnectionString.replace(/^["']|["']$/g, '').trim();

  let hostname = '';
  try {
    hostname = new URL(connectionString.replace(/^postgresql:/, 'http:')).hostname;
  } catch {
    hostname = '';
  }

  const isLocal = !hostname || hostname === 'localhost' || hostname === '127.0.0.1';
  const isRemoteSsl =
    !isLocal &&
    (/sslmode=/i.test(connectionString) ||
      /supabase\.com/i.test(connectionString) ||
      /neon\.tech/i.test(connectionString));

  if (!isRemoteSsl) {
    return new Pool({ connectionString });
  }

  // pg v8 maps sslmode=require → verify-full; strip it and use explicit SSL instead
  let poolUrl = connectionString;
  try {
    const parsed = new URL(connectionString.replace(/^postgresql:/, 'http:'));
    parsed.searchParams.delete('sslmode');
    parsed.searchParams.delete('sslaccept');
    poolUrl = parsed.toString().replace(/^http:/, 'postgresql:');
  } catch {
    poolUrl = connectionString.replace(/([?&])sslmode=[^&]*&?/gi, '$1').replace(/[?&]$/, '');
  }

  const config: PoolConfig = {
    connectionString: poolUrl,
    ssl: { rejectUnauthorized: false },
  };

  return new Pool(config);
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool | null;

  constructor() {
    const connectionString = process.env.DATABASE_URL?.trim();
    const pool = connectionString ? createPgPool(connectionString) : null;
    super(pool ? { adapter: new PrismaPg(pool) } : {});
    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      this.logger.warn(
        'Database connection failed — auth/orders unavailable, games API still works',
      );
      this.logger.warn(err instanceof Error ? err.message : String(err));
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool?.end();
  }
}
