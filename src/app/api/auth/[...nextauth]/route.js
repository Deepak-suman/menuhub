import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("User not found");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          restaurantId: user.restaurantId,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.restaurantId = user.restaurantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.restaurantId = token.restaurantId;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: (() => {
    if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "production") {
      throw new Error("NEXTAUTH_SECRET is not defined in production environment.");
    }
    return process.env.NEXTAUTH_SECRET || "fallback_super_secret_for_local_dev";
  })(),
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
