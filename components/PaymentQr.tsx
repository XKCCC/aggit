"use client";

import { useState } from "react";

// 收款码图片：文件未上传时优雅降级为占位提示
export default function PaymentQr({
  src,
  alt,
  missingHint,
}: {
  src: string;
  alt: string;
  missingHint: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-dashed border-[#30363d] p-3 text-center text-xs text-zinc-600">
        {missingHint}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      className="h-40 w-40 rounded-lg border border-[#30363d] bg-white object-contain"
      onError={() => setFailed(true)}
    />
  );
}
