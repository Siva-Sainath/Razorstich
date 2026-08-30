import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogoMark } from '@/components/brand/LogoMark';

const NAV_LINKS = [
  { to: '/research', label: 'How it works' },
  { to: '/integrations', label: 'Integrations' },
  { to: '/sandbox', label: 'Test checkout' },
  { to: '/checkout', label: 'Demo' },
  { to: '/pricing', label: 'Pricing' },
];

export const SiteNav = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/[0.06] bg-[hsl(218_62%_7%)]/95 backdrop-blur-xl shrink-0"
      data-testid="site-nav"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <LogoMark size={28} />
          <span className={`type-body font-semibold hidden sm:inline text-white/90`}>
            Razor<span className="text-primary">Stitch</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.to ||
              (link.to === '/checkout' && ['/checkout', '/cart', '/subscription', '/invoice'].includes(pathname));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg type-meta transition-colors ${ active
                      ? 'text-white bg-white/[0.08]'
                      : 'text-white/55 hover:text-white/85 hover:bg-white/[0.04]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/checkout" className="hidden sm:inline-flex btn-quiet items-center px-4">
            Try demo
          </Link>
          <Link to="/start" className="btn-primary inline-flex items-center px-4">
            Get pilot access
          </Link>
          <button
            type="button"
            className={`md:hidden p-2 text-white/60 hover:text-white`}
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          className={`md:hidden border-t px-4 py-3 space-y-1 border-white/[0.06] bg-[hsl(218_62%_7%)]`}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-3 py-2.5 rounded-lg type-body text-white/70 hover:bg-white/[0.05]`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
