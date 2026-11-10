"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

function resolveUrl(url: string | undefined, base: string | undefined) {
  if (!url || !base) return url;
  // 已是绝对地址或锚点/协议相对地址：不动
  if (/^(https?:)?\/\//.test(url) || url.startsWith("#") || url.startsWith("data:")) {
    return url;
  }
  const clean = url.replace(/^\.?\//, "");
  return `${base}${clean}`;
}

export default function Markdown({
  content,
  rawBase,
  blobBase,
}: {
  content: string;
  rawBase?: string; // https://raw.githubusercontent.com/{owner}/{repo}/HEAD/
  blobBase?: string; // https://github.com/{owner}/{repo}/blob/HEAD/
}) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // 渲染 GitHub README 常见的内嵌 HTML（居中图/徽章/链接行），同时消毒防 XSS
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // GitHub 相对路径资源 → 解析到仓库原始地址（与 GitHub 渲染行为一致）
          img: ({ src, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveUrl(typeof src === "string" ? src : undefined, rawBase)} {...props} />
          ),
          a: ({ href, ...props }) => (
            // eslint-disable-next-line jsx-a11y/anchor-has-content
            <a
              href={resolveUrl(typeof href === "string" ? href : undefined, blobBase)}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
