# Webpointer Changelog

All notable changes to the Webpointer Vector CAD Editor project are documented in this file.

## [v0.8.4] - 2026-08-15
### Added & Improved (Line Orthogonal Snap, Color Button Hold/Apply & In-Browser Test Runner)
- **Line Drawing & Handle Drag `Ctrl` Orthogonal Snap (`TC60`)**:
  - Holding `Ctrl` while drawing a line or dragging line endpoints (`start`/`end` handles) locks angle to perfectly horizontal (`y2 = y1`) or vertical (`x2 = x1`).
- **Independent Color Button Apply & 200ms Long-Press Palette Popover (`TC61`)**:
  - Short click (< 200ms) on shape stroke, shape fill, text fill, text stroke, and underline color buttons immediately applies current color independently without altering other style attributes.
  - Long press (>= 200ms) opens the interactive color palette popover (`colorPalettePopover`).
  - Fixed SVG DOM rendering engine in `renderCanvas.js` to ensure `<text>` elements reflect `fill`, `stroke`, `stroke-width`, and `paint-order` DOM attributes in real-time.
- **Zero-Dependency In-Browser Test Runner & Modular Suites (`tests/`)**:
  - Created standalone web test dashboard (`tests/index.html` & `tests/testEngine.js`) enabling 1-click execution of all tests in any browser without Playwright CLI or npm dependencies.
  - Split entire test catalog into 7 modular feature suites (`tests/suites/suite-01-basic.js` through `suite-07-storage.js`).
  - Converted `TC06` from visual pixel comparison to robust DOM structure & canvas integrity verification.
  - Published comprehensive test catalog and direct test execution guide (`tests/TEST_CATALOG.md`).

## [v0.8.3] - 2026-08-14
### Fixed & Improved (AutoFit Direction A & Anti-Spiral Base Font Preservation)
- **AutoFit Mode Direction A & Base Font Size Preservation (`TC58`, `TC59`)**:
  - Implemented Direction A `fitTextToShape` behavior: font size scales down ONLY when text overflows container, maintaining set base font size (`baseFontSize`) when space remains.
  - Preserved `baseFontSize` across all auto-fit mode cycles (`fitShapeToText`, `fitTextToShape`, `none`), completely preventing cumulative font and shape shrinking (Spiral Bug) on repeated clicks.

## [v0.8.2] - 2026-08-14
### Added & Improved (Text Padding Category, 3-Tier Vertical Alignment Engine & Context-Aware Clipboard)
- **Text Padding Category in `Text Format` Tab (`TC57`)**:
  - Added new `Padding` category under `Text Format` (`text`) ribbon tab with Top, Bottom, Left, and Right numeric padding inputs (default 10px) and `Sync All Sides` checkbox (default checked).
  - Integrated padding controls dynamically into horizontal (`left`, `center`, `right`, `justify`) and vertical (`top`, `middle`, `bottom`) text placement algorithms.
- **3-Tier Real-Time Height Measurement & Vertical Alignment Engine (`TC54`, `TC55`)**:
  - Built 3-Tier 2-Pass height measurement helper (`measureTextRealHeight`) using DOM `getBBox()`, off-screen SVG measurement fallback, and font em metrics.
  - Aligned text box center with shape center for middle alignment, and bottom line with shape bottom margin for bottom alignment.
  - Resolved cumulative Y position drift when toggling vertical alignment repeatedly.
- **Context-Aware `Ctrl+C` / `Ctrl+V` & Cascading Paste Engine (`TC56`)**:
  - Enabled context-aware clipboard handling: pasting text automatically embeds text box into a selected shape, or creates a standalone text box if no shape is selected.
  - Implemented cumulative diagonal cascading offset (+15px per step) for consecutive `Ctrl+V` shape pastes.
- **AI Coding Rules Directive**:
  - Added Section 5 Anti-Inference Verification Directive to `AI_Coding_Rules.md`.

## [v0.8.1] - 2026-08-14
### Fixed & Improved (SVG Text Justification Engine)
- **SVG Text Justification (`textAnchor="justify"`) Engine (`TC54`)**:
  - Replaced fallback left-alignment logic with automatic `textLength` and `lengthAdjust="spacing"` attributes on justified text.
  - Dynamically stretches word and character spacing across container/shape inner width for full justification.
  - Automatically cleans up `textLength` attributes when switching back to left/center/right alignment modes.

## [v0.8.0] - 2026-08-14
### Major Improvements (Shape-Text Unified Synchronization Engine & Precision UX)
- **Shape-Text 100% Unified Bounds Sync Engine (`syncShapeTextBounds`)**:
  - Synchronized text bounding box (`x, y, width, height, angle`) with host shape on move, resize, rotation, and flip, completely eliminating rotation teleportation bugs.
  - Automatically hidden text-only transform handles when embedded in shapes to present a single unified handle set.
