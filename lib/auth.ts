import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/lib/db";

// Better Auth uses our existing Prisma client so authentication
// and application data share the same PostgreSQL database.
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Email/password authentication is enough for our first version.
  emailAndPassword: {
    enabled: true,
  },

  // Organizations are the tenant boundary for the SaaS.
  // Projects and client data will eventually belong to the
  // authenticated user's organization.
  plugins: [
    organization(),
  ],
});