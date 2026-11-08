/**
 * @file module/tools/ribbonHandlers.js
 * @description 리본 탭/도구 전환, 기본 선/면/마커/텍스트 서식, 환경설정 모달, 레이어 Z-Order 및 그룹/변형 제어 모듈
 */
(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;
  var state = window.WebpointerState;
  var holdTimer = null;

  function setTool(tool) {
    if (state.isMultiBezierActive && tool !== 'bez2' && tool !== 'bez3') {
      if (window.WebpointerBezier && window.WebpointerBezier.finishMultiBezier) {
        window.WebpointerBezier.finishMultiBezier();
      }
    }
    cfg.currentTool = tool;
    var mainSvg = document.getElementById('mainSvg');
    if (mainSvg) {
      if (tool === 'text') {
        mainSvg.style.cursor = 'text';
      } else if (tool === 'pan') {
        mainSvg.style.cursor = 'grab';
      } else if (tool === 'select') {
        mainSvg.style.cursor = 'default';
      } else {
        mainSvg.style.cursor = 'crosshair';
      }
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function getAllGroupMembers(selectedIds) {
    var memberMap = new Map();

    function addObj(obj) {
      if (!obj || memberMap.has(obj.id)) return;
      memberMap.set(obj.id, obj);
      if (obj.parentId) {
        cfg.objectsMap.forEach(function(o) {
          if (o.parentId === obj.parentId && !memberMap.has(o.id)) {
            addObj(o);
          }
        });
      }
    }

    (selectedIds || new Set()).forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (obj) addObj(obj);
    });

    return Array.from(memberMap.values());
  }

  function applyStyleToSelected() {
    var objectsGroup = document.getElementById('objectsGroup');
    var members = getAllGroupMembers(cfg.selectedIds);
    var targetShapes = [];
    var standaloneTexts = [];

    var hasShapeInGroup = members.some(function(m) { return m.type !== 'text'; });
    members.forEach(function(m) {
      if (m.type !== 'text') {
        if (targetShapes.indexOf(m) === -1) targetShapes.push(m);
      } else if (!hasShapeInGroup) {
        if (standaloneTexts.indexOf(m) === -1) standaloneTexts.push(m);
      }
    });

    targetShapes.forEach(function(obj) {
      if (obj.attrs) {
        obj.attrs.stroke = cfg.strokeColor;
        obj.attrs.fill = cfg.fillColor;
        obj.attrs.strokeWidth = cfg.strokeWidth;
        obj.attrs.strokeDashStyle = cfg.strokeDashStyle;
        obj.attrs.strokeDashArray = cfg.strokeDashArray || '6,6';
        obj.attrs.strokeCap = cfg.strokeCap || 'butt';
        obj.attrs.strokeJoin = cfg.strokeJoin || 'miter';
      }
      if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
        window.WebpointerRender.updateElementAttributes(obj);
      }
    });

    standaloneTexts.forEach(function(textObj) {
      var bounds = window.WebpointerObjects ? window.WebpointerObjects.getObjectBounds(textObj) : null;
      if (!bounds) return;

      var rectX = Math.round(bounds.minX - 8);
      var rectY = Math.round(bounds.minY - 8);
      var rectW = Math.max(20, Math.round(bounds.maxX - bounds.minX + 16));
      var rectH = Math.max(20, Math.round(bounds.maxY - bounds.minY + 16));

      var shapeId = 'obj_' + (cfg.nextId++);
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

      var groupId = textObj.parentId || ('group_' + (cfg.nextId++));
      textObj.parentId = groupId;

      var attrs = {
        x: rectX,
        y: rectY,
        width: rectW,
        height: rectH,
        rx: 10,
        stroke: cfg.strokeColor || '#041e49',
        fill: cfg.fillColor || 'none',
        strokeWidth: cfg.strokeWidth || 2,
        strokeDashStyle: cfg.strokeDashStyle || 'solid',
        strokeDashArray: cfg.strokeDashArray || '6,6',
        strokeCap: cfg.strokeCap || 'butt',
        strokeJoin: cfg.strokeJoin || 'miter'
      };

      var newShapeObj = { id: shapeId, type: 'rounded', parentId: groupId, attrs: attrs, el: el };
      cfg.objectsMap.set(shapeId, newShapeObj);
      cfg.selectedIds.add(shapeId);

      if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
        window.WebpointerRender.updateElementAttributes(newShapeObj);
      }

      if (objectsGroup && textObj.el) {
        objectsGroup.insertBefore(el, textObj.el);
      } else if (objectsGroup) {
        objectsGroup.appendChild(el);
      }
    });
  }

  function setStrokeColor(val) {
    cfg.strokeColor = val;
    var members = getAllGroupMembers(cfg.selectedIds);
    members.forEach(function(obj) {
      if (obj && obj.attrs && obj.type !== 'text') {
        obj.attrs.stroke = val;
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(obj);
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setFillColor(val) {
    cfg.fillColor = val;
    var members = getAllGroupMembers(cfg.selectedIds);
    members.forEach(function(obj) {
      if (obj && obj.attrs && obj.type !== 'text') {
        obj.attrs.fill = val;
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(obj);
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setStrokeWidth(val) {
    cfg.strokeWidth = parseInt(val, 10) || 2;
    applyStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function adjustStrokeWidth(delta) {
    var cur = cfg.strokeWidth || 2;
    var nextW = Math.max(1, Math.min(50, cur + delta));
    setStrokeWidth(nextW);
  }

  function setStrokeDashStyle(style) {
    cfg.strokeDashStyle = style;
    applyStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function toggleStrokeDashStyle() {
    if (state.holdTriggered) {
      state.holdTriggered = false;
      return;
    }
    var cur = cfg.strokeDashStyle || 'solid';
    cfg.strokeDashStyle = (cur === 'dashed') ? 'solid' : 'dashed';
    applyStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function startHoldDashArray(e, btnEl) {
    state.holdTriggered = false;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(function() {
      state.holdTriggered = true;
      showDashArraySelectPopup(btnEl);
    }, 400);
  }

  function endHoldDashArray() {
    clearTimeout(holdTimer);
  }

  function showDashArraySelectPopup(btnEl) {
    var old = document.getElementById('dashArrayPopupSelect');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var popup = document.createElement('div');
    popup.id = 'dashArrayPopupSelect';
    popup.style.cssText = 'position:fixed; z-index:99999; padding:6px; border:1px solid #0284c7; border-radius:6px; background:#ffffff; box-shadow:0 6px 16px rgba(0,0,0,0.18); outline:none; font-family:sans-serif; display:flex; flex-direction:column; gap:4px; width:110px;';
    var rect = btnEl.getBoundingClientRect();
    popup.style.left = Math.max(10, rect.left) + 'px';
    popup.style.top = (rect.bottom + 4) + 'px';

    var cur = cfg.strokeDashArray || '6,6';
    popup.innerHTML =
      '<div style="font-size:0.75rem; font-weight:700; color:#0f172a;">점선 패턴</div>' +
      '<input type="text" id="dashArrayInput" value="' + cur + '" style="width:100%; box-sizing:border-box; padding:4px 6px; font-size:0.8rem; border:1px solid #cbd5e1; border-radius:4px; font-family:monospace; text-align:center;" placeholder="6,6">';

    document.body.appendChild(popup);
    var inputEl = document.getElementById('dashArrayInput');

    function closePopup() {
      var p = document.getElementById('dashArrayPopupSelect');
      if (p && p.parentNode) p.parentNode.removeChild(p);
    }

    if (inputEl) {
      inputEl.focus();
      inputEl.select();

      inputEl.onkeydown = function(ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          var val = inputEl.value.trim() || '6,6';
          closePopup();
          setStrokeDashArray(val);
        } else if (ev.key === 'Escape') {
          closePopup();
        }
      };

      inputEl.onblur = function() {
        setTimeout(function() {
          var val = inputEl ? inputEl.value.trim() : '';
          closePopup();
          if (val) setStrokeDashArray(val);
        }, 100);
      };
    }

    function onOutsideClick(evt) {
      if (popup && !popup.contains(evt.target) && !btnEl.contains(evt.target)) {
        closePopup();
        document.removeEventListener('mousedown', onOutsideClick);
      }
    }
    setTimeout(function() { document.addEventListener('mousedown', onOutsideClick); }, 50);
  }

  function setStrokeDashArray(arrStr) {
    cfg.strokeDashArray = arrStr;
    cfg.strokeDashStyle = 'dashed';
    applyStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setStrokeCap(val) {
    cfg.strokeCap = val;
    applyStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function cycleStrokeCap() {
    var cur = cfg.strokeCap || 'butt';
    var next = (cur === 'butt') ? 'round' : (cur === 'round' ? 'square' : 'butt');
    setStrokeCap(next);
  }

  function setStrokeJoin(val) {
    cfg.strokeJoin = val;
    applyStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function cycleStrokeJoin() {
    var cur = cfg.strokeJoin || 'miter';
    var next = (cur === 'miter') ? 'round' : (cur === 'round' ? 'bevel' : 'miter');
    setStrokeJoin(next);
  }

  function setStartMarker(val) {
    cfg.startMarker = val;
    applyStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setEndMarker(val) {
    cfg.endMarker = val;
    applyStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setStartMarkerFillStyle(style) {
    cfg.startMarkerFillStyle = style;
    applyStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function toggleStartMarkerFillStyle() {
    var cur = cfg.startMarkerFillStyle || 'solid';
    cfg.startMarkerFillStyle = (cur === 'solid') ? 'hollow' : 'solid';
    applyStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setEndMarkerFillStyle(style) {
    cfg.endMarkerFillStyle = style;
    applyStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function toggleEndMarkerFillStyle() {
    var cur = cfg.endMarkerFillStyle || 'solid';
    cfg.endMarkerFillStyle = (cur === 'solid') ? 'hollow' : 'solid';
    applyStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function scaleMarker(type, factor) {
    if (type === 'start') {
      cfg.startMarkerScale = Math.max(0.2, Math.min(5.0, (cfg.startMarkerScale || 1.0) * factor));
    } else {
      cfg.endMarkerScale = Math.max(0.2, Math.min(5.0, (cfg.endMarkerScale || 1.0) * factor));
    }
    applyStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function toggleCategoryCollapse(catId) {
    if (!cfg.collapsedCategories || !(cfg.collapsedCategories instanceof Set)) {
      cfg.collapsedCategories = new Set();
    }
    if (cfg.collapsedCategories.has(catId)) {
      cfg.collapsedCategories.delete(catId);
    } else {
      cfg.collapsedCategories.add(catId);
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function setTextUnderlineStyle(val) {
    cfg.textUnderlineStyle = val;
    var members = getAllGroupMembers(cfg.selectedIds);
    var textObjs = members.filter(function(m) { return m.type === 'text'; });
    textObjs.forEach(function(obj) {
      if (obj && obj.attrs) {
        obj.attrs.underlineStyle = val;
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(obj);
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setTextUnderlineOffset(val) {
    var num = parseInt(val, 10);
    cfg.textUnderlineOffset = isNaN(num) ? 3 : num;
    var members = getAllGroupMembers(cfg.selectedIds);
    var textObjs = members.filter(function(m) { return m.type === 'text'; });
    textObjs.forEach(function(obj) {
      if (obj && obj.attrs) {
        obj.attrs.underlineOffset = cfg.textUnderlineOffset;
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(obj);
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setTextStrokeWidth(val) {
    var num = parseInt(val, 10);
    cfg.textStrokeWidth = isNaN(num) ? 1 : num;
    var members = getAllGroupMembers(cfg.selectedIds);
    var textObjs = members.filter(function(m) { return m.type === 'text'; });
    textObjs.forEach(function(obj) {
      if (obj && obj.attrs) {
        obj.attrs.strokeWidth = cfg.textStrokeWidth;
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(obj);
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function toggleTextWritingMode() {
    var cur = cfg.textWritingMode || 'horizontal-tb';
    cfg.textWritingMode = (cur === 'vertical-rl' || cur === 'vertical') ? 'horizontal-tb' : 'vertical-rl';
    var members = getAllGroupMembers(cfg.selectedIds);
    var textObjs = members.filter(function(m) { return m.type === 'text'; });
    textObjs.forEach(function(obj) {
      if (obj && obj.attrs) {
        obj.attrs.writingMode = cfg.textWritingMode;
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(obj);
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function getParentShapeBounds(textObj) {
    if (!textObj || !textObj.parentId) return null;
    var groupMembers = [];
    cfg.objectsMap.forEach(function(o) {
      if (o.parentId === textObj.parentId && o.id !== textObj.id && o.type !== 'text') {
        groupMembers.push(o);
      }
    });
    if (groupMembers.length === 0) return null;

    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    groupMembers.forEach(function(m) {
      var b = window.WebpointerObjects ? window.WebpointerObjects.getObjectBounds(m) : null;
      if (b) {
        if (b.minX < minX) minX = b.minX;
        if (b.maxX > maxX) maxX = b.maxX;
        if (b.minY < minY) minY = b.minY;
        if (b.maxY > maxY) maxY = b.maxY;
      }
    });
    if (minX === Infinity) return null;
    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
  }

  function setTextVerticalAlign(val) {
    cfg.textDominantBaseline = val;
    var members = getAllGroupMembers(cfg.selectedIds);
    var textObjs = members.filter(function(m) { return m.type === 'text'; });

    var vAlign = 'top';
    if (val === 'central' || val === 'middle') {
      vAlign = 'middle';
    } else if (val === 'alphabetic' || val === 'bottom') {
      vAlign = 'bottom';
    }

    textObjs.forEach(function(obj) {
      if (obj && obj.attrs) {
        var shapeObj = null;
        if (obj.parentId) {
          cfg.objectsMap.forEach(function(o) {
            if (o.parentId === obj.parentId && o.type !== 'text') {
              shapeObj = o;
            }
          });
        }

        if (shapeObj && window.WebpointerTextTool && window.WebpointerTextTool.updateShapeTextAlignment) {
          window.WebpointerTextTool.updateShapeTextAlignment(shapeObj, obj, obj.attrs.textAnchor, vAlign);
        } else {
          obj.attrs.dominantBaseline = val;
          obj.attrs.verticalAlign = vAlign;
        }

        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(obj);
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function cycleTextVerticalAlign() {
    var cur = cfg.textDominantBaseline || 'alphabetic';
    var nextBaseline = (cur === 'hanging') ? 'central' : ((cur === 'central' || cur === 'middle') ? 'alphabetic' : 'hanging');
    setTextVerticalAlign(nextBaseline);
  }

  function setTextPadding(side, val) {
    var numVal = Math.max(0, Math.min(200, parseInt(val, 10) || 0));
    if (cfg.padSync) {
      cfg.padTop = numVal;
      cfg.padBottom = numVal;
      cfg.padLeft = numVal;
      cfg.padRight = numVal;
    } else {
      if (side === 'top') cfg.padTop = numVal;
      if (side === 'bottom') cfg.padBottom = numVal;
      if (side === 'left') cfg.padLeft = numVal;
      if (side === 'right') cfg.padRight = numVal;
    }

    var members = getAllGroupMembers(cfg.selectedIds);
    var textObjs = members.filter(function(m) { return m.type === 'text'; });
    textObjs.forEach(function(obj) {
      if (obj && obj.attrs) {
        obj.attrs.padTop = cfg.padTop;
        obj.attrs.padBottom = cfg.padBottom;
        obj.attrs.padLeft = cfg.padLeft;
        obj.attrs.padRight = cfg.padRight;

        var shapeObj = null;
        if (obj.parentId) {
          cfg.objectsMap.forEach(function(o) {
            if (o.parentId === obj.parentId && o.type !== 'text') {
              shapeObj = o;
            }
          });
        }
        if (shapeObj && window.WebpointerTextTool && window.WebpointerTextTool.updateShapeTextAlignment) {
          window.WebpointerTextTool.updateShapeTextAlignment(shapeObj, obj, obj.attrs.textAnchor, obj.attrs.verticalAlign || 'top');
        }
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(obj);
        }
      }
    });

    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function toggleTextPaddingSync() {
    cfg.padSync = !cfg.padSync;
    if (cfg.padSync) {
      var syncVal = cfg.padTop;
      cfg.padBottom = syncVal;
      cfg.padLeft = syncVal;
      cfg.padRight = syncVal;
      setTextPadding('top', syncVal);
    } else {
      if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
    }
  }

  function cycleTextHorizontalAlign() {
    var cur = cfg.textAnchor || 'start';
    var nextAnchor = 'start';
    if (cur === 'start') nextAnchor = 'middle';
    else if (cur === 'middle') nextAnchor = 'end';
    else if (cur === 'end') nextAnchor = 'justify';
    else nextAnchor = 'start';
    setTextAnchor(nextAnchor);
  }

  function applyAutoFitToGroup(textObj) {
    if (!textObj || !textObj.parentId) return;
    var mode = textObj.attrs.autoFitMode || cfg.textAutoFitMode || 'fitShapeToText';

    var baseFont = textObj.attrs.baseFontSize || textObj.attrs.fontSize || cfg.fontSize || 20;
    textObj.attrs.baseFontSize = baseFont;

    var groupMembers = [];
    cfg.objectsMap.forEach(function(o) {
      if (o.parentId === textObj.parentId && o.id !== textObj.id && o.type !== 'text') {
        groupMembers.push(o);
      }
    });
    if (groupMembers.length === 0) return;

    var shapeObj = groupMembers[0];
    var sAttrs = shapeObj.attrs || {};

    var pTop = textObj.attrs.padTop !== undefined ? textObj.attrs.padTop : (cfg.padTop !== undefined ? cfg.padTop : 10);
    var pBottom = textObj.attrs.padBottom !== undefined ? textObj.attrs.padBottom : (cfg.padBottom !== undefined ? cfg.padBottom : 10);
    var pLeft = textObj.attrs.padLeft !== undefined ? textObj.attrs.padLeft : (cfg.padLeft !== undefined ? cfg.padLeft : 10);
    var pRight = textObj.attrs.padRight !== undefined ? textObj.attrs.padRight : (cfg.padRight !== undefined ? cfg.padRight : 10);

    if (mode === 'fitShapeToText' || mode === 'none') {
      textObj.attrs.fontSize = baseFont;
      if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
        window.WebpointerRender.updateElementAttributes(textObj);
      }
    }

    if (mode === 'none') return;

    var textWidth = 100, textHeight = 30;
    try {
      if (textObj.el) {
        var bbox = textObj.el.getBBox();
        textWidth = bbox.width;
        textHeight = bbox.height;
      }
    } catch (e) {}

    if (mode === 'fitShapeToText') {
      var reqWidth = textWidth + pLeft + pRight;
      var reqHeight = textHeight + pTop + pBottom;

      if (shapeObj.type === 'rect' || shapeObj.type === 'rounded') {
        sAttrs.width = Math.max(20, Math.round(reqWidth));
        sAttrs.height = Math.max(20, Math.round(reqHeight));
      } else if (shapeObj.type === 'ellipse') {
        sAttrs.rx = Math.max(10, Math.round(reqWidth / 2));
        sAttrs.ry = Math.max(10, Math.round(reqHeight / 2));
      }
      if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
        window.WebpointerRender.updateElementAttributes(shapeObj);
      }
    } else if (mode === 'fitTextToShape') {
      var shapeWidth = sAttrs.width || (sAttrs.rx ? sAttrs.rx * 2 : 100);
      var shapeHeight = sAttrs.height || (sAttrs.ry ? sAttrs.ry * 2 : 60);

      var availW = Math.max(10, shapeWidth - (pLeft + pRight));
      var availH = Math.max(10, shapeHeight - (pTop + pBottom));

      if (textWidth > availW || textHeight > availH) {
        var scale = Math.min(availW / textWidth, availH / textHeight);
        if (scale < 1) {
          var newFont = Math.max(8, Math.floor(baseFont * scale));
          textObj.attrs.fontSize = newFont;
          if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
            window.WebpointerRender.updateElementAttributes(textObj);
          }
        }
      } else {
        textObj.attrs.fontSize = baseFont;
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(textObj);
        }
      }
    }

    if (window.WebpointerTextTool && window.WebpointerTextTool.updateShapeTextAlignment) {
      window.WebpointerTextTool.updateShapeTextAlignment(shapeObj, textObj, textObj.attrs.textAnchor || 'start', textObj.attrs.verticalAlign || 'top');
    }
  }

  function setTextAutoFitMode(mode) {
    cfg.textAutoFitMode = mode;
    var members = getAllGroupMembers(cfg.selectedIds);
    var textObjs = members.filter(function(m) { return m.type === 'text'; });
    textObjs.forEach(function(obj) {
      if (obj && obj.attrs) {
        obj.attrs.autoFitMode = mode;
        applyAutoFitToGroup(obj);
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(obj);
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function cycleTextAutoFitMode() {
    var cur = cfg.textAutoFitMode || 'fitShapeToText';
    var nextMode = (cur === 'fitShapeToText') ? 'fitTextToShape' : (cur === 'fitTextToShape' ? 'none' : 'fitShapeToText');
    setTextAutoFitMode(nextMode);
  }

  function setTextUnderlineWidth(val) {
    var num = parseInt(val, 10);
    cfg.textUnderlineWidth = isNaN(num) ? 1 : num;
    var members = getAllGroupMembers(cfg.selectedIds);
    var textObjs = members.filter(function(m) { return m.type === 'text'; });
    textObjs.forEach(function(obj) {
      if (obj && obj.attrs) {
        obj.attrs.underlineWidth = cfg.textUnderlineWidth;
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(obj);
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setElementOpacity(val) {
    var num = parseFloat(val);
    if (isNaN(num)) num = 1;
    num = Math.max(0, Math.min(1, num));
    cfg.opacity = num;

    var members = getAllGroupMembers(cfg.selectedIds);
    var isTextTab = (cfg.currentTab === 'text');

    members.forEach(function(obj) {
      if (obj && obj.attrs) {
        if ((isTextTab && obj.type === 'text') || (!isTextTab && obj.type !== 'text')) {
          obj.attrs.opacity = num;
          if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.updateElementAttributes) {
            window.WebpointerRenderCanvas.updateElementAttributes(obj);
          }
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function setAlphaStepCount(val) {
    var count = parseInt(val, 10);
    cfg.alphaStepCount = (isNaN(count) || count <= 0) ? 5 : count;
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function setGridStepSize(val) {
    var num = parseInt(val, 10);
    cfg.gridStepSize = (isNaN(num) || num <= 0) ? 24 : num;
    if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.renderGrid) {
      window.WebpointerRenderCanvas.renderGrid();
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function switchTab(tabKey) {
    cfg.currentTab = tabKey;
    var menuBar = document.querySelector('.menu-bar');
    if (menuBar) {
      menuBar.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').indexOf("'" + tabKey + "'") !== -1) {
          btn.classList.add('active');
        }
      });
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function setTextFontFamily(val) {
    cfg.fontFamily = val;
    applyTextStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setTextFontSize(val) {
    cfg.fontSize = parseInt(val, 10) || 20;
    applyTextStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setTextFontWeight(val) {
    cfg.fontWeight = val;
    applyTextStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setTextFontStyle(val) {
    cfg.fontStyle = val;
    applyTextStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setTextLineHeight(val) {
    cfg.lineHeight = parseFloat(val) || 1.2;
    applyTextStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function applyTextStyleToSelected() {
    var members = getAllGroupMembers(cfg.selectedIds);
    var textObjs = members.filter(function(m) { return m.type === 'text'; });

    textObjs.forEach(function(obj) {
      if (obj && obj.attrs) {
        obj.attrs.fontFamily = cfg.fontFamily;
        obj.attrs.fontSize = cfg.fontSize;
        obj.attrs.baseFontSize = cfg.fontSize;
        obj.attrs.fontWeight = cfg.fontWeight;
        obj.attrs.fontStyle = cfg.fontStyle;
        obj.attrs.textDecoration = cfg.textDecoration || 'none';
        obj.attrs.textAnchor = cfg.textAnchor || 'start';
        obj.attrs.lineHeight = cfg.lineHeight;
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(obj);
        }
      }
    });
  }

  function toggleTextStrikethrough() {
    var cur = cfg.textDecoration || 'none';
    cfg.textDecoration = (cur === 'line-through') ? 'none' : 'line-through';
    applyTextStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setTextAnchor(newAnchor) {
    cfg.textAnchor = newAnchor;
    var members = getAllGroupMembers(cfg.selectedIds);
    var textObjs = members.filter(function(m) { return m.type === 'text'; });

    textObjs.forEach(function(obj) {
      if (obj && obj.attrs) {
        var shapeBounds = getParentShapeBounds(obj);
        if (shapeBounds) {
          var cx = (shapeBounds.minX + shapeBounds.maxX) / 2;
          var lx = shapeBounds.minX + 10;
          var rx = shapeBounds.maxX - 10;
          var targetX = cx;
          if (newAnchor === 'start') targetX = lx;
          else if (newAnchor === 'middle') targetX = cx;
          else if (newAnchor === 'end') targetX = rx;

          obj.attrs.x = Math.round(targetX);
          obj.attrs.textAnchor = newAnchor;
        } else {
          var oldAnchor = obj.attrs.textAnchor || 'start';
          if (oldAnchor !== newAnchor) {
            var currX = obj.attrs.x || 0;
            var width = 0;
            try {
              if (obj.el) {
                var bbox = obj.el.getBBox();
                width = bbox.width;
              }
            } catch (e) {}

            if (!width || width <= 0) {
              var lines = (obj.attrs.text || '').split('\n');
              var maxLen = 0;
              lines.forEach(function(l) { if (l.length > maxLen) maxLen = l.length; });
              width = maxLen * (obj.attrs.fontSize || 20) * 0.55;
            }

            var xLeft = currX;
            if (oldAnchor === 'middle') xLeft = currX - (width / 2);
            else if (oldAnchor === 'end') xLeft = currX - width;

            var newX = xLeft;
            if (newAnchor === 'middle') newX = xLeft + (width / 2);
            else if (newAnchor === 'end') newX = xLeft + width;

            obj.attrs.x = Math.round(newX);
            obj.attrs.textAnchor = newAnchor;
          }
        }
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(obj);
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function toggleTextLineHeight() {
    if (state.holdTriggered) {
      state.holdTriggered = false;
      return;
    }
    var cur = cfg.lineHeight || 1.2;
    var nextLH = (cur == 1.2) ? 1.5 : 1.2;
    setTextLineHeight(nextLH);
  }

  function startHoldLineHeight(e, btnEl) {
    state.holdTriggered = false;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(function() {
      state.holdTriggered = true;
      showLineHeightPopup(btnEl);
    }, 400);
  }

  function endHoldLineHeight() {
    clearTimeout(holdTimer);
  }

  function showLineHeightPopup(btnEl) {
    var old = document.getElementById('lineHeightPopupSelect');
    if (old) old.remove();

    var sel = document.createElement('select');
    sel.id = 'lineHeightPopupSelect';
    sel.style.cssText = 'position:fixed; z-index:99999; font-size:0.78rem; padding:4px; border:1px solid #0284c7; border-radius:4px; background:#ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.15); outline:none;';
    var rect = btnEl.getBoundingClientRect();
    sel.style.left = rect.left + 'px';
    sel.style.top = (rect.bottom + 2) + 'px';

    var heights = [
      { v: '1', l: '1.0 (좁게)' },
      { v: '1.2', l: '1.2 (기본)' },
      { v: '1.5', l: '1.5 (보통)' },
      { v: '2', l: '2.0 (넓게)' },
      { v: '2.5', l: '2.5' },
      { v: '3', l: '3.0' }
    ];

    var cur = cfg.lineHeight || 1.2;
    sel.innerHTML = heights.map(function(h) {
      var selected = (cur == h.v) ? 'selected' : '';
      return '<option value="' + h.v + '" ' + selected + '>' + h.l + '</option>';
    }).join('');

    sel.onchange = function() {
      setTextLineHeight(sel.value);
      sel.remove();
    };
    sel.onblur = function() {
      setTimeout(function() { if (sel.parentElement) sel.remove(); }, 150);
    };

    document.body.appendChild(sel);
    sel.focus();
  }

  function toggleTextBold() {
    if (state.holdTriggered) {
      state.holdTriggered = false;
      return;
    }
    var current = cfg.fontWeight || 'normal';
    var isBold = (current === 'bold' || parseInt(current, 10) >= 600);
    setTextFontWeight(isBold ? 'normal' : 'bold');
  }

  function toggleTextItalic() {
    if (state.holdTriggered) {
      state.holdTriggered = false;
      return;
    }
    var current = cfg.fontStyle || 'normal';
    var isItalic = (current === 'italic' || current === 'oblique');
    setTextFontStyle(isItalic ? 'normal' : 'italic');
  }

  function startHoldWeight(e, btnEl) {
    state.holdTriggered = false;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(function() {
      state.holdTriggered = true;
      showWeightSelectPopup(btnEl);
    }, 400);
  }

  function endHoldWeight() {
    clearTimeout(holdTimer);
  }

  function showWeightSelectPopup(btnEl) {
    var old = document.getElementById('weightPopupSelect');
    if (old) old.remove();

    var sel = document.createElement('select');
    sel.id = 'weightPopupSelect';
    sel.style.cssText = 'position:fixed; z-index:99999; font-size:0.78rem; padding:4px; border:1px solid #0284c7; border-radius:4px; background:#ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.15); outline:none;';
    var rect = btnEl.getBoundingClientRect();
    sel.style.left = rect.left + 'px';
    sel.style.top = (rect.bottom + 2) + 'px';

    var weights = [
      { v: '100', l: '100 (Thin)' },
      { v: '200', l: '200 (Extra Light)' },
      { v: '300', l: '300 (Light)' },
      { v: '400', l: '400 (Normal)' },
      { v: '500', l: '500 (Medium)' },
      { v: '600', l: '600 (Semi Bold)' },
      { v: '700', l: '700 (Bold)' },
      { v: '800', l: '800 (Extra Bold)' },
      { v: '900', l: '900 (Black)' }
    ];

    var cur = cfg.fontWeight || '400';
    sel.innerHTML = weights.map(function(w) {
      var selected = (cur == w.v || (cur === 'bold' && w.v === '700') || (cur === 'normal' && w.v === '400')) ? 'selected' : '';
      return '<option value="' + w.v + '" ' + selected + '>' + w.l + '</option>';
    }).join('');

    sel.onchange = function() {
      setTextFontWeight(sel.value);
      sel.remove();
    };
    sel.onblur = function() {
      setTimeout(function() { if (sel.parentElement) sel.remove(); }, 150);
    };

    document.body.appendChild(sel);
    sel.focus();
  }

  function startHoldStyle(e, btnEl) {
    state.holdTriggered = false;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(function() {
      state.holdTriggered = true;
      showStyleSelectPopup(btnEl);
    }, 400);
  }

  function endHoldStyle() {
    clearTimeout(holdTimer);
  }

  function showStyleSelectPopup(btnEl) {
    var old = document.getElementById('stylePopupSelect');
    if (old) old.remove();

    var sel = document.createElement('select');
    sel.id = 'stylePopupSelect';
    sel.style.cssText = 'position:fixed; z-index:99999; font-size:0.78rem; padding:4px; border:1px solid #0284c7; border-radius:4px; background:#ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.15); outline:none;';
    var rect = btnEl.getBoundingClientRect();
    sel.style.left = rect.left + 'px';
    sel.style.top = (rect.bottom + 2) + 'px';

    var styles = [
      { v: 'normal', l: 'Normal (보통)' },
      { v: 'italic', l: 'Italic (이탤릭)' },
      { v: 'oblique', l: 'Oblique (사선)' }
    ];

    var cur = cfg.fontStyle || 'normal';
    sel.innerHTML = styles.map(function(s) {
      var selected = (cur === s.v) ? 'selected' : '';
      return '<option value="' + s.v + '" ' + selected + '>' + s.l + '</option>';
    }).join('');

    sel.onchange = function() {
      setTextFontStyle(sel.value);
      sel.remove();
    };
    sel.onblur = function() {
      setTimeout(function() { if (sel.parentElement) sel.remove(); }, 150);
    };

    document.body.appendChild(sel);
    sel.focus();
  }

  async function fetchLocalSystemFonts() {
    if ('queryLocalFonts' in window) {
      try {
        var availableFonts = await window.queryLocalFonts();
        var fontSet = new Set(cfg.systemFonts || []);
        availableFonts.forEach(function(f) {
          if (f.family) fontSet.add(f.family);
        });
        var sorted = Array.from(fontSet).sort();
        if (sorted.length !== (cfg.systemFonts ? cfg.systemFonts.length : 0)) {
          cfg.systemFonts = sorted;
          if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
            window.WebpointerRender.renderRibbon();
          }
        }
      } catch (err) {
        console.warn('Local font query error/denied:', err);
      }
    }
  }

  function toggleGridSnap(enabled) {
    cfg.gridSnapEnabled = !!enabled;
    if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.renderGrid) {
      window.WebpointerRenderCanvas.renderGrid();
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function toggleSnapping(enabled) {
    cfg.enableSnapping = !!enabled;
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function setSnappingThreshold(val) {
    var v = parseInt(val, 10);
    if (!isNaN(v) && v >= 1) {
      cfg.snappingThreshold = v;
    }
  }

  function setGridDensity(val) {
    cfg.gridDensity = val;
    if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.renderGrid) {
      window.WebpointerRenderCanvas.renderGrid();
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function setProximityThreshold(val) {
    var num = parseInt(val, 10);
    cfg.proximityThreshold = isNaN(num) ? 30 : num;
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function setDefaultShapeSize(val) {
    var num = parseInt(val, 10);
    cfg.defaultShapeSize = isNaN(num) ? 100 : num;
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function setCanvasRatio(val) {
    cfg.canvasRatio = val;
    var mainSvg = document.getElementById('mainSvg');
    if (mainSvg) {
      var parts = val.split('x');
      if (parts.length === 2) {
        var w = parseInt(parts[0], 10);
        var h = parseInt(parts[1], 10);
        if (!isNaN(w) && !isNaN(h)) {
          cfg.SVG_WIDTH = w;
          cfg.SVG_HEIGHT = h;
          mainSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        }
      }
    }
    if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.renderGrid) {
      window.WebpointerRenderCanvas.renderGrid();
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function setCanvasBgColor(val) {
    cfg.canvasBgColor = val;
    var mainSvg = document.getElementById('mainSvg');
    if (mainSvg) {
      mainSvg.style.backgroundColor = val;
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function openShortcutModal() {
    var modal = document.getElementById('shortcutModal');
    if (modal) modal.classList.add('show');
  }

  function closeShortcutModal() {
    var modal = document.getElementById('shortcutModal');
    if (modal) modal.classList.remove('show');
  }

  function setLongPressDelay(val) {
    var ms = parseInt(val, 10);
    if (isNaN(ms)) ms = 200;
    ms = Math.max(200, Math.min(1000, ms));
    cfg.longPressDelay = ms;
    try {
      localStorage.setItem('webpointer_long_press_delay', ms);
    } catch (e) {}
  }

  function openDetailedSettingsModal() {
    var modal = document.getElementById('detailedSettingsModal');
    if (modal) {
      var proxInput = document.getElementById('settingProximityThreshold');
      var sizeInput = document.getElementById('settingDefaultShapeSize');
      var stepInput = document.getElementById('settingAlphaStepCount');
      var snapEnableInput = document.getElementById('settingEnableSnapping');
      var snapThreshInput = document.getElementById('settingSnappingThreshold');
      var holdInput = document.getElementById('settingLongPressDelay');
      var holdVal = document.getElementById('settingLongPressVal');

      if (proxInput) proxInput.value = cfg.proximityThreshold !== undefined ? cfg.proximityThreshold : 12;
      if (sizeInput) sizeInput.value = cfg.defaultShapeSize || 100;
      if (stepInput) stepInput.value = cfg.alphaStepCount || 5;
      if (snapEnableInput) snapEnableInput.checked = cfg.enableSnapping !== undefined ? cfg.enableSnapping : true;
      if (snapThreshInput) snapThreshInput.value = cfg.snappingThreshold || 12;
      if (holdInput) holdInput.value = cfg.longPressDelay || 200;
      if (holdVal) holdVal.innerText = (cfg.longPressDelay || 200) + 'ms';
      modal.classList.add('show');
    }
  }

  function closeDetailedSettingsModal() {
    var modal = document.getElementById('detailedSettingsModal');
    if (modal) modal.classList.remove('show');
  }

  function applyDetailedSettings() {
    var proxInput = document.getElementById('settingProximityThreshold');
    var sizeInput = document.getElementById('settingDefaultShapeSize');
    var stepInput = document.getElementById('settingAlphaStepCount');
    var snapEnableInput = document.getElementById('settingEnableSnapping');
    var snapThreshInput = document.getElementById('settingSnappingThreshold');
    var holdInput = document.getElementById('settingLongPressDelay');

    if (proxInput && proxInput.value !== '') setProximityThreshold(proxInput.value);
    if (sizeInput && sizeInput.value !== '') setDefaultShapeSize(sizeInput.value);
    if (stepInput && stepInput.value !== '') setAlphaStepCount(stepInput.value);
    if (snapEnableInput) cfg.enableSnapping = snapEnableInput.checked;
    if (snapThreshInput && snapThreshInput.value !== '') cfg.snappingThreshold = parseInt(snapThreshInput.value, 10) || 12;
    if (holdInput && holdInput.value !== '') setLongPressDelay(holdInput.value);

    closeDetailedSettingsModal();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function bringToFront() {
    var render = window.WebpointerRender;
    if (!cfg || !cfg.selectedIds || cfg.selectedIds.size === 0) return;
    var objectsGroup = document.getElementById('objectsGroup');
    if (!objectsGroup) return;

    if (window.pushHistoryState) window.pushHistoryState();

    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (obj) {
        if (obj.underlineEl && obj.underlineEl.parentNode) {
          objectsGroup.appendChild(obj.underlineEl);
        }
        if (obj.el && obj.el.parentNode) {
          objectsGroup.appendChild(obj.el);
        }
        cfg.objectsMap.delete(id);
        cfg.objectsMap.set(id, obj);
      }
    });

    if (render && render.renderUI) render.renderUI();
    if (render && render.renderRibbon) render.renderRibbon();
    if (window.pushHistoryState) window.pushHistoryState();
  }

  function bringForward() {
    var render = window.WebpointerRender;
    if (!cfg || !cfg.selectedIds || cfg.selectedIds.size === 0) return;
    var objectsGroup = document.getElementById('objectsGroup');
    if (!objectsGroup) return;

    if (window.pushHistoryState) window.pushHistoryState();

    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (obj && obj.el && obj.el.parentNode) {
        var el = obj.el;
        var next = el.nextSibling;
        if (next) {
          var targetNext = next.nextSibling;
          if (targetNext) {
            objectsGroup.insertBefore(el, targetNext);
          } else {
            objectsGroup.appendChild(el);
          }
        }
      }
    });

    if (render && render.renderUI) render.renderUI();
    if (render && render.renderRibbon) render.renderRibbon();
    if (window.pushHistoryState) window.pushHistoryState();
  }

  function sendBackward() {
    var render = window.WebpointerRender;
    if (!cfg || !cfg.selectedIds || cfg.selectedIds.size === 0) return;
    var objectsGroup = document.getElementById('objectsGroup');
    if (!objectsGroup) return;

    if (window.pushHistoryState) window.pushHistoryState();

    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (obj && obj.el && obj.el.parentNode) {
        var el = obj.el;
        var prev = el.previousSibling;
        if (prev) {
          objectsGroup.insertBefore(el, prev);
        }
      }
    });

    if (render && render.renderUI) render.renderUI();
    if (render && render.renderRibbon) render.renderRibbon();
    if (window.pushHistoryState) window.pushHistoryState();
  }

  function sendToBack() {
    var render = window.WebpointerRender;
    if (!cfg || !cfg.selectedIds || cfg.selectedIds.size === 0) return;
    var objectsGroup = document.getElementById('objectsGroup');
    if (!objectsGroup) return;

    if (window.pushHistoryState) window.pushHistoryState();

    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (obj) {
        if (obj.el && obj.el.parentNode) {
          objectsGroup.insertBefore(obj.el, objectsGroup.firstChild);
        }
        if (obj.underlineEl && obj.underlineEl.parentNode) {
          objectsGroup.insertBefore(obj.underlineEl, obj.el);
        }
      }
    });

    if (render && render.renderUI) render.renderUI();
    if (render && render.renderRibbon) render.renderRibbon();
    if (window.pushHistoryState) window.pushHistoryState();
  }

  function openBezierSplitConfirmModal(objId, handleType, idx, onConfirm) {
    if (localStorage.getItem('webpointer_suppress_bezier_split_confirm') === 'true') {
      if (onConfirm) onConfirm();
      return;
    }

    var existingModal = document.getElementById('bezierSplitModalOverlay');
    if (existingModal) existingModal.remove();

    var overlay = document.createElement('div');
    overlay.id = 'bezierSplitModalOverlay';
    overlay.className = 'palette-modal-backdrop show';

    overlay.innerHTML =
      '<div class="palette-modal-card" style="width:380px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<span style="font-size:24px;">✂️</span>' +
          '<h3 style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">연속 베지어 분리</h3>' +
        '</div>' +
        '<p class="palette-modal-desc" style="margin:0;">연속 베지어를 해당지점에서 분리하시겠습니까?<br><span style="font-size:12px;color:#64748b;">(분리 시 이후 곡선이 독립 제어점으로 조절됩니다.)</span></p>' +
        '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#334155;">' +
          '<input type="checkbox" id="bezierSuppressChk" style="width:16px;height:16px;cursor:pointer;">' +
          '<label for="bezierSuppressChk" style="cursor:pointer;">다시 보지 않기</label>' +
        '</div>' +
        '<div class="palette-modal-actions">' +
          '<button id="bezierSplitCancelBtn" class="palette-modal-btn secondary">취소</button>' +
          '<button id="bezierSplitConfirmBtn" class="palette-modal-btn primary">확인</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    var closeModal = function() {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    document.getElementById('bezierSplitCancelBtn').onclick = closeModal;
    document.getElementById('bezierSplitConfirmBtn').onclick = function() {
      var suppressChk = document.getElementById('bezierSuppressChk');
      if (suppressChk && suppressChk.checked) {
        localStorage.setItem('webpointer_suppress_bezier_split_confirm', 'true');
      }
      closeModal();
      if (onConfirm) onConfirm();
    };
  }

  function openTextRotateSplitConfirmModal(onConfirm, onCancel) {
    if (localStorage.getItem('webpointer_suppress_text_rotate_split_confirm') === 'true') {
      if (onConfirm) onConfirm();
      return;
    }

    var existingModal = document.getElementById('textRotateSplitModalOverlay');
    if (existingModal) existingModal.remove();

    var overlay = document.createElement('div');
    overlay.id = 'textRotateSplitModalOverlay';
    overlay.className = 'palette-modal-backdrop show';

    overlay.innerHTML =
      '<div class="palette-modal-card" style="width:380px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<span style="font-size:24px;">🔄</span>' +
          '<h3 style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">회전 분리</h3>' +
        '</div>' +
        '<p class="palette-modal-desc" style="margin:0;">도형과 텍스트의 회전을 분리합니다.</p>' +
        '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#334155;">' +
          '<input type="checkbox" id="textRotateSuppressChk" style="width:16px;height:16px;cursor:pointer;">' +
          '<label for="textRotateSuppressChk" style="cursor:pointer;">앞으로 묻지 않음</label>' +
        '</div>' +
        '<div class="palette-modal-actions">' +
          '<button id="textRotateSplitCancelBtn" class="palette-modal-btn secondary">취소</button>' +
          '<button id="textRotateSplitConfirmBtn" class="palette-modal-btn primary">확인</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    var closeModal = function() {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    document.getElementById('textRotateSplitCancelBtn').onclick = function() {
      closeModal();
      if (onCancel) onCancel();
    };

    document.getElementById('textRotateSplitConfirmBtn').onclick = function() {
      var suppressChk = document.getElementById('textRotateSuppressChk');
      if (suppressChk && suppressChk.checked) {
        localStorage.setItem('webpointer_suppress_text_rotate_split_confirm', 'true');
      }
      closeModal();
      if (onConfirm) onConfirm();
    };
  }

  function updateSelectedMetricWidth(newW) {
    var render = window.WebpointerRender;
    var val = parseFloat(newW);
    if (isNaN(val) || val <= 0) return;
    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (obj && obj.attrs) {
        if (obj.attrs.width !== undefined) {
          obj.attrs.width = val;
        } else if (obj.attrs.rx !== undefined && (obj.type === 'ellipse' || obj.type === 'arc')) {
          obj.attrs.rx = val / 2;
        } else if (obj.type === 'line') {
          var currW = Math.abs(obj.attrs.x2 - obj.attrs.x1);
          if (currW > 0) {
            var scale = val / currW;
            obj.attrs.x2 = obj.attrs.x1 + (obj.attrs.x2 - obj.attrs.x1) * scale;
          }
        }
        if (render && render.updateElementAttributes) render.updateElementAttributes(obj);
      }
    });
    if (render && render.renderUI) render.renderUI();
  }

  function updateSelectedMetricHeight(newH) {
    var render = window.WebpointerRender;
    var val = parseFloat(newH);
    if (isNaN(val) || val <= 0) return;
    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (obj && obj.attrs) {
        if (obj.attrs.height !== undefined) {
          obj.attrs.height = val;
        } else if (obj.attrs.ry !== undefined && (obj.type === 'ellipse' || obj.type === 'arc')) {
          obj.attrs.ry = val / 2;
        } else if (obj.type === 'line') {
          var currH = Math.abs(obj.attrs.y2 - obj.attrs.y1);
          if (currH > 0) {
            var scale = val / currH;
            obj.attrs.y2 = obj.attrs.y1 + (obj.attrs.y2 - obj.attrs.y1) * scale;
          }
        }
        if (render && render.updateElementAttributes) render.updateElementAttributes(obj);
      }
    });
    if (render && render.renderUI) render.renderUI();
  }

  function updateSelectedMetricAngle(newAng) {
    var render = window.WebpointerRender;
    var val = parseFloat(newAng);
    if (isNaN(val)) return;
    var safeAng = Math.round((val % 360 + 360) % 360);
    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (obj && obj.attrs) {
        obj.attrs.angle = safeAng;
        if (render && render.updateElementAttributes) render.updateElementAttributes(obj);
      }
    });
    if (render && render.renderUI) render.renderUI();
  }

  function groupSelected() {
    if (!cfg.selectedIds || cfg.selectedIds.size < 2) return;
    var objectsGroup = document.getElementById('objectsGroup');
    if (!objectsGroup) return;

    var gEl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    var gId = 'group_' + (cfg.nextId++);
    gEl.setAttribute('id', gId);
    objectsGroup.appendChild(gEl);

    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (obj && obj.el && obj.el.parentNode) {
        gEl.appendChild(obj.el);
        obj.parentId = gId;
      }
    });

    if (window.WebpointerRender && window.WebpointerRender.renderUI) {
      window.WebpointerRender.renderUI();
      window.WebpointerRender.renderRibbon();
    }
  }

  function ungroupSelected() {
    if (!cfg.selectedIds || cfg.selectedIds.size === 0) return;
    var objectsGroup = document.getElementById('objectsGroup');
    if (!objectsGroup) return;

    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (obj && obj.el) {
        var pG = obj.el.parentElement;
        if (pG && pG !== objectsGroup && pG.tagName && pG.tagName.toLowerCase() === 'g') {
          objectsGroup.appendChild(obj.el);
          delete obj.parentId;
          if (pG.children.length === 0) {
            pG.remove();
          }
        }
      }
    });

    if (window.WebpointerRender && window.WebpointerRender.renderUI) {
      window.WebpointerRender.renderUI();
      window.WebpointerRender.renderRibbon();
    }
  }

  function transformSelected(actionType) {
    if (!cfg.selectedIds || cfg.selectedIds.size === 0) return;
    var render = window.WebpointerRender;

    // Calculate combined selection center when multiple objects are selected
    var customCenter = null;
    if (cfg.selectedIds.size > 1 && window.WebpointerObjects && window.WebpointerObjects.getObjectBounds) {
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      cfg.selectedIds.forEach(function(id) {
        var o = cfg.objectsMap.get(id);
        if (o) {
          var b = window.WebpointerObjects.getObjectBounds(o);
          if (b) {
            minX = Math.min(minX, b.minX);
            maxX = Math.max(maxX, b.maxX);
            minY = Math.min(minY, b.minY);
            maxY = Math.max(maxY, b.maxY);
          }
        }
      });
      if (isFinite(minX) && isFinite(maxX) && isFinite(minY) && isFinite(maxY)) {
        customCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
      }
    }

    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (!obj || !obj.attrs) return;

      if (actionType === 'rotate90') {
        if (obj.type === 'line' || obj.type === 'bez2' || obj.type === 'bez3' || obj.type === 'point') {
          if (window.WebpointerObjects && window.WebpointerObjects.rotateObject) {
            window.WebpointerObjects.rotateObject(obj, 90, customCenter);
          }
        } else {
          var curAngle = obj.attrs.angle || 0;
          obj.attrs.angle = Math.round(((curAngle + 90) % 360 + 360) % 360);
        }
      } else if (actionType === 'rotateNeg90') {
        if (obj.type === 'line' || obj.type === 'bez2' || obj.type === 'bez3' || obj.type === 'point') {
          if (window.WebpointerObjects && window.WebpointerObjects.rotateObject) {
            window.WebpointerObjects.rotateObject(obj, -90, customCenter);
          }
        } else {
          var curAngleNeg = obj.attrs.angle || 0;
          obj.attrs.angle = Math.round(((curAngleNeg - 90) % 360 + 360) % 360);
        }
      } else if (actionType === 'flipH') {
        if (window.WebpointerObjects && window.WebpointerObjects.flipObject) {
          window.WebpointerObjects.flipObject(obj, 'H', customCenter);
        }
        var curAngleH = obj.attrs.angle || 0;
        if (curAngleH !== 0) {
          obj.attrs.angle = Math.round(((-curAngleH) % 360 + 360) % 360);
        }
      } else if (actionType === 'flipV') {
        if (window.WebpointerObjects && window.WebpointerObjects.flipObject) {
          window.WebpointerObjects.flipObject(obj, 'V', customCenter);
        }
        var curAngleV = obj.attrs.angle || 0;
        if (curAngleV !== 0) {
          obj.attrs.angle = Math.round(((-curAngleV) % 360 + 360) % 360);
        }
      }

      if (window.WebpointerObjects && window.WebpointerObjects.syncShapeTextBounds) {
        window.WebpointerObjects.syncShapeTextBounds(obj);
      }
      if (render && render.updateElementAttributes) {
        render.updateElementAttributes(obj);
      }
    });

    if (render && render.renderUI) {
      render.renderUI();
      render.renderRibbon();
    }
    if (window.pushHistoryState) window.pushHistoryState();
  }

  window.getAllGroupMembers = getAllGroupMembers;
  window.switchTab = switchTab;
  window.setTool = setTool;
  window.applyStyleToSelected = applyStyleToSelected;
  window.setStrokeColor = setStrokeColor;
  window.setFillColor = setFillColor;
  window.setStrokeWidth = setStrokeWidth;
  window.adjustStrokeWidth = adjustStrokeWidth;
  window.setStrokeDashStyle = setStrokeDashStyle;
  window.toggleStrokeDashStyle = toggleStrokeDashStyle;
  window.startHoldDashArray = startHoldDashArray;
  window.endHoldDashArray = endHoldDashArray;
  window.setStrokeDashArray = setStrokeDashArray;
  window.setStrokeCap = setStrokeCap;
  window.cycleStrokeCap = cycleStrokeCap;
  window.setStrokeJoin = setStrokeJoin;
  window.cycleStrokeJoin = cycleStrokeJoin;
  window.setStartMarker = setStartMarker;
  window.setEndMarker = setEndMarker;
  window.setStartMarkerFillStyle = setStartMarkerFillStyle;
  window.toggleStartMarkerFillStyle = toggleStartMarkerFillStyle;
  window.setEndMarkerFillStyle = setEndMarkerFillStyle;
  window.toggleEndMarkerFillStyle = toggleEndMarkerFillStyle;
  window.scaleMarker = scaleMarker;
  window.toggleCategoryCollapse = toggleCategoryCollapse;

  window.setTextFontFamily = setTextFontFamily;
  window.setTextFontSize = setTextFontSize;
  window.setTextFontWeight = setTextFontWeight;
  window.setTextFontStyle = setTextFontStyle;
  window.setTextLineHeight = setTextLineHeight;
  window.toggleTextStrikethrough = toggleTextStrikethrough;
  window.setTextAnchor = setTextAnchor;
  window.toggleTextLineHeight = toggleTextLineHeight;
  window.startHoldLineHeight = startHoldLineHeight;
  window.endHoldLineHeight = endHoldLineHeight;
  window.fetchLocalSystemFonts = fetchLocalSystemFonts;
  window.toggleTextBold = toggleTextBold;
  window.toggleTextItalic = toggleTextItalic;
  window.startHoldWeight = startHoldWeight;
  window.endHoldWeight = endHoldWeight;
  window.startHoldStyle = startHoldStyle;
  window.endHoldStyle = endHoldStyle;
  window.setTextStrokeWidth = setTextStrokeWidth;
  window.toggleTextWritingMode = toggleTextWritingMode;
  window.setTextVerticalAlign = setTextVerticalAlign;
  window.cycleTextVerticalAlign = cycleTextVerticalAlign;
  window.cycleTextHorizontalAlign = cycleTextHorizontalAlign;
  window.setTextPadding = setTextPadding;
  window.toggleTextPaddingSync = toggleTextPaddingSync;
  window.setTextAutoFitMode = setTextAutoFitMode;
  window.cycleTextAutoFitMode = cycleTextAutoFitMode;
  window.applyAutoFitToGroup = applyAutoFitToGroup;
  window.setTextUnderlineStyle = setTextUnderlineStyle;
  window.setTextUnderlineOffset = setTextUnderlineOffset;
  window.setTextUnderlineWidth = setTextUnderlineWidth;

  window.setElementOpacity = setElementOpacity;
  window.setAlphaStepCount = setAlphaStepCount;
  window.toggleGridSnap = toggleGridSnap;
  window.toggleSnapping = toggleSnapping;
  window.setSnappingThreshold = setSnappingThreshold;
  window.setGridDensity = setGridDensity;
  window.setGridStepSize = setGridStepSize;
  window.setProximityThreshold = setProximityThreshold;
  window.setDefaultShapeSize = setDefaultShapeSize;
  window.setCanvasRatio = setCanvasRatio;
  window.setCanvasBgColor = setCanvasBgColor;
  window.setLongPressDelay = setLongPressDelay;
  window.openShortcutModal = openShortcutModal;
  window.closeShortcutModal = closeShortcutModal;
  window.openDetailedSettingsModal = openDetailedSettingsModal;
  window.closeDetailedSettingsModal = closeDetailedSettingsModal;
  window.applyDetailedSettings = applyDetailedSettings;

  window.openBezierSplitConfirmModal = openBezierSplitConfirmModal;
  window.openTextRotateSplitConfirmModal = openTextRotateSplitConfirmModal;
  window.updateSelectedMetricWidth = updateSelectedMetricWidth;
  window.updateSelectedMetricHeight = updateSelectedMetricHeight;
  window.updateSelectedMetricAngle = updateSelectedMetricAngle;
  window.transformSelected = transformSelected;
  window.groupSelected = groupSelected;
  window.ungroupSelected = ungroupSelected;
  window.bringToFront = bringToFront;
  window.bringForward = bringForward;
  window.sendBackward = sendBackward;
  window.sendToBack = sendToBack;

  window.WebpointerHandlers = Object.assign(
    {
      setTool: setTool,
      applyStyleToSelected: applyStyleToSelected,
      setStrokeColor: setStrokeColor,
      setFillColor: setFillColor,
      setStrokeWidth: setStrokeWidth,
      adjustStrokeWidth: adjustStrokeWidth,
      setStrokeDashStyle: setStrokeDashStyle,
      toggleStrokeDashStyle: toggleStrokeDashStyle,
      startHoldDashArray: startHoldDashArray,
      endHoldDashArray: endHoldDashArray,
      setStrokeDashArray: setStrokeDashArray,
      setStrokeCap: setStrokeCap,
      setStrokeJoin: setStrokeJoin,
      setStartMarker: setStartMarker,
      setEndMarker: setEndMarker,
      setStartMarkerFillStyle: setStartMarkerFillStyle,
      toggleStartMarkerFillStyle: toggleStartMarkerFillStyle,
      setEndMarkerFillStyle: setEndMarkerFillStyle,
      toggleEndMarkerFillStyle: toggleEndMarkerFillStyle,
      scaleMarker: scaleMarker,
      toggleCategoryCollapse: toggleCategoryCollapse,
      openShortcutModal: openShortcutModal,
      closeShortcutModal: closeShortcutModal,
      openDetailedSettingsModal: openDetailedSettingsModal,
      closeDetailedSettingsModal: closeDetailedSettingsModal,
      applyDetailedSettings: applyDetailedSettings,
      setTextFontFamily: setTextFontFamily,
      setTextFontSize: setTextFontSize,
      setTextFontWeight: setTextFontWeight,
      setTextFontStyle: setTextFontStyle,
      setTextLineHeight: setTextLineHeight,
      toggleTextStrikethrough: toggleTextStrikethrough,
      setTextAnchor: setTextAnchor,
      toggleTextLineHeight: toggleTextLineHeight,
      startHoldLineHeight: startHoldLineHeight,
      endHoldLineHeight: endHoldLineHeight,
      fetchLocalSystemFonts: fetchLocalSystemFonts,
      toggleTextBold: toggleTextBold,
      toggleTextItalic: toggleTextItalic,
      startHoldWeight: startHoldWeight,
      endHoldWeight: endHoldWeight,
      startHoldStyle: startHoldStyle,
      endHoldStyle: endHoldStyle
    },
    window.WebpointerHistory || {},
    window.WebpointerFileSlots || {},
    window.WebpointerFillStyles || {},
    window.WebpointerEffectClip || {},
    window.WebpointerAlignSnap || {},
    window.WebpointerAssetPresets || {}
  );
})(window);
