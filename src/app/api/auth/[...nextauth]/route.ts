import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getDataSource } from "@/lib/db";
import { User } from "@/lib/entities/User";

import { NextAuthOptions } from "next-auth";

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
          
          (session.user as any).id = dbUser.id;
          (session.user as any).isAdmin = dbUser.isAdmin;
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

