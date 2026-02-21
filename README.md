# Infinity Canvas

**Infinity Canvas** is a powerful, infinite whiteboard application built for architects, artists, and cartoonists. Evolving from a client-only canvas into a full-fledged SaaS, it features a robust **Hybrid Architecture** — delivering a blazing-fast, offline-first local experience with seamless cloud synchronization.

![Infinity Canvas](./public/og-image.png)

## 🚀 Features

### Core Canvas Engine
- **Infinite Canvas**: Pan and zoom freely without boundaries.
- **Shapes**: Rectangle, Diamond, Ellipse, Arrow, Line.
- **Freehand**: Smooth pencil tool powered by `perfect-freehand`.
- **Text**: Interactive text boxes with in-place editing.
- **Eraser**: Intuitive shape removal.

### Hybrid Architecture (Local & Cloud)
- **Offline-First**: Guest users can create, edit, and save unlimited boards directly to their device (IndexedDB/localStorage) without signing up.
- **Authentication**: Secure JWT-based authentication via HTTP-only cookies.
- **Cloud Sync**: Signed-in users can seamlessly move local boards to the cloud, access them from anywhere, and manage their cloud and local boards independently from the unified Dashboard.
- **Visual Distinction**: Distinct `💾 Local` and `☁ Cloud` badges ensure you always know where your data lives.

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

**Frontend**
- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (with sophisticated caching and sync)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Rendering**: Custom 2D Engine (Canvas API)

**Backend (MERN)**
- **Runtime**: Node.js & Express
- **Database**: MongoDB & Mongoose
- **Authentication**: JWT, bcryptjs, cookie-parser, and secure HTTP-only configurations.
- **Security**: Helmet, MongoDB Sanitize, rate limiting, and CORS.

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
├── server/             # Backend (Express API)
│   ├── src/
│   │   ├── config/     # DB & Security configurations
│   │   ├── middleware/ # Auth & error handling
│   │   ├── models/     # Mongoose Schemas (User, Board, BoardData, Library)
│   │   └── modules/    # Controller & Route logic (Auth, Board, Library)
│   └── server.js       # Entry point
└── src/                # Frontend (React App)
    ├── components/     # UI Components (Dashboard, Canvas, Layouts)
    ├── engine/         # Core Visualization Engine
    ├── hooks/          # React hooks (useCanvas, useBoardStore, useAuth)
    ├── pages/          # Full page views (Dashboard, Workspace, Auth)
    └── services/       # Storage abstraction (LocalProvider, CloudProvider, Factory)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
