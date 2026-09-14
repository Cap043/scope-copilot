import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

// Client-side Better Auth instance.
// This provides sign-up, sign-in, session, and organization methods
// to our React components.
export const authClient = createAuthClient({
  plugins: [
    organizationClient(),
  ],
});