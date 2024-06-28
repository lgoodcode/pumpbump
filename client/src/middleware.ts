import { NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { setSentryUser } from "@/lib/sentry/utils";

const authPagesRegex =
  /^\/(login|register|forgot-password|reset-password|set-password)/;

export const config = {
  matcher: [
    "/login",
    "/register",
    "/api",
    "/dashboard",
  ],
};

const getRedirectUrl = (request: NextRequest) => {
  const queryParams = new URLSearchParams(request.nextUrl.search);
  const redirectUrl = queryParams.get("redirect_to");
  const baseURL = `${request.nextUrl.origin}/login`;
  const isLoginPage = request.nextUrl.pathname === "/login";
  const queryString = !!queryParams.size
    ? encodeURIComponent(queryParams.toString())
    : "";

  queryParams.delete("redirect_to");

  if (isLoginPage && redirectUrl) {
    return new URL(
      `${baseURL}${queryString ? `?${queryString}` : ""}`,
    );
  }

  return new URL(
    `${baseURL}?redirect_to=${request.nextUrl.pathname}${
      queryString ? `&${queryString}` : ""
    }`,
  );
};

export async function middleware(request: NextRequest) {
  const { user, response } = await updateSession(request);
  const isAuthPage = authPagesRegex.test(request.nextUrl.pathname);
  const isApi = request.nextUrl.pathname.startsWith("/api");

  if (!user) {
    if (!isAuthPage) {
      return NextResponse.redirect(getRedirectUrl(request));
    } else if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    setSentryUser(user);

    // If there is a session and user is visiting an auth page, redirect to dashboard home
    if (isAuthPage) {
      return NextResponse.redirect(
        new URL(`${request.nextUrl.origin}/dashboard`),
      );
    }
  }

  return response;
}
