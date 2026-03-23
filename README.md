# Infinity Canvas

**Infinity Canvas** is a powerful, infinite whiteboard application built for architects, artists, and cartoonists. Evolving from a client-only canvas into a full-fledged SaaS, it features a robust **Hybrid Architecture** — delivering a blazing-fast, offline-first local experience with seamless, real-time cloud collaboration.

![Infinity Canvas](./public/og-image.png)

## 🚀 Features

### Core Canvas Engine
- **Infinite Canvas**: Pan and zoom freely without boundaries.
- **Tools & Shapes**: Select, Rectangle, Diamond, Ellipse, Line, Arrow, Freehand Pencil, Text, Eraser.
- **Excalidraw-style Aesthetics**: High-quality, hand-drawn "sloppy" rendering for shapes and arrows, complete with padding and smart arrowhead sizing.
- **Layer Management**: Bring to front, send to back, bring forward, and send backward.
- **Grouping/Ungrouping**: Select multiple shapes to group them together for scaled resizing and movement.
- **Text**: Interactive text boxes with precise bounding box calculations and in-place editing.

### AI-Powered Diagram Generation ✨
- **Intelligent Creation**: Generate various types of complex diagrams directly from text prompts, including:
  - **Flowcharts**: Map out processes, workflows, and logic.
  - **Mind Maps**: Brainstorm and organize hierarchical ideas.
  - **ERDs (Entity-Relationship Diagrams)**: Design database schemas and data architectures.
  - **DSA (Data Structures & Algorithms)**: Illustrate trees, graphs, arrays, and algorithms.
  - **Comparison Diagrams**: Visually evaluate pros/cons, features, or architectural differences.
- **Hand-Drawn Aesthetic**: AI diagrams adopt an organic, hand-drawn look with curated pastel palettes, custom roughness, and handwriting fonts.
- **Hierarchical Structures**: Automatic organization into nested group elements ("Tiers") with distinct headers and styled backgrounds.
- **Smart Connectivity**: Advanced arrow routing with staggered anchor points preventing overlap, backed by a refactored and optimized 2-point line system.
- **Fully Interactive**: All AI-generated elements are fully integrated canvas components—freely editable, movable, and resizable.

### Asset Library & Extensibility 📚
- **Rich Library Panel**: Quickly access predefined "Featured Shapes" and your personal "My Library".
- **Excalidraw Compatibility**: Seamlessly import existing `.excalidrawlib` files. The robust importer natively handles coordinate translation, complex groupings, and legacy draw types.
- **Component Architecture**: Deep integration separating "Core" components for AI generation from standard "Normal" components.
- **Community Sharing**: Discover, use, and share community-created assets from the public library ecosystem.

### Real-Time Collaboration (Live Rooms) 🌐
- **Multiplayer Synchronized Drawing**: Draw and see others draw in real-time with ultra-low latency via Socket.IO.
- **Live Cursors & Presence**: See what others are doing with live pointers, user-specific colors, and names.
- **Live Selection Highlights**: Instantly see which shapes are currently selected or being edited by collaborators.
- **Throttled Sync Optimization**: High-performance socket events that don't overwhelm the browser during fast drag or resize operations.
- **Granular Access Control**: Share boards via email invites with Viewer or Editor roles, managed seamlessly through the dashboard setup.

### Hybrid Architecture (Local & Cloud)
- **Offline-First**: Guest users can create, edit, and save unlimited boards directly to their device (IndexedDB/localStorage) without signing up.
- **Authentication**: Secure JWT-based authentication via HTTP-only cookies.
- **Cloud Sync**: Signed-in users can seamlessly move local boards to the cloud, access them from anywhere, and manage their cloud and local boards independently from the unified Dashboard.
- **Visual Distinction**: Distinct `💾 Local` and `☁ Cloud` badges ensure you always know where your data lives (along with `🟢 Live` indicators).

### Smart Styling
- **Sloppiness Modes**:
  - 🏛️ **Architect**: Clean, precise lines.
  - 🎨 **Artist**: Sketchy, multi-stroke rough style.
  - 🦸 **Cartoonist**: Bold, stylized appearance with hachure fills.
- **Stroke Styles**: Solid, Dashed, Dotted.
- **Fill Patterns**: Solid, Hachure, Cross-Hatch.
- **Colors**: Curated palette of vibrant colors.

### Controls & Shortcuts
| Action | Shortcut |
|--------|----------|
| **Pan** | `Space` + Drag / Mouse Wheel / `Shift` + Wheel |
| **Zoom** | `Ctrl` + Wheel / `Meta` + Wheel |
| **Multi-Select** | `Shift` + Click / Drag Selection |
| **Group / Ungroup**| Menu Buttons located in Context Toolbar |
| **Delete** | `Backspace` / `Delete` |
| **Edit Text** | Double Click on Text |
| **Undo/Redo** | `Ctrl+Z` / `Ctrl+Y` |

## 🛠️ Tech Stack

**Frontend**
- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (with sophisticated caching and sync)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Rendering**: Custom 2D Engine (Canvas API) + [Rough.js](https://roughjs.com/)
- **Sockets**: Socket.IO Client

**Backend (MERN)**
- **Runtime**: Node.js & Express
- **Database**: MongoDB & Mongoose
- **Real-Time Engine**: Socket.IO
- **Authentication**: JWT, bcryptjs, cookie-parser, and secure HTTP-only configurations.
- **Security**: Helmet, MongoDB Sanitize, rate limiting, and CORS.
- **AI Integration**: Integration with Google GenAI for intelligent text-to-diagram generation.

## 📦 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Database (Local or MongoDB Atlas)

### Setup & Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/infinity-canvas.git
   cd infinity-canvas
   ```

2. Setup Backend:
   ```bash
   cd server
   npm install
   # Create a .env file with PORT, MONGO_URI, JWT_SECRET, CLIENT_URL, NODE_ENV
   npm run dev
   ```

3. Setup Frontend:
   ```bash
   # From the project root
   npm install
   npm run dev
   ```

## 📂 Project Structure

```
.
├── server/             # Backend (Express API + Socket.IO)
│   ├── src/
│   │   ├── config/     # DB & Security configurations
│   │   ├── middleware/ # Auth & error handling
│   │   ├── models/     # Mongoose Schemas (User, Board, Workspace, Notification)
│   │   ├── modules/    # Controller & Route logic
│   │   └── sockets/    # Web-Socket Handlers (Live Collaboration)
│   └── server.js       # Entry point
└── src/                # Frontend (React App)
    ├── components/     # UI Components (Dashboard, Canvas, Toolbar, Alerts)
    ├── engine/         # Core Visualization Engine & Physics (Hit Testing, Resolvers)
    ├── hooks/          # React hooks (useCanvas, useEngineInteraction, useSockets)
    ├── pages/          # Full page views (Dashboard, Workspace, Auth)
    └── services/       # API Services & Storage abstractors
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
