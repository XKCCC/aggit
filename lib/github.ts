export interface GithubRepoInfo {
  name: string;
  description: string;
  readme: string;
  language: string;
  stars: number;
  repoUrl: string;
}

export function parseGithubUrl(
  url: string
): { owner: string; repo: string } | null {
  const match = url
    .trim()
    .match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

export async function fetchGithubRepo(
  url: string
): Promise<{ data?: GithubRepoInfo; error?: string }> {
  const parsed = parseGithubUrl(url);
  if (!parsed) {
    return { error: "无法识别的 GitHub 仓库地址，格式应为 https://github.com/owner/repo" };
  }
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "aggit-app",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  try {
    const repoRes = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers, next: { revalidate: 300 } }
    );
    if (!repoRes.ok) {
      return { error: `仓库拉取失败（HTTP ${repoRes.status}），请确认仓库为公开仓库` };
    }
    const repo = await repoRes.json();

    let readme = "";
    const readmeRes = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`,
      {
        headers: { ...headers, Accept: "application/vnd.github.raw" },
        next: { revalidate: 300 },
      }
    );
    if (readmeRes.ok) {
      readme = await readmeRes.text();
    }

    return {
      data: {
        name: repo.name ?? parsed.repo,
        description: repo.description ?? "",
        readme,
        language: repo.language ?? "",
        stars: repo.stargazers_count ?? 0,
        repoUrl: repo.html_url ?? url,
      },
    };
  } catch {
    return { error: "网络请求失败，请稍后重试或改为手动填写" };
  }
}
