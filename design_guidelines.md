{
  "brand": {
    "name": "RazorStitch",
    "design_philosophy": "RazorSense-aligned: calm, intelligent, premium, cohesive. Deep-ink surfaces, hairline borders, restrained glow, generous whitespace, minimal iconography. No badge/pill noise; status is contextual and sentence-like.",
    "do_not": [
      "No fixed top health bar (remove entirely).",
      "No generic SaaS dashboard patterns (over-bento, loud badges, random pills).",
      "No anxiety styling (no red floods, no alarm icons).",
      "No purple/pink; no saturated gradients; gradients <= 20% viewport and never on reading areas.",
      "No mixed radii/paddings/text scales—use the unified tokens below."
    ]
  },

  "token_sheet": {
    "typography": {
      "font_stack": {
        "display": "Newsreader, Georgia, serif",
        "sans": "Inter, ui-sans-serif, system-ui, sans-serif",
        "mono": "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
      },
      "usage_rules": [
        "Newsreader only for: hero title, panel titles, key narrative phrases (1 line).",
        "Inter for: body, labels, helper text, buttons.",
        "IBM Plex Mono for: amounts, timestamps, IDs, odds %, chart axis ticks, deltas. Always tabular-nums."
      ],
      "type_scale_px": {
        "display": {
          "name": "display",
          "tailwind": "text-4xl sm:text-5xl lg:text-6xl",
          "exact": { "size_px": 44, "line_height_px": 52, "weight": 600, "tracking": "-0.015em" },
          "notes": "Use sparingly: only the main hero headline."
        },
        "h_panel": {
          "name": "h-panel",
          "exact": { "size_px": 18, "line_height_px": 24, "weight": 600, "tracking": "-0.01em" },
          "notes": "Panel titles (Newsreader)."
        },
        "h_section": {
          "name": "h-section",
          "exact": { "size_px": 16, "line_height_px": 22, "weight": 600, "tracking": "-0.005em" },
          "notes": "Subheads inside panels (Inter)."
        },
        "body": {
          "name": "body",
          "exact": { "size_px": 14, "line_height_px": 20, "weight": 500, "tracking": "0em" },
          "notes": "Default reading size."
        },
        "body_sm": {
          "name": "body-sm",
          "exact": { "size_px": 13, "line_height_px": 18, "weight": 500, "tracking": "0em" }
        },
        "meta": {
          "name": "meta",
          "exact": { "size_px": 12, "line_height_px": 16, "weight": 500, "tracking": "0em" },
          "notes": "Quiet labels; sentence case; no uppercase."
        },
        "micro": {
          "name": "micro",
          "exact": { "size_px": 11, "line_height_px": 14, "weight": 500, "tracking": "0.01em" },
          "notes": "Chart ticks, tiny helper text."
        },
        "data_mono": {
          "name": "data-mono",
          "exact": { "size_px": 12, "line_height_px": 16, "weight": 500, "tracking": "0em" },
          "notes": "All numeric UI; apply .font-mono + .tabular-nums."
        },
        "data_mono_lg": {
          "name": "data-mono-lg",
          "exact": { "size_px": 16, "line_height_px": 20, "weight": 600, "tracking": "-0.005em" },
          "notes": "Hero amount + key odds number."
        }
      },
      "text_color_ladder_white_alpha": {
        "w90": "rgba(255,255,255,0.90)",
        "w70": "rgba(255,255,255,0.70)",
        "w55": "rgba(255,255,255,0.55)",
        "w40": "rgba(255,255,255,0.40)",
        "rule": "Use w90 for primary text, w70 for secondary, w55 for meta labels, w40 for disabled/placeholder only."
      }
    },

    "spacing_scale_px": {
      "scale": [4, 8, 12, 16, 20, 24, 32, 40, 48],
      "panel_padding": {
        "reference_card": 32,
        "standard_panel": 24,
        "dense_panel": 20,
        "nested_block": 16
      },
      "gaps": {
        "tight": 8,
        "default": 12,
        "roomy": 16,
        "hero": 20
      },
      "rules": [
        "All major panels use ONE of: p-6 (24px) or p-8 (32px). No px-5/7.",
        "Inside panels: default gap-3 (12px); use gap-4 (16px) for hero blocks."
      ]
    },

    "radius_scale_px": {
      "card": 24,
      "nested": 16,
      "control": 12,
      "pill": 999,
      "rules": [
        "Cards/panels: rounded-[24px] only.",
        "Nested surfaces (inner charts, inset blocks): rounded-[16px].",
        "Controls (buttons/inputs/chips): rounded-[12px].",
        "Avoid arbitrary 14/20/22 mixes."
      ]
    },

    "borders": {
      "hairline_default": {
        "width": "1px",
        "color": "rgba(255,255,255,0.10)",
        "use": "Most panels, inset blocks, separators."
      },
      "hairline_muted": {
        "width": "1px",
        "color": "rgba(255,255,255,0.07)",
        "use": "Chart frames, table rows, quiet dividers."
      },
      "reference_gradient_hairline": {
        "css_utility": "gradient-border",
        "definition": "Use existing .gradient-border (padding-box + border-box) as the signature border.",
        "use": [
          "Hero odds card",
          "Primary AI panels (Policy Brain, AI Next Step) when they are the focus",
          "Dock (only the outer shell)"
        ],
        "avoid": [
          "Every panel at once (too loud)",
          "Small elements (<100px)"
        ]
      }
    },

    "elevation": {
      "tiers": {
        "e0": "none",
        "e1": "var(--shadow-1) (default panel)",
        "e2": "var(--shadow-2) (hero + dock only)"
      },
      "rule": "No heavy drop shadows on every card; reserve e2 for hero + dock to create hierarchy."
    },

    "color_tokens": {
      "base": {
        "bg": "hsl(218 62% 7%)",
        "bg_2": "hsl(218 55% 10%)",
        "surface_glass": "rgba(255,255,255,0.055)",
        "surface_glass_stronger": "rgba(255,255,255,0.078)",
        "border": "rgba(255,255,255,0.10)",
        "border_2": "rgba(255,255,255,0.07)"
      },
      "brand": {
        "primary_azure": "hsl(213 89% 56%)",
        "accent_teal": "hsl(199 92% 60%)",
        "support_teal_soft": "rgba(45,212,191,0.18)",
        "ink": "hsl(218 62% 7%)"
      },
      "semantic": {
        "success": "hsl(152 62% 45%)",
        "warning": "hsl(38 92% 55%)",
        "destructive": "hsl(0 78% 58%)",
        "rule": "Semantic colors are accents only (dots, thin strokes, small numbers). Never full backgrounds."
      },
      "focus": {
        "ring": "0 0 0 3px rgba(43,138,247,0.35)",
        "ring_inner": "0 0 0 1px rgba(255,255,255,0.14)",
        "rule": "Focus-visible must be obvious on dark glass; use dual ring (inner hairline + outer azure glow)."
      },
      "gradients_allowed": {
        "ambient_lightfield": [
          "radial-gradient(900px 520px at 14% -10%, rgba(43,138,247,0.22), transparent 58%)",
          "radial-gradient(760px 520px at 86% -14%, rgba(56,189,248,0.16), transparent 56%)"
        ],
        "border_gradient": "linear-gradient(135deg, rgba(43, 138, 247, 0.55), rgba(45, 212, 191, 0.22), rgba(255, 255, 255, 0.08))",
        "rule": "Gradients only as ambient wash + hairline borders; never as big blocks behind text."
      }
    },

    "motion": {
      "principles": [
        "Animate only transform/opacity/filter blur; avoid layout thrash.",
        "Use one easing: var(--ease-out) for entrances; linear for scrubber-linked motion.",
        "Durations: 120ms hover, 180ms press, 240ms panel entrance, 320ms hero intro.",
        "Reduced motion: respect prefers-reduced-motion (already in index.css)."
      ],
      "micro_interactions": {
        "hover": "translateY(-1px) + subtle border brighten (rgba white 0.10 -> 0.14)",
        "press": "scale(0.98)",
        "focus": "dual ring (see focus tokens)",
        "scrub": "dock pulse wave animates only while playing; otherwise static"
      }
    }
  },

  "contextual_status_replacement": {
    "goal": "Replace removed fixed top bar with a quiet console header + inline status sentence that feels editorial, not alarmist.",
    "structure": {
      "placement": "Top of the single screen content, inside the main container (not fixed).",
      "layout": "Left: brand mark + case identifier. Right: contextual status sentence + last update time (mono).",
      "components": ["/app/frontend/src/components/ui/separator.jsx", "/app/frontend/src/components/ui/tooltip.jsx", "/app/frontend/src/components/ui/button.jsx"],
      "copy_pattern": {
        "brand": "RazorStitch",
        "status_sentence": "Recovery is tracking {trend_word}; next best action is {action_phrase}.",
        "trend_word_examples": ["within range", "slightly behind", "ahead of baseline"],
        "action_phrase_examples": ["send the second reminder", "switch to voice follow-up", "pause outreach for 2h"],
        "timestamp": "Updated {HH:MM} · {n} events in last 10m"
      },
      "status_visual": {
        "style": "Inline dot + text (no pill).",
        "dot": "6px circle; color uses semantic accent at 70% alpha.",
        "example": "• within range"
      }
    },
    "tailwind_scaffold": {
      "container": "flex flex-col gap-3 md:flex-row md:items-end md:justify-between",
      "left": "flex items-center gap-3",
      "right": "flex items-center gap-3 text-[12px] leading-4 text-white/70",
      "dot": "inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/70"
    },
    "where_live_pulse_moves": "Pulse wave moves to the floating dock only (small, mono-line)."
  },

  "component_redesign_notes": {
    "global_panel_language": {
      "panel_shell": {
        "class_recipe": "glass-panel rounded-[24px] p-6 md:p-6",
        "hero_variant": "glass-2 gradient-border rounded-[24px] p-8 shadow-[var(--shadow-2)]",
        "nested_inset": "rounded-[16px] border border-white/10 bg-white/[0.03]"
      },
      "panel_header": {
        "title": "Newsreader 18/24 600 (font-display)",
        "meta": "Inter 12/16 500 (text-white/55)",
        "actions": "One quiet secondary button max; no icon clusters."
      },
      "badge_pill_unification": {
        "single_style_if_needed": "Only one pill style allowed: control radius 12px, height 28px, bg white/6, border white/10, text white/70, no gradients.",
        "default": "Prefer inline dot + sentence-case text instead of pills."
      }
    },

    "hero_case_odds": {
      "keep": ["Gradient hairline border", "Generous 32px padding", "Odds ring as the single focused visual"],
      "change": [
        "Remove any 'Recovering' pill -> replace with inline dot + 'Recovering' text in meta row.",
        "Ensure amount + odds % are mono and tabular.",
        "Secondary button: one only (ghost/quiet)."
      ],
      "states": {
        "loading": "Use shadcn Skeleton blocks inside the hero; keep ring placeholder as faint circle stroke.",
        "hover": "Border brighten + translateY(-1px) only.",
        "focus": "If hero is focusable, apply dual ring."
      }
    },

    "policy_brain": {
      "change": [
        "Q-value bars: use calm strokes; no neon fills. Bars should be 6px height with 3px radius.",
        "Guardrail callouts: convert badges to inline 'Guardrail: …' with a small teal dot.",
        "Policy version badge -> inline meta text 'Policy v{n}' (mono)"
      ],
      "components": ["/app/frontend/src/components/ui/card.jsx", "/app/frontend/src/components/ui/button.jsx", "/app/frontend/src/components/ui/tooltip.jsx", "/app/frontend/src/components/ui/skeleton.jsx"]
    },

    "failure_anatomy": {
      "tone": "Informative, forensic. No red blocks; use neutral ink + thin semantic accents.",
      "change": [
        "Stats row: mono numbers, labels in meta.",
        "Accordions: use shadcn Accordion; headers are sentence-case; chevron subtle.",
        "Any 'At risk' pill -> inline dot + 'At risk' only when truly needed; otherwise 'Needs attention'."
      ],
      "components": ["/app/frontend/src/components/ui/accordion.jsx", "/app/frontend/src/components/ui/separator.jsx"]
    },

    "recovery_curve": {
      "change": [
        "Curve stroke 2px; baseline 1px; gridlines 1px at white/6.",
        "Draggable playhead: 10px handle with 2px stroke; hit area 32px (invisible).",
        "Labels: mono 11px white/55; avoid bold axis titles."
      ],
      "interaction": "On drag: show a small tooltip (HoverCard) with time + odds delta (mono)."
    },

    "ghost_runs": {
      "change": [
        "Comparison lines: primary azure 2px, ghost line white/25 2px dashed (4 4).",
        "Hover reasons: use HoverCard; no badges; show bullet list with subtle dots.",
        "Legend: inline text row, no boxed legend."
      ],
      "components": ["/app/frontend/src/components/ui/hover-card.jsx"]
    },

    "customer_plane_phone_preview": {
      "change": [
        "Phone frame: rounded-[24px] outer, inner screen rounded-[16px].",
        "State badge -> inline dot + 'Customer sees: …'",
        "Morph animation: opacity/transform only; keep it calm (<=240ms)."
      ],
      "responsive": "On mobile: phone preview becomes a collapsible Drawer section."
    },

    "ai_next_step_card": {
      "change": [
        "Make this a 'primary focus' panel: use gradient-border like hero when it is the current recommended step.",
        "Approve/Edit buttons: primary + quiet secondary; both radius 12, height 36.",
        "No badges like 'AI'—title already implies it."
      ],
      "components": ["/app/frontend/src/components/ui/button.jsx", "/app/frontend/src/components/ui/dialog.jsx", "/app/frontend/src/components/ui/textarea.jsx"]
    },

    "trust_budget_3_contacts": {
      "change": [
        "Represent as 3 slots with subtle progress (not loud).",
        "Each slot: name (body), channel (meta), remaining budget (mono).",
        "No pill tags; use small dot for channel type (sms/whatsapp/voice)."
      ],
      "components": ["/app/frontend/src/components/ui/progress.jsx", "/app/frontend/src/components/ui/tooltip.jsx"]
    },

    "live_updates_feeds": {
      "change": [
        "Remove 'Live' pill -> inline dot + 'Live updates' in header meta.",
        "Feed rows: 44px min height, hairline separators, mono timestamps.",
        "New event highlight: 1.5s fade from bg-white/6 to transparent (no flashing)."
      ],
      "components": ["/app/frontend/src/components/ui/scroll-area.jsx", "/app/frontend/src/components/ui/separator.jsx"]
    },

    "floating_timeline_dock": {
      "role": "Carries the 'system heartbeat' now that the top bar is removed.",
      "change": [
        "Dock shell uses gradient-border + glass-2 + shadow e2.",
        "Pulse wave: tiny (height 10-12px), white/40 stroke; only animates while playing.",
        "Mode label pill -> inline text 'Mode: Replay' (meta)"
      ],
      "interaction": [
        "Slider thumb: 12px visual, 32px hit area.",
        "Buttons: icon-only with Tooltip; 36x36 min.",
        "Dock should never cover critical content; on mobile it becomes a bottom Sheet with peek handle."
      ],
      "components": ["/app/frontend/src/components/ui/slider.jsx", "/app/frontend/src/components/ui/tooltip.jsx", "/app/frontend/src/components/ui/sheet.jsx", "/app/frontend/src/components/ui/button.jsx"]
    },

    "boot_intro": {
      "change": [
        "Fast (<=900ms).",
        "Use one line of Newsreader + one mono line for 'Initializing timeline…'.",
        "No big gradients; use ambient lightfield only."
      ],
      "motion": "Opacity + slight translateY(6px) entrance; respect reduced motion."
    },

    "toasts": {
      "library": "sonner",
      "style": [
        "Toast surface: bg-white/8, border white/12, radius 16, shadow e1.",
        "No emoji icons; use lucide-react icons if needed.",
        "Copy: sentence-case, calm."
      ],
      "component": "/app/frontend/src/components/ui/sonner.jsx"
    }
  },

  "responsive_rules": {
    "grid": {
      "desktop_12col": {
        "container": "max-w-[1320px] mx-auto px-4 lg:px-6",
        "layout": "12-col grid with 24px gaps; hero spans 7, right rail spans 5; lower panels in 6/6 split."
      },
      "tablet": {
        "breakpoint": "md",
        "rule": "Collapse to 8 columns; hero becomes full width; right rail becomes 2-up grid."
      },
      "mobile": {
        "breakpoint": "sm",
        "rule": "Single column; panels become stacked; keep p-5/p-6 equivalent (20–24px)."
      }
    },
    "dock_mobile_behavior": {
      "rule": "Dock becomes bottom Sheet (shadcn Sheet) with a compact collapsed bar showing time + play/pause + scrub thumb.",
      "tap_targets": "Minimum 44x44 for all dock controls."
    },
    "phone_preview": {
      "desktop": "Max width 360px; keep aspect ratio; never exceed 40% of viewport height.",
      "mobile": "Move into Drawer/Collapsible; default collapsed to reduce scroll fatigue."
    }
  },

  "chart_restraint_spec": {
    "strokes": {
      "primary_line": "2px rgba(43,138,247,0.9)",
      "secondary_line": "2px rgba(255,255,255,0.25)",
      "gridline": "1px rgba(255,255,255,0.06)",
      "axis": "1px rgba(255,255,255,0.10)",
      "marker": "4px radius dot; fill rgba(255,255,255,0.85) with 2px azure stroke"
    },
    "labels": {
      "tick": "11px mono, white/55",
      "annotation": "12px Inter, white/70",
      "title": "Avoid chart titles; use panel title instead."
    },
    "fills": {
      "rule": "Prefer no area fills. If needed, max alpha 0.10 and only under the primary curve."
    }
  },

  "accessibility": {
    "contrast_pairs": [
      { "fg": "white/90", "bg": "bg ink", "note": "Primary reading" },
      { "fg": "white/70", "bg": "glass surface", "note": "Secondary text" },
      { "fg": "azure", "bg": "ink", "note": "Links/interactive" }
    ],
    "keyboard_nav": [
      "All interactive elements must be reachable via Tab in a logical order (left-to-right, top-to-bottom).",
      "Timeline scrubber: arrow keys adjust by small step; Shift+arrow for larger step; announce time via aria-live polite.",
      "Accordions: use shadcn defaults (Enter/Space toggles)."
    ],
    "reduced_motion": [
      "Disable pulse animation and curve shimmer when prefers-reduced-motion is set.",
      "Keep scrubber updates instantaneous (no tween) in reduced motion."
    ]
  },

  "image_urls": {
    "rule": "No stock photography needed; this is a console. Use code-crafted ambient + subtle noise only.",
    "ambient": [
      {
        "category": "background",
        "description": "Use existing .rs-lightfield__mesh + .noise-overlay; do not add raster images.",
        "image_url": null
      }
    ]
  },

  "component_path": {
    "primary": [
      "/app/frontend/src/components/ui/card.jsx",
      "/app/frontend/src/components/ui/button.jsx",
      "/app/frontend/src/components/ui/slider.jsx",
      "/app/frontend/src/components/ui/accordion.jsx",
      "/app/frontend/src/components/ui/hover-card.jsx",
      "/app/frontend/src/components/ui/tooltip.jsx",
      "/app/frontend/src/components/ui/sheet.jsx",
      "/app/frontend/src/components/ui/drawer.jsx",
      "/app/frontend/src/components/ui/scroll-area.jsx",
      "/app/frontend/src/components/ui/skeleton.jsx",
      "/app/frontend/src/components/ui/separator.jsx",
      "/app/frontend/src/components/ui/sonner.jsx"
    ],
    "note": "Use existing shadcn components; restyle via tokens/classes. JS files only (no TSX guidance)."
  },

  "instructions_to_main_agent": [
    "Remove the fixed top bar entirely; implement the contextual console header described above.",
    "Systematize the hero reference card language across all panels: radius 24, padding 24/32, hairline borders, restrained glow.",
    "Unify tokens: remove mixed radii and old token dialects; prefer the white-alpha glass recipe already present in index.css.",
    "Demote pills/badges: replace with inline dot + sentence-case text everywhere except where a pill is truly required (single unified pill style).",
    "Keep gradients limited to ambient lightfield + gradient hairline borders only; ensure gradient area <=20% viewport.",
    "Preserve all existing data-testids; add missing data-testid to any new interactive element introduced by redesign.",
    "Charts: apply the restraint spec (stroke widths, gridlines, label sizes) consistently across all custom SVG charts.",
    "Dock: becomes the only place with pulse wave; on mobile convert to bottom Sheet with compact controls.",
    "Accessibility: implement dual focus ring; ensure 44px tap targets on mobile; respect reduced motion."
  ],

  "General UI UX Design Guidelines": "- You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals."
}
