"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function refreshContentPaths(kind: "agents" | "bounties", id: string) {
  revalidatePath(`/${kind}/${id}`);
  revalidatePath(`/${kind}`);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function setProjectVisibility(
  projectId: string,
  visibility: string
) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  // 作者本人或管理员可改可见性
  if (!project || (!user.isAdmin && user.id !== project.ownerId)) return;

  await prisma.project.update({
    where: { id: projectId },
    data: { visibility: visibility === "HIDDEN" ? "HIDDEN" : "PUBLIC" },
  });
  refreshContentPaths("agents", projectId);
}

export async function deleteProject(projectId: string) {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) redirect("/"); // 删除仅管理员
  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/admin");
  revalidatePath("/agents");
  revalidatePath("/");
  redirect("/admin");
}

export async function setBountyVisibility(
  bountyId: string,
  visibility: string
) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
  // 发布方本人或管理员可改可见性
  if (!bounty || (!user.isAdmin && user.id !== bounty.creatorId)) return;

  await prisma.bounty.update({
    where: { id: bountyId },
    data: { visibility: visibility === "HIDDEN" ? "HIDDEN" : "PUBLIC" },
  });
  refreshContentPaths("bounties", bountyId);
}

export async function deleteBounty(bountyId: string) {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) redirect("/"); // 删除仅管理员
  await prisma.bounty.delete({ where: { id: bountyId } });
  revalidatePath("/admin");
  revalidatePath("/bounties");
  revalidatePath("/");
  redirect("/admin");
}
