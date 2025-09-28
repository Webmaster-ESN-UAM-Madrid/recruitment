import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Helper function to check if a path is public
function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/forms/connect/register") ||
    pathname.startsWith("/api/forms/connect/response") ||
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/favicon.ico")
  );
}

export default withAuth(
  async function middleware(req) {
    const pathname = req.nextUrl.pathname;

    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        if (isPublicPath(pathname)) {
          return true;
        }

        // For all other routes, simply check if the user is authenticated
        const isAuthenticated = !!token;
        return isAuthenticated;
      }
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error"
    }
  }
);

export const config = {
  matcher: ["/:path*"]
};
