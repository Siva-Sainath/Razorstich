import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WEDGE_LANES } from '@/config/wedges';

export const WedgeNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="flex items-center gap-2 shrink-0 flex-wrap" data-testid="wedge-nav">
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
      <Link
        to="/integrations"
        className={`rounded-full px-3 py-1.5 type-micro font-medium border transition-colors ${
          pathname === '/integrations'
            ? 'border-white/30 bg-white/10 text-white'
            : 'border-white/10 text-white/45 hover:text-white/70'
        }`}
      >
        Integrations
      </Link>
      <Link
        to="/"
        className={`rounded-full px-3 py-1.5 type-micro font-medium border transition-colors ml-1 ${
          pathname === '/'
            ? 'border-white/30 bg-white/10 text-white'
            : 'border-white/10 text-white/45 hover:text-white/70'
        }`}
      >
        Home
      </Link>
      <Link
        to="/research"
        className={`rounded-full px-3 py-1.5 type-micro font-medium border transition-colors ${
          pathname === '/research'
            ? 'border-white/30 bg-white/10 text-white'
            : 'border-white/10 text-white/45 hover:text-white/70'
        }`}
      >
        Research
      </Link>
      <Link
        to="/pricing"
        className={`rounded-full px-3 py-1.5 type-micro font-medium border transition-colors ${
          pathname === '/pricing'
            ? 'border-white/30 bg-white/10 text-white'
            : 'border-white/10 text-white/45 hover:text-white/70'
        }`}
      >
        Pricing
      </Link>
    </nav>
  );
};
