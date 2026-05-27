import { Link, useLocation } from "wouter";
import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/", label: "Articles" },
  { href: "/assessments", label: "Assessments" },
  { href: "/herbs", label: "Herbs & Supplements" },
  { href: "/fire-toolkit", label: "Fire Toolkit" },
  { href: "/about", label: "About" },
];

export default function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loc] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))] sticky top-0 z-40 bg-[color-mix(in_oklch,var(--paper)_92%,transparent)] backdrop-blur-md">
        <div className="container flex items-center justify-between py-5">
          <Link href="/" className="no-underline">
            <span className="masthead text-[1.6rem] sm:text-[2rem] text-[var(--ink)]">
              The Anger Practice
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-7">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`dateline no-underline hover:text-[var(--ember)] transition-colors ${
                  loc === n.href ? "text-[var(--ember)]" : "text-[var(--ink)]"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <button
            className="md:hidden text-[var(--ink)]"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
            <div className="container py-4 flex flex-col gap-3">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="dateline text-[var(--ink)] no-underline"
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-24 border-t border-[color-mix(in_oklch,var(--ink)_14%,var(--paper))]">
        <div className="container py-12 grid md:grid-cols-3 gap-8">
          <div>
            <div className="masthead text-2xl text-[var(--ink)]">The Anger Practice</div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)] max-w-sm">
              A journal on healthy anger, rage work, and the body's wisdom.
              A companion to{" "}
              <a href="https://theoraclelover.com" className="text-[var(--ember-deep)]">
                theoraclelover.com
              </a>.
            </p>
          </div>
          <div>
            <div className="dateline mb-3">Pages</div>
            <ul className="space-y-1.5">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="text-sm no-underline hover:text-[var(--ember)]">
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/privacy" className="text-sm no-underline hover:text-[var(--ember)]">
                  Privacy & Disclosures
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="dateline mb-3">The Byline</div>
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
              Written by The Oracle Lover. A companion journal to{" "}
              <a href="https://theoraclelover.com" className="text-[var(--ember-deep)]">
                theoraclelover.com
              </a>
              . No influencer tone. No spiritual bypassing.
            </p>
            <p className="mt-4 text-xs text-[var(--muted-foreground)]">
              As an Amazon Associate we earn from qualifying purchases. Nothing here is medical advice.
            </p>
          </div>
        </div>
        <div className="container pb-8 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>© {new Date().getFullYear()} The Anger Practice</span>
          <span className="dateline">Vol. I / In Progress</span>
        </div>
      </footer>
    </div>
  );
}
