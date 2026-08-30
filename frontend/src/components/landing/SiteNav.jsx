import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogoMark } from '@/components/brand/LogoMark';
import { PAGE_CONTAINER } from '@/components/landing/MarketingLayout';

const NAV_LINKS = [
  { to: '/research', label: 'How it works' },
  { to: '/integrations', label: 'Integrations' },
  { to: '/checkout', label: 'Demo', matchDemo: true },
  { to: '/pricing', label: 'Pricing', matchPricing: true },
];

const DEMO_PATHS = ['/checkout', '/cart', '/subscription', '/invoice'];

export const SiteNav = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const onDemo = DEMO_PATHS.includes(pathname);

  const isActive = (link) => {
    if (link.matchDemo) return DEMO_PATHS.includes(pathname);
    if (link.matchPricing) return pathname === '/pricing';
    return pathname === link.to || pathname.startsWith(`${link.to}/`);
  };

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/[0.06] bg-[hsl(218_62%_7%)]/95 backdrop-blur-xl shrink-0"
      data-testid="site-nav"
    >
      <div className={`${PAGE_CONTAINER} h-14 flex items-center justify-between gap-3`}>
        <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <LogoMark size={28} />
          <span className="type-body font-semibold hidden xs:inline sm:inline text-white/90">
            Razor<span className="text-primary">Stitch</span>
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-0.5 flex-1 justify-center max-w-md mx-auto">
          {NAV_LINKS.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg type-meta transition-colors ${
                  active
                    ? 'text-white bg-white/[0.08]'
                    : 'text-white/55 hover:text-white/85 hover:bg-white/[0.04]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {!onDemo && (
            <Link to="/checkout" className="hidden md:inline-flex btn-quiet items-center px-3 text-xs h-9">
              Try demo
            </Link>
          )}
          <Link to="/start" className="btn-primary inline-flex items-center px-4 h-9 text-sm">
            Get pilot access
          </Link>
          <button
            type="button"
            className="sm:hidden p-2 text-white/60 hover:text-white"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="sm:hidden border-t border-white/[0.06] bg-[hsl(218_62%_7%)] px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-3 py-2.5 rounded-lg type-body ${
                isActive(link) ? 'text-white bg-white/[0.08]' : 'text-white/70 hover:bg-white/[0.05]'
              }`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {!onDemo && (
            <Link
              to="/checkout"
              className="block px-3 py-2.5 rounded-lg type-body text-white/70 hover:bg-white/[0.05]"
              onClick={() => setOpen(false)}
            >
              Try demo
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
