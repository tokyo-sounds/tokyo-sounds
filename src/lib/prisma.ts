import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Neon DB connection string
// For optimal performance with Neon DB, ensure DATABASE_URL includes:
// - connect_timeout=10 (to handle Neon instance wake-up time)
// - Use pooler connection for application queries
// - Use direct connection (DIRECT_URL) for migrations
const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
