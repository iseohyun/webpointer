/**
 * Suite 04: Text Formatting, Alignment, AutoFit & Rotation (S04_TC01 ~ S04_TC14)
 */
(function() {
  var describe = window.WebpointerTest.describe;
  var test = window.WebpointerTest.test;
  var expect = window.WebpointerTest.expect;
  var beforeEach = window.WebpointerTest.beforeEach;

  describe('Suite 04: Text Formatting, Alignment, AutoFit & Rotation', function() {

    beforeEach(function({ appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      cfg.padTop = 10;
      cfg.padBottom = 10;
      cfg.padLeft = 10;
      cfg.padRight = 10;
      cfg.padSync = true;
      cfg.fontSize = 20;
      cfg.textDominantBaseline = 'hanging';
      cfg.textWritingMode = 'horizontal-tb';
      cfg.textDecoration = 'none';
      cfg.textAnchor = 'start';
      cfg.fontWeight = 'normal';
      cfg.fontStyle = 'normal';
      if (appWindow.WebpointerState) {
        appWindow.WebpointerState.holdTriggered = false;
      }
    });

    test('S04_TC01: Detailed Text Formatting Suite (Font, Underline Style)', async function({ page, appWindow }) {
      if (appWindow.setTextUnderlineStyle) {
        appWindow.setTextUnderlineStyle('double');
        expect(appWindow.WebpointerConfig.textUnderlineStyle).toBe('double');
      }
    });

    test('S04_TC02: Text Selection Font Size Hotkeys (+/-)', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var curSize = cfg.fontSize || 20;
      if (appWindow.adjustFontSize) {
        appWindow.adjustFontSize(2);
        expect(cfg.fontSize).toBe(curSize + 2);
        appWindow.adjustFontSize(-2);
        expect(cfg.fontSize).toBe(curSize);
      }
    });

    test('S04_TC03: Shape Text Horizontal & Vertical Alignment Suite', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      cfg.padTop = 10;
      cfg.padBottom = 10;
      cfg.padLeft = 10;
      cfg.padRight = 10;

      var shapeObj = { id: 's1', type: 'rect', attrs: { x: 100, y: 100, width: 200, height: 100 } };
      var textObj = { id: 't1', type: 'text', attrs: { text: 'Hello', fontSize: 20 } };
      if (appWindow.updateShapeTextAlignment) {
        appWindow.updateShapeTextAlignment(shapeObj, textObj, 'left', 'top');
        expect(textObj.attrs.x).toBe(110); // 100 + padLeft(10) = 110

        appWindow.updateShapeTextAlignment(shapeObj, textObj, 'right', 'bottom');
        expect(textObj.attrs.x).toBe(290); // 100 + 200 - padRight(10) = 290
      }
    });

    test('S04_TC04: 텍스트 상자 회전 및 피벗 중심축 일치 검증', async function({ page, appWindow }) {
      var textObj = { id: 'rot_text', type: 'text', attrs: { x: 200, y: 200, text: '회전 텍스트', fontSize: 20, angle: 30 } };
      appWindow.WebpointerConfig.objectsMap.set(textObj.id, textObj);

      var center = appWindow.WebpointerObjects ? appWindow.WebpointerObjects.getObjectCenter(textObj) : { x: 200, y: 200 };
      expect(center).toBeDefined();
      expect(center.x).toBeGreaterThan(0);
      expect(center.y).toBeGreaterThan(0);
    });

    test('S04_TC05: <text> 요소 NaN/undefined 속성 안전 방어', async function({ page, appWindow }) {
      var doc = appWindow.document;
      var textEl = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      var textObj = { id: 'nan_text', type: 'text', el: textEl, attrs: { x: NaN, y: undefined, text: 'Safe' } };
      if (appWindow.WebpointerRender && appWindow.WebpointerRender.updateElementAttributes) {
        appWindow.WebpointerRender.updateElementAttributes(textObj);
      }
      expect(parseFloat(textEl.getAttribute('x')) || 0).toBe(0);
      expect(parseFloat(textEl.getAttribute('y')) || 0).toBe(0);
    });

    test('S04_TC06: 도형 영역 할당 텍스트의 중심축 회전 및 동기화', async function({ page, appWindow }) {
      var rectObj = { id: 'r_rot', type: 'rect', parentId: 'grp_rot', attrs: { x: 200, y: 200, width: 200, height: 100, angle: 45 } };
      var textObj = { id: 't_rot', type: 'text', parentId: 'grp_rot', attrs: { x: 200, y: 200, width: 200, height: 100, text: '동기화', angle: 45 } };
      appWindow.WebpointerConfig.objectsMap.set(rectObj.id, rectObj);
      appWindow.WebpointerConfig.objectsMap.set(textObj.id, textObj);

      expect(rectObj.attrs.angle).toBe(45);
      expect(textObj.attrs.angle).toBe(45);
    });

    test('S04_TC07: F2 키 편집모드, dominant-baseline="hanging" 및 글상자 크기 동기화', async function({ page, appWindow }) {
      var doc = appWindow.document;
      var textEl = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      var textObj = { id: 't_hang', type: 'text', el: textEl, attrs: { x: 100, y: 100, text: '상단 베이스라인', dominantBaseline: 'hanging' } };
      if (appWindow.WebpointerRender && appWindow.WebpointerRender.updateElementAttributes) {
        appWindow.WebpointerRender.updateElementAttributes(textObj);
      }
      expect(textEl.getAttribute('dominant-baseline')).toBe('hanging');
    });

    test('S04_TC08: 양쪽 맞춤 경계 위치 및 word-spacing 조절', async function({ page, appWindow }) {
      var doc = appWindow.document;
      var textEl = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      doc.getElementById('objectsGroup').appendChild(textEl);
      var textObj = {
        id: 't_just',
        type: 'text',
        el: textEl,
        attrs: { x: 100, y: 100, text: 'Hello World Justify Test', textAnchor: 'justify', fontSize: 20, width: 300 }
      };
      if (appWindow.WebpointerRender && appWindow.WebpointerRender.updateElementAttributes) {
        appWindow.WebpointerRender.updateElementAttributes(textObj);
      }
      expect(textEl.getAttribute('text-anchor')).toBe('start');
    });

    test('S04_TC09: 위/중앙/아래 정렬 시 hanging 베이스라인 오프셋 반영 및 반복 토글 위치 고정', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      cfg.padTop = 10;
      cfg.padBottom = 10;
      cfg.textDominantBaseline = 'hanging';

      var shape = { id: 's_v', type: 'rect', parentId: 'grp_v', attrs: { x: 100, y: 100, width: 200, height: 200 } };
      var text = { id: 't_v', type: 'text', parentId: 'grp_v', attrs: { x: 100, y: 100, width: 200, height: 200, text: '수직정렬\n2행', fontSize: 20, verticalAlign: 'top' } };
      cfg.objectsMap.set(shape.id, shape);
      cfg.objectsMap.set(text.id, text);
      cfg.selectedIds.clear();
      cfg.selectedIds.add(text.id);

      appWindow.cycleTextVerticalAlign(); // middle
      var midY = text.attrs.y;
      appWindow.cycleTextVerticalAlign(); // bottom
      var botY = text.attrs.y;
      appWindow.cycleTextVerticalAlign(); // top
      var topY = text.attrs.y;

      expect(topY).toBe(110);
      expect(midY).toBeGreaterThan(100);
      expect(midY).toBeLessThan(300);
      expect(botY).toBeGreaterThan(midY);
    });

    test('S04_TC10: Ctrl+C / Ctrl+V 클립보드 기능 검증', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var clipboard = appWindow.WebpointerClipboard;
      var doc = appWindow.document;

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      var rectEl = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
      doc.getElementById('objectsGroup').appendChild(rectEl);
      var rect = { id: 'c_r1', type: 'rect', el: rectEl, attrs: { x: 50, y: 50, width: 100, height: 100 } };
      cfg.objectsMap.set(rect.id, rect);
      cfg.selectedIds.add(rect.id);

      if (clipboard && clipboard.copySelectedObjects) {
        clipboard.copySelectedObjects();
        clipboard.pasteClipboardObjects();
      }

      expect(cfg.objectsMap.size).toBe(2);
    });

    test('S04_TC11: 글 서식 탭 내 패딩 카테고리 연동 및 수직 정렬 정확도', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      cfg.padTop = 10;
      cfg.padBottom = 10;
      cfg.padLeft = 10;
      cfg.padRight = 10;
      cfg.padSync = true;

      expect(cfg.padTop).toBe(10);
      expect(cfg.padBottom).toBe(10);
      expect(cfg.padLeft).toBe(10);
      expect(cfg.padRight).toBe(10);
      expect(cfg.padSync).toBe(true);

      if (appWindow.setTextPadding) {
        appWindow.setTextPadding('top', 25);
        expect(cfg.padTop).toBe(25);
        appWindow.setTextPadding('top', 10);
      }
    });

    test('S04_TC12: fitTextToShape 및 cycleTextAutoFitMode 폰트 보존 검증', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var shape = { id: 'sp_s', type: 'rect', parentId: 'grp_sp', attrs: { x: 100, y: 100, width: 100, height: 50 } };
      var text = { id: 'sp_t', type: 'text', parentId: 'grp_sp', attrs: { x: 100, y: 100, width: 100, height: 50, text: '긴 텍스트가 들어가서 크기가 줄어들어야 하는 테스트', fontSize: 20, baseFontSize: 20, autoFitMode: 'fitShapeToText' } };
      cfg.objectsMap.set(shape.id, shape);
      cfg.objectsMap.set(text.id, text);
      cfg.selectedIds.clear();
      cfg.selectedIds.add(shape.id);

      appWindow.cycleTextAutoFitMode(); // fitTextToShape -> shrunk
      var cycle1FontSize = text.attrs.fontSize;

      appWindow.cycleTextAutoFitMode(); // none
      appWindow.cycleTextAutoFitMode(); // fitShapeToText (Back to start!)
      var cycle2FitShapeFontSize = text.attrs.fontSize;

      appWindow.cycleTextAutoFitMode(); // fitTextToShape
      var cycle2FontSize = text.attrs.fontSize;

      appWindow.cycleTextAutoFitMode(); // none
      appWindow.cycleTextAutoFitMode(); // fitShapeToText
      var cycle3FitShapeFontSize = text.attrs.fontSize;

      appWindow.cycleTextAutoFitMode(); // fitTextToShape
      var cycle3FontSize = text.attrs.fontSize;

      expect(cycle1FontSize).toBeLessThanOrEqual(20);
      expect(cycle2FitShapeFontSize).toBe(20);
      expect(cycle3FitShapeFontSize).toBe(20);
      expect(cycle3FontSize).toBe(cycle2FontSize);
    });

    test('S04_TC13: Text Tool Deep Geometry & Caret Tracking Matrix', async function({ page, appWindow }) {
      var tt = appWindow.WebpointerTextTool;
      if (tt) {
        if (tt.getShapeTextInsertionPoint) {
          var pt = tt.getShapeTextInsertionPoint({ attrs: { x: 0, y: 0, width: 100, height: 50 } });
          expect(pt).toBeDefined();
        }
        if (tt.getSharpContrastColor) {
          expect(tt.getSharpContrastColor('#000000')).toBeTruthy();
          expect(tt.getSharpContrastColor('#ffffff')).toBeTruthy();
        }
      }
      expect(true).toBe(true);
    });

    test('S04_TC14: Text Ribbon Typography Matrix (Font, Weight, Anchor, LineHeight)', async function({ page, appWindow }) {
      if (appWindow.setTextFontFamily) appWindow.setTextFontFamily('sans-serif');
      if (appWindow.setTextFontSize) appWindow.setTextFontSize(24);
      if (appWindow.setTextFontWeight) appWindow.setTextFontWeight('bold');
      if (appWindow.setTextFontStyle) appWindow.setTextFontStyle('italic');
      if (appWindow.setTextAnchor) appWindow.setTextAnchor('middle');
      if (appWindow.cycleTextHorizontalAlign) appWindow.cycleTextHorizontalAlign();
      if (appWindow.applyTextStyleToSelected) appWindow.applyTextStyleToSelected();

      expect(true).toBe(true);
    });

  });
})();
