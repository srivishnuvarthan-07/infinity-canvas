# Infinity Canvas

A powerful implementation of an infinite drawing canvas built with React and Fabric.js. This application allows users to sketch, draw shapes, and take notes on a limitless workspace.

## Features

### Drawing Tools
- **Selection**: Move and manipulate objects on the canvas (Shortcut: `V`)
- **Hand/Pan**: Navigate around the infinite canvas (Shortcut: `H`)
- **Pencil**: Freehand drawing with customizable stroke width (Shortcut: `P`)
- **Eraser**: Remove objects or parts of drawings (Shortcut: `E`)

### Shapes & Objects
- **Basic Shapes**:
  - Line (Shortcut: `L`)
  - Arrow (Shortcut: `A`)
  - Rectangle (Shortcut: `R`)
  - Diamond (Shortcut: `D`)
  - Ellipse (Shortcut: `O`)
- **Text**: Add text labels and notes (Shortcut: `T`)

### Styling & Customization
- **Stroke Color**: Choose from a palette of vibrant colors.
- **Stroke Width**: Adjust the thickness of your lines and shapes.
- **Stroke Style**: Toggle between Solid, Dashed, and Dotted lines.

### Canvas Controls
- **Zoom Controls**: Zoom in/out for detailed work or an overview.
- **Infinite Scrolling**: Panning capability to extend your workspace indefinitely.

## Tech Stack

- **Framework**: React + Vite
- **Canvas Engine**: Fabric.js
- **UI Components**: Shadcn UI (@radix-ui)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

Follow these steps to set up the project locally:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```
