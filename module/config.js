/**
 * Webpointer Configuration & Global State Module
 * Encapsulates constants, state objects, and default settings.
 */
(function() {
  var WebpointerConfig = {
    // Canvas & Grid Dimensions
    SVG_WIDTH: 960,
    SVG_HEIGHT: 540,
    STEPS_X: 480, // 0 ~ 480 (481 points)
    STEPS_Y: 270, // 0 ~ 270 (271 points)

    // Dynamic State Variables & User Defaults
    currentTab: 'insert',
    currentTool: 'select',
    gridSnapEnabled: true,
    enableSnapping: true,     // Default Magnetic snapping ON
    snappingThreshold: 12,    // Default 12px Snapping threshold
    canvasBgColor: '#ffffff', // Default White Canvas

    strokeColor: '#041e49',   // Default Shape Color (#041e49)
    fillColor: 'none',        // Default Fill: Transparent ('none')
    strokeWidth: 2,
    strokeDashStyle: 'solid',  // 'solid' (실선) vs 'dashed' (점선)
    strokeDashArray: '6,6',    // Default custom dash pattern ('6,6')
    strokeCap: 'butt',         // 'butt' (평평함), 'round' (둥글게), 'square' (돌출)
    strokeJoin: 'miter',       // 'miter' (뾰족함), 'round' (둥글게), 'bevel' (깎임)
    pointRadius: 5,           // Default Point Diameter 10px (radius = 5px)

    collapsedCategories: new Set(), // Set of collapsed category keys ('style_color', etc.)

    proximityThreshold: 30,   // Default 30px Proximity selection threshold
    defaultShapeSize: 100,    // Default 100px shape size for short clicks (<= 10px drag)

    startMarker: 'none',
    startMarkerScale: 1,
    startMarkerFillStyle: 'solid', // 'solid' vs 'hollow'

    endMarker: 'none',
    endMarkerScale: 1,
    endMarkerFillStyle: 'solid',   // 'solid' vs 'hollow'

    // Default 24 UniPalette Color Swatch Preset Memory
    customPalette: [
      "#660000", "#660000", "#086600", "#006627", "#002e66", "#000080", "#3a0066", "#660031",
      "#e44d1b", "#c27800", "#669900", "#00a879", "#009dd1", "#4182fb", "#a760e2", "#d94594",
      "#ff976b", "#ffbb00", "#aae43f", "#00f5c0", "#00eaff", "#85caff", "#ec99ff", "#ff8fda"
    ],
    activeColorTarget: 'stroke', // 'stroke' vs 'fill' for Picture Format tab

    // Text Formatting Defaults
    fontFamily: 'sans-serif',
    fontSize: 20,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none', // 'none' vs 'line-through'
    textAnchor: 'start',     // 'start' (왼쪽), 'middle' (가운데), 'end' (오른쪽)
    textDominantBaseline: 'hanging', // 'hanging' (top baseline)
    lineHeight: 1.2,
    padTop: 10,
    padBottom: 10,
    padLeft: 10,
    padRight: 10,
    padSync: true,
    textFillColor: '#041e49',
    textColor: '#041e49',
    textStrokeColor: 'none',
    textStrokeWidth: 1,
    activeTextColorTarget: 'text', // 'text' (글자색) vs 'bg' (배경색/하이라이트)
    systemFonts: [
      "맑은 고딕", "나눔고딕", "나눔명조", "굴림", "돋움", "바탕", "궁서",
      "Arial", "Calibri", "Comic Sans MS", "Consolas", "Courier New", "Georgia",
      "Impact", "Segoe UI", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana",
      "sans-serif", "serif", "monospace"
    ],

    // Selection & Manipulation Memory
    gridStepSize: 24,         // Default grid step size 24px
    textUnderlineStyle: 'none', // Default underline style: 'none'
    textUnderlineColor: '#041e49',
    textUnderlineOffset: 3,
    textUnderlineWidth: 1,
    symbolRegistry: JSON.parse(localStorage.getItem('webpointer_symbols') || '[]'),

    // Long Press Delay in ms (200ms ~ 1000ms, default 200ms)
    longPressDelay: parseInt(localStorage.getItem('webpointer_long_press_delay'), 10) || 200,

    // Default Filter Presets (10 core + 1 glow)
    defaultFilterPresets: {
      'blur': { type: 'blur', val: 5, unit: 'px', label: '블러' },
      'brightness': { type: 'brightness', val: 130, unit: '%', label: '밝기' },
      'contrast': { type: 'contrast', val: 150, unit: '%', label: '대비' },
      'grayscale': { type: 'grayscale', val: 100, unit: '%', label: '흑백' },
      'hue-rotate': { type: 'hue-rotate', val: 90, unit: 'deg', label: '색상 회전' },
      'invert': { type: 'invert', val: 100, unit: '%', label: '반전' },
      'opacity': { type: 'opacity', val: 50, unit: '%', label: '불투명도' },
      'saturate': { type: 'saturate', val: 200, unit: '%', label: '채도' },
      'sepia': { type: 'sepia', val: 100, unit: '%', label: '세피아' },
      'drop-shadow': { type: 'drop-shadow', dx: 4, dy: 4, blur: 8, color: 'rgba(0,0,0,0.5)', label: '그림자' },
      'glow': { type: 'glow', blur: 10, color: '#38bdf8', label: '네온 발광' }
    },

    selectedIds: new Set(),
    objectsMap: new Map(),
    nextId: 1
  };

  var WebpointerState = {
    isDrawingNewObject: false,
    drawStartCoords: null,
    activeNewObj: null,

    isDraggingHandle: false,
    activeHandleInfo: null,

    isDraggingObject: false,
    dragStartCoords: null,
    initialObjAttrsMap: new Map(),

    isMarqueeSelecting: false,
    marqueeStartCoords: null,

    isMultiBezierActive: false,
    bezierPoints: [],
    activeBezierObj: null,

    typingSvgObj: null,
    typingCaretEl: null
  };

  window.WebpointerConfig = WebpointerConfig;

  // ReferenceError 차단을 위한 전역 switchTab 세이프가드 잇점 배치
  if (typeof window.switchTab !== 'function') {
    window.switchTab = function(tabKey) {
      if (window.WebpointerConfig) window.WebpointerConfig.currentTab = tabKey;
      if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
        window.WebpointerRender.renderRibbon();
      }
    };
  }
  window.WebpointerState = WebpointerState;
})();
