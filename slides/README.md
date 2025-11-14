# Rask UI Presentation Slides

This directory contains a Slidev presentation for Rask UI.

## Getting Started

From the slides directory, run:

```bash
pnpm install
pnpm dev
```

This will start the development server and open your presentation in a browser at http://localhost:3030

## Controls

- **Space** / **Arrow Keys** - Navigate between slides
- **F** - Toggle fullscreen
- **O** - Toggle overview mode
- **D** - Toggle dark mode
- **G** - Go to specific slide

## Building

To create a static build:

```bash
pnpm build
```

To export as PDF:

```bash
pnpm export
```

## Editing

Edit `slides.md` to modify your presentation. Slidev supports:

- Standard Markdown syntax with frontmatter
- Code blocks with syntax highlighting (Shiki)
- Line highlighting and animations
- Vue components
- Multiple themes and layouts

Code blocks automatically get syntax highlighting:

\`\`\`tsx {2-4}
// Line highlighting supported
const foo = 'bar'
// These lines will be highlighted
\`\`\`

## Learn More

- [Slidev Documentation](https://sli.dev)
- [Themes](https://sli.dev/themes/gallery.html)
- [Addons](https://sli.dev/addons/use.html)
