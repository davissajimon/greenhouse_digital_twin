# Restructuring & Cleanup Report

## Summary
The project directory has been significantly reorganized to improve maintainability, separation of concerns, and to remove redundancy. The `src/` directory now follows a feature-based structure with `pages/`, `components/`, `context/`, `hooks/`, and `utils/`. Duplicate assets in the build folder (`dist/`) have been moved to a trash directory to avoid confusion with the source of truth in `public/`.

## 1. Trash Folder
Created a `trash/` directory at the project root to archive unused or duplicate files.
- `trash/dist_duplicates/`: Contains redundant asset copies found in `dist/`.

## 2. Duplicate Handling
Identified duplicate assets between `dist/` and `public/`.
- **Action**: Moved duplicates from `dist/` to `trash/dist_duplicates/`.
- **Reason**: The build process (Vite) automatically copies assets from `public/` to `dist/`. Keeping manual copies in `dist/` is redundant and error-prone.
- **Moved Files**:
  - `dist/NatureLoader.lottie`
  - `dist/Untitled.glb`
  - `dist/chilli_v2.glb`
  - `dist/detailed_ground_texture.png`
  - `dist/grassbase.glb`
  - `dist/logo.png`
  - `dist/okra2.glb`
  - `dist/tomato_v2.glb`

## 3. Unreferenced / Unused Code
- **ScalabilityTest.jsx**: Removed unused variables `isStem` and `isPot` that were causing lint errors.
- **Home.jsx**: Removed duplicate import of `useFetchSensorData`. Fixed unused variable in `ErrorBoundary`.

## 4. Code Consolidation & Restructuring
Rearranged the `src/` directory:

### Components (`src/components/`)
- Moved `Navbar.jsx` and `Navbar.css` here.
- Moved `Footer.jsx` and `Footer.css` here.
- Existing 3D components (`ThreeTomato`, `ThreeChilli`, `ThreePea`) remain here.
- `NatureLoader.jsx` remains here.

### Pages (`src/pages/`)
- Created `src/pages/`.
- Moved `Home.jsx` and `Home.css` here.
- Moved `Simulator.jsx` and `Simulator.css` here.
- Moved `scalability_test.jsx` (renamed to `ScalabilityTest.jsx`) and `scalability_test.css` (renamed to `ScalabilityTest.css`) here.

### Context (`src/context/`)
- Created `src/context/`.
- Moved `DarkModeContext.jsx` here.

### Updates to References
Imports were updated across the codebase to reflect these moves:
- **App.jsx**: Updated imports for pages (`Home`, `Simulator`, `ScalabilityTest`), components (`Navbar`, `Footer`), and context (`DarkModeProvider`).
- **Home.jsx**: Updated imports for components, config, utils, and hooks (now relative paths `../`).
- **Simulator.jsx**: Updated imports for components and utils.
- **ScalabilityTest.jsx**: Updated CSS import.

## 5. Final Folder Structure
```
greenhouse_digital_twin/
├── public/                 # Static assets (GLB models, images, lottie)
├── src/
│   ├── components/         # Reusable UI & 3D components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── NatureLoader.jsx
│   │   ├── ThreeTomato.jsx
│   │   └── ...
│   ├── context/            # Global state context
│   │   └── DarkModeContext.jsx
│   ├── hooks/              # Custom hooks
│   │   └── useFetchSensorData.js
│   ├── pages/              # Route-level page components
│   │   ├── Home.jsx
│   │   ├── Simulator.jsx
│   │   └── ScalabilityTest.jsx
│   ├── utils/              # Helper functions & logic
│   │   ├── PlantHealthEngine.js
│   │   └── SensorCorrelations.js
│   ├── App.jsx             # Main application component
│   ├── main.jsx            # Entry point
│   ├── config.js
│   ├── App.css
│   └── index.css
├── trash/                  # Archived files
├── dist/                   # Build output (cleaned)
├── package.json
├── vite.config.js
└── ...
```

## 6. Stability Check
- Ensured all imports are resolved correctly.
- Verified asset loading paths in `NatureLoader` and 3D components (`useGLTF`).
- Fixed Linter warnings in `Home.jsx` and `ScalabilityTest.jsx`.
