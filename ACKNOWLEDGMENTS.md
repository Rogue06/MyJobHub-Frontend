# Acknowledgments / Crédits

## MyJobHub is built on top of `santifer/career-ops`

> **MyJobHub is an independent graphical interface for [career-ops](https://github.com/santifer/career-ops). It is not affiliated with, endorsed by, or sponsored by career-ops or its author.**

[career-ops](https://github.com/santifer/career-ops) is the open-source CLI tool that does the heavy lifting in MyJobHub :
- The whole job evaluation engine (A–F scoring, archetype detection, STAR+R interview stories)
- PDF generation (ATS-optimized CV)
- Portal scanning (Greenhouse / Ashby / Lever APIs + Playwright)
- Pipeline orchestration
- Tracker management, deduplication, normalization
- And all the `modes/*.md` instructions that define each slash command

**MyJobHub adds zero AI engine of its own** — it's a Next.js layer that:
1. Calls `claude -p "/career-ops …"` as a subprocess to drive career-ops
2. Reads / writes the user-data files career-ops expects (cv.md, profile.yml, portals.yml, data/*)
3. Provides forms instead of YAML editing, a visual tracker instead of markdown parsing, a learning filter on top of career-ops's scan results

Every workspace contains a standalone, unmodified clone of `santifer/career-ops`. MyJobHub never edits the system files of career-ops — only the user-data ones. You can drop MyJobHub at any time and continue using career-ops directly with `claude` in the CLI.

## Trademark policy compliance

career-ops has a clear [Trademark Policy](https://github.com/santifer/career-ops/blob/main/TRADEMARK.md). MyJobHub follows it :

- ✅ **The project name is distinct** (« MyJobHub », not a career-ops variant)
- ✅ **Origin is acknowledged everywhere** : « built on career-ops » in the README, sidebar footer, this file, and the project description
- ✅ **No endorsement claim** : nowhere does MyJobHub say « Powered by career-ops », « Official career-ops », « Partner of career-ops »
- ✅ **No use of career-ops logos or visual identity**
- ✅ **The codebase is MIT, like career-ops itself**

If anything in this project unintentionally crosses a trademark line, please open an issue or reach out — happy to adjust.

## Thanks

To [Santiago Fernández de Valderrama](https://santifer.io) (`@santifer`) for building and open-sourcing career-ops. Without it, MyJobHub couldn't exist. Real respect for putting months of careful tool-building under MIT for everyone to benefit from.

---

## Built with

- [Next.js 14](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) on [Base UI](https://base-ui.com)
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) v2 — resume text extraction
- [yaml](https://www.npmjs.com/package/yaml) — YAML serialization
- [sonner](https://sonner.emilkowal.ski) — toast notifications
- [lucide-react](https://lucide.dev) — icons
- [next-themes](https://github.com/pacocoursey/next-themes) — dark mode
- Server-Sent Events (native Web Streams) — real-time log streaming

## Built by

[Mickaël Burani](https://github.com/Rogue06), with extensive use of [Claude Code](https://claude.com/claude-code) for the implementation.