- **Shape+Text Keybinding & Precision Cursor UX (`TC51`, `TC52`, `TC53`)**:
  - **F2 Key Edit Mode**: Pressing `F2` on a shape or text opens inline editing for the existing merged text without creating duplicate text objects.
  - **Esc Key Restore**: Pressing `Esc` during typing finishes text editing and restores tool state to Select mode with host shape selected.
  - **Top Dominant Baseline (`dominant-baseline="hanging"`)**: Switched default text baseline to top baseline (`hanging`), ensuring text stays inside shape boundaries.
  - **Grouped Selection Box (`boxRect`) Rotation**: Updated selection box renderer to apply rotation transform for multi-selected / grouped shape+text objects.
  - **Rotated Caret & Selection Highlight Alignment**: Synchronized caret line (`canvasBlinkingCaret`) and selection highlight group (`canvasTextSelectionGroup`) with `hanging` baseline and `rotate(angle)` transform.
- **Metrics Category in Ribbon Menu (`Insert` > `Metrics`) (`TC48`)**:
  - Added real-time width (px), height (px), and rotation angle (°) input fields in the Insert ribbon tab with bi-directional update handlers.
- **Ctrl-Rotate Separation Modal & 90-Degree Rotation Binding (`TC45`, `TC49`)**:
  - Implemented Ctrl-rotate notice dialog and fixed global reference bindings for `transformSelected('rotate90')`.

## [v0.7.1] - 2026-08-09
### Added
- Added Image/Symbol Insertion Tool button in `Insert` > `Shapes` ribbon category with modal picker (`#imageSymbolPickerModal`).
- Implemented centered symbol placement on viewport `(centerX, centerY)` and automatic entry into Selection Transform Mode with active transform handles.

## [v0.7.0] - 2026-07-31
### Added & Improved (8-Step SMIL Animation Specification Suite & Canvas Resizing)
- **8-Step SMIL SVG Animation Ribbon Suite**:
  - **1. Target & Attribute Type**: Displays selected object ID (`targetId`) and supports `fill`, `stroke`, `stroke-width`, `opacity`, `transform:translate/scale/rotate`, `d` (path morph).
  - **2. Values & Coordinates**: `from`, `to`, and multi-step `values="v1;v2;v3"` input fields.
  - **3. Trigger & Duration**: `begin` (`0s`, `click`, `mouseover`, `mouseleave`, `anim1.end` sequence), `dur` (1-cycle duration), `repeatCount` (`indefinite`, `1`, `2`, `3`, `5`).
  - **4. Limits & End Conditions**: `max` (absolute max time limit), `restart` (`always`, `whenNotActive`, `never`), `end` (forced termination trigger).
  - **5. Multi-Track Stacking & Preset Manager**: Add multiple parallel/serial animation tracks to a single object (`addCustomSmilAnimation`), clear all tracks (`removeAllAnimationsFromSelected`), 11 quick presets, and stop all.
- **Canvas Aspect-Ratio Auto-Height & Bottom Resize Handle**:
  - Auto-scales height on SVG import (`성경요약.svg`, etc.) matching native viewBox aspect ratio 1:1.
  - Added bottom mouse drag resize handle (`═══ 캔버스 세로 높이 조절 ═══`).
- **Pan Tool (1st Row 1st Col)**: Added Pan hand tool in Insert > Shapes tab (Alt+H) for real-time canvas dragging and panning.
- **Updated Layer Ordering Icons**: Redesigned `bringToFront`, `bringForward`, `sendBackward`, `sendToBack` with white paper (#ffffff) and gold highlight paper stacking graphics.

## [v0.6.0] - 2026-07-31
### Major Improvements (Milestone 6 ~ 17 Full Completion)
- **3-Slot Auto-Save & Defensive Import Modal (`TC24`)**: Rotating local storage slots and dirty canvas defense dialog.
- **Image Fill Modes (`TC25`)**: Stretch, Tile (repeat), and Single (contain) image patterns.
- **Multi-Stop Gradient & 2-Point Handles (`TC26`)**: Multi-stop ramp editor with interactive canvas handles.
- **Shape Text In-Box Alignment (`TC27`)**: Calculated horizontal and vertical in-box alignment.
- **Live Filter Preview & Stack Reordering (`TC28`)**: Instant filter slider preview and ▲/▼ stack order reordering.
- **Single Cycling Buttons (Milestone 11)**: `cycleStartMarker`, `cycleEndMarker`, `cycleStrokeCap`, `cycleStrokeJoin`.
- **UI Consolidation (Milestone 12, 13)**: Filter popovers integrated into Edit tab; alpha sliders streamlined.
- **SMIL Animation & Hotkeys (`TC29`)**: 11 SMIL animation presets, canvas wheel zoom, `Ctrl+A` select all, rotation/flip tests.
- **29/29 E2E Test Suite Passed (100%)**.

## [v0.5.5] - 2026-07-30
### Added & Improved
- **File Menu Tab**: Added `"File"` (`파일`) tab with `openFile`, `saveFileToWeb`, and `downloadFile`.
- **Undo / Redo History Manager**: Implemented `undo` (`Ctrl+Z`) and `redo` (`Ctrl+Y` / `Ctrl+Shift+Z`).
- **Global Floating Tooltip Manager**: `#webpointerGlobalTooltip` with fixed body positioning.

## [v0.5.4] - 2026-07-30
### Added & Improved
- **Ribbon Layout & Settings Tab Refactoring**: Removed menubar gap, right-aligned `"설정"` (`Settings`) tab.
- **Grid & Canvas Fixes**: Kept `bgRect` visible when grid is disabled; real-time updates for step size and canvas color.

## [v0.5.3] - 2026-07-30
### Added & Improved
- **Text Ribbon Tab Upgrades**: Single cycling alignment buttons, 3-way text auto-fit mode toggle, custom SVG underline renderer (6 styles).

## [v0.5.2] - 2026-07-30
### Added & Improved
- **Shape-Text Auto-Grouping**: Grouped shape and overlay text automatically with isolated formatting controls.
- **Swatch Color Palette Popovers**: Converted color pickers to popovers with UniPalette swatches.

## [v0.5.1] - 2026-07-30
### Added & Improved
- **Text Editing Hotkeys & Inline Edit**: Double-click, `F2`, and text tool inline canvas text editing.

## [v0.5.0] - 2026-07-30
### Added & Improved
- **Text Ribbon Tab Major Enhancement**: Added font family, font size, font weight, font style, line height, text color, and background highlight controls.

## [v0.4.6] - 2026-07-30
### Refactored & Improved
- SVG Icon Asset Modularization into `icons/` folder and `module/render/icons.js`.

## [v0.4.5] - 2026-07-30
### Refactored & Improved
- Restored Ribbon Bar UI & SVG Icons; expanded `.content-area` to 100% full-width layout.

## [v0.4.4] - 2026-07-30
### Refactored & Improved
- Modularized codebase into `core/objects.js`, `core/selection.js`, `core/bezier.js`, `tools/textTool.js`, `tools/ribbonHandlers.js`, `render/renderRibbon.js`, `render/renderCanvas.js`.

## [v0.4.3] - 2026-07-30
### Fixed & Improved
- Text selection bounding box accuracy and caret position fixes.

## [v0.4.2] - 2026-07-30
### Added & Improved
- Direct in-canvas text typing mode with blinking caret line (`.blinking-caret`).

## [v0.4.1] - 2026-07-30
### Added & Fixed
- Interactive in-place text editing workflow and live typing preview.

## [v0.4.0] - 2026-07-30
### Added & Updated
- Picture format category reordering and new Cap & Join category (`strokeCap`, `strokeJoin`).

## [v0.3.6] - 2026-07-30
### Fixed
- Line category dash style & pattern management fixes.

## [v0.3.5] - 2026-07-30
### Added & Updated
- Line Ends category redesign (Start/End markers with solid/hollow fill styles).

## [v0.3.4] - 2026-07-30
### Added & Updated
- UniPalette 24-color preset and popup modal.

## [v0.3.3] - 2026-07-30
### Added
- Style Ribbon redesign (27-slot color palette grid, target selectors).

## [v0.3.2] - 2026-07-30
### Fixed
- Real-time color updates on canvas.

## [v0.3.1] - 2026-07-30
### Added
- Rotation & Flip transformation system (`flipH`, `flipV`, `rotate90`, `rotateNeg90`).

## [v0.3.0] - 2026-07-30
### Added
- Precision geometric boundary alignment engine (6-way alignment).

## [v0.2.1] - 2026-07-30
### Added
- Ctrl + Click object/group deselection system.

## [v0.2.0] - 2026-07-30
### Added
- Hierarchical multi-level grouping (`Group`, `Ungroup`).

## [v0.1.9] - 2026-07-30
### Added
- 2nd-order (Quadratic) & 3rd-order (Cubic) Bezier curve control handle system.

## [v0.1.0] ~ [v0.1.8] - 2026-07-30
### Initial Baseline
- 16:9 Vector CAD Editor, 481x271 step grid snapping engine, MS Office ribbon UI, shape tools, proximity selection, and E2E automation suite.
