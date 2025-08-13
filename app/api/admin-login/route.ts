// admin-login/route.ts
import { NextResponse } from "next/server";

const allowedUsers: Record<string, string> = {
  puneet: "puneet@ssi",
  ravinder: "ravinder@ssi",
  varsha: "varsha@ssi",
  shrijal: "shrijal@ssi",
  yash: "yash@ssi",
  tanmay: "tanmay@ssi",
};

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (allowedUsers[username] && allowedUsers[username] === password) {
    const cookieValue = `admin-auth=true; Path=/; HttpOnly; Max-Age=3600; SameSite=Strict${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`;

    return NextResponse.json({ success: true }, {
      status: 200,
      headers: {
        "Set-Cookie": cookieValue, // This sets your custom cookie
      },
    });
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}