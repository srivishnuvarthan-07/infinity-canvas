# SAFE MIGRATION STRATEGY (Fabric → Custom Engine)

## Core Rule
❗ **Never rewrite everything at once**
❗ **Always keep the app runnable**
❗ **Always be able to roll back**

## Step 0 — Migration Guardrails (MANDATORY)
❌ Do NOT refactor existing Fabric code unless instructed
❌ Do NOT change behavior
❌ Do NOT delete Fabric yet
✅ Add new code in parallel only
✅ App must work after every step

## Step 1 — Freeze Fabric (No New Features)
- Treat Fabric code as legacy.
- Only bug fixes allowed.
- No new features, no refactors.

## Step 2 — Extract Shape Schema (DATA ONLY)
- Create a pure shape schema with:
    - No Fabric imports
    - No canvas references
    - Serializable JSON
    - Stable IDs

## Step 3 — Adapter Layer (CRITICAL SAFETY STEP)
- Create a `FabricAdapter` that converts:
    - `ShapeSchema` → `FabricObject`
    - `FabricObject` → `ShapeSchema`

## Step 4 — Build Renderers (Read-Only)
- Implement custom renderers that:
    - Only draw
    - Do not mutate state
    - Do not handle events

## Step 5 — Dual Render Mode (Safety Net)
- Add a runtime flag: `RENDER_MODE = "fabric" | "custom"`
- Same `ShapeSchema` drives both.
- Toggle without reload.

## Step 6 — Migrate Hit-Testing (One Shape at a Time)
- Replace Fabric hit-testing incrementally.
- Compare Fabric vs math result.

## Step 7 — Migrate Interaction Logic
- Migrate in order: Hover, Selection, Drag, Resize, Multi-select, Zoom/Pan.
- Do not remove Fabric handlers until custom logic produces identical results.

## Step 8 — Feature Parity Checklist
- Do NOT delete Fabric until ALL items pass:
    - Selection accuracy
    - Drag precision
    - Resize handles
    - Undo / redo
    - Export
    - Performance equal or better

## Step 9 — Soft Delete Fabric
- Remove Fabric behind a feature flag first.
- Keep dependency for one release cycle.

## Step 10 — Cleanup & Lock-In
- Freeze schema.
- Add schema tests.
- Add renderer snapshot tests.
- Document math formulas.
