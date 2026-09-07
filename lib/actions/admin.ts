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

// Concierge 托管：管理员线下确认定金到账 / 结清后，手动推进托管状态
export async function setEscrowStatus(bountyId: string, status: string) {
  await requireAdmin();
  if (!["AWAITING", "DEPOSITED", "RELEASED"].includes(status)) return;
  if (status === "DEPOSITED") {
    // 定金到账：悬赏从「待付定金」转为公开招募
    await prisma.bounty.update({
      where: { id: bountyId },
      data: { escrowStatus: status, status: "OPEN" },
    });
  } else {
    await prisma.bounty.update({
      where: { id: bountyId },
      data: { escrowStatus: status },
    });
  }
  revalidatePath("/admin");
  revalidatePath(`/bounties/${bountyId}`);
}
