import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@prisma/client";

const roleRules: Array<[string, Role[]]> = [
  ["/dashboard/student", [Role.STUDENT]],
  ["/dashboard/company", [Role.COMPANY]],
  ["/dashboard/mediator", [Role.MEDIATOR]],
  ["/dashboard/admin", [Role.ADMIN]],
];

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const rule = roleRules.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!rule) return NextResponse.next();

  const session = request.auth;
  if (!session?.user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!rule[1].includes(session.user.role))
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
