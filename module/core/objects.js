(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;
  var state = window.WebpointerState;

  function createSvgObject(type, stepStart, stepEnd) {
    var objectsGroup = document.getElementById('objectsGroup');
    var id = 'obj_' + (cfg.nextId++);
    var el, attrs = {};

    var px1 = (stepStart.stepX / cfg.STEPS_X) * cfg.SVG_WIDTH;
    var py1 = (stepStart.stepY / cfg.STEPS_Y) * cfg.SVG_HEIGHT;
    var px2 = (stepEnd.stepX / cfg.STEPS_X) * cfg.SVG_WIDTH;
    var py2 = (stepEnd.stepY / cfg.STEPS_Y) * cfg.SVG_HEIGHT;

    if (type === 'point') {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      attrs = { cx: px1, cy: py1, r: cfg.pointRadius || 5, stepX: stepStart.stepX, stepY: stepStart.stepY };
    } else if (type === 'line') {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      attrs = { x1: px1, y1: py1, x2: px2, y2: py2, stepX1: stepStart.stepX, stepY1: stepStart.stepY, stepX2: stepEnd.stepX, stepY2: stepEnd.stepY };
    } else if (type === 'rect' || type === 'rounded' || type === 'image') {
      if (type === 'image') {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      } else {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      }
      var x = Math.min(px1, px2);
      var y = Math.min(py1, py2);
      var w = Math.max(10, Math.abs(px2 - px1));
      var h = Math.max(10, Math.abs(py2 - py1));
      var rx = type === 'rounded' ? 15 : 0;
      attrs = { x: x, y: y, width: w, height: h, rx: rx, stepX: Math.min(stepStart.stepX, stepEnd.stepX), stepY: Math.min(stepStart.stepY, stepEnd.stepY), stepW: Math.abs(stepEnd.stepX - stepStart.stepX), stepH: Math.abs(stepEnd.stepY - stepStart.stepY) };
      if (type === 'image' && extraData) {
        attrs.href = extraData;
        attrs.preserveAspectRatio = 'xMidYMid meet';
      }
    } else if (type === 'ellipse') {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      var cx = (px1 + px2) / 2;
      var cy = (py1 + py2) / 2;
      var rxEl = Math.max(10, Math.abs(px2 - px1) / 2);
      var ryEl = Math.max(10, Math.abs(py2 - py1) / 2);
      attrs = { cx: cx, cy: cy, rx: rxEl, ry: ryEl, angle: 0, stepCx: Math.round((stepStart.stepX + stepEnd.stepX) / 2), stepCy: Math.round((stepStart.stepY + stepEnd.stepY) / 2), stepRx: Math.abs(stepEnd.stepX - stepStart.stepX) / 2, stepRy: Math.abs(stepEnd.stepY - stepStart.stepY) / 2 };
    } else if (type === 'arc') {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      var rArc = Math.max(10, Math.hypot(px2 - px1, py2 - py1));
      var initialEndAngle = Math.round(Math.atan2(py2 - py1, px2 - px1) * (180 / Math.PI));
      attrs = {
        cx: px1,
        cy: py1,
        rx: rArc,
        ry: rArc,
        startAngle: -90,
        endAngle: initialEndAngle,
        angle: 0
      };
    } else if (type === 'bez2' || type === 'bez3') {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      attrs = { pathD: 'M ' + px1 + ' ' + py1, points: [{px: px1, py: py1, stepX: stepStart.stepX, stepY: stepStart.stepY}], ctrls3: [] };
    }

    attrs.stroke = cfg.strokeColor || '#041e49';
    attrs.fill = cfg.fillColor || 'none';
    attrs.strokeWidth = cfg.strokeWidth || 2;
    attrs.strokeDashStyle = cfg.strokeDashStyle || 'solid';
    attrs.strokeDashArray = cfg.strokeDashArray || '6,6';
    attrs.strokeCap = cfg.strokeCap || 'butt';
    attrs.strokeJoin = cfg.strokeJoin || 'miter';

    el.setAttribute('id', id);
    el.setAttribute('stroke', cfg.strokeColor || '#041e49');
    el.setAttribute('fill', cfg.fillColor || 'none');
    el.setAttribute('stroke-width', cfg.strokeWidth || 2);
    el.setAttribute('stroke-linecap', attrs.strokeCap);
    el.setAttribute('stroke-linejoin', attrs.strokeJoin);

    if (cfg.strokeDashStyle === 'dashed' && cfg.strokeDashArray) {
      el.setAttribute('stroke-dasharray', cfg.strokeDashArray);
    }

    if (cfg.startMarker !== 'none') el.setAttribute('marker-start', 'url(#marker-start-' + cfg.startMarker + ')');
    if (cfg.endMarker !== 'none') el.setAttribute('marker-end', 'url(#marker-end-' + cfg.endMarker + ')');

    var objData = { id: id, type: type, parentId: null, attrs: attrs, el: el };
    cfg.objectsMap.set(id, objData);
    if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
      window.WebpointerRender.updateElementAttributes(objData);
      window.WebpointerRender.updateDomTree();
    }
    if (objectsGroup) objectsGroup.appendChild(el);
    return objData;
  }

  function getObjectBounds(obj) {
    if (!obj || !obj.attrs) return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    var a = obj.attrs;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    if (obj.type === 'point') {
      var r = a.r || 5;
      var cx = a.cx || 0, cy = a.cy || 0;
      minX = cx - r; maxX = cx + r;
      minY = cy - r; maxY = cy + r;
    } else if (obj.type === 'line') {
      var x1 = a.x1 || 0, x2 = a.x2 || 0, y1 = a.y1 || 0, y2 = a.y2 || 0;
      minX = Math.min(x1, x2); maxX = Math.max(x1, x2);
      minY = Math.min(y1, y2); maxY = Math.max(y1, y2);
    } else if (obj.type === 'rect' || obj.type === 'rounded' || obj.type === 'image') {
      var state = window.WebpointerState || {};
      var hasCrop = a.cropLeft || a.cropRight || a.cropTop || a.cropBottom;
      var ox = a.x || 0, oy = a.y || 0, ow = a.width || 100, oh = a.height || 100;
      if (hasCrop && !state.isCropModeActive) {
        var cL = a.cropLeft || 0;
        var cR = a.cropRight || 0;
        var cT = a.cropTop || 0;
        var cB = a.cropBottom || 0;
        minX = ox + ow * cL;
        maxX = ox + ow * (1 - cR);
        minY = oy + oh * cT;
        maxY = oy + oh * (1 - cB);
      } else {
        minX = ox; maxX = ox + ow;
        minY = oy; maxY = oy + oh;
      }
    } else if (obj.type === 'text') {
      if (a.width && a.height) {
        minX = a.x; maxX = a.x + a.width;
        minY = a.y; maxY = a.y + a.height;
      } else {
        var hasBBox = false;
        try {
          if (obj.el) {
            var bb = obj.el.getBBox();
            if (bb && bb.width > 0 && bb.height > 0) {
              minX = bb.x; maxX = bb.x + bb.width;
              minY = bb.y; maxY = bb.y + bb.height;
              hasBBox = true;
            }
          }
        } catch(e) {}
        if (!hasBBox) {
          var fontSize = parseInt(a.fontSize || 20, 10);
          if (isNaN(fontSize) || fontSize <= 0) fontSize = 20;
          var approxW = (a.text || '').length * (fontSize * 0.55);
          var tx = (a.x !== undefined && a.x !== null && !isNaN(parseFloat(a.x))) ? parseFloat(a.x) : 0;
          var ty = (a.y !== undefined && a.y !== null && !isNaN(parseFloat(a.y))) ? parseFloat(a.y) : 0;
          minX = tx; maxX = tx + approxW;
          minY = ty - fontSize; maxY = ty + 4;
        }
      }
    } else if (obj.type === 'ellipse' || obj.type === 'arc') {
      var ecx = a.cx || 0, ecy = a.cy || 0, erx = a.rx || 30, ery = a.ry || 30;
      minX = ecx - erx; maxX = ecx + erx;
      minY = ecy - ery; maxY = ecy + ery;
    } else if (obj.type === 'bez2' || obj.type === 'bez3') {
      if (a.points && a.points.length > 0) {
        a.points.forEach(function(pt) {
          if (pt && typeof pt.px === 'number' && typeof pt.py === 'number') {
            minX = Math.min(minX, pt.px); maxX = Math.max(maxX, pt.px);
            minY = Math.min(minY, pt.py); maxY = Math.max(maxY, pt.py);
          }
        });
        if (a.firstCtrl && typeof a.firstCtrl.cx === 'number' && typeof a.firstCtrl.cy === 'number') {
          minX = Math.min(minX, a.firstCtrl.cx); maxX = Math.max(maxX, a.firstCtrl.cx);
          minY = Math.min(minY, a.firstCtrl.cy); maxY = Math.max(maxY, a.firstCtrl.cy);
        }
        if (a.ctrls3 && Array.isArray(a.ctrls3)) {
          a.ctrls3.forEach(function(cp) {
            if (cp && cp.c1 && typeof cp.c1.x === 'number' && typeof cp.c1.y === 'number') {
              minX = Math.min(minX, cp.c1.x); maxX = Math.max(maxX, cp.c1.x);
              minY = Math.min(minY, cp.c1.y); maxY = Math.max(maxY, cp.c1.y);
            }
            if (cp && cp.c2 && typeof cp.c2.x === 'number' && typeof cp.c2.y === 'number') {
              minX = Math.min(minX, cp.c2.x); maxX = Math.max(maxX, cp.c2.x);
              minY = Math.min(minY, cp.c2.y); maxY = Math.max(maxY, cp.c2.y);
            }
          });
        }
      } else {
        var bx1 = a.x1 || 0, bx2 = a.x2 || 100, by1 = a.y1 || 0, by2 = a.y2 || 100;
        minX = Math.min(bx1, bx2); maxX = Math.max(bx1, bx2);
        minY = Math.min(by1, by2); maxY = Math.max(by1, by2);
      }
    }

    if (!isFinite(minX) || isNaN(minX)) minX = a.x || a.x1 || a.cx || 0;
    if (!isFinite(maxX) || isNaN(maxX)) maxX = (a.x !== undefined ? a.x + (a.width || 100) : (a.x2 !== undefined ? a.x2 : (a.cx !== undefined ? a.cx + (a.rx || 50) : 100)));
    if (!isFinite(minY) || isNaN(minY)) minY = a.y || a.y1 || a.cy || 0;
    if (!isFinite(maxY) || isNaN(maxY)) maxY = (a.y !== undefined ? a.y + (a.height || 100) : (a.y2 !== undefined ? a.y2 : (a.cy !== undefined ? a.cy + (a.ry || 50) : 100)));

    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
  }

  function shiftObject(obj, deltaX, deltaY) {
    var a = obj.attrs;
    if (obj.type === 'point' || obj.type === 'ellipse' || obj.type === 'arc') {
      a.cx += deltaX; a.cy += deltaY;
    } else if (obj.type === 'line') {
      a.x1 += deltaX; a.y1 += deltaY;
      a.x2 += deltaX; a.y2 += deltaY;
    } else if (obj.type === 'rect' || obj.type === 'rounded' || obj.type === 'text' || obj.type === 'image') {
      a.x += deltaX; a.y += deltaY;
    } else if (obj.type === 'bez2' || obj.type === 'bez3') {
      if (a.points && a.points.length > 0) {
        a.points.forEach(function(pt) {
          pt.px += deltaX; pt.py += deltaY;
        });
        if (a.firstCtrl) {
          a.firstCtrl.cx += deltaX; a.firstCtrl.cy += deltaY;
        }
        if (a.ctrls3) {
          a.ctrls3.forEach(function(cp) {
            if (!cp) return;
            if (cp.c1) { cp.c1.x += deltaX; cp.c1.y += deltaY; }
            if (cp.c2) { cp.c2.x += deltaX; cp.c2.y += deltaY; }
          });
        }
        if (window.WebpointerBezier && window.WebpointerBezier.buildContinuousBezierPathD) {
          a.pathD = window.WebpointerBezier.buildContinuousBezierPathD(a.points, null, obj.type, a.firstCtrl, null, null, a.ctrls3, a.ctrls2);
        }
      } else {
        a.x1 += deltaX; a.y1 += deltaY;
        a.x2 += deltaX; a.y2 += deltaY;
        if (a.cx !== undefined) { a.cx += deltaX; a.cy += deltaY; }
        if (a.c1x !== undefined) { a.c1x += deltaX; a.c1y += deltaY; }
        if (a.c2x !== undefined) { a.c2x += deltaX; a.c2y += deltaY; }
      }
    }
    if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
      window.WebpointerRender.updateElementAttributes(obj);
    }
  }

  function rotatePoint(px, py, deg) {
    var rad = deg * (Math.PI / 180);
    var cx = (cfg.SVG_WIDTH || 960) / 2;
    var cy = (cfg.SVG_HEIGHT || 540) / 2;
    var dx = px - cx;
    var dy = py - cy;
    return {
      x: Math.round(cx + dx * Math.cos(rad) - dy * Math.sin(rad)),
      y: Math.round(cy + dx * Math.sin(rad) + dy * Math.cos(rad))
    };
  }

  function rotateObject(obj, deg) {
    var a = obj.attrs;
    if (obj.type === 'point') {
      var pPt = rotatePoint(a.cx, a.cy, deg);
      a.cx = pPt.x; a.cy = pPt.y;
    } else if (obj.type === 'ellipse' || obj.type === 'arc') {
      var pEl = rotatePoint(a.cx, a.cy, deg);
      a.cx = pEl.x; a.cy = pEl.y;
      a.angle = ((a.angle || 0) + deg) % 360;
    } else if (obj.type === 'line') {
      var pL1 = rotatePoint(a.x1, a.y1, deg);
      var pL2 = rotatePoint(a.x2, a.y2, deg);
      a.x1 = pL1.x; a.y1 = pL1.y;
      a.x2 = pL2.x; a.y2 = pL2.y;
    } else if (obj.type === 'rect' || obj.type === 'rounded' || obj.type === 'text' || obj.type === 'image') {
      var rectCenter = { x: a.x + (a.width || 80) / 2, y: a.y + (a.height || 24) / 2 };
      var pRectC = rotatePoint(rectCenter.x, rectCenter.y, deg);
      var oldW = a.width || 80;
      var oldH = a.height || 24;
      a.width = oldH;
      a.height = oldW;
      a.x = pRectC.x - a.width / 2;
      a.y = pRectC.y - a.height / 2;
    } else if (obj.type === 'bez2' || obj.type === 'bez3') {
      if (a.points && a.points.length > 0) {
        a.points.forEach(function(pt) {
          var pRot = rotatePoint(pt.px, pt.py, deg);
          pt.px = pRot.x; pt.py = pRot.y;
        });
        if (a.firstCtrl) {
          var pFC = rotatePoint(a.firstCtrl.cx, a.firstCtrl.cy, deg);
          a.firstCtrl.cx = pFC.x; a.firstCtrl.cy = pFC.y;
        }
        if (a.ctrls3) {
          a.ctrls3.forEach(function(cp) {
            if (!cp) return;
            if (cp.c1) {
              var pC1 = rotatePoint(cp.c1.x, cp.c1.y, deg);
              cp.c1.x = pC1.x; cp.c1.y = pC1.y;
            }
            if (cp.c2) {
              var pC2 = rotatePoint(cp.c2.x, cp.c2.y, deg);
              cp.c2.x = pC2.x; cp.c2.y = pC2.y;
            }
          });
        }
        if (window.WebpointerBezier && window.WebpointerBezier.buildContinuousBezierPathD) {
          a.pathD = window.WebpointerBezier.buildContinuousBezierPathD(a.points, null, obj.type, a.firstCtrl, null, null, a.ctrls3, a.ctrls2);
        }
      }
    }
    if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
      window.WebpointerRender.updateElementAttributes(obj);
    }
  }

  function flipObject(obj, dir) {
    var a = obj.attrs;
    var cx = (cfg.SVG_WIDTH || 960) / 2;
    var cy = (cfg.SVG_HEIGHT || 540) / 2;

    if (dir === 'H') {
      if (obj.type === 'point' || obj.type === 'ellipse' || obj.type === 'arc') a.cx = 2 * cx - a.cx;
      else if (obj.type === 'line') { a.x1 = 2 * cx - a.x1; a.x2 = 2 * cx - a.x2; }
      else if (obj.type === 'rect' || obj.type === 'rounded' || obj.type === 'text' || obj.type === 'image') a.x = 2 * cx - (a.x + (a.width || 80));
      else if (obj.type === 'bez2' || obj.type === 'bez3') {
        if (a.points) a.points.forEach(function(pt) { pt.px = 2 * cx - pt.px; });
        if (a.firstCtrl) a.firstCtrl.cx = 2 * cx - a.firstCtrl.cx;
        if (a.ctrls3) a.ctrls3.forEach(function(cp) {
          if (!cp) return;
          if (cp.c1) cp.c1.x = 2 * cx - cp.c1.x;
          if (cp.c2) cp.c2.x = 2 * cx - cp.c2.x;
        });
        if (window.WebpointerBezier && window.WebpointerBezier.buildContinuousBezierPathD) {
          a.pathD = window.WebpointerBezier.buildContinuousBezierPathD(a.points, null, obj.type, a.firstCtrl, null, null, a.ctrls3, a.ctrls2);
        }
      }
    } else if (dir === 'V') {
      if (obj.type === 'point' || obj.type === 'ellipse' || obj.type === 'arc') a.cy = 2 * cy - a.cy;
      else if (obj.type === 'line') { a.y1 = 2 * cy - a.y1; a.y2 = 2 * cy - a.y2; }
      else if (obj.type === 'rect' || obj.type === 'rounded' || obj.type === 'text' || obj.type === 'image') a.y = 2 * cy - (a.y + (a.height || 24));
      else if (obj.type === 'bez2' || obj.type === 'bez3') {
        if (a.points) a.points.forEach(function(pt) { pt.py = 2 * cy - pt.py; });
        if (a.firstCtrl) a.firstCtrl.cy = 2 * cy - a.firstCtrl.cy;
        if (a.ctrls3) a.ctrls3.forEach(function(cp) {
          if (!cp) return;
          if (cp.c1) cp.c1.y = 2 * cy - cp.c1.y;
          if (cp.c2) cp.c2.y = 2 * cy - cp.c2.y;
        });
        if (window.WebpointerBezier && window.WebpointerBezier.buildContinuousBezierPathD) {
          a.pathD = window.WebpointerBezier.buildContinuousBezierPathD(a.points, null, obj.type, a.firstCtrl, null, null, a.ctrls3, a.ctrls2);
        }
      }
    }
    if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
      window.WebpointerRender.updateElementAttributes(obj);
    }
  }

  function getObjectCenter(obj) {
    if (!obj || !obj.attrs) return { x: 0, y: 0 };
    var a = obj.attrs;
    if (a.cx !== undefined && a.cy !== undefined) {
      return { x: a.cx, y: a.cy };
    }
    var bounds = getObjectBounds(obj);
    return { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  }

  function syncShapeTextBounds(shapeObj) {
    if (!shapeObj || shapeObj.type === 'text') return;
    var cfg = window.WebpointerConfig;
    if (!cfg) return;

    var bounds = getObjectBounds(shapeObj);
    var shapeW = Math.max(1, bounds.maxX - bounds.minX);
    var shapeH = Math.max(1, bounds.maxY - bounds.minY);
    var shapeAngle = shapeObj.attrs.angle || 0;

    cfg.objectsMap.forEach(function(sObj) {
      if (sObj.type === 'text') {
        var isAssociated = false;
        if (shapeObj.parentId && sObj.parentId === shapeObj.parentId) {
          isAssociated = true;
        } else if (cfg.selectedIds && cfg.selectedIds.has(sObj.id) && cfg.selectedIds.has(shapeObj.id)) {
          isAssociated = true;
        }

        if (isAssociated) {
          sObj.attrs.x = bounds.minX;
          sObj.attrs.y = bounds.minY;
          sObj.attrs.width = shapeW;
          sObj.attrs.height = shapeH;
          sObj.attrs.angle = shapeAngle;
          if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
            window.WebpointerRender.updateElementAttributes(sObj);
          }
        }
      }
    });
  }

  window.WebpointerObjects = {
    createSvgObject: createSvgObject,
    getObjectBounds: getObjectBounds,
    getObjectCenter: getObjectCenter,
    syncShapeTextBounds: syncShapeTextBounds,
    shiftObject: shiftObject,
    rotatePoint: rotatePoint,
    rotateObject: rotateObject,
    flipObject: flipObject
  };
})(window);
