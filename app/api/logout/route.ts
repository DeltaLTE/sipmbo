import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logout successful" });

  // Method 1: Use the Next.js helper (Cleaner)
  response.cookies.delete('auth-token');

  // Method 2: Explicitly overwrite it (Fallback for older browsers/edge cases)
  // We set 'maxAge' to 0 and 'expires' to the past.
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    maxAge: 0,
    path: '/',
  });

  return response;
}