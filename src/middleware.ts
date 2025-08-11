import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["pt-BR", "en"] as const;
const DEFAULT_LOCALE = "pt-BR" as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startsWithLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (startsWithLocale) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};


