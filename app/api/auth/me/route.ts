// /api/auth/me/route.ts

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // Read the cookie header from the request
    const cookieHeader = req.headers.get('cookie') || '';

    // Check if the 'admin-auth=true' cookie exists
    const isAuthenticated = cookieHeader.includes('admin-auth=true');

    if (isAuthenticated) {
      // If the cookie is found, the user is authenticated
      return NextResponse.json({ authenticated: true });
    } else {
      // If the cookie is not found, return unauthorized
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error) {
    // In case of any unexpected errors, treat as unauthorized
    console.error("Auth check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}