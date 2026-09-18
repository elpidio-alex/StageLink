import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  canAttemptLogin,
  clearLoginFailures,
  recordLoginFailure,
} from "@/lib/auth-rate-limit";

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

const providers = [
  Credentials({
    name: "Identifiants",
    credentials: { email: {}, password: {} },
    async authorize(rawCredentials) {
      const parsed = credentialsSchema.safeParse(rawCredentials);
      if (!parsed.success) return null;
      const email = parsed.data.email.toLowerCase();
      if (!canAttemptLogin(email)) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (
        !user?.passwordHash ||
        !(await bcrypt.compare(parsed.data.password, user.passwordHash))
      ) {
        recordLoginFailure(email);
        return null;
      }

      clearLoginFailures(email);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    },
  }),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        if (token.role && Object.values(Role).includes(token.role as Role)) {
          session.user.role = token.role as Role;
        }
      }
      return session;
    },
  },
});
