"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fetchGithubRepo } from "@/lib/github";
import { rateLimit } from "@/lib/ratelimit";

export async function importGithubRepo(url: string) {
  return fetchGithubRepo(url);
}

export async function createProject(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await rateLimit("createProject", 10, 60_000))) {
    redirect("/agents/new?error=2");
  }

  const name = String(formData.get("name") || "").trim();
  const tagline = String(formData.get("tagline") || "").trim();
  const readme = String(formData.get("readme") || "").trim();
  const framework = String(formData.get("framework") || "自研框架");
  const language = String(formData.get("language") || "Python");
  const scenario = String(formData.get("scenario") || "其他");
  const openType = String(formData.get("openType") || "FULL");
  const kind = String(formData.get("kind") || "AGENT");
  const licenseType = String(formData.get("licenseType") || "MIT");
  const repoUrl = String(formData.get("repoUrl") || "").trim();

  if (!name || !tagline || !readme) {
    redirect("/agents/new?error=1");
  }

  const project = await prisma.project.create({
    data: {
      name,
      tagline,
      readme,
      framework,
      language,
      scenario,
      openType,
      kind: ["AGENT", "COMPONENT", "BENCHMARK"].includes(kind)
        ? kind
        : "AGENT",
      licenseType,
      repoUrl: repoUrl || null,
      ownerId: user.id,
    },
  });
  redirect(`/agents/${project.id}`);
}

export async function toggleStar(projectId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existing = await prisma.star.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (existing) {
    await prisma.star.delete({ where: { id: existing.id } });
  } else {
    await prisma.star.create({ data: { userId: user.id, projectId } });
  }
  revalidatePath(`/agents/${projectId}`);
  revalidatePath("/agents");
  revalidatePath("/");
}
