# Webpointer Vector CAD Simulator - Master Technical Implementation Specification

> [!IMPORTANT]
> This document is the master technical design specification for the Webpointer Web Application. It contains complete, exhaustive documentation for all features, architecture, ribbon tabs, keyboard shortcuts, 8-step SMIL SVG animation suite, picture filter engine, shape/text formatting engines, SVG file import/export parsers, and the E2E Playwright verification suite. Anyone reading this single document will know 100% of Webpointer's capabilities.

---

## 1. System Architecture

### 1.1 Canvas System & Aspect Ratio Math
* **Default Canvas Resolution**: 16:9 ($960 \times 540\,\text{px}$)
* **Snap Step Grid System (481×271 Step Grid)**:
  * Horizontal Axis: $0 \le Step_X \le 480$ (481 precision snap step points)
  * Vertical Axis: $0 \le Step_Y \le 270$ (271 precision snap step points)
  * Coordinate Transformation Formulas:
    $$Pixel_X = \frac{Step_X}{480} \times 960, \quad Pixel_Y = \frac{Step_Y}{270} \times 540$$
* **Canvas Aspect Ratio Auto-Height & Bottom Height Resize Handle**:
  * External portrait SVG imports (e.g. `성경요약.svg`, `720x1280`) auto-match `viewBox` 1:1 and auto-extend canvas height.
  * Bottom drag resize handle bar (`#canvasResizeHandle`) enables interactive height adjustment.

### 1.2 Browser Module Architecture (`module/`)
* `module/main.js`: Global event capture, hotkeys, mouse zooming, Pan tool drag, and entry point.
* `module/core/objects.js`: SVG object data model creation, bounding box calculations, rotation/flip transforms.
* `module/core/selection.js`: Single/multi/group selection, marquee selection drag, proximity distance detection.
* `module/core/bezier.js`: 2nd/3rd-order Bezier curve mathematics and control handle reflection logic.
* `module/tools/textTool.js`: Direct in-canvas text typing and blinking caret bar (`.blinking-caret`).
* `module/tools/ribbonHandlers.js`: Style mutations, filter stack, SMIL animation engine, file slots, save/load.
* `module/tools/svgImporter.js`: Native SVG file importer, `fill-opacity`/`stroke-opacity` extraction, object wiping, viewBox auto-fit.
* `module/render/icons.js`: 50+ SVG tool icon dictionary (`WebpointerIcons`).
* `module/render/renderRibbon.js`: MS Office 5-tab ribbon UI DOM and global tooltip manager.
* `module/render/renderCanvas.js`: SVG DOM elements, selection bounds, handle dots, and snap guides real-time rendering.

---

## 2. Top Menu Tabs & Ribbon Controls Specification

### 2.1 `File` (`파일`) Tab
* **`Open File` (`openFile`)**: Read local `.json`, `.webpointer`, `.svg` files with dirty canvas confirmation defense dialog.
* **`Save File to Web` (`saveFileToWeb`)**: 3-slot rotating local storage auto-save (`webpointer_slot_1, 2, 3`) with thumbnail preview modal.
* **`Download File` (`downloadFile`)**: Export `.webpointer` project JSON and vector `.svg` files.
* **`Undo` (`Ctrl + Z`) & `Redo` (`Ctrl + Y` / `Ctrl + Shift + Z`)**: State history stack restoration.

### 2.2 `Insert` (`삽입`) Tab
* **Shape Tools (`shapeTools`)**:
  1. **`Pan Tool` (Row 1 Col 1)**: Real-time mouse drag canvas panning (`Alt + H`).
  2. **`Select`**: Click and marquee box selection.
  3. **`Point`**: Single precision point creation.
  4. **`Line`**: 2-point line creation.
  5. **`Rectangle`**: Rectangle creation.
  6. **`Ellipse`**: 4-handle ellipse creation.
  7. **`Arc`**: 6-handle arc creation with start/end angles.
  8. **`Bez2`**: 1-control-point quadratic Bezier curve.
  9. **`Bez3`**: 2-control-point cubic Bezier curve.
  10. **`Text`**: Direct in-canvas text box insertion.
