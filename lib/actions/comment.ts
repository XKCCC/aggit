"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

export async function addComment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await rateLimit("addComment", 20, 60_000))) return;

  const body = String(formData.get("body") || "").trim();
  const bountyId = String(formData.get("bountyId") || "") || null;
  const projectId = String(formData.get("projectId") || "") || null;
  if (!body || (!bountyId && !projectId)) return;

  await prisma.comment.create({
    data: { body, userId: user.id, bountyId, projectId },
  });
  if (bountyId) revalidatePath(`/bounties/${bountyId}`);
  if (projectId) revalidatePath(`/agents/${projectId}`);
}
