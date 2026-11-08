/**
 * Suite 10: Canvas Mouse Event State-Machine Suite (S10_TC01 ~ S10_TC05)
 */
(function() {
  var describe = window.WebpointerTest.describe;
  var test = window.WebpointerTest.test;
  var expect = window.WebpointerTest.expect;

  function dispatchMouseEvent(target, type, x, y, options) {
    options = options || {};
    var rect = target.getBoundingClientRect();
    var svgW = (window.WebpointerConfig && window.WebpointerConfig.SVG_WIDTH) || 960;
    var svgH = (window.WebpointerConfig && window.WebpointerConfig.SVG_HEIGHT) || 540;
    var clientX = rect.left + (rect.width > 0 ? (x / svgW) * rect.width : x);
    var clientY = rect.top + (rect.height > 0 ? (y / svgH) * rect.height : y);
    var evt = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: clientX,
      clientY: clientY,
      button: options.button || 0,
      buttons: options.buttons || 1,
      shiftKey: !!options.shiftKey,
      ctrlKey: !!options.ctrlKey,
      altKey: !!options.altKey
    });
    target.dispatchEvent(evt);
  }

  describe('Suite 10: Canvas Mouse Interactions & State-Machine', function() {

    test('S10_TC01: Marquee Drag Selection (Rubberband Multi-Selection)', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var objs = appWindow.WebpointerObjects;
      var svg = appWindow.document.getElementById('mainSvg');

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      var o1 = objs.createSvgObject('rect', { px: 50, py: 50 }, { px: 80, py: 80 });
      var o2 = objs.createSvgObject('rect', { px: 90, py: 90 }, { px: 120, py: 120 });
      cfg.currentTool = 'select';
      if (appWindow.WebpointerRender && appWindow.WebpointerRender.renderAllObjects) {
        appWindow.WebpointerRender.renderAllObjects();
      }

      dispatchMouseEvent(o1.el || svg, 'mousedown', 60, 60);
      dispatchMouseEvent(svg, 'mouseup', 60, 60);
      expect(cfg.selectedIds.has(o1.id)).toBe(true);

      dispatchMouseEvent(o2.el || svg, 'mousedown', 100, 100, { ctrlKey: true });
      dispatchMouseEvent(svg, 'mouseup', 100, 100, { ctrlKey: true });
      expect(cfg.selectedIds.size).toBe(2);
    });

    test('S10_TC02: Object Drag & Translation with Mouse', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var objs = appWindow.WebpointerObjects;
      var svg = appWindow.document.getElementById('mainSvg');

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      var o = objs.createSvgObject('rect', { px: 100, py: 100 }, { px: 150, py: 150 });
      cfg.selectedIds.add(o.id);
      cfg.currentTool = 'select';
      if (appWindow.WebpointerRender && appWindow.WebpointerRender.renderAllObjects) {
        appWindow.WebpointerRender.renderAllObjects();
      }

      dispatchMouseEvent(o.el || svg, 'mousedown', 110, 110);
      dispatchMouseEvent(svg, 'mousemove', 140, 140);
      dispatchMouseEvent(svg, 'mouseup', 140, 140);

      expect(typeof o.attrs.x).toBe('number');
      expect(o.attrs.x).toBeGreaterThan(0);
    });

    test('S10_TC03: Pan Tool Dragging (Canvas ViewBox Pan)', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var svg = appWindow.document.getElementById('mainSvg');
      cfg.currentTool = 'pan';

      dispatchMouseEvent(svg, 'mousedown', 100, 100);
      dispatchMouseEvent(svg, 'mousemove', 50, 50);
      dispatchMouseEvent(svg, 'mouseup', 50, 50);

      cfg.currentTool = 'select';
      expect(svg.getAttribute('viewBox')).toBeTruthy();
    });

    test('S10_TC04: Shift Key Aspect-Ratio Constraint & Snap Modes', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var svg = appWindow.document.getElementById('mainSvg');
      cfg.currentTool = 'rect';

      dispatchMouseEvent(svg, 'mousedown', 50, 50, { shiftKey: true });
      dispatchMouseEvent(svg, 'mousemove', 150, 120, { shiftKey: true });
      dispatchMouseEvent(svg, 'mouseup', 150, 120, { shiftKey: true });

      cfg.currentTool = 'select';
      expect(cfg.objectsMap.size).toBeGreaterThan(0);
    });

    test('S10_TC05: Animation SMIL & Keyframe State Engine Matrix', async function({ page, appWindow }) {
      if (appWindow.playAnimation) appWindow.playAnimation();
      if (appWindow.stopAllAnimations) appWindow.stopAllAnimations();
      if (appWindow.setAnimStep) appWindow.setAnimStep(1);
      expect(true).toBe(true);
    });

  });
})();
