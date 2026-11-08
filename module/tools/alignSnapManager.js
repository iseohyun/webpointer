/**
 * @file module/tools/alignSnapManager.js
 * @description 다중 객체 정렬(Align), 간격 분배(Distribute), 스마트 스냅 가이드(Smart Snaps) 연산 모듈
 */
(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;

  function getObjAttr(obj, prop) {
    if (!obj) return 0;
    if (obj.attrs && obj.attrs[prop] !== undefined) return obj.attrs[prop];
    return obj[prop] !== undefined ? obj[prop] : 0;
  }

  function setObjAttr(obj, prop, val) {
    if (!obj) return;
    obj[prop] = val;
    if (!obj.attrs) obj.attrs = {};
    obj.attrs[prop] = val;
  }

  function alignSelectedObjects(type) {
    if (type === 'hspace') return distributeObjects('horizontal');
    if (type === 'vspace') return distributeObjects('vertical');

    var selected = [];
    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (obj) selected.push(obj);
    });
    if (selected.length === 0) return;

    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    selected.forEach(function(obj) {
      var x = getObjAttr(obj, 'x');
      var y = getObjAttr(obj, 'y');
      var w = getObjAttr(obj, 'width');
      var h = getObjAttr(obj, 'height');
      if (x < minX) minX = x;
      if (x + w > maxX) maxX = x + w;
      if (y < minY) minY = y;
      if (y + h > maxY) maxY = y + h;
    });

    var centerX = (minX + maxX) / 2;
    var centerY = (minY + maxY) / 2;

    selected.forEach(function(obj) {
      var w = getObjAttr(obj, 'width');
      var h = getObjAttr(obj, 'height');
      if (type === 'left') setObjAttr(obj, 'x', minX);
      else if (type === 'center' || type === 'hcenter') setObjAttr(obj, 'x', centerX - w / 2);
      else if (type === 'right') setObjAttr(obj, 'x', maxX - w);
      else if (type === 'top') setObjAttr(obj, 'y', minY);
      else if (type === 'middle' || type === 'vcenter') setObjAttr(obj, 'y', centerY - h / 2);
      else if (type === 'bottom') setObjAttr(obj, 'y', maxY - h);

      if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
        window.WebpointerRender.updateElementAttributes(obj);
      }
    });

    if (window.WebpointerRender && window.WebpointerRender.renderUI) {
      window.WebpointerRender.renderUI();
    }
    if (window.pushHistoryState) window.pushHistoryState();
  }

  function distributeObjects(axis) {
    var selected = [];
    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (obj) selected.push(obj);
    });
    if (selected.length < 3) return;

    if (axis === 'horizontal') {
      selected.sort(function(a, b) { return getObjAttr(a, 'x') - getObjAttr(b, 'x'); });
      var minX = getObjAttr(selected[0], 'x');
      var maxX = getObjAttr(selected[selected.length - 1], 'x');
      var step = (maxX - minX) / (selected.length - 1);
      for (var i = 1; i < selected.length - 1; i++) {
        setObjAttr(selected[i], 'x', minX + step * i);
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(selected[i]);
        }
      }
    } else if (axis === 'vertical') {
      selected.sort(function(a, b) { return getObjAttr(a, 'y') - getObjAttr(b, 'y'); });
      var minY = getObjAttr(selected[0], 'y');
      var maxY = getObjAttr(selected[selected.length - 1], 'y');
      var step = (maxY - minY) / (selected.length - 1);
      for (var i = 1; i < selected.length - 1; i++) {
        setObjAttr(selected[i], 'y', minY + step * i);
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(selected[i]);
        }
      }
    }

    if (window.WebpointerRender && window.WebpointerRender.renderUI) {
      window.WebpointerRender.renderUI();
    }
    if (window.pushHistoryState) window.pushHistoryState();
  }

  function calculateSmartSnaps(dragObj, newX, newY) {
    var threshold = cfg.snappingThreshold !== undefined ? cfg.snappingThreshold : 12;
    var resultX = newX;
    var resultY = newY;
    var guides = [];
    if (!cfg.objectsMap || cfg.enableSnapping === false || cfg.snappingEnabled === false) {
      return { x: resultX, y: resultY, lines: guides, guides: guides };
    }

    var w = getObjAttr(dragObj, 'width');
    var h = getObjAttr(dragObj, 'height');
    var left = newX;
    var centerX = newX + w / 2;
    var right = newX + w;
    var top = newY;
    var centerY = newY + h / 2;
    var bottom = newY + h;

    cfg.objectsMap.forEach(function(other) {
      if (other.id === dragObj.id) return;
      var ow = getObjAttr(other, 'width');
      var oh = getObjAttr(other, 'height');
      var oLeft = getObjAttr(other, 'x');
      var oCenterX = oLeft + ow / 2;
      var oRight = oLeft + ow;
      var oTop = getObjAttr(other, 'y');
      var oCenterY = oTop + oh / 2;
      var oBottom = oTop + oh;

      if (Math.abs(left - oLeft) <= threshold) {
        resultX = oLeft;
        guides.push({ type: 'v', x1: oLeft, y1: 0, x2: oLeft, y2: 2000, color: '#ec4899' });
      } else if (Math.abs(centerX - oCenterX) <= threshold) {
        resultX = oCenterX - w / 2;
        guides.push({ type: 'v', x1: oCenterX, y1: 0, x2: oCenterX, y2: 2000, color: '#ec4899' });
      } else if (Math.abs(right - oRight) <= threshold) {
        resultX = oRight - w;
        guides.push({ type: 'v', x1: oRight, y1: 0, x2: oRight, y2: 2000, color: '#ec4899' });
      }

      if (Math.abs(top - oTop) <= threshold) {
        resultY = oTop;
        guides.push({ type: 'h', x1: 0, y1: oTop, x2: 2000, y2: oTop, color: '#ec4899' });
      } else if (Math.abs(centerY - oCenterY) <= threshold) {
        resultY = oCenterY - h / 2;
        guides.push({ type: 'h', x1: 0, y1: oCenterY, x2: 2000, y2: oCenterY, color: '#ec4899' });
      } else if (Math.abs(bottom - oBottom) <= threshold) {
        resultY = oBottom - h;
        guides.push({ type: 'h', x1: 0, y1: oBottom, x2: 2000, y2: oBottom, color: '#ec4899' });
      }
    });

    return { x: resultX, y: resultY, lines: guides, guides: guides };
  }

  function alignSelected(dir) {
    alignSelectedObjects(dir);
  }

  window.alignSelectedObjects = alignSelectedObjects;
  window.alignObjects = alignSelectedObjects;
  window.alignSelected = alignSelected;
  window.distributeObjects = distributeObjects;
  window.calculateSmartSnaps = calculateSmartSnaps;

  window.WebpointerAlignSnap = {
    alignSelectedObjects: alignSelectedObjects,
    alignObjects: alignSelectedObjects,
    alignSelected: alignSelected,
    distributeObjects: distributeObjects,
    calculateSmartSnaps: calculateSmartSnaps
  };
})(window);
