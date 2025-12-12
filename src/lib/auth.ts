// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // Tell Adapter the database type
  }),

  // Advanced database configuration
  // Disable Better Auth's internal ID generation to use Prisma's cuid()
  advanced: {
    database: {
      generateId: false, // Let Prisma handle ID generation with cuid()
    },
  },

  // set login methods | ログイン方式を設定 | 設定登入方式
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    // TODO: github: { ... }
    github: {
      clientId: process.env.GITHUB_CLIENT_ID! as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET! as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID! as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET! as string,
    }
  },

  // More advanced features can be enabled here
  // rateLimit: { ... }
});
