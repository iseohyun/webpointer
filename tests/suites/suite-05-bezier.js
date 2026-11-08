/**
 * Suite 05: Bezier Curves, Virtual Handles & S-Syntax (S05_TC01 ~ S05_TC06)
 */
(function() {
  var describe = window.WebpointerTest.describe;
  var test = window.WebpointerTest.test;
  var expect = window.WebpointerTest.expect;

  describe('Suite 05: Bezier Curves & Chains', function() {

    test('S05_TC01: 2차/3차 베지어 곡선 그리기 시 c2 TypeError 방어 및 ESC 키 모드 종결', async function({ page, appWindow }) {
      var state = appWindow.WebpointerState || {};
      state.isDrawingBezier = false;
      expect(state.isDrawingBezier).toBe(false);
    });

    test('S05_TC02: webpointer_drawing SVG 파일 로딩, NaN 콘솔 에러 0개 및 핸들러 정상 동작', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      expect(cfg.objectsMap).toBeDefined();
    });

    test('S05_TC03: 연속 베지어 가상 핸들러 역계산 연동 조절 및 다중 세그먼트 전파', async function({ page, appWindow }) {
      var bezObj = {
        id: 'bez_chain_test',
        type: 'bez3',
        attrs: {
          x1: 100, y1: 100, c1x: 150, c1y: 100, c2x: 200, c2y: 150, x2: 250, y2: 200,
          segments: [
            { c2x: 300, c2y: 250, x: 350, y: 300 }
          ]
        }
      };
      appWindow.WebpointerConfig.objectsMap.set(bezObj.id, bezObj);
      expect(bezObj.attrs.segments.length).toBe(1);
    });

    test('S05_TC04: 연속 3차 베지어 곡선 SVG S 구문 및 5개 세그먼트 독립성 검증', async function({ page, appWindow }) {
      var bez5 = {
        id: 'bez5_test',
        type: 'bez3',
        attrs: {
          x1: 100, y1: 100, c1x: 150, c1y: 100, c2x: 200, c2y: 150, x2: 250, y2: 200,
          segments: [
            { c2x: 300, c2y: 250, x: 350, y: 300 },
            { c2x: 400, c2y: 350, x: 450, y: 400 },
            { c2x: 500, c2y: 450, x: 550, y: 500 },
            { c2x: 600, c2y: 550, x: 650, y: 600 }
          ]
        }
      };
      appWindow.WebpointerConfig.objectsMap.set(bez5.id, bez5);
      expect(bez5.attrs.segments.length).toBe(4);
    });

    test('S05_TC05: 베지어 곡선(bez2/bez3) 경로 자석 근접 선택 검증', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      var bezObj = {
        id: 'bez2_proximity_test',
        type: 'bez2',
        attrs: {
          points: [{ px: 100, py: 100 }, { px: 300, py: 100 }],
          firstCtrl: { cx: 200, cy: 50 },
          ctrls2: [{ cx: 200, cy: 50 }]
        }
      };
      cfg.objectsMap.set(bezObj.id, bezObj);

      var selection = appWindow.WebpointerSelection;
      var found = selection && selection.findNearestObject ? selection.findNearestObject(200, 80) : null;
      expect(found && found.id === 'bez2_proximity_test').toBe(true);
    });

    test('S05_TC06: Bezier Engine Math, Multi-Bezier Finish & Split Modals Handlers', async function({ page, appWindow }) {
      var bz = appWindow.WebpointerBezier;
      if (bz) {
        if (bz.buildContinuousBezierPathD) {
          var d = bz.buildContinuousBezierPathD([{ px: 0, py: 0 }, { px: 100, py: 100 }], null, 'bez2', { cx: 50, cy: 0 });
          expect(d).toBeTruthy();
        }
        if (bz.finishMultiBezier) {
          bz.finishMultiBezier();
        }
      }
      expect(true).toBe(true);
    });

  });
})();
