import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Returns the current session if the user is signed in AND is an admin.
 * Returns null otherwise. Use this to guard every /api/admin/* route.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return null;
  }
  return session;
}
