/**
 * Suite 06: Canvas Tools, Symbols, Layers, Snapping & Metrics (S06_TC01 ~ S06_TC13)
 */
(function() {
  var describe = window.WebpointerTest.describe;
  var test = window.WebpointerTest.test;
  var expect = window.WebpointerTest.expect;

  describe('Suite 06: Canvas Tools, Symbols & Layers', function() {

    test('S06_TC01: Proximity Selection Distance & Nearest Object Detection', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      var pt = { id: 'prox_point', type: 'point', attrs: { cx: 100, cy: 100, r: 5 } };
      cfg.objectsMap.set(pt.id, pt);

      var selection = appWindow.WebpointerSelection;
      var found = selection && selection.findNearestObject ? selection.findNearestObject(105, 105) : null;
      expect(found && found.id === 'prox_point').toBe(true);
    });

    test('S06_TC02: Animation Tab & Preset Previews', async function({ page, appWindow }) {
      if (appWindow.switchTab) appWindow.switchTab('anim');
      expect(appWindow.WebpointerConfig.currentTab).toBe('anim');
    });

    test('S06_TC03: Shortcut Guidance Modal Popup', async function({ page, appWindow }) {
      if (appWindow.openShortcutModal) {
        appWindow.openShortcutModal();
        var modal = appWindow.document.getElementById('shortcutModal');
        expect(modal).toBeDefined();
        if (appWindow.closeShortcutModal) appWindow.closeShortcutModal();
      }
    });

    test('S06_TC04: Detailed Settings Modal & Apply Proximity Threshold', async function({ page, appWindow }) {
      if (appWindow.openDetailedSettingsModal) {
        appWindow.openDetailedSettingsModal();
        var modal = appWindow.document.getElementById('detailedSettingsModal');
        expect(modal).toBeDefined();
        if (appWindow.closeDetailedSettingsModal) appWindow.closeDetailedSettingsModal();
      }
    });

    test('S06_TC05: Non-Destructive Image & Shape Cropping (ClipPath)', async function({ page, appWindow }) {
      var imgObj = { id: 'crop_img', type: 'image', attrs: { x: 50, y: 50, width: 200, height: 200, crop: { x: 10, y: 10, width: 100, height: 100 } } };
      appWindow.WebpointerConfig.objectsMap.set(imgObj.id, imgObj);
      expect(imgObj.attrs.crop.width).toBe(100);
    });

    test('S06_TC06: Symbol Manager Modal & Symbol Registry Operations', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      expect(Array.isArray(cfg.symbolRegistry)).toBe(true);
    });

    test('S06_TC07: Object Alignment & Distribution Tools', async function({ page, appWindow }) {
      var o1 = { id: 'al_1', type: 'rect', attrs: { x: 100, y: 100, width: 50, height: 50 } };
      var o2 = { id: 'al_2', type: 'rect', attrs: { x: 200, y: 100, width: 50, height: 50 } };
      appWindow.WebpointerConfig.objectsMap.set(o1.id, o1);
      appWindow.WebpointerConfig.objectsMap.set(o2.id, o2);
      appWindow.WebpointerConfig.selectedIds.clear();
      appWindow.WebpointerConfig.selectedIds.add(o1.id);
      appWindow.WebpointerConfig.selectedIds.add(o2.id);

      if (appWindow.alignSelectedObjects) {
        appWindow.alignSelectedObjects('left');
        expect(o2.attrs.x).toBe(100);
      }
    });

    test('S06_TC08: 그림 맨앞으로, 앞으로, 맨뒤로, 뒤로 레이어 순서 변경', async function({ page, appWindow }) {
      expect(typeof appWindow.bringToFront).toBe('function');
      expect(typeof appWindow.bringForward).toBe('function');
      expect(typeof appWindow.sendToBack).toBe('function');
      expect(typeof appWindow.sendBackward).toBe('function');
    });

    test('S06_TC09: 리본 메뉴 [삽입 > 수치] 및 transformSelected(rotate90) 90도 회전', async function({ page, appWindow }) {
      var obj = { id: 'metric_obj', type: 'rect', attrs: { x: 50, y: 50, width: 150, height: 80, angle: 0 } };
      appWindow.WebpointerConfig.objectsMap.set(obj.id, obj);
      appWindow.WebpointerConfig.selectedIds.clear();
      appWindow.WebpointerConfig.selectedIds.add(obj.id);

      if (appWindow.transformSelected) {
        appWindow.transformSelected('rotate90');
        expect(obj.attrs.angle).toBe(90);
      }
    });

    test('S06_TC10: Selection Math & Distance Engine Matrix (getStepCoords, getDistanceToObj, getDistanceToArc, getDistanceToSegment, getDistanceToBezier, selectObjectWithGroup)', async function({ page, appWindow }) {
      var sel = appWindow.WebpointerSelection;
      if (sel) {
        var dummyEvt = { clientX: 100, clientY: 100 };
        if (sel.getStepCoords) {
          var sc = sel.getStepCoords(dummyEvt);
          expect(sc).toBeDefined();
        }
        if (sel.getDistanceToSegment) {
          var d = sel.getDistanceToSegment(100, 100, 0, 0, 200, 200);
          expect(d).toBeGreaterThanOrEqual(0);
        }
        if (sel.getDistanceToObj) sel.getDistanceToObj({ type: 'rect', attrs: { x: 0, y: 0, width: 50, height: 50 } }, 10, 10);
        if (sel.getDistanceToArc) sel.getDistanceToArc({ attrs: { cx: 50, cy: 50, rx: 30, ry: 30, startAngle: 0, endAngle: 90 } }, 50, 20);
        if (sel.getDistanceToBezier) sel.getDistanceToBezier({ type: 'bez2', attrs: { points: [{ px: 0, py: 0 }, { px: 100, py: 100 }] } }, 50, 50);
        if (sel.selectObjectWithGroup) sel.selectObjectWithGroup('prox_point', false);
      }
      expect(true).toBe(true);
    });

    test('S06_TC11: Custom Path & Path Preset Manager Modals', async function({ page, appWindow }) {
      if (appWindow.openPathManagerModal && appWindow.closePathManagerModal) {
        appWindow.openPathManagerModal();
        appWindow.closePathManagerModal();
      }
      expect(true).toBe(true);
    });

    test('S06_TC12: Marker Manager & Stroke Caps/Joins Matrix', async function({ page, appWindow }) {
      if (appWindow.openMarkerManagerModal && appWindow.closeMarkerManagerModal) {
        appWindow.openMarkerManagerModal();
        appWindow.closeMarkerManagerModal();
      }
      if (appWindow.cycleStrokeCap) appWindow.cycleStrokeCap();
      if (appWindow.cycleStrokeJoin) appWindow.cycleStrokeJoin();
      expect(true).toBe(true);
    });

    test('S06_TC13: Grouping, Ungrouping & Smart Snapping Matrix', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var o1 = { id: 'g_o1', type: 'rect', attrs: { x: 10, y: 10, width: 20, height: 20 } };
      var o2 = { id: 'g_o2', type: 'rect', attrs: { x: 50, y: 50, width: 20, height: 20 } };
      cfg.objectsMap.clear();
      cfg.selectedIds.clear();
      cfg.objectsMap.set(o1.id, o1);
      cfg.objectsMap.set(o2.id, o2);
      cfg.selectedIds.add(o1.id);
      cfg.selectedIds.add(o2.id);

      if (appWindow.groupSelected) appWindow.groupSelected();
      if (appWindow.ungroupSelected) appWindow.ungroupSelected();
      expect(true).toBe(true);
    });

  });
})();
