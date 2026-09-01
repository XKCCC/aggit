import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { setLocale } from "@/lib/actions/locale";
import { logout } from "@/lib/actions/auth";
import Avatar from "./Avatar";

export default async function Navbar() {
  const user = await getCurrentUser();
  const { locale, m } = await getI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-[#21262d] bg-[#0d1117]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-emerald-400">ag</span>
            <span className="text-zinc-100">git</span>
          </span>
          <span className="hidden text-xs text-zinc-500 md:inline">
            {m.nav.tagline}
          </span>
        </Link>

        <nav className="ml-2 flex items-center gap-1 text-sm">
          <Link
            href="/agents"
            className="rounded-md px-3 py-1.5 text-zinc-300 hover:bg-[#161b22] hover:text-white"
          >
            {m.nav.explore}
          </Link>
          <Link
            href="/bounties"
            className="rounded-md px-3 py-1.5 text-zinc-300 hover:bg-[#161b22] hover:text-white"
          >
            {m.nav.bounties}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form action={setLocale.bind(null, locale === "en" ? "zh" : "en")}>
            <button
              type="submit"
              className="rounded-md border border-[#30363d] px-2 py-1 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white"
              title="Switch language / 切换语言"
            >
              {locale === "en" ? "中文" : "EN"}
            </button>
          </form>

          {user ? (
            <>
              <Link
                href="/agents/new"
                className="hidden rounded-md border border-[#30363d] px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white md:block"
              >
                {m.nav.publishAgent}
              </Link>
              <Link
                href="/bounties/new"
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-[#0d1117] hover:bg-emerald-400"
              >
                {m.nav.postBounty}
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-[#161b22]"
                title={m.nav.dashboard}
              >
                <Avatar
                  name={user.displayName}
                  color={user.avatarColor}
                  size={26}
                />
                <span className="hidden text-sm text-zinc-300 lg:inline">
                  {user.displayName}
                </span>
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  {m.nav.logout}
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-[#0d1117] hover:bg-emerald-400"
            >
              {m.nav.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
