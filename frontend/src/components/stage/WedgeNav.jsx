import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WEDGE_LANES } from '@/config/wedges';

/** Wedge tabs only — global links live in SiteNav. */
export const WedgeNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="flex items-center gap-2 shrink-0 flex-wrap" data-testid="wedge-nav">
      <span className="type-micro text-white/30 mr-1 hidden sm:inline">Recovery case</span>
      {WEDGE_LANES.map((lane) => {
        const active = pathname === lane.path;
        return (
          <Link
            key={lane.wedge}
            to={lane.path}
            className={`rounded-full px-3 py-1.5 type-micro font-medium border transition-colors ${
              active
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-white/10 text-white/50 hover:text-white/80 hover:border-white/20'
            }`}
          >
            {lane.short}
          </Link>
        );
      })}
    </nav>
  );
};
