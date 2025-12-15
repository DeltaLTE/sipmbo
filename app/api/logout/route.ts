import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logout successful" });

  // Method 1: Use the Next.js helper (Cleaner)
  response.cookies.delete('auth-token');

  return response;
}