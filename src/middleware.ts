import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { apiAuthPrefix, authRoutes, DEFAULT_LOGIN_REDIRECT, publicRoutes } from "./routes";

export async function middleware(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);

    const isLoggedIn = !!sessionCookie;
    const path = request.nextUrl.pathname;

    const isApiAuthRoute = path.startsWith(apiAuthPrefix);
    const isPublicRoute = publicRoutes.some(route => {
        if (route.endsWith('/[*]')) {
            const baseRoute = route.slice(0, -4);
            return path === baseRoute || path.startsWith(baseRoute + '/');
        }
        return route === path;
    });
    const isAuthRoute = authRoutes.includes(path);

    if (isApiAuthRoute) {
        return NextResponse.next();;
    }

    if (isAuthRoute) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.nextUrl));
        }
        return NextResponse.next();;
    }

    if (!isPublicRoute) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/', request.nextUrl));
        }
        else {
            return NextResponse.next();
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};