import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Mount Better Auth's authentication API under /api/auth/*.
export const { GET, POST } = toNextJsHandler(auth);