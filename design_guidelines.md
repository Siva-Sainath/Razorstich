{
  "brand": {
    "product_name": "Midnight Operating Theater",
    "elevated_brand_name": "M.O.T. — Midnight Operating Theater",
    "tagline": "Payment Resuscitation Console",
    "brand_attributes": [
      "cinematic",
      "clinical-precise",
      "high-stakes",
      "companion-like intelligence",
      "instrument-grade",
      "recognizable at a glance"
    ],
    "wordmark_treatment": {
      "structure": "Two-line lockup: 'MIDNIGHT' (mono caps) above 'OPERATING THEATER' (serif), with a thin ECG baseline running through the gap.",
      "typography": {
        "primary": "Newsreader (keep)",
        "support": "IBM Plex Mono (keep)",
        "styling": "Use mono for labels/telemetry; serif for narrative headings. Add subtle tracking and small-caps feel via uppercase + letterspacing."
      },
      "implementation_hint": "Create a <Wordmark /> component that renders text + inline SVG ECG line. Keep it static by default; animate only the ECG stroke-dashoffset in hero/topbar."
    },
    "logo_mark_concept_svg_buildable": {
      "concept": "ECG + Razor-glyph-inspired corner geometry: a rounded-rect 'monitor' frame with one corner notched (existing motif), containing a single ECG spike that doubles as an upward recovery arrow.",
      "geometry_rules": [
        "Angles derived from a consistent 12°/24° chamfer system (echo RazorSense 'glyph-derived edges').",
        "Stroke-only mark (no fills) so it reads like etched instrument labeling.",
        "Use 2 strokes: outer frame (muted) + ECG trace (accent)."
      ],
      "svg_spec": {
        "viewBox": "0 0 64 64",
        "strokes": {
          "frame": "hsl(var(--border) / 0.9)",
          "trace": "hsl(var(--accent-cyan))"
        },
        "strokeWidth": 2,
        "linecap": "round",
        "linejoin": "round",
        "paths": [
          "Frame: rounded rect with one notched corner",
          "Trace: baseline -> spike -> baseline -> small recovery uptick"
        ]
      },
      "animation": "On load: trace draws in (stroke-dasharray/dashoffset). Idle: subtle pulse glow via filter drop-shadow opacity (no transform)."
    }
  },

  "design_personality": {
    "style_fusion": [
      "Operating-room vital monitor UI (clinical hierarchy, green/amber/red semantics)",
      "RazorSense-like pulse responsiveness (alive at every touchpoint)",
      "Cinematic noir + instrument tray labeling",
      "Subtle CRT/phosphor hints (scanline + bloom) used as overlay only"
    ],
    "signature_visual_devices": [
      {
        "name": "Vital Top Bar (Monitor Rail)",
        "what": "A thin fixed top rail that looks like a patient monitor header: left wordmark, center live ECG trace, right 'Vitals' chips (P(recover), amount, latency).",
        "where": "Global header above CaseHeader; does not change existing layout, just wraps/frames it.",
        "implementation": {
          "tailwind": "fixed top-0 inset-x-0 z-[120] h-12 px-4 flex items-center gap-4 bg-[hsl(var(--background)/0.72)] backdrop-blur-md border-b border-[hsl(var(--border)/0.7)]",
          "notes": "Keep height small; avoid stealing vertical space. Use pointer-events-none for the ECG canvas/SVG so it doesn't block interactions."
        }
      },
      {
        "name": "Instrument Tray Indexing",
        "what": "Every panel gets an 'INSTRUMENT 01' mono label + a thin vertical tick ruler on the left edge.",
        "where": "All glass panels (FailureAnatomy, RecoveryWindow, etc.).",
        "implementation": {
          "pattern": "Add a PanelChrome wrapper component that renders: top-left label, left ruler, corner-notch, and optional status dot.",
          "tailwind": "relative corner-notch glass-panel px-4 pt-4 pb-3",
          "ruler_css": ".panel-ruler{position:absolute;left:10px;top:44px;bottom:14px;width:1px;background:linear-gradient(to bottom, transparent, hsl(var(--border)/0.9), transparent);} .panel-ruler::after{content:'';position:absolute;inset:0;background-image:repeating-linear-gradient(to bottom, rgba(255,255,255,0.0) 0, rgba(255,255,255,0.0) 10px, rgba(94,234,212,0.22) 10px, rgba(94,234,212,0.22) 11px);opacity:.55;}"
        }
      },
      {
        "name": "ECG Probability Trace",
        "what": "A live ECG-like line whose amplitude maps to P(recover). Flatline at low probability; stronger spikes as probability rises.",
        "where": "Top bar center + optionally faint watermark behind RecoveryWindow.",
        "implementation": {
          "svg": "Use an SVG path updated at ~10–15fps max. Animate stroke-dashoffset for 'moving' feel; do not animate layout.",
          "css": "stroke: hsl(var(--accent-green)); filter: drop-shadow(0 0 10px rgba(52,211,153,.25)); opacity:.9;",
          "accessibility": "Provide aria-label and a text fallback: 'Recovery trace'."
        }
      },
      {
        "name": "Crosshair Cursor for Charts",
        "what": "Charts feel like instruments: on hover, show a thin crosshair + coordinate readout in mono.",
        "where": "RecoveryWindow, CounterfactualGhostRuns, TrustBudget.",
        "implementation": {
          "css": ".chart-scope{cursor:crosshair;} .crosshair-x,.crosshair-y{position:absolute;background:rgba(94,234,212,.22);} .crosshair-x{height:1px;left:0;right:0;} .crosshair-y{width:1px;top:0;bottom:0;}"
        }
      },
      {
        "name": "Giant Watermark Type",
        "what": "Large, ultra-low-opacity serif watermark behind the grid: 'RESUSCITATION' / 'RECOVERY PROTOCOL'.",
        "where": "Background layer only.",
        "implementation": {
          "tailwind": "pointer-events-none fixed inset-0 z-[0]",
          "css": ".bg-watermark{font-family:var(--font-heading);font-weight:600;letter-spacing:.02em;color:rgba(255,255,255,.04);text-transform:uppercase;}"
        }
      },
      {
        "name": "Sterilization Boot Sequence (Intro)",
        "what": "A 900ms intro overlay: 'Sterilizing instruments…', progress ticks, then fades. Feels like powering on an OR console.",
        "where": "On initial mount only; must not block SSE or interactions beyond 1s.",
        "implementation": {
          "motion": "Framer Motion overlay opacity 0->1->0; progress bar uses scaleX only.",
          "reduced_motion": "If prefers-reduced-motion: skip overlay entirely."
        }
      },
      {
        "name": "CRT Scanline + Phosphor Hint (Subtle)",
        "what": "A very subtle scanline overlay + occasional vertical sweep at 0.02–0.04 opacity.",
        "where": "Global overlay (like existing noise-overlay), capped to be decorative only.",
        "implementation": {
          "css": ".scanlines::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:2;opacity:.035;background:repeating-linear-gradient(to bottom, rgba(255,255,255,.06) 0, rgba(255,255,255,.06) 1px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px);mix-blend-mode:overlay;} .phosphor-sweep::after{content:'';position:fixed;inset:-20% 0;pointer-events:none;z-index:2;background:linear-gradient(to bottom, transparent, rgba(52,211,153,.08), transparent);transform:translateY(-60%);animation:sweep 9s linear infinite;opacity:.25;} @keyframes sweep{0%{transform:translateY(-60%);}100%{transform:translateY(60%);}}",
          "rule": "Disable sweep animation under prefers-reduced-motion."
        }
      }
    ]
  },

  "color_system": {
    "notes": "Keep existing base (ink background + cyan/emerald/amber). Refine into semantic OR monitor palette with strict roles.",
    "tokens_css_variables": {
      "background": "210 25% 4%",
      "surface_1": "210 22% 7%",
      "surface_2": "210 18% 12%",
      "border": "210 15% 18%",
      "text_primary": "0 0% 96%",
      "text_muted": "0 0% 64%",
      "accent_cyan": "186 100% 55%",
      "accent_green": "152 84% 52%",
      "accent_amber": "38 92% 56%",
      "danger": "0 78% 58%",
      "info_blue": "199 92% 60%",
      "sterile_white": "0 0% 98%"
    },
    "allowed_gradients_under_20pct_viewport": [
      {
        "use": "theater-wash background only",
        "css": "radial-gradient(900px circle at 18% 8%, rgba(0, 255, 200, 0.07), transparent 55%), radial-gradient(720px circle at 82% 12%, rgba(255, 184, 72, 0.05), transparent 55%), radial-gradient(1000px circle at 50% 110%, rgba(0, 180, 255, 0.05), transparent 60%)"
      }
    ],
    "semantic_mapping": {
      "ok": "accent_green",
      "caution": "accent_amber",
      "critical": "danger",
      "active_focus_ring": "accent_cyan"
    }
  },

  "typography": {
    "font_pairing": {
      "headings": "Newsreader",
      "mono": "IBM Plex Mono",
      "optional_swap_if_needed": "If you want more 'product recognizable' headings without losing editorial feel: swap headings to 'Spectral' (Google Font) but only if Newsreader feels too literary. Default: keep Newsreader."
    },
    "scale": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl",
      "h2": "text-base md:text-lg",
      "body": "text-sm md:text-base",
      "label_caps": "text-[11px] tracking-[0.18em] uppercase font-mono"
    },
    "styling_rules": [
      "Use mono for numbers, probabilities, timestamps, and panel indices.",
      "Use serif for section titles and narrative explanations.",
      "Avoid center alignment; left-align for scanability."
    ]
  },

  "layout_and_grid": {
    "desktop_first": {
      "target": "1920x1080 projector",
      "grid": "Keep existing grid; add chrome layers that do not change panel sizes.",
      "spacing": "Increase internal padding by +4px to +8px per panel if safe; prefer whitespace over extra borders."
    },
    "panel_chrome_wrapper": {
      "goal": "Add consistent identity without touching inner component logic or data-testids.",
      "structure": [
        "Outer: glass-panel + corner-notch",
        "Top row: instrument label + status chip",
        "Left: ruler",
        "Optional: faint watermark glyph"
      ]
    }
  },

  "components": {
    "component_path": {
      "shadcn_primary": [
        "/app/frontend/src/components/ui/button.jsx",
        "/app/frontend/src/components/ui/badge.jsx",
        "/app/frontend/src/components/ui/card.jsx",
        "/app/frontend/src/components/ui/tooltip.jsx",
        "/app/frontend/src/components/ui/tabs.jsx",
        "/app/frontend/src/components/ui/slider.jsx",
        "/app/frontend/src/components/ui/progress.jsx",
        "/app/frontend/src/components/ui/separator.jsx",
        "/app/frontend/src/components/ui/scroll-area.jsx",
        "/app/frontend/src/components/ui/sonner.jsx"
      ],
      "new_wrappers_to_add": [
        "src/components/brand/Wordmark.js",
        "src/components/brand/LogoMark.js",
        "src/components/brand/VitalTopBar.js",
        "src/components/brand/PanelChrome.js",
        "src/components/brand/ECGTrace.js",
        "src/components/brand/SterilizeIntro.js"
      ]
    },
    "button_system": {
      "style": "Professional / instrument-grade",
      "variants": {
        "primary": "Cyan outline + subtle fill on hover; focus ring cyan.",
        "secondary": "Glass ghost button; border + blur; hover increases border opacity.",
        "danger": "Solid danger with reduced saturation; no gradients."
      },
      "tailwind_examples": {
        "primary": "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--foreground))] border border-[hsl(var(--primary)/0.45)] hover:bg-[hsl(var(--primary)/0.18)] hover:border-[hsl(var(--primary)/0.7)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
        "ghost": "bg-transparent hover:bg-white/5 border border-white/10 hover:border-white/20",
        "press_motion": "active:scale-[0.98] transition-[background-color,border-color,box-shadow,opacity] duration-150"
      },
      "data_testid_rule": "Do not remove existing data-testids. Any new buttons must add data-testid in kebab-case."
    },
    "badges_and_chips": {
      "vitals_chip": "Use Badge with mono text; color by semantic mapping (ok/caution/critical).",
      "tailwind": "font-mono text-[11px] tracking-[0.12em] uppercase bg-white/5 border-white/10"
    }
  },

  "motion_identity": {
    "principles": [
      "Pulse, not float: motion should feel like a monitor heartbeat (periodic, purposeful).",
      "Animate opacity/transform only for performance.",
      "Use short durations (120–220ms) for UI responses; longer (600–1200ms) for ambient pulses.",
      "No universal transitions; specify properties."
    ],
    "framer_motion_patterns": {
      "panel_enter": {
        "initial": "{ opacity: 0, y: 10 }",
        "animate": "{ opacity: 1, y: 0 }",
        "transition": "{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }"
      },
      "pulse_glow": {
        "animate": "{ opacity: [0.55, 0.9, 0.55] }",
        "transition": "{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }",
        "use": "Apply to small accent dots, not whole panels."
      },
      "thinking_state": {
        "animate": "{ opacity: [0.35, 0.75, 0.35] }",
        "transition": "{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }",
        "use": "Skeleton loaders / 'AI evaluating' labels."
      },
      "ecg_trace": {
        "technique": "stroke-dashoffset animation on SVG path; update path points from probability.",
        "transition": "Use requestAnimationFrame throttled; keep under 15fps."
      },
      "scrubber_feedback": {
        "animate": "On drag: scaleX highlight bar to 1.02 and increase opacity; on release: spring back.",
        "transition": "{ type: 'spring', stiffness: 380, damping: 30 }"
      }
    },
    "hover_microinteractions": {
      "buttons": "hover: slight border brighten + subtle glow shadow; active: scale 0.98",
      "panels": "hover: border opacity increases; do NOT translate panels (avoid layout jitter)",
      "charts": "hover: crosshair fades in (opacity transition only)"
    }
  },

  "css_svg_implementation_hints": {
    "global_overlays": {
      "order": "Background wash (z0) -> watermark (z0) -> app content (z10+) -> noise overlay (z1 fixed) -> scanlines (z2 fixed)",
      "note": "Ensure overlays are pointer-events:none and do not interfere with clicks."
    },
    "panel_edges": {
      "rule": "Keep existing corner-notch but refine: reduce opacity, add inner hairline via box-shadow inset.",
      "css": ".glass-panel{box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 18px 60px rgba(0,0,0,0.55);}"
    },
    "svg_chart_style": {
      "strokes": "Use 1.5–2px strokes; dashed for counterfactual ghosts; solid for primary.",
      "colors": "Primary curve: accent-cyan; probability/ok: accent-green; warnings: amber; failures: danger.",
      "glow": "Use filter drop-shadow only; avoid heavy blur."
    }
  },

  "libraries": {
    "required": [
      {
        "name": "No new libraries required",
        "reason": "All signature devices can be built with CSS + SVG + framer-motion already present."
      }
    ],
    "optional": [
      {
        "name": "vault66-crt-effect",
        "reason": "If you want a turnkey CRT preset; otherwise implement CSS scanlines manually.",
        "install": "npm i vault66-crt-effect",
        "usage_note": "Keep opacity extremely low; do not let CRT effect reduce readability."
      }
    ]
  },

  "image_urls": {
    "note": "This dashboard is mostly vector/typography driven. Avoid stock photos; use SVG devices instead.",
    "categories": [
      {
        "category": "background_texture",
        "description": "Optional subtle grain/noise already implemented via data-uri SVG. No external images needed.",
        "urls": []
      }
    ]
  },

  "instructions_to_main_agent": [
    "Do NOT change existing component logic or remove/rename any existing data-testid attributes.",
    "Implement brand elevation as wrappers/overlays: VitalTopBar, PanelChrome, Wordmark, LogoMark, ECGTrace, SterilizeIntro.",
    "Keep gradients limited to the existing theater-wash background (<=20% viewport impact). No purple/pink gradients.",
    "All new interactive elements must include data-testid in kebab-case.",
    "Prefer CSS + SVG + framer-motion; animate opacity/transform only. For ECG line, animate stroke-dashoffset and update path points at low FPS.",
    "Ensure overlays (noise/scanlines/watermark) are pointer-events:none and z-indexed so they never block interactions.",
    "Maintain dark-only color-scheme; ensure WCAG AA contrast for text on glass panels (increase text opacity rather than brightening backgrounds).",
    "Use shadcn/ui components from /app/frontend/src/components/ui (Button, Badge, Tooltip, Tabs, Slider, Progress, ScrollArea, Sonner)."
  ],

  "citations": {
    "razorsense": [
      "https://razorpay.com/razorsense/",
      "https://blade.razorpay.com/?path=/story/components-razorsense--default"
    ],
    "crt_reference": [
      "https://github.com/mdombrov-33/vault66-crt-effect",
      "https://github.com/TheGreatGildo/nerv-ui"
    ]
  },

  "general_ui_ux_design_guidelines_appendix": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
