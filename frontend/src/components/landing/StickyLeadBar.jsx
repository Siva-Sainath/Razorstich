import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/** Bottom sticky CTA — appears after scroll on marketing pages. */
export const StickyLeadBar = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 border-t border-white/[0.08] bg-[hsl(218_62%_7%)]/95 backdrop-blur-xl px-4 py-3"
      data-testid="sticky-lead-bar"
    >
      <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-3">
        <p className="type-meta text-white/60">
          <span className="text-white/85 font-medium">Razorpay merchants</span> — pilot slots open this week
        </p>
        <div className="flex gap-2">
          <Link to="/checkout" className="btn-quiet h-9 px-4 inline-flex items-center text-xs">
            Try demo
          </Link>
          <Link to="/start" className="btn-primary h-9 px-5 inline-flex items-center text-xs">
            Get pilot access
          </Link>
        </div>
      </div>
    </div>
  );
};
