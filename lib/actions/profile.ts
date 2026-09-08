"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type ProfileFormState = { error?: string; ok?: boolean };

const AVATAR_COLORS = [
  "#10b981",
  "#38bdf8",
  "#fbbf24",
  "#a78bfa",
  "#fb7185",
  "#34d399",
  "#f472b6",
  "#60a5fa",
];

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // displayName 允许与他人重名；username 为唯一 handle 不可修改，uid 永不外露
  const displayName = String(formData.get("displayName") || "").trim();
  const avatarColor = String(formData.get("avatarColor") || "");
  const avatarUrl = String(formData.get("avatarUrl") || "").trim();

  if (!displayName || displayName.length > 30) return { error: "format" };
  if (avatarUrl && !/^https?:\/\/.{1,290}$/.test(avatarUrl)) {
    return { error: "format" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName,
      avatarColor: AVATAR_COLORS.includes(avatarColor)
        ? avatarColor
        : user.avatarColor,
      avatarUrl: avatarUrl || null,
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { ok: true };
}
