import Link from "next/link";

import { ROUTES } from "@/lib/routes";

const FOOTER_LINKS = [
  { href: ROUTES.legal, label: "Mentions légales" },
  { href: ROUTES.privacy, label: "Politique de confidentialité" },
  { href: ROUTES.terms, label: "Conditions d'utilisation" },
  { href: ROUTES.support, label: "Support" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 px-6 py-10">
      <nav className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500">
        {FOOTER_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-sky-600">
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
