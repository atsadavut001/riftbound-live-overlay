import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Server-side guard for /admin/* pages.
// Uses the NextAuth JWT session cookie to check isAdmin before the page renders.

interface AdminToken {
  isAdmin?: boolean;
  email?: string;
}

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    // Not logged in -> send home
    return NextResponse.redirect(new URL("/", req.url));
  }

  const { isAdmin, email } = token as AdminToken;

  if (!isAdmin) {
    // Tokens issued before the jwt callback existed don't carry isAdmin.
    // Fall back to a direct DB check before kicking the user out.
    if (email) {
      try {
        const { getDataSource } = await import("@/lib/db");
        const { User } = await import("@/lib/entities/User");
        const dbUser = await (await getDataSource()).getRepository(User).findOne({ where: { email } });
        if (dbUser?.isAdmin) {
          return NextResponse.next();
        }
      } catch (e) {
        console.error("Proxy admin fallback failed:", e);
      }
    }
    // Logged in but not admin -> send to user area
    return NextResponse.redirect(new URL("/overlapanal", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
