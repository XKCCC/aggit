"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

export async function createBounty(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await rateLimit("createBounty", 10, 60_000))) {
    redirect("/bounties/new?error=2");
  }

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const budgetMin = Number(formData.get("budgetMin"));
  const budgetMax = Number(formData.get("budgetMax"));
  const currency = String(formData.get("currency") || "CNY");
  const tags = String(formData.get("tags") || "").trim();
  const projectId = String(formData.get("projectId") || "") || null;

  if (
    !title ||
    !description ||
    !Number.isFinite(budgetMin) ||
    !Number.isFinite(budgetMax) ||
    budgetMin <= 0 ||
    budgetMax < budgetMin
  ) {
    redirect("/bounties/new?error=1");
  }

  const bounty = await prisma.bounty.create({
    data: {
      title,
      description,
      budgetMin: Math.round(budgetMin),
      budgetMax: Math.round(budgetMax),
      currency,
      tags,
      projectId,
      creatorId: user.id,
    },
  });
  redirect(`/bounties/${bounty.id}`);
}

export async function claimBounty(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bountyId = String(formData.get("bountyId") || "");
  const message = String(formData.get("message") || "").trim();
  const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
  if (
    !bounty ||
    bounty.status !== "OPEN" ||
    bounty.creatorId === user.id ||
    !message
  ) {
    redirect(`/bounties/${bountyId}`);
  }

  await prisma.claim.upsert({
    where: { bountyId_developerId: { bountyId, developerId: user.id } },
    create: { bountyId, developerId: user.id, message },
    update: { message },
  });
  revalidatePath(`/bounties/${bountyId}`);
}

export async function submitClaim(claimId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const claim = await prisma.claim.findUnique({ where: { id: claimId } });
  if (!claim || claim.developerId !== user.id || claim.status !== "ACTIVE") {
    return;
  }
  await prisma.claim.update({
    where: { id: claimId },
    data: { status: "SUBMITTED" },
  });
  revalidatePath(`/bounties/${claim.bountyId}`);
}

export async function acceptClaim(claimId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { bounty: true },
  });
  if (
    !claim ||
    claim.bounty.creatorId !== user.id ||
    claim.bounty.status !== "OPEN"
  ) {
    return;
  }
  await prisma.$transaction([
    prisma.claim.update({
      where: { id: claimId },
      data: { status: "ACCEPTED" },
    }),
    prisma.claim.updateMany({
      where: { bountyId: claim.bountyId, id: { not: claimId } },
      data: { status: "REJECTED" },
    }),
    prisma.bounty.update({
      where: { id: claim.bountyId },
      // 验收通过后进入托管流程：等待发布方把赏金打入平台账户
      data: { status: "COMPLETED", escrowStatus: "AWAITING" },
    }),
  ]);
  revalidatePath(`/bounties/${claim.bountyId}`);
}

export async function cancelBounty(bountyId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
  if (!bounty || bounty.creatorId !== user.id || bounty.status !== "OPEN") {
    return;
  }
  await prisma.bounty.update({
    where: { id: bountyId },
    data: { status: "CANCELLED" },
  });
  revalidatePath(`/bounties/${bountyId}`);
  revalidatePath("/bounties");
}
