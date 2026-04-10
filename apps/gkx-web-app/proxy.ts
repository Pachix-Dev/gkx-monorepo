import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/verify-email", "/forgot-password", "/reset-password"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isAssetPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/editor-assets") ||
    /\.(?:png|jpg|jpeg|webp|svg|gif|ico|woff2?|ttf|otf)$/i.test(pathname)
  );
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isAssetPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("gkx_access_token")?.value;
  const hasToken = Boolean(token);
  const isPublic = isPublicPath(pathname);

  if (!hasToken && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasToken && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|editor-assets|.*\\.(?:png|jpg|jpeg|webp|svg|gif|ico|woff2?|ttf|otf)).*)"],
};
