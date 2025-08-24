3. Directory Structure Explained
code
Code
download
content_copy
expand_less

.
├── .electron-vite/              # Config and cache for Electron + Vite
├── .eslintrc.cjs                # ESLint configuration for code linting
├── .prettierrc                  # Prettier configuration for code formatting
├── package.json                 # Project dependencies and scripts
├── vite.config.ts               # Vite bundler configuration
│
├── README.md                    # [CRITICAL] Project overview, mandatory reading for new members
│
├── main/                        # [BACKEND] Electron Main Process
│   ├── index.ts                 # Main process entry point: creates window, manages app lifecycle
│   ├── preload.ts               # Preload script: secure bridge for IPC
│   └── server/                  # Embedded Express server (for OAuth, etc.)
│
├── window/                      # [FRONTEND] All User Interfaces (Renderer Process)
│   └── src/
│       ├── App.tsx              # Root React component
│       ├── main.tsx             # React application entry point
│       │
│       ├── assets/              # Static assets (icons, wallpapers)
│       ├── components/          # Common UI components for the desktop environment
│       │   ├── layout/          # Overall desktop structure (Desktop, Taskbar)
│       │   └── features/        # Specific UI features (AppWindow, ContextMenu, StartMenu)
│       │
│       ├── apps/                # [CORE APPS] Standalone "applications" within the desktop
│       │   ├── FileManager/
│       │   ├── Notebook/
│       │   └── Settings/
│       │
│       ├── hooks/               # Custom React Hooks
│       ├── pages/               # Top-level pages (e.g., DesktopPage)
│       ├── store/               # Redux global state management
│       │   └── slices/          # State slices by feature (desktopSlice, windowSlice)
│       │
│       ├── lib/                 # Common frontend utility functions
│       ├── styles/              # Global styles
│       └── types/               # TypeScript type definitions
│
├── services/                    # [CORE] API Interface Layer (NO LOGIC)
│   ├── SERVICES_API.md          # [IMPORTANT] Rules for the services module
│   └── api/                     # API definitions
│
├── function/                    # [CORE] All Business Logic (Completely Isolated)
│   ├── FUNCTION_GUIDELINES.md   # [IMPORTANT] Core rules for the function module
│   │
│   ├── stable/                  # Stable functions (never modified after release)
│   │   ├── user/
│   │   └── file/
│   │
│   └── test/                    # Test functions (under development)
│       ├── user/
│       └── data/
│
├── components/                  # [Optional] Global, business-agnostic UI library components
│   └── ui/                      # (e.g., base implementations of Button, Modal)
│
└── apps/                        # [Optional] External apps or large plug-in modules
    └── reporting/

# Project Structure and Directory Guide

This document provides an overview of the project's directory structure, explaining the purpose and function of each major folder. This is based on the core architectural principles outlined in the main `README.md`.

## Root Level

The root directory contains configuration files and the primary folders that organize the application.

-   `.` (Root)
    -   `README.md`: **[CRITICAL]** The main project documentation outlining the core philosophy of stability and the strict architectural rules.
    -   `package.json`: Defines project metadata, dependencies, and scripts.
    -   `vite.config.cjs`: Configuration for the Vite bundler, which handles the React frontend.
    -   `tsconfig.json`: TypeScript configuration for the entire project.
    -   `tailwind.config.cjs`: Configuration for the Tailwind CSS utility-first framework.
    -   `postcss.config.cjs`: Configuration for PostCSS, a tool for transforming CSS with JavaScript.
    -   `apps/`: Contains standalone, external applications that can be discovered and installed by the App Store.
    -   `function/`: **[CORE LOGIC]** The most critical directory, containing all isolated business logic.
    -   `main/`: **[BACKEND]** The Electron main process entry point and lifecycle management.
    -   `services/`: **[API LAYER]** The bridge between the frontend and the backend logic.
    -   `window/`: **[FRONTEND]** The React-based user interface (renderer process).
    -   `virtual-fs/`: A simulated filesystem for the application, used for storing desktop items, etc.
    -   `old/`: **[LEGACY]** Contains the previous version of the application. It is kept for reference but is no longer in active use.

---

## Core Directories Explained

### `main/` (Electron Main Process)

This directory is the heart of the Electron application itself.

-   `index.ts`: The main entry point. It creates the browser window, loads the React application, and handles all operating-system-level interactions (like app startup and shutdown).
-   `preload.ts`: A critical security feature in Electron. This script runs in a privileged context and exposes a secure API (`window.electronAPI`) from the main process to the frontend (renderer process), preventing the frontend from having direct access to Node.js APIs.

### `function/` (Isolated Business Logic)

This is where all the "thinking" of the application happens, governed by the strict rules in `README.md`.

-   `stable/`: Contains functions whose logic, interface, and behavior are considered permanent and immutable. This guarantees that other parts of the system relying on these functions will never break due to a change in the function itself. Each sub-directory (e.g., `filesystem`, `app-store`) represents a distinct feature domain.
-   `test/`: A directory for developing and experimenting with new functions before they are proven stable. (Currently empty).

### `services/` (API Interface Layer)

This directory acts as a clean, simple, and logic-less "switchboard" that connects the `window` (frontend) to the `function` (backend logic).

-   `api/`: Contains small files that import a stable function from the `function/` directory and expose it.
-   `index.ts`: A barrel file that exports all the individual APIs from the `api/` directory, providing a single, clean entry point for the frontend to import from (`@services/index`).

### `window/` (Frontend UI)

This directory contains the entire React application that the user sees and interacts with.

-   `index.html`: The HTML entry point for the React application.
-   `src/`: The source code for the React app.
    -   `main.tsx`: The root of the React application, where it mounts to the `index.html`.
    -   `App.tsx`: The main React component that lays out the core structure of the UI.
    -   `apps/`: Contains the React components for core, built-in applications like the "App Store" and "File Explorer".
    -   `components/`: Contains reusable React components that make up the desktop environment.
        -   `layout/`: Components that define the overall structure, like the `Desktop` and `Taskbar`.
        -   `features/`: Specific interactive elements like `AppWindow` (the frame for applications), `ContextMenu`, and the `StartMenu`.
    -   `store/`: Contains the Redux Toolkit global state management setup.
        -   `slices/`: Defines the different pieces of the global state (e.g., `windowSlice` manages the state of all open windows).
        -   `thunks/`: For asynchronous logic that interacts with the Redux store.
    -   `types/`: Contains shared TypeScript type definitions.

### `apps/` (Installable Applications)

This directory acts as the source for applications that can be "installed" via the App Store.

-   Each subdirectory represents a self-contained application, typically with its own `package.json` and entry point (`main.js` or `index.js`).
-   The `AppStore`'s `discoverApps` function scans this directory to find available apps.

### `virtual-fs/` (Simulated Filesystem)

-   This directory acts as the user's "hard drive" within the application. For example, the `Desktop/` subdirectory holds the files and shortcuts that are rendered on the UI's desktop. This allows the application to manage files without touching the user's actual computer filesystem.
