import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@generated/prisma/client";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const url = new URL(env.DATABASE_URL);
  const sslAccept = url.searchParams.get("sslaccept");
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 10,
    // The connector gives up after 1s by default, which a database in another region (a hosted one, reached over TLS) can exceed.
    connectTimeout: 10_000,
    // Hosted MySQL such as TiDB Cloud only accepts TLS connections. The same `?sslaccept=` flag Prisma's own CLI reads switches it on here too.
    ssl: sslAccept ? { rejectUnauthorized: sslAccept === "strict" } : undefined,
  });
  return new PrismaClient({ adapter }) as PrismaClient;
}

export const db = globalForPrisma.prisma ?? createClient();
if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
