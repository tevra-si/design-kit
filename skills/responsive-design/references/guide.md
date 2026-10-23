# Focused implementation guide

Default profiles are 390×844, 768×1024, 1280×800 and 1440×900; they are configurable representatives, not breakpoint prescriptions. Prefer gap and intrinsic minmax layouts. Touch-target checks use 24 CSS pixels as an automated WCAG 2.2 AA-oriented signal; spacing exceptions require human review and a project may target 44 or 48. Use safe-area-inset where fixed UI needs it. Native platforms require device testing, not browser dimensions alone.