* **Layer Order (`layerTools`)**:
  * **`Bring to Front` (`bringToFront`: `Shift + ]`)**: White paper sheets below, gold paper on top.
  * **`Bring Forward` (`bringForward`: `]`)**: White paper below, gold paper on top.
  * **`Send Backward` (`sendBackward`: `[`)**: White paper on top, gold paper below.
  * **`Send to Back` (`sendToBack`: `Shift + [`)**: White paper sheets on top, gold paper at bottom.
* **Object Grouping (`groupTools`)**:
  * **`Group` (`Ctrl + G`)**: Group selected units into nested `<g>`.
  * **`Ungroup` (`Ctrl + Shift + G`)**: Unpack 1 outer layer of group hierarchy.
* **Object Alignment & Transformation (`alignTools` & `transformTools`)**:
  * 6-way geometric alignment (Left, Right, Top, Bottom, H-Center, V-Center) and 2-way distribution spacing.
  * 4-way flip & rotate: `flipH`, `flipV`, `rotate90`, `rotateNeg90`.
  * **`Selection Window` (`openSymbolModal`)**: Symbol Manager thumbnail modal.

### 2.3 `Picture Format` (`style`) Tab
* **Color Category**:
  * 27-slot UniPalette swatch grid, 1x2 stroke/fill target radio selector.
  * 3 Image Fill Modes: **Stretch**, **Tile (repeat)**, **Single (contain)**.
  * **Multi-Stop Gradient Editor**: Linear/radial gradient ramp editor with 2-point canvas handles.
* **Line Category**: Stroke width input, `Dashed` line toggle and custom pattern modal.
* **Line Ends Category**: Start/End markers (arrow, circle, diamond) with solid/hollow fill toggles (`cycleStartMarker`, `cycleEndMarker`).
* **Cap & Join Category**:
  * **Stroke Cap Toggle (`cycleStrokeCap`)**: `butt`, `round`, `square`.
  * **Stroke Join Toggle (`cycleStrokeJoin`)**: `miter`, `round`, `bevel`.
* **Picture Filter Effects**:
  * Stacked filter popover (brightness, contrast, blur, saturate, grayscale, sepia, hue-rotate, invert, drop-shadow, non-destructive ClipPath crop).
  * Filter stack reordering (▲/▼) and live slider preview.

### 2.4 `Text Format` (`text`) Tab
* **Font Category**: `font-family`, `font-size` (+/- hotkeys), `Bold`, `Italic`, `Strikethrough`, `Line-Height`.
* **Text Alignment**: Single 4-way horizontal alignment cycle button (Left $\rightarrow$ Center $\rightarrow$ Right $\rightarrow$ Justify) and single 3-way vertical alignment cycle button (Top $\rightarrow$ Middle $\rightarrow$ Bottom).
* **Shape Text Auto-Fit**: 3-way mode toggle (Expand shape / Shrink text / Off).
* **Custom SVG Underline Renderer**: 6 underline styles (Solid, Dashed, Dotted, Double, Wavy, None) with thickness/offset controls.

### 2.5 `Animation` (`anim`) Tab (SMIL SVG Animation Suite)
* **8-Step SMIL Animation Parameter Suite**:
  1. **Target Selection**: Selected object `targetId` real-time display.
  2. **Attribute Type**: `fill`, `stroke`, `stroke-width`, `opacity`, `transform:translate`, `transform:scale`, `transform:rotate`, `d`.
  3. **Values & Coordinates**: Start value (`from`), Target value (`to`), Multi-step values (`values="v1;v2;v3"`).
  4. **Trigger (`begin`)**: `0s` (auto), `click`, `mouseover`, `mouseleave`, `anim1.end` (chain sequence).
  5. **Duration (`dur`)**: 1-cycle duration (e.g. `2s`).
  6. **Repeat Count (`repeatCount`)**: `indefinite`, `1`, `2`, `3`, `5`.
  7. **Limits & Restart**: `max` (absolute max time limit, e.g. `5s`), `restart` (`always`, `whenNotActive`, `never`).
  8. **End Condition (`end`)**: Forced termination trigger (e.g. `mouseleave`, `10s`).
* **Multi-Track Stacking & Preset Manager**:
  * **[➕ Add SMIL Track]**: Add multiple parallel/serial animation tags to a single object.
  * **[🗑️ Clear All Tracks]**: Remove all animation tags from selected object.
  * **11 Quick Presets & Stop**: Draw, Fade, Rotate, Pulse, Bounce, Color, Morph, Dash, Zoom, Shake, Glow.

### 2.6 `Settings` (`view`) Tab (Right-Aligned)
* **Grid Controls**: Grid visibility checkbox and grid step size input (px).
* **Snapping & Proximity Distance**: Snap toggle and proximity selection distance (`proximityThreshold`, default `30px`).
* **Default Shape Size**: Base creation size (`100px`).

---

## 3. Keyboard Shortcuts

| **Shortcut** | **Description** |
| :--- | :--- |
| **`Ctrl + Z`** | Undo |
| **`Ctrl + Y` / `Ctrl + Shift + Z`** | Redo |
| **`Ctrl + A`** | Select All Objects on Canvas |
| **`Ctrl + G`** | Group Selected Objects |
| **`Ctrl + Shift + G`** | Ungroup 1 Level of Group Hierarchy |
| **`Alt + H`** | Activate Pan Tool |
| **`Shift + ]`** | Bring to Front |
| **`]`** | Bring Forward |
| **`[`** | Send Backward |
| **`Shift + [`** | Send to Back |
| **`+` / `-`** | Increase / Decrease Font Size of Selected Text |
| **`F2` / Double-Click** | Canvas Inline Text Editing |
| **`Esc`** | Finish Text Edit / Deselect |
| **Mouse Wheel Scroll** | Zoom Canvas In / Out |

---

## 4. Playwright E2E Test Suite (`test-results/TC.csv`)

Running `node run_tests.js` executes all 29 E2E test cases and writes real-time benchmark results to `test-results/TC.csv`:

- `TC01`: App initialization & no console errors
- `TC02`: Draw rectangle and add text element
- `TC03`: Single cycling buttons & underline format
- `TC04`: Undo/Redo history stack
- `TC05`: Settings tab & grid background persistence
- `TC06`: Visual snapshot baseline
- `TC07`: Full shape drawing suite (Point, Line, Ellipse, Arc, Bezier)
- `TC08`: Picture formatting suite
- `TC09`: Detailed text formatting suite
- `TC10`: Proximity selection distance & nearest object detection
- `TC11`: Web LocalStorage save & file modal
- `TC12`: Animation tab & preset previews
- `TC13`: Shortcut guidance modal popup
- `TC14`: Detailed settings modal & apply proximity threshold
- `TC15`: Text selection font size hotkeys (+/-)
- `TC16`: Non-destructive ClipPath cropping
- `TC17`: Native SVG file import & parser diagnostics
- `TC18`: Symbol Manager modal & registry operations
- `TC19`: Extended fill color palette
- `TC20`: Picture filter effects suite
- `TC21`: Symbol cookie-cutter clipping
- `TC22`: Smart alignment snap guides & snapping
- `TC23`: Object alignment & distribution tools
- `TC24`: 3-slot auto-save & file import defense
- `TC25`: Image fill modes (Stretch, Tile, Single)
- `TC26`: Multi-stop gradient & 2-point handles
- `TC27`: Shape text in-box alignment computation
- `TC28`: Live filter preview & stack reordering
- `TC29`: Rotation & flip suite, SMIL animation, hotkeys & canvas zoom
