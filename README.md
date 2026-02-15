# Infinity Canvas

**Infinity Canvas** is a powerful, infinite whiteboard application built for architects, artists, and cartoonists. It features a custom high-performance rendering engine that supports various visual styles, from clean architectural lines to rough, hand-drawn sketches.

![Infinity Canvas](./public/og-image.png)

## 🚀 Features

### Core Tools
- **Infinite Canvas**: Pan and zoom freely without boundaries.
- **Shapes**: Rectangle, Diamond, Ellipse, Arrow, Line.
- **Freehand**: Smooth pencil tool powered by `perfect-freehand`.
- **Text**: Interactive text boxes with in-place editing.
- **Eraser**: Intuitive shape removal.

### Smart Styling
- **Sloppiness Modes**:
  - 🏛️ **Architect**: Clean, precise lines.
  - 🎨 **Artist**: Sketchy, multi-stroke rough style.
  - 🦸 **Cartoonist**: Bold, stylized appearance.
- **Stroke Styles**: Solid, Dashed, Dotted.
- **Fill Patterns**: Solid, Hachure, Cross-Hatch.
- **Colors**: Curated palette of vibrant colors.

### Controls & Shortcuts
| Action | Shortcut |
|--------|----------|
| **Pan** | `Space` + Drag / Mouse Wheel / `Shift` + Wheel |
| **Zoom** | `Ctrl` + Wheel / `Meta` + Wheel |
| **Multi-Select** | `Shift` + Click / Drag Selection |
| **Delete** | `Backspace` / `Delete` |
| **Edit Text** | Double Click on Text |
| **Undo/Redo** | `Ctrl+Z` / `Ctrl+Y` |

## 🛠️ Tech Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Rendering**: Custom 2D Engine (Canvas API)
- **Algorithms**: [Perfect Freehand](https://github.com/steveruizok/perfect-freehand)

## 📦 Getting Started

### Prerequisites
- Node.js (v18+ recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/infinity-canvas.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 📂 Project Structure

```
src/
├── components/         # UI Components
│   ├── canvas/         # Canvas-specific widgets (Toolbar, Sidebar)
│   └── ui/             # Generic UI kit (Buttons, Inputs)
├── engine/             # Core Visualization Engine
│   ├── render/         # Drawing logic for shapes
│   ├── physics/        # Hit testing and math helpers
│   └── utils/          # Geometry and serialization utils
├── hooks/              # React integration hooks
│   ├── engine/         # Interaction & State logic hooks
│   └── useCanvas.js    # Main entry point for UI
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
