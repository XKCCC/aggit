"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export async function mockLogin(formData: FormData) {
  const username = String(formData.get("username") || "");
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) redirect("/login?error=1");
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
