import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { mockLogin } from "@/lib/actions/auth";
import Avatar from "@/components/Avatar";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const { m } = await getI18n();
  const current = await getCurrentUser();
  if (current) redirect("/dashboard");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const developers = users.filter((u) => u.role === "DEVELOPER");
  const employers = users.filter((u) => u.role === "EMPLOYER");

  const groups = [
    { title: m.login.devAccounts, list: developers, ring: "hover:border-emerald-400/50" },
    { title: m.login.employerAccounts, list: employers, ring: "hover:border-violet-400/50" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-zinc-50">
          <span className="text-emerald-400">ag</span>git · {m.login.title}
        </h1>
        <p className="mt-3 text-sm text-zinc-400">{m.login.subtitle}</p>
        {sp.error && (
          <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-red-300">
            {m.login.error}
          </p>
        )}
      </div>

      {groups.map((g) => (
        <section key={g.title} className="mt-10">
          <h2 className="mb-4 text-sm font-medium text-zinc-400">{g.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {g.list.map((u) => (
              <form key={u.id} action={mockLogin}>
                <input type="hidden" name="username" value={u.username} />
                <button
                  type="submit"
                  className={`flex w-full items-center gap-3 rounded-xl border border-[#21262d] bg-[#0d1117] p-4 text-left transition-colors ${g.ring}`}
                >
                  <Avatar name={u.displayName} color={u.avatarColor} size={40} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-zinc-100">
                      {u.displayName}
                      <span className="ml-2 font-mono text-xs text-zinc-500">
                        @{u.username}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-1 block text-xs text-zinc-500">
                      {u.bio}
                    </span>
                  </span>
                </button>
              </form>
            ))}
          </div>
        </section>
      ))}

      <p className="mt-12 rounded-xl border border-[#21262d] bg-[#161b22] p-4 text-center text-xs text-zinc-500">
        {m.login.oauthNote}
      </p>
    </div>
  );
}
