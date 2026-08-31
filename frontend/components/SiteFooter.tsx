import Link from "next/link";

export function SiteFooter() {
  return (
    <footer id="footer" className="mt-12 sm:mt-16 border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold text-slate-800">KelanaAI</p>
          <p className="text-sm text-slate-500 mt-0.5">
            © {new Date().getFullYear()} KelanaAI. All rights reserved.
          </p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
          <Link href="/#plan" className="hover:text-blue-600 transition-colors">
            Plan a Trip
          </Link>
          <Link href="/trips" className="hover:text-blue-600 transition-colors">
            My Trips
          </Link>
          <Link href="/#footer" className="hover:text-blue-600 transition-colors">
            About
          </Link>
          <a href="mailto:hello@kelana.ai" className="hover:text-blue-600 transition-colors">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
