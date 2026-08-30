import React from 'react';
import { Link } from 'react-router-dom';
import { AmbientLightField } from '@/components/brand/AmbientLightField';
import { SiteNav } from '@/components/landing/SiteNav';
import { StickyLeadBar } from '@/components/landing/StickyLeadBar';

/**
 * Unified app shell — same nav, ambient background, and tokens on every route.
 * @param {'marketing' | 'demo'} variant — demo uses flex column for full-height stage
 */
export const AppShell = ({
  children,
  variant = 'marketing',
  showStickyLeadBar = false,
  showFooter = true,
}) => (
  <div className="min-h-screen rs-ambient noise-overlay text-white relative overflow-x-hidden flex flex-col">
    <AmbientLightField />
    <SiteNav />
    {showStickyLeadBar && <StickyLeadBar />}
    <main
      className={
        variant === 'demo'
          ? 'flex-1 min-h-0 flex flex-col relative z-10 overflow-hidden'
          : 'flex-1 relative z-10'
      }
    >
      {children}
    </main>
    {showFooter && variant !== 'demo' && <MarketingFooter />}
  </div>
);

/** Back-compat wrapper for marketing pages */
export const MarketingPageShell = ({
  children,
  showStickyLeadBar = false,
  navTransparent: _ignored,
}) => (
  <AppShell showStickyLeadBar={showStickyLeadBar}>{children}</AppShell>
);

export const MarketingFooter = () => (
  <footer className="border-t border-white/[0.06] py-8 relative z-10 shrink-0">
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between gap-4 type-meta text-white/35">
      <p>© 2026 RazorStitch</p>
      <div className="flex flex-wrap gap-4">
        <Link to="/research" className="hover:text-white/60">
          How it works
        </Link>
        <Link to="/integrations" className="hover:text-white/60">
          Integrations
        </Link>
        <Link to="/pricing?try=sandbox" className="hover:text-white/60">
          Test checkout
        </Link>
        <Link to="/checkout" className="hover:text-white/60">
          Demo
        </Link>
        <Link to="/pricing" className="hover:text-white/60">
          Pricing
        </Link>
        <Link to="/start" className="hover:text-white/60">
          Pilot access
        </Link>
      </div>
    </div>
  </footer>
);
