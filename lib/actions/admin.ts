"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) redirect("/");
  return user;
}

export async function setUserBlocked(userId: string, blocked: boolean) {
  await requireAdmin();
  const target = await prisma.user.findUnique({ where: { id: userId } });
  // 管理员账号不可被封禁
  if (!target || target.isAdmin) return;

  await prisma.user.update({ where: { id: userId }, data: { blocked } });
  if (blocked) {
    // 踢掉该用户所有在线会话
    await prisma.session.deleteMany({ where: { userId } });
  }
  revalidatePath("/admin");
}
