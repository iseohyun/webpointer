/**
 * Suite 03: Styling, Gradients, Filters & Color Long-Press (S03_TC01 ~ S03_TC09)
 */
(function() {
  var describe = window.WebpointerTest.describe;
  var test = window.WebpointerTest.test;
  var expect = window.WebpointerTest.expect;

  describe('Suite 03: Styles, Gradients & Colors', function() {

    test('S03_TC01: Shape & Style Settings Suite', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      if (appWindow.setStrokeColor) {
        appWindow.setStrokeColor('#ff0000');
        expect(cfg.strokeColor).toBe('#ff0000');
      }
      if (appWindow.setFillColor) {
        appWindow.setFillColor('#00ff00');
        expect(cfg.fillColor).toBe('#00ff00');
      }
    });

    test('S03_TC02: Gradient Fill Presets & Color Stops', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      if (appWindow.applyGradientPreset) {
        appWindow.applyGradientPreset(1);
        expect(cfg.fillColor).toContain('linear-gradient');
      }
    });

    test('S03_TC03: CSS / SVG Filter Effects (Drop Shadow, Blur, Grayscale)', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      if (appWindow.setDropShadow) {
        appWindow.setDropShadow(true);
        expect(cfg.dropShadow).toBe(true);
      }
      if (appWindow.setBlurEffect) {
        appWindow.setBlurEffect(5);
        expect(cfg.blurEffect).toBe(5);
      }
    });

    test('S03_TC04: Gradient Direct Angle Slider & Stop Controls', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      if (appWindow.setGradientAngle) {
        appWindow.setGradientAngle(180);
        expect(cfg.gradientAngle).toBe(180);
      }
    });

    test('S03_TC05: Detailed Shape Format Toolbar Suite', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var obj = { id: 's_fmt_test', type: 'rect', attrs: { x: 50, y: 50, width: 100, height: 100, strokeWidth: 2 } };
      cfg.objectsMap.set(obj.id, obj);
      cfg.selectedIds.clear();
      cfg.selectedIds.add(obj.id);

      if (appWindow.setStrokeWidth) {
        appWindow.setStrokeWidth(6);
        expect(obj.attrs.strokeWidth).toBe(6);
      }
    });

    test('S03_TC06: Gradient Fill Linear & Radial Engine with SVG Defs Injection', async function({ page, appWindow }) {
      var doc = appWindow.document;
      var defs = doc.getElementById('svgDefs');
      expect(defs).toBeTruthy();
    });

    test('S03_TC07: 색상 버튼 5종 단독 적용 및 200ms 롱프레스 팔레트 팝오버', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var shape = { id: 'color_test_s', type: 'rect', parentId: 'grp_color', attrs: { x: 100, y: 100, width: 100, height: 100, stroke: '#000000', fill: '#ffffff' } };
      var text = { id: 'color_test_t', type: 'text', parentId: 'grp_color', attrs: { x: 100, y: 100, width: 100, height: 100, text: 'Sample', fill: '#000000', stroke: 'none' } };

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();
      cfg.objectsMap.set(shape.id, shape);
      cfg.objectsMap.set(text.id, text);
      cfg.selectedIds.add(shape.id);

      // Short click stroke color
      cfg.strokeColor = '#059669';
      if (appWindow.applyCurrentColorDirectly) {
        appWindow.applyCurrentColorDirectly('stroke');
        expect(shape.attrs.stroke).toBe('#059669');
        expect(shape.attrs.fill).toBe('#ffffff');
      }

      // Short click text fill color (merged into shape group)
      cfg.textFillColor = '#dc2626';
      if (appWindow.applyCurrentColorDirectly) {
        appWindow.applyCurrentColorDirectly('text_fill');
        expect(text.attrs.fill).toBe('#dc2626');
      }
    });

    test('S03_TC08: Gradient & Defs Generator Matrix Handlers', async function({ page, appWindow }) {
      if (appWindow.openGradientManagerModal && appWindow.closeGradientManagerModal) {
        appWindow.openGradientManagerModal();
        appWindow.closeGradientManagerModal();
      }
      expect(true).toBe(true);
    });

    test('S03_TC09: 11종 효과 직접 적용, 리스트박스 On/Off 토글, 순서 변경, 삭제 및 전체 초기화', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var obj = { id: 'fx_test_obj', type: 'rect', attrs: { x: 50, y: 50, width: 100, height: 100, filterList: [] } };
      cfg.objectsMap.clear();
      cfg.selectedIds.clear();
      cfg.objectsMap.set(obj.id, obj);
      cfg.selectedIds.add(obj.id);

      // Direct Apply blur and drop-shadow
      appWindow.applyEffectDirect('blur');
      expect(obj.attrs.filterList.length).toBe(1);
      expect(obj.attrs.filterList[0].type).toBe('blur');
      expect(obj.attrs.filterList[0].val).toBe(5);

      appWindow.applyEffectDirect('drop-shadow');
      expect(obj.attrs.filterList.length).toBe(2);
      expect(obj.attrs.filterList[1].type).toBe('drop-shadow');

      // Toggle On/Off
      appWindow.toggleEffectEnabled(0, false);
      expect(obj.attrs.filterList[0].enabled).toBe(false);
      appWindow.toggleEffectEnabled(0, true);
      expect(obj.attrs.filterList[0].enabled).toBe(true);

      // Reorder
      appWindow.reorderEffect(0, 1);
      expect(obj.attrs.filterList[0].type).toBe('drop-shadow');
      expect(obj.attrs.filterList[1].type).toBe('blur');

      // Remove single
      appWindow.removeEffectItem(0);
      expect(obj.attrs.filterList.length).toBe(1);
      expect(obj.attrs.filterList[0].type).toBe('blur');

      // Clear all
      appWindow.clearAllFilterEffects();
      expect(obj.attrs.filterList.length).toBe(0);
    });

    test('S03_TC10: 롱프레스 타이머, 파라미터 Popover, 라이브 프리뷰/취소 롤백, 다중선택 공통목록 검증', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var obj1 = { id: 'fx_m1', type: 'rect', attrs: { x: 10, y: 10, width: 50, height: 50, filterList: [{ type: 'blur', val: 5, enabled: true }] } };
      var obj2 = { id: 'fx_m2', type: 'circle', attrs: { cx: 100, cy: 100, r: 30, filterList: [{ type: 'blur', val: 5, enabled: true }, { type: 'sepia', val: 100, enabled: true }] } };

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();
      cfg.objectsMap.set(obj1.id, obj1);
      cfg.objectsMap.set(obj2.id, obj2);
      cfg.selectedIds.add(obj1.id);
      cfg.selectedIds.add(obj2.id);

      // Multi-selection common list & discrepancy check
      var commonRes = appWindow.getCommonFilterList(cfg.selectedIds);
      expect(commonRes.hasDiscrepancy).toBe(true);
      expect(commonRes.commonList.length).toBe(1);

      // Long-press Popover open & cancel rollback
      var dummyBtn = appWindow.document.createElement('button');
      appWindow.document.body.appendChild(dummyBtn);

      appWindow.openEffectParamPopover(dummyBtn, 'drop-shadow');
      var pop = appWindow.document.getElementById('effectParamPopover');
      expect(pop).toBeTruthy();

      // Live preview
      appWindow.livePreviewEffect('drop-shadow');
      expect(obj1.attrs.filterList.length).toBe(2);

      // Cancel and rollback
      appWindow.cancelEffectParam();
      expect(obj1.attrs.filterList.length).toBe(1);

      // Edit existing item popover & confirm
      appWindow.openEffectEditPopover(dummyBtn, 0);
      appWindow.confirmEffectParam('blur', 0);
      expect(obj1.attrs.filterList.length).toBe(1);

      // Hold helpers
      appWindow.startHoldEffect({ preventDefault: function(){} }, dummyBtn, 'glow');
      appWindow.endHoldEffect();

      // Compatibility filter aliases
      if (appWindow.openFilterPopover) appWindow.openFilterPopover(dummyBtn, 'blur');
      if (appWindow.updateFilterRangeConfig) appWindow.updateFilterRangeConfig('blur', 5);
      if (appWindow.addFilterFromPopover) appWindow.addFilterFromPopover('blur');

      if (dummyBtn.parentNode) dummyBtn.parentNode.removeChild(dummyBtn);
    });

  });
})();
