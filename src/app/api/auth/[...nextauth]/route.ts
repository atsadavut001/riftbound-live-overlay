import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getDataSource } from "@/lib/db";
import { User } from "@/lib/entities/User";

import { NextAuthOptions } from "next-auth";

interface SessionUser {
  id?: string;
  isAdmin?: boolean;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        const db = await getDataSource();
        const userRepo = db.getRepository(User);
        let existingUser = await userRepo.findOne({ where: { email: user.email! } });
        
        if (!existingUser) {
          existingUser = userRepo.create({
            email: user.email!,
            name: user.name!,
            image: user.image!,
          });
          await userRepo.save(existingUser);
        }
        return true;
      } catch (error) {
        console.error("Error saving user:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      // Enrich the JWT with id/isAdmin at sign-in so middleware/proxy can read it.
      try {
        const email = user?.email || token.email;
        if (email) {
          const db = await getDataSource();
          const userRepo = db.getRepository(User);
          let dbUser = await userRepo.findOne({ where: { email } });

          if (!dbUser) {
            dbUser = userRepo.create({
              email,
              name: user?.name || (token.name as string) || "Unknown",
              image: user?.image || (token.picture as string) || "",
            });
            await userRepo.save(dbUser);
          }

          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin;
        }
      } catch (e) {
        console.error("JWT error:", e);
      }
      return token;
    },
    async session({ session }) {
      try {
        if (session?.user?.email) {
          const db = await getDataSource();
          const userRepo = db.getRepository(User);
          let dbUser = await userRepo.findOne({ where: { email: session.user.email } });
          
          if (!dbUser) {
            dbUser = userRepo.create({
              email: session.user.email,
              name: session.user.name || "Unknown",
              image: session.user.image || "",
            });
            await userRepo.save(dbUser);
          }
          
          const sessionUser = session.user as SessionUser;
          sessionUser.id = dbUser.id;
          sessionUser.isAdmin = dbUser.isAdmin;
        }
      } catch (e) {
        console.error("Session error:", e);
      }
      return session;
    },
  },
  pages: {
    signIn: "/overlapanal",
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

