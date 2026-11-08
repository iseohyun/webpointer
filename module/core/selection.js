(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;

  function getStepCoords(e) {
    var svgBox = document.getElementById('mainSvg');
    if (!svgBox) return { stepX: 0, stepY: 0, rawX: 0, rawY: 0, px: 0, py: 0 };
    var rect = svgBox.getBoundingClientRect();

    var mouseX = e.clientX - rect.left;
    var mouseY = e.clientY - rect.top;

    var px = (mouseX / rect.width) * (cfg.SVG_WIDTH || 960);
    var py = (mouseY / rect.height) * (cfg.SVG_HEIGHT || 540);

    var rawX = Math.round(px);
    var rawY = Math.round(py);

    var stepX = Math.round((rawX / (cfg.SVG_WIDTH || 960)) * (cfg.STEPS_X || 40));
    var stepY = Math.round((rawY / (cfg.SVG_HEIGHT || 540)) * (cfg.STEPS_Y || 40));

    stepX = Math.max(0, Math.min(cfg.STEPS_X || 40, stepX));
    stepY = Math.max(0, Math.min(cfg.STEPS_Y || 40, stepY));

    return { stepX: stepX, stepY: stepY, rawX: rawX, rawY: rawY, px: px, py: py };
  }

  function getDistanceToObj(px, py, obj) {
    var a = obj.attrs;
    if (obj.type === 'point') {
      return Math.hypot(px - a.cx, py - a.cy);
    } else if (obj.type === 'line') {
      var x1 = a.x1, y1 = a.y1, x2 = a.x2, y2 = a.y2;
      var A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
      var dot = A * C + B * D;
      var lenSq = C * C + D * D;
      var param = lenSq !== 0 ? dot / lenSq : -1;
      var xx, yy;
      if (param < 0) { xx = x1; yy = y1; }
      else if (param > 1) { xx = x2; yy = y2; }
      else { xx = x1 + param * C; yy = y1 + param * D; }
      return Math.hypot(px - xx, py - yy);
    } else if (obj.type === 'rect' || obj.type === 'rounded' || obj.type === 'image') {
      var rx = a.x, ry = a.y, rw = a.width, rh = a.height;
      if (px >= rx && px <= rx + rw && py >= ry && py <= ry + rh) return 0;
      var dx = Math.max(rx - px, 0, px - (rx + rw));
      var dy = Math.max(ry - py, 0, py - (ry + rh));
      return Math.hypot(dx, dy);
    } else if (obj.type === 'text') {
      var bounds = window.WebpointerObjects ? window.WebpointerObjects.getObjectBounds(obj) : { minX: a.x, maxX: a.x + 80, minY: a.y - 20, maxY: a.y };
      if (px >= bounds.minX && px <= bounds.maxX && py >= bounds.minY && py <= bounds.maxY) return 0;
      var dX = Math.max(bounds.minX - px, 0, px - bounds.maxX);
      var dY = Math.max(bounds.minY - py, 0, py - bounds.maxY);
      return Math.hypot(dX, dY);
    } else if (obj.type === 'ellipse') {
      return Math.hypot(px - a.cx, py - a.cy);
    } else if (obj.type === 'arc') {
      return getDistanceToArc(px, py, obj);
    } else if (obj.type === 'bez2' || obj.type === 'bez3') {
      return getDistanceToBezier(px, py, obj);
    }
    return Infinity;
  }

  function getDistanceToArc(px, py, obj) {
    var a = obj.attrs;
    var rx = a.rx || 30;
    var ry = a.ry || 30;
    var cx = a.cx;
    var cy = a.cy;
    var rot = a.angle || 0;
    var rotRad = rot * (Math.PI / 180);
    var sAng = a.startAngle !== undefined ? a.startAngle : -90;
    var eAng = a.endAngle !== undefined ? a.endAngle : 0;

    var sweep = (eAng - sAng);

    var isFilled = a.fill && a.fill !== 'none' && a.fill !== 'transparent';
    if (isFilled) {
      var dx = px - cx;
      var dy = py - cy;
      var unrotX = dx * Math.cos(-rotRad) - dy * Math.sin(-rotRad);
      var unrotY = dx * Math.sin(-rotRad) + dy * Math.cos(-rotRad);
      var normDistSq = (unrotX * unrotX) / (rx * rx) + (unrotY * unrotY) / (ry * ry);

      if (normDistSq <= 1.0) {
        var clickAng = Math.atan2(unrotY, unrotX) * (180 / Math.PI);
        var relAng = (clickAng - sAng + 720) % 360;
        var relEnd = (eAng - sAng + 720) % 360;
        if (relAng <= relEnd) {
          return 0;
        }
      }
    }

    var minD = Infinity;
    var STEPS = 25;
    for (var i = 0; i <= STEPS; i++) {
      var t = i / STEPS;
      var deg = sAng + t * sweep;
      var rad = deg * (Math.PI / 180);
      var localX = rx * Math.cos(rad);
      var localY = ry * Math.sin(rad);
      var rotX = cx + (localX * Math.cos(rotRad) - localY * Math.sin(rotRad));
      var rotY = cy + (localX * Math.sin(rotRad) + localY * Math.cos(rotRad));
      var dist = Math.hypot(px - rotX, py - rotY);
      if (dist < minD) minD = dist;
    }
    return minD;
  }

  function getDistanceToSegment(px, py, x1, y1, x2, y2) {
    var A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    var dot = A * C + B * D;
    var lenSq = C * C + D * D;
    var param = lenSq !== 0 ? dot / lenSq : -1;
    var xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    return Math.hypot(px - xx, py - yy);
  }

  function getDistanceToBezier(px, py, obj) {
    var a = obj.attrs;
    var pts = a.points || [];
    if (pts.length === 0) return Infinity;
    if (pts.length === 1) return Math.hypot(px - pts[0].px, py - pts[0].py);

    var minD = Infinity;
    var SAMPLES = 20;

    if (obj.type === 'bez2') {
      var ctrls2 = a.ctrls2 || [];
      var prevC = null;

      for (var seg = 0; seg < pts.length - 1; seg++) {
        var pStart = pts[seg];
        var pEnd = pts[seg + 1];
        var ctrl;

        if (seg === 0) {
          ctrl = a.firstCtrl ? { x: a.firstCtrl.cx, y: a.firstCtrl.cy } : (ctrls2[0] ? { x: ctrls2[0].cx, y: ctrls2[0].cy } : { x: Math.round((pStart.px + pEnd.px) / 2), y: Math.round((pStart.py + pEnd.py) / 2 - 50) });
          prevC = ctrl;
        } else {
          if (ctrls2[seg]) {
            ctrl = { x: ctrls2[seg].cx, y: ctrls2[seg].cy };
            prevC = ctrl;
          } else {
            var basePrevC = prevC || { x: pStart.px, y: pStart.py };
            ctrl = { x: 2 * pStart.px - basePrevC.x, y: 2 * pStart.py - basePrevC.y };
            prevC = ctrl;
          }
        }

        var prevSample = { x: pStart.px, y: pStart.py };
        for (var i = 1; i <= SAMPLES; i++) {
          var t = i / SAMPLES;
          var invT = 1 - t;
          var sampleX = invT * invT * pStart.px + 2 * invT * t * ctrl.x + t * t * pEnd.px;
          var sampleY = invT * invT * pStart.py + 2 * invT * t * ctrl.y + t * t * pEnd.py;

          var segD = getDistanceToSegment(px, py, prevSample.x, prevSample.y, sampleX, sampleY);
          if (segD < minD) minD = segD;
          prevSample = { x: sampleX, y: sampleY };
        }
      }
    } else if (obj.type === 'bez3') {
      var ctrls3 = a.ctrls3 || [];
      var prevC2 = null;

      for (var seg = 0; seg < pts.length - 1; seg++) {
        var pStart = pts[seg];
        var pEnd = pts[seg + 1];
        var ctrl1, ctrl2;

        var defaultC2 = { x: pEnd.px, y: Math.round((pStart.py + pEnd.py) / 2 - 50) };
        ctrl2 = (ctrls3[seg] && ctrls3[seg].c2) ? ctrls3[seg].c2 : defaultC2;

        if (seg === 0) {
          var defaultC1 = { x: pStart.px, y: Math.round((pStart.py + pEnd.py) / 2 - 50) };
          ctrl1 = (ctrls3[0] && ctrls3[0].c1) ? ctrls3[0].c1 : defaultC1;
        } else {
          if (ctrls3[seg] && ctrls3[seg].c1) {
            ctrl1 = ctrls3[seg].c1;
          } else {
            var basePrevC2 = prevC2 || { x: pStart.px, y: pStart.py };
            ctrl1 = { x: 2 * pStart.px - basePrevC2.x, y: 2 * pStart.py - basePrevC2.y };
          }
        }
        prevC2 = ctrl2;

        var prevSample = { x: pStart.px, y: pStart.py };
        for (var i = 1; i <= SAMPLES; i++) {
          var t = i / SAMPLES;
          var invT = 1 - t;
          var sampleX = invT * invT * invT * pStart.px + 3 * invT * invT * t * ctrl1.x + 3 * invT * t * t * ctrl2.x + t * t * t * pEnd.px;
          var sampleY = invT * invT * invT * pStart.py + 3 * invT * invT * t * ctrl1.y + 3 * invT * t * t * ctrl2.y + t * t * t * pEnd.py;

          var segD = getDistanceToSegment(px, py, prevSample.x, prevSample.y, sampleX, sampleY);
          if (segD < minD) minD = segD;
          prevSample = { x: sampleX, y: sampleY };
        }
      }
    }
    return minD;
  }

  function findNearestObject(px, py) {
    var threshold = cfg.proximityThreshold !== undefined ? cfg.proximityThreshold : 30;
    if (threshold <= 0) return null;

    var nearestObj = null;
    var minDistance = Infinity;

    cfg.objectsMap.forEach(function(obj) {
      var d = getDistanceToObj(px, py, obj);
      if (d < minDistance) {
        minDistance = d;
        nearestObj = obj;
      }
    });

    if (nearestObj && minDistance <= threshold) {
      return nearestObj;
    }
    return null;
  }

  function selectObjectWithGroup(objId, isToggle) {
    if (!isToggle) cfg.selectedIds.clear();

    var target = cfg.objectsMap.get(objId);
    if (!target) return;

    if (target.parentId) {
      cfg.objectsMap.forEach(function(o, id) {
        if (o.parentId === target.parentId) {
          if (isToggle && cfg.selectedIds.has(id)) cfg.selectedIds.delete(id);
          else cfg.selectedIds.add(id);
        }
      });
    } else {
      if (isToggle && cfg.selectedIds.has(objId)) cfg.selectedIds.delete(objId);
      else cfg.selectedIds.add(objId);
    }
  }

  window.WebpointerSelection = {
    getStepCoords: getStepCoords,
    getDistanceToObj: getDistanceToObj,
    findNearestObject: findNearestObject,
    selectObjectWithGroup: selectObjectWithGroup
  };
})(window);
