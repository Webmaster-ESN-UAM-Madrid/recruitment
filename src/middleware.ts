import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Define admin and recruiter emails
const adminEmails = ["vicepresident@esnuam.org", "hector.tablero@esnuam.org", "mario.viton@esnuam.org"];
const recruiterEmails = ["recruiter1@esnuam.org", "recruiter2@esnuam.org"]; // Placeholder: Add actual recruiter emails here

// Helper function to check for admin access
function hasAdminAccess(email: string | null | undefined): boolean {
    return email ? adminEmails.includes(email) : false;
}

// Helper function to check for recruiter access
function hasRecruiterAccess(email: string | null | undefined): boolean {
    // Admins also have recruiter access
    return email ? recruiterEmails.includes(email) || adminEmails.includes(email) : false;
}

// Helper function to check if a path is public
function isPublicPath(pathname: string): boolean {
    return (
        pathname.startsWith("/auth") ||
        pathname.startsWith("/feedback") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/feedback") ||
        pathname.startsWith("/api/forms/connect/register") ||
        pathname.startsWith("/api/forms/connect/response") || // Also allow response endpoint
        pathname.startsWith("/_next/static") ||
        pathname.startsWith("/_next/image") ||
        pathname.startsWith("/favicon.ico")
    );
}

export default withAuth(
    async function middleware(req) {
        const pathname = req.nextUrl.pathname;
        console.log(`Middleware: Processing request for ${pathname}`);

        if (isPublicPath(pathname)) {
            console.log(`Middleware: Allowing public path ${pathname}`);
            return NextResponse.next();
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const pathname = req.nextUrl.pathname;
                const userEmail = token?.email;

                if (isPublicPath(pathname)) {
                    console.log(`Authorized Callback: Public path ${pathname}, returning true`);
                    return true;
                }

                // For admin routes, check if authenticated AND is an admin
                if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
                    const isAuthorized = hasAdminAccess(userEmail);
                    console.log(`Authorized Callback: Admin route ${pathname}, authorized: ${isAuthorized}`);
                    return isAuthorized;
                }

                // For recruiter routes, check if authenticated AND is a recruiter/admin
                if (pathname.startsWith("/recruitment") || pathname.startsWith("/api/candidates")) {
                    const isAuthorized = hasRecruiterAccess(userEmail);
                    console.log(`Authorized Callback: Recruiter route ${pathname}, authorized: ${isAuthorized}`);
                    return isAuthorized;
                }

                // For all other routes, simply check if the user is authenticated
                const isAuthenticated = !!token;
                console.log(`Authorized Callback: Protected route ${pathname}, authenticated: ${isAuthenticated}`);
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
