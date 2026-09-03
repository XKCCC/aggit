"use server";

import { newCaptcha } from "@/lib/captcha";

export async function getCaptcha() {
  return newCaptcha();
}
