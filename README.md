<div align="center">
<pre>
██╗   ██╗██╗███████╗██╗    ██╗    ███╗   ███╗██████╗ 
██║   ██║██║██╔════╝██║    ██║    ████╗ ████║██╔══██╗
██║   ██║██║█████╗  ██║ █╗ ██║    ██╔████╔██║██║  ██║
╚██╗ ██╔╝██║██╔══╝  ██║███╗██║    ██║╚██╔╝██║██║  ██║
 ╚████╔╝ ██║███████╗╚███╔███╔╝ ██╗██║ ╚═╝ ██║██████╔╝
  ╚═══╝  ╚═╝╚══════╝ ╚══╝╚══╝  ╚═╝╚═╝     ╚═╝╚═════╝ 
</pre>
  <p><b>Sleek, instant, and lightweight desktop Markdown reader.</b></p>
</div>

---

**`view.md`** is a premium desktop Markdown reader designed to be your default `.md` handler on Windows. Built to provide a distraction-free, high-performance, and visually gorgeous alternative to firing up full-featured IDEs just to read simple documentation.

## Features

| Feature | Description |
| :--- | :--- |
| **Instant Startup** | Tailored for a lightning-fast experience with load times under 500ms. |
| **Premium UI** | A modern, glassmorphic design that seamlessly integrates with your operating system's light/dark modes. |
| **Interactive Search** | Custom, keyboard-friendly `Ctrl+F` in-document search with real-time highlighting. |
| **Dynamic Table of Contents** | Resizable, auto-highlighting sidebar that tracks your reading progress. |
| **Secure Local Media** | Renders relative local images instantly and securely via a custom `view-media://` protocol. |
| **Single-Instance Locking** | Double-click multiple files smoothly—they all open dynamically in your single active reader without cluttering your desktop. |

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Electron](https://www.electronjs.org/) (Main process) + [React 18](https://react.dev/) (Renderer) |
| **Language** | TypeScript |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Markdown Engine** | `react-markdown`, `remark-gfm`, `rehype-katex` |
| **Syntax Highlighting**| Pre-styled `PrismJS` for ultra-low latency initialization. |

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Quick Start Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Installs all required dependencies |
| `npm run dev` | Concurrently compiles the React renderer and launches the Electron app with Hot-Module Replacement |
| `npm run package` | Packages the application into a standalone Windows executable inside the `dist/` directory |

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/pvsaravanan/view.md.git
cd view.md
npm install
```

---

## Architecture Overview

The application follows secure Electron best practices, structured into three primary domains:

| Component | Path | Responsibility |
| :--- | :--- | :--- |
| **Main Process** | `src/main/main.ts` | Manages OS lifecycle, single-instance locks, theme detection, and custom protocol (`view-media://`) handling. |
| **Preload Script** | `src/main/preload.ts` | Serves as a secure bridge, exposing only necessary APIs via `contextBridge` with `contextIsolation` enabled. |
| **Renderer Process** | `src/renderer/` | The React frontend containing the UI components (`Reader`, `Sidebar`, `Search`, `Toolbar`). |

> *For deeper structural knowledge and the full product requirements, see [`prd.md`](./prd.md).*

## Contributing

We welcome contributions! Please feel free to submit a Pull Request or open an Issue to discuss improvements, feature requests, or bug fixes.

## License

This project is licensed under the [MIT License](LICENSE).
