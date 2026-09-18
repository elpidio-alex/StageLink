import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "STUDENT" | "COMPANY" | "MEDIATOR" | "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "COMPANY" | "MEDIATOR" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "STUDENT" | "COMPANY" | "MEDIATOR" | "ADMIN";
  }
}
