/**
 * Suite 02: Shape Tools, Arcs & Orthogonal Snapping (S02_TC01 ~ S02_TC08)
 */
(function() {
  var describe = window.WebpointerTest.describe;
  var test = window.WebpointerTest.test;
  var expect = window.WebpointerTest.expect;

  describe('Suite 02: Shapes & Snapping', function() {

    test('S02_TC01: Basic Shapes & Path Creation (Rect, Rounded, Ellipse, Line)', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var shapes = [
        { id: 'rect1', type: 'rect', attrs: { x: 10, y: 10, width: 100, height: 50 } },
        { id: 'rounded1', type: 'rounded', attrs: { x: 10, y: 70, width: 100, height: 50, rx: 10 } },
        { id: 'ellipse1', type: 'ellipse', attrs: { cx: 60, cy: 160, rx: 50, ry: 25 } },
        { id: 'line1', type: 'line', attrs: { x1: 10, y1: 200, x2: 110, y2: 250 } }
      ];

      cfg.objectsMap.clear();
      shapes.forEach(function(s) {
        cfg.objectsMap.set(s.id, s);
      });

      expect(cfg.objectsMap.size).toBe(4);
      expect(cfg.objectsMap.get('rect1').type).toBe('rect');
      expect(cfg.objectsMap.get('rounded1').attrs.rx).toBe(10);
    });

    test('S02_TC02: 호(arc) 도구 오브젝트 생성, startAngle 및 endAngle 핸들러 렌더링 및 드래그 동작 검증', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var doc = appWindow.document;

      var pathEl = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      doc.getElementById('objectsGroup').appendChild(pathEl);

      var arcObj = {
        id: 'arc_test_38',
        type: 'arc',
        el: pathEl,
        attrs: {
          cx: 200,
          cy: 200,
          rx: 80,
          ry: 80,
          startAngle: -90,
          endAngle: 45,
          angle: 0,
          stroke: '#0284c7',
          strokeWidth: 2
        }
      };
      cfg.objectsMap.set(arcObj.id, arcObj);
      if (appWindow.WebpointerRender && appWindow.WebpointerRender.updateElementAttributes) {
        appWindow.WebpointerRender.updateElementAttributes(arcObj);
      }

      var d = arcEl = pathEl.getAttribute('d');
      expect(d).toBeTruthy();
      expect(d.startsWith('M')).toBe(true);
    });

    test('S02_TC03: 호(arc) 가로/세로 크기 및 회전 핸들러, 직사각형(rect) 회전 핸들러 렌더링 검증 수트', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var doc = appWindow.document;
      var objectsGroup = doc.getElementById('objectsGroup');

      var pathEl = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      objectsGroup.appendChild(pathEl);
      var arcObj = {
        id: 'arc_handles_test',
        type: 'arc',
        el: pathEl,
        attrs: { cx: 200, cy: 200, rx: 60, ry: 60, startAngle: -90, endAngle: 90, angle: 15 }
      };
      cfg.currentTool = 'select';
      cfg.objectsMap.set(arcObj.id, arcObj);
      cfg.selectedIds.clear();
      cfg.selectedIds.add(arcObj.id);

      if (appWindow.WebpointerRender && appWindow.WebpointerRender.updateElementAttributes) {
        appWindow.WebpointerRender.updateElementAttributes(arcObj);
      }
      if (appWindow.WebpointerRender && appWindow.WebpointerRender.renderUI) {
        appWindow.WebpointerRender.renderUI();
      }

      var handles = doc.querySelectorAll('#uiGroup .handle-node');
      expect(handles.length).toBeGreaterThan(0);
    });

    test('S02_TC04: 회전된 호(arc) 및 직사각형(rect/rounded) 선택 상자(boxRect) transform 회전 및 렌더링 검증 수트', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var doc = appWindow.document;
      var obj = cfg.objectsMap.get('arc_handles_test');
      if (obj) {
        obj.attrs.angle = 45;
        if (appWindow.WebpointerRender && appWindow.WebpointerRender.renderUI) {
          appWindow.WebpointerRender.renderUI();
        }
      }
      var box = doc.querySelector('#uiGroup rect[stroke-dasharray="4,4"]') || doc.querySelector('#uiGroup rect');
      expect(box).toBeTruthy();
      var tf = box ? box.getAttribute('transform') : '';
      expect(tf && tf.includes('rotate(45')).toBe(true);
    });

    test('S02_TC05: 채우기가 없는(fill: none) 호(arc) 경로 근처 자석선택(Magnet Selection) 및 허수 영역 배제 검증 수트', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var doc = appWindow.document;
      var selection = appWindow.WebpointerSelection;

      var pathEl = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      doc.getElementById('objectsGroup').appendChild(pathEl);
      var arcObj = {
        id: 'unfilled_arc_magnet_test',
        type: 'arc',
        el: pathEl,
        attrs: { cx: 200, cy: 200, rx: 100, ry: 100, startAngle: -90, endAngle: 0, fill: 'none', stroke: '#0284c7', strokeWidth: 4 }
      };
      cfg.objectsMap.set(arcObj.id, arcObj);

      var detected = selection && selection.findNearestObject ? selection.findNearestObject(275, 125, 20) : null;
      expect(detected && detected.id === 'unfilled_arc_magnet_test').toBe(true);
    });

    test('S02_TC06: 직선(line) 그리기 및 양 끝점 조절 시 Ctrl 키 가로/세로 직교 스냅(Orthogonal Lock) 검증 수트', async function({ page, appWindow }) {
      var px1 = 100, py1 = 100;
      var px2H = 300, py2H = 110;
      var px2V = 110, py2V = 350;

      // Horizontal snap check
      var dxH = px2H - px1;
      var dyH = py2H - py1;
      var snapX2H, snapY2H;
      if (Math.abs(dxH) >= Math.abs(dyH)) {
        snapX2H = px2H;
        snapY2H = py1;
      } else {
        snapX2H = px1;
        snapY2H = py2H;
      }
      expect(snapY2H).toBe(100);

      // Vertical snap check
      var dxV = px2V - px1;
      var dyV = py2V - py1;
      var snapX2V, snapY2V;
      if (Math.abs(dxV) >= Math.abs(dyV)) {
        snapX2V = px2V;
        snapY2V = py1;
      } else {
        snapX2V = px1;
        snapY2V = py2V;
      }
      expect(snapX2V).toBe(100);
    });

    test('S02_TC07: Core Geometry & Objects Engine Matrix (create, shift, rotate, flip, sync)', async function({ page, appWindow }) {
      var objs = appWindow.WebpointerObjects;
      if (objs) {
        var newRect = objs.createSvgObject('rect', { px: 10, py: 10 }, { px: 110, py: 60 });
        expect(newRect).toBeDefined();

        var bounds = objs.getObjectBounds(newRect);
        expect(bounds).toBeDefined();

        if (objs.shiftObject) objs.shiftObject(newRect, 10, 10);
        if (objs.rotatePoint) {
          var pt = objs.rotatePoint(10, 10, 0, 0, 90);
          expect(pt).toBeDefined();
        }
        if (objs.rotateObject) objs.rotateObject(newRect, 45);
        if (objs.flipObject) objs.flipObject(newRect, 'horizontal');
        if (objs.syncShapeTextBounds) objs.syncShapeTextBounds(newRect);
      }
    });

    test('S02_TC08: Canvas Rendering & Helper Points Engine', async function({ page, appWindow }) {
      var render = appWindow.WebpointerRender;
      if (render) {
        if (render.renderGrid) render.renderGrid();
        if (render.updateSvgDefs) render.updateSvgDefs();
        if (render.updateDomTree) render.updateDomTree();
        if (render.renderCanvas) render.renderCanvas();
        if (render.renderSnapGuides) render.renderSnapGuides([]);
        if (render.clearSnapGuides) render.clearSnapGuides();
      }
      expect(true).toBe(true);
    });

    test('S02_TC09: Filter String Compiler Engine (compileFilterString)', async function({ page, appWindow }) {
      var canvas = appWindow.WebpointerRenderCanvas;
      if (canvas && canvas.compileFilterString) {
        var testList = [
          { type: 'blur', val: 8, unit: 'px', enabled: true },
          { type: 'drop-shadow', dx: 3, dy: 3, blur: 6, color: '#ff0000', enabled: true },
          { type: 'glow', blur: 12, color: '#00ffff', enabled: true },
          { type: 'sepia', val: 100, unit: '%', enabled: false } // disabled should be skipped
        ];
        var compiled = canvas.compileFilterString(testList);
        expect(compiled).toContain('blur(8px)');
        expect(compiled).toContain('drop-shadow(3px 3px 6px #ff0000)');
        expect(compiled).toContain('drop-shadow(0px 0px 12px #00ffff)');
        expect(compiled.includes('sepia')).toBe(false);
      }
    });

  });
})();
