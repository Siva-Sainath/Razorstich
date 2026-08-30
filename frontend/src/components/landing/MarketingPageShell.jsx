import React from 'react';
import { Link } from 'react-router-dom';
import { AmbientLightField } from '@/components/brand/AmbientLightField';
import { SiteNav } from '@/components/landing/SiteNav';
import { StickyLeadBar } from '@/components/landing/StickyLeadBar';

/**
 * Shared GTM page chrome — matches landing / integrations / pricing / research / start.
 * Deep-ink ambient, single nav hierarchy.
 */
export const MarketingPageShell = ({
  children,
  navTransparent = true,
  showStickyLeadBar = false,
}) => (
  <div className="min-h-screen rs-ambient noise-overlay text-white relative overflow-x-hidden flex flex-col">
    <AmbientLightField />
    <SiteNav transparent={navTransparent} />
    {showStickyLeadBar && <StickyLeadBar />}
    <main className="flex-1">
      {children}
    </main>
  </div>
);

export const MarketingFooter = () => (
  <footer className="border-t border-white/[0.06] py-8">
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between gap-4 type-meta text-white/35">
      <p>© 2026 RazorStitch</p>
      <div className="flex gap-4">
        <Link to="/start" className="hover:text-white/60">Pilot access</Link>
        <Link to="/pricing" className="hover:text-white/60">Pricing</Link>
        <Link to="/research" className="hover:text-white/60">How it works</Link>
      </div>
    </div>
  </footer>
);
