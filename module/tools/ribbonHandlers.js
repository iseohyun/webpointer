(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;
  var state = window.WebpointerState;

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
          if (val) {
            closePopup();
            setStrokeDashArray(val);
          } else {
            closePopup();
          }
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

  function setStrokeJoin(val) {
    cfg.strokeJoin = val;
    applyStyleToSelected();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
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

  var default24Colors = [
    "#660000", "#660000", "#086600", "#006627", "#002e66", "#000080", "#3a0066", "#660031",
    "#e44d1b", "#c27800", "#669900", "#00a879", "#009dd1", "#4182fb", "#a760e2", "#d94594",
    "#ff976b", "#ffbb00", "#aae43f", "#00f5c0", "#00eaff", "#85caff", "#ec99ff", "#ff8fda"
  ];

  var colorHoldTimer = null;
  var isColorHoldTriggered = false;

  function startHoldColorBtn(e, btnEl, targetMode) {
    isColorHoldTriggered = false;
    clearTimeout(colorHoldTimer);
    colorHoldTimer = setTimeout(function() {
      isColorHoldTriggered = true;
      toggleColorPalettePopover(btnEl, targetMode);
    }, 200);
  }

  function endHoldColorBtn() {
    clearTimeout(colorHoldTimer);
  }

  function handleColorBtnClick(btnEl, targetMode) {
    if (isColorHoldTriggered) {
      isColorHoldTriggered = false;
      return;
    }
    clearTimeout(colorHoldTimer);
    applyCurrentColorDirectly(targetMode);
  }

  function applyCurrentColorDirectly(targetMode) {
    if (targetMode === 'stroke') {
      setStrokeColor(cfg.strokeColor || '#0284c7');
    } else if (targetMode === 'fill') {
      setFillColor(cfg.fillColor || '#38bdf8');
    } else if (targetMode === 'text_stroke' || targetMode === 'text') {
      var sColor = cfg.textStrokeColor !== undefined ? cfg.textStrokeColor : 'none';
      var members = getAllGroupMembers(cfg.selectedIds);
      var textObjs = members.filter(function(m) { return m.type === 'text'; });
      textObjs.forEach(function(obj) {
        if (obj && obj.attrs) {
          obj.attrs.stroke = sColor;
          if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
            window.WebpointerRender.updateElementAttributes(obj);
          }
        }
      });
    } else if (targetMode === 'text_fill' || targetMode === 'bg') {
      var fColor = cfg.textFillColor || cfg.textColor || cfg.fillColor || '#041e49';
      var members = getAllGroupMembers(cfg.selectedIds);
      var textObjs = members.filter(function(m) { return m.type === 'text'; });
      textObjs.forEach(function(obj) {
        if (obj && obj.attrs) {
          obj.attrs.fill = fColor;
          if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
            window.WebpointerRender.updateElementAttributes(obj);
          }
        }
      });
    } else if (targetMode === 'text_underline') {
      var uColor = cfg.textUnderlineColor || '#041e49';
      var members = getAllGroupMembers(cfg.selectedIds);
      var textObjs = members.filter(function(m) { return m.type === 'text'; });
      textObjs.forEach(function(obj) {
        if (obj && obj.attrs) {
          obj.attrs.underlineColor = uColor;
          if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
            window.WebpointerRender.updateElementAttributes(obj);
          }
        }
      });
    }

    var popover = document.getElementById('colorPalettePopover');
    if (popover && popover.parentNode) popover.parentNode.removeChild(popover);
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function toggleColorPalettePopover(btnEl, targetMode) {
    var old = document.getElementById('colorPalettePopover');
    if (old) {
      var isSame = old.dataset.targetMode === targetMode;
      old.remove();
      if (isSame) return;
    }

    var popover = document.createElement('div');
    popover.id = 'colorPalettePopover';
    popover.dataset.targetMode = targetMode;
    popover.style.cssText = 'position:fixed; z-index:99999; padding:8px; border:1px solid #0284c7; border-radius:8px; background:#ffffff; box-shadow:0 8px 24px rgba(0,0,0,0.2); outline:none; font-family:sans-serif; width:250px;';

    var rect = btnEl.getBoundingClientRect();
    popover.style.left = Math.max(10, Math.min(window.innerWidth - 260, rect.left)) + 'px';
    popover.style.top = (rect.bottom + 4) + 'px';

    var isFillMode = (targetMode === 'fill' || targetMode === 'text_fill');

    var userColors = (cfg.customPalette || cfg.paletteColors || []).slice();
    while (userColors.length < 24) {
      userColors.push(default24Colors[userColors.length % default24Colors.length]);
    }

    var swatchGridHtml = '<div style="display:grid; grid-template-columns:repeat(9, 24px); grid-template-rows:repeat(3, 24px); gap:2px; margin:0; padding:0;">';
    var userIdx = 0;

    for (var slot = 1; slot <= 27; slot++) {
      var hex = '#ffffff';
      var title = '';
      if (slot === 9) {
        hex = '#ffffff'; title = '흰색 (#ffffff)';
      } else if (slot === 18) {
        hex = '#000000'; title = '검정색 (#000000)';
      } else if (slot === 27) {
        hex = 'none'; title = '투명색 (none)';
      } else {
        hex = userColors[userIdx++] || '#041e49';
        title = hex;
      }

      var innerContent = (hex === 'none') ? '<svg viewBox="0 0 24 24" style="width:100%; height:100%; display:block;"><line x1="0" y1="24" x2="24" y2="0" stroke="#ef4444" stroke-width="2.5"/></svg>' : '';
      swatchGridHtml += '<div style="width:24px; height:24px; box-sizing:border-box; border:1px solid rgba(0,0,0,0.15); border-radius:3px; background:' + (hex === 'none' ? '#ffffff' : hex) + '; cursor:pointer; position:relative;" onclick="selectColorFromPopover(\'' + targetMode + '\', \'' + hex + '\')" title="' + title + '">' + innerContent + '</div>';
    }
    swatchGridHtml += '</div>';

    var finalHtml = '';

    if (isFillMode) {
      var tabsHeader =
        '<div style="display:flex; gap:2px; margin-bottom:8px; border-bottom:1px solid #cbd5e1; padding-bottom:4px; font-size:0.75rem;">' +
          '<button class="pop-tab" style="flex:1; padding:3px; background:#0284c7; color:#ffffff; font-weight:700; border:none; border-radius:4px; cursor:pointer;" onclick="switchPopoverTab(this, \'swatch\')">단색</button>' +
          '<button class="pop-tab" style="flex:1; padding:3px; background:#f1f5f9; color:#475569; font-weight:500; border:none; border-radius:4px; cursor:pointer;" onclick="switchPopoverTab(this, \'gradient\')">그라디언트</button>' +
          '<button class="pop-tab" style="flex:1; padding:3px; background:#f1f5f9; color:#475569; font-weight:500; border:none; border-radius:4px; cursor:pointer;" onclick="switchPopoverTab(this, \'pattern\')">패턴</button>' +
          '<button class="pop-tab" style="flex:1; padding:3px; background:#f1f5f9; color:#475569; font-weight:500; border:none; border-radius:4px; cursor:pointer;" onclick="switchPopoverTab(this, \'image\')">그림</button>' +
        '</div>';

      var swatchTab = '<div class="pop-tab-content" data-tab="swatch" style="display:flex; flex-direction:column;">' + swatchGridHtml + '</div>';

      var gradTab =
        '<div class="pop-tab-content" data-tab="gradient" style="display:none; flex-direction:column; gap:6px; font-size:0.78rem; color:#334155;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center;">' +
            '<span>유형:</span>' +
            '<select id="popGradType" style="padding:2px; font-size:0.75rem;"><option value="linear">직선 (Linear)</option><option value="radial">원형 (Radial)</option></select>' +
          '</div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center;">' +
            '<span>시작/끝 색상:</span>' +
            '<div style="display:flex; gap:4px;"><input type="color" id="popGradStart" value="#38bdf8"><input type="color" id="popGradEnd" value="#0369a1"></div>' +
          '</div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center;">' +
            '<span>각도:</span>' +
            '<input type="number" id="popGradAngle" value="90" style="width:55px; padding:2px; font-size:0.75rem; text-align:center;">' +
          '</div>' +
          '<button onclick="applyGradientFromPopover(\'' + targetMode + '\')" style="margin-top:4px; padding:4px; background:#0284c7; color:#fff; border:none; border-radius:4px; font-size:0.78rem; font-weight:600; cursor:pointer;">그라디언트 적용</button>' +
        '</div>';

      var patTab =
        '<div class="pop-tab-content" data-tab="pattern" style="display:none; flex-direction:column; gap:6px; font-size:0.78rem; color:#334155;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center;">' +
            '<span>패턴 종류:</span>' +
            '<select id="popPatType" style="padding:2px; font-size:0.75rem;"><option value="dots">점 (Dots)</option><option value="grid">격자 (Grid)</option><option value="diagonal">사선 (Diagonal)</option><option value="stripes">줄무늬 (Stripes)</option></select>' +
          '</div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center;">' +
            '<span>패턴 색상:</span>' +
            '<input type="color" id="popPatColor" value="#0284c7">' +
          '</div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center;">' +
            '<span>크기 (px):</span>' +
            '<input type="number" id="popPatSize" value="16" style="width:55px; padding:2px; font-size:0.75rem; text-align:center;">' +
          '</div>' +
          '<button onclick="applyPatternFromPopover(\'' + targetMode + '\')" style="margin-top:4px; padding:4px; background:#0284c7; color:#fff; border:none; border-radius:4px; font-size:0.78rem; font-weight:600; cursor:pointer;">패턴 적용</button>' +
        '</div>';

      var symbols = cfg.symbolRegistry || [];
      var symbolOptionsHtml = '<option value="">심볼 선택 (선택사항)</option>';
      for (var s = 0; s < symbols.length; s++) {
        symbolOptionsHtml += '<option value="' + symbols[s].id + '">' + symbols[s].name + '</option>';
      }

      var imgTab =
        '<div class="pop-tab-content" data-tab="image" style="display:none; flex-direction:column; gap:6px; font-size:0.78rem; color:#334155;">' +
          '<span>채우기 모드:</span>' +
          '<select id="popImgFillMode" style="width:100%; padding:3px; font-size:0.75rem; border:1px solid #cbd5e1; border-radius:4px;">' +
            '<option value="stretch">늘리기 (Stretch)</option>' +
            '<option value="tile">반복 (Tile / Repeat)</option>' +
            '<option value="single">1회만 채우기 (Single / Contain)</option>' +
          '</select>' +
          '<span>등록된 심볼 사용:</span>' +
          '<select id="popImgSymbolSelect" style="width:100%; padding:2px; font-size:0.75rem;">' + symbolOptionsHtml + '</select>' +
          '<span>또는 이미지 파일 업로드:</span>' +
          '<input type="file" id="popImgFileInput" accept="image/*" style="font-size:0.72rem;">' +
          '<button onclick="applyImageFillFromPopover(\'' + targetMode + '\')" style="margin-top:4px; padding:4px; background:#0284c7; color:#fff; border:none; border-radius:4px; font-size:0.78rem; font-weight:600; cursor:pointer;">그림 채우기 적용</button>' +
        '</div>';

      finalHtml = tabsHeader + swatchTab + gradTab + patTab + imgTab;
    } else {
      finalHtml = swatchGridHtml;
    }

    popover.innerHTML = finalHtml;
    document.body.appendChild(popover);

    function onOutsideClick(evt) {
      if (popover && !popover.contains(evt.target) && !btnEl.contains(evt.target)) {
        if (popover.parentNode) popover.parentNode.removeChild(popover);
        document.removeEventListener('mousedown', onOutsideClick);
      }
    }
    setTimeout(function() {
      document.addEventListener('mousedown', onOutsideClick);
    }, 50);
  }

  function selectColorFromPopover(targetMode, hex) {
    if (targetMode === 'stroke') {
      setStrokeColor(hex);
    } else if (targetMode === 'fill') {
      setFillColor(hex);
    } else if (targetMode === 'text_stroke' || targetMode === 'text') {
      cfg.textStrokeColor = hex;
      var members = getAllGroupMembers(cfg.selectedIds);
      var textObjs = members.filter(function(m) { return m.type === 'text'; });
      textObjs.forEach(function(obj) {
        if (obj && obj.attrs) {
          obj.attrs.stroke = hex;
          if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
            window.WebpointerRender.updateElementAttributes(obj);
          }
        }
      });
    } else if (targetMode === 'text_fill' || targetMode === 'bg') {
      cfg.textFillColor = hex;
      var members = getAllGroupMembers(cfg.selectedIds);
      var textObjs = members.filter(function(m) { return m.type === 'text'; });
      textObjs.forEach(function(obj) {
        if (obj && obj.attrs) {
          obj.attrs.fill = hex;
          if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
            window.WebpointerRender.updateElementAttributes(obj);
          }
        }
      });
    } else if (targetMode === 'text_underline') {
      cfg.textUnderlineColor = hex;
      var members = getAllGroupMembers(cfg.selectedIds);
      var textObjs = members.filter(function(m) { return m.type === 'text'; });
      textObjs.forEach(function(obj) {
        if (obj && obj.attrs) {
          obj.attrs.underlineColor = hex;
          if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
            window.WebpointerRender.updateElementAttributes(obj);
          }
        }
      });
    }

    var popover = document.getElementById('colorPalettePopover');
    if (popover && popover.parentNode) popover.parentNode.removeChild(popover);
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
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
    var nextBaseline = 'hanging';
    if (cur === 'hanging') {
      nextBaseline = 'central';
    } else if (cur === 'central' || cur === 'middle') {
      nextBaseline = 'alphabetic';
    } else {
      nextBaseline = 'hanging';
    }
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

  window.setTextPadding = setTextPadding;
  window.toggleTextPaddingSync = toggleTextPaddingSync;

  function cycleTextHorizontalAlign() {
    var cur = cfg.textAnchor || 'start';
    var nextAnchor = 'start';
    if (cur === 'start') {
      nextAnchor = 'middle';
    } else if (cur === 'middle') {
      nextAnchor = 'end';
    } else if (cur === 'end') {
      nextAnchor = 'justify';
    } else {
      nextAnchor = 'start';
    }
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
    } catch(e) {}

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
    var nextMode = 'fitShapeToText';
    if (cur === 'fitShapeToText') {
      nextMode = 'fitTextToShape';
    } else if (cur === 'fitTextToShape') {
      nextMode = 'none';
    } else {
      nextMode = 'fitShapeToText';
    }
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

  function openPaletteModal() {
    var modal = document.getElementById('paletteModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'paletteModal';
      modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.6); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(3px);';
      modal.innerHTML =
        '<div style="background:#ffffff; width:480px; max-width:90vw; padding:24px; border-radius:12px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); font-family:sans-serif;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
            '<h3 style="margin:0; font-size:1.1rem; color:#0f172a; font-weight:700;">사용자 팔레트 프리셋 수정 (Array 입력)</h3>' +
            '<button onclick="closePaletteModal()" style="background:none; border:none; font-size:1.2rem; cursor:pointer; color:#64748b;">✕</button>' +
          '</div>' +
          '<textarea class="palette-modal-textarea" id="paletteTextarea" style="width:100%; height:130px; padding:10px; font-family:monospace; font-size:0.82rem; border:1px solid #cbd5e1; border-radius:8px; outline:none; resize:vertical; color:#0f172a; background:#f8fafc;" placeholder=\'const colorPalette = [\n  "#2AA314", "#14A36A", "#1471A3"\n];\'></textarea>' +
          '<div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">' +
            '<button onclick="closePaletteModal()" style="padding:8px 16px; border:1px solid #cbd5e1; background:#ffffff; border-radius:6px; cursor:pointer; font-weight:600; color:#475569;">취소</button>' +
            '<button onclick="importPaletteFromText()" style="padding:8px 16px; border:none; background:#0284c7; color:#ffffff; border-radius:6px; cursor:pointer; font-weight:600;">적용하기</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(modal);
    }
    var textarea = document.getElementById('paletteTextarea');
    if (textarea) {
      textarea.value = '';
      textarea.focus();
    }
    modal.style.display = 'flex';
  }

  function closePaletteModal() {
    var modal = document.getElementById('paletteModal');
    if (modal) modal.style.display = 'none';
  }

  function importPaletteFromText() {
    var textarea = document.getElementById('paletteTextarea');
    if (!textarea) return;
    var rawText = textarea.value.trim();
    if (!rawText) { closePaletteModal(); return; }

    var matches = rawText.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g);
    if (matches && matches.length > 0) {
      cfg.paletteColors = matches.slice(0, 27);
      if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
    }
    closePaletteModal();
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
  window.switchTab = switchTab;

  function setActiveColorTarget(target) {
    cfg.activeColorTarget = target;
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function setActiveTextColorTarget(target) {
    cfg.activeTextColorTarget = target;
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
  }

  function applyPaletteColor(hex) {
    if (cfg.currentTab === 'text') {
      var target = cfg.activeTextColorTarget || 'text';
      var members = getAllGroupMembers(cfg.selectedIds);
      var textObjs = members.filter(function(m) { return m.type === 'text'; });

      textObjs.forEach(function(obj) {
        if (obj && obj.attrs) {
          if (target === 'text') {
            obj.attrs.fill = hex;
          } else {
            obj.attrs.bgColor = hex;
          }
          if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
            window.WebpointerRender.updateElementAttributes(obj);
          }
        }
      });
      if (target === 'text') cfg.strokeColor = hex;
    } else {
      var mode = cfg.activeColorTarget || 'stroke';
      if (mode === 'stroke') {
        setStrokeColor(hex);
      } else {
        setFillColor(hex);
      }
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
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
            } catch(e) {}

            if (!width || width <= 0) {
              var lines = (obj.attrs.text || '').split('\n');
              var maxLen = 0;
              lines.forEach(function(l) { if (l.length > maxLen) maxLen = l.length; });
              width = maxLen * (obj.attrs.fontSize || 20) * 0.55;
            }

            var xLeft = currX;
            if (oldAnchor === 'start') {
              xLeft = currX;
            } else if (oldAnchor === 'middle') {
              xLeft = currX - (width / 2);
            } else if (oldAnchor === 'end') {
              xLeft = currX - width;
            }

            var newX = xLeft;
            if (newAnchor === 'start') {
              newX = xLeft;
            } else if (newAnchor === 'middle') {
              newX = xLeft + (width / 2);
            } else if (newAnchor === 'end') {
              newX = xLeft + width;
            }

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

  var holdTimer = null;

  function toggleTextBold() {
    if (state.holdTriggered) {
      state.holdTriggered = false;
      return;
    }
    var current = cfg.fontWeight || 'normal';
    var isBold = (current === 'bold' || parseInt(current, 10) >= 600);
    var nextWeight = isBold ? 'normal' : 'bold';
    setTextFontWeight(nextWeight);
  }

  function toggleTextItalic() {
    if (state.holdTriggered) {
      state.holdTriggered = false;
      return;
    }
    var current = cfg.fontStyle || 'normal';
    var isItalic = (current === 'italic' || current === 'oblique');
    var nextStyle = isItalic ? 'normal' : 'italic';
    setTextFontStyle(nextStyle);
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

  window.switchTab = switchTab;
  window.applyImportedPalette = importPaletteFromText;
  window.applyPaletteColor = applyPaletteColor;
  window.setActiveColorTarget = setActiveColorTarget;
  window.setActiveTextColorTarget = setActiveTextColorTarget;
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
  window.setTool = setTool;
  window.setStrokeColor = setStrokeColor;
  window.setFillColor = setFillColor;
  window.setStrokeWidth = setStrokeWidth;
  window.setStrokeDashStyle = setStrokeDashStyle;
  window.toggleStrokeDashStyle = toggleStrokeDashStyle;
  window.startHoldDashArray = startHoldDashArray;
  window.endHoldDashArray = endHoldDashArray;
  window.setStrokeDashArray = setStrokeDashArray;
  window.setStrokeCap = setStrokeCap;
  window.setStrokeJoin = setStrokeJoin;
  window.setStartMarker = setStartMarker;
  window.setEndMarker = setEndMarker;
  window.adjustStrokeWidth = adjustStrokeWidth;
  window.setStartMarkerFillStyle = setStartMarkerFillStyle;
  window.toggleStartMarkerFillStyle = toggleStartMarkerFillStyle;
  window.setEndMarkerFillStyle = setEndMarkerFillStyle;
  window.toggleEndMarkerFillStyle = toggleEndMarkerFillStyle;
  window.scaleMarker = scaleMarker;
  window.toggleCategoryCollapse = toggleCategoryCollapse;
  window.toggleColorPalettePopover = toggleColorPalettePopover;
  window.startHoldColorBtn = startHoldColorBtn;
  window.endHoldColorBtn = endHoldColorBtn;
  window.handleColorBtnClick = handleColorBtnClick;
  window.applyCurrentColorDirectly = applyCurrentColorDirectly;
  window.selectColorFromPopover = selectColorFromPopover;
  window.openPaletteModal = openPaletteModal;
  window.closePaletteModal = closePaletteModal;
  window.importPaletteFromText = importPaletteFromText;
  window.applyStyleToSelected = applyStyleToSelected;
  window.setTextStrokeWidth = setTextStrokeWidth;
  window.toggleTextWritingMode = toggleTextWritingMode;
  window.setTextVerticalAlign = setTextVerticalAlign;
  window.setElementOpacity = setElementOpacity;
  window.setAlphaStepCount = setAlphaStepCount;
  window.startHoldAlphaInput = function() {};
  window.endHoldAlphaInput = function() {};
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

  // =========================================================================
  // History Manager (Undo / Redo with Ctrl+Z & Ctrl+Y)
  // =========================================================================
  var undoStack = [];
  var redoStack = [];
  var isRestoringHistory = false;

  function captureSnapshot() {
    var objs = [];
    cfg.objectsMap.forEach(function(obj) {
      objs.push({
        id: obj.id,
        type: obj.type,
        attrs: JSON.parse(JSON.stringify(obj.attrs))
      });
    });
    return JSON.stringify({
      canvas: {
        width: cfg.SVG_WIDTH || 960,
        height: cfg.SVG_HEIGHT || 540,
        bgColor: cfg.canvasBgColor || '#ffffff',
        gridSnapEnabled: !!cfg.gridSnapEnabled,
        gridStepSize: cfg.gridStepSize || 24
      },
      objects: objs
    });
  }

  function pushHistoryState() {
    if (isRestoringHistory) return;
    var snap = captureSnapshot();
    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === snap) return;
    undoStack.push(snap);
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
  }

  function restoreSnapshot(jsonStr) {
    if (!jsonStr) return;
    isRestoringHistory = true;
    try {
      var data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      if (data.canvas) {
        cfg.SVG_WIDTH = data.canvas.width || 960;
        cfg.SVG_HEIGHT = data.canvas.height || 540;
        cfg.canvasBgColor = data.canvas.bgColor || '#ffffff';
        cfg.gridSnapEnabled = !!data.canvas.gridSnapEnabled;
        cfg.gridStepSize = data.canvas.gridStepSize || 24;

        var mainSvg = document.getElementById('mainSvg');
        if (mainSvg) {
          mainSvg.setAttribute('viewBox', '0 0 ' + cfg.SVG_WIDTH + ' ' + cfg.SVG_HEIGHT);
          mainSvg.style.backgroundColor = cfg.canvasBgColor;
        }
      }

      cfg.objectsMap.forEach(function(obj) {
        if (obj.el && obj.el.parentNode) {
          obj.el.parentNode.removeChild(obj.el);
        }
        if (obj.underlineEl && obj.underlineEl.parentNode) {
          obj.underlineEl.parentNode.removeChild(obj.underlineEl);
        }
      });
      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      var objectsGroup = document.getElementById('objectsGroup');
      if (objectsGroup) {
        var orphans = objectsGroup.querySelectorAll('.custom-text-underline');
        orphans.forEach(function(el) {
          if (el.parentNode) el.parentNode.removeChild(el);
        });
      }
      if (data.objects && Array.isArray(data.objects)) {
        var maxIdNum = 0;
        data.objects.forEach(function(oData) {
          if (!oData || !oData.type) return;
          var idNum = parseInt((oData.id || '').replace('obj_', ''), 10);
          if (!isNaN(idNum) && idNum > maxIdNum) maxIdNum = idNum;

          var tag = 'rect';
          if (oData.type === 'point' || oData.type === 'circle') tag = 'circle';
          else if (oData.type === 'line') tag = 'line';
          else if (oData.type === 'ellipse') tag = 'ellipse';
          else if (oData.type === 'arc' || oData.type === 'bez2' || oData.type === 'bez3') tag = 'path';
          else if (oData.type === 'text') tag = 'text';
          else if (oData.type === 'image') tag = 'image';

          var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
          el.setAttribute('id', oData.id);
          if (objectsGroup) objectsGroup.appendChild(el);

          var newObj = {
            id: oData.id,
            type: oData.type,
            el: el,
            attrs: oData.attrs || {}
          };
          cfg.objectsMap.set(oData.id, newObj);
          if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.updateElementAttributes) {
            window.WebpointerRenderCanvas.updateElementAttributes(newObj);
          }
        });
        if (maxIdNum > 0) cfg.nextId = maxIdNum + 1;
      }

      if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.renderUI) {
        window.WebpointerRenderCanvas.renderUI();
      }
      if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.renderGrid) {
        window.WebpointerRenderCanvas.renderGrid();
      }
      if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
        window.WebpointerRender.renderRibbon();
      }
    } catch(e) {
      console.error('[Webpointer] Error restoring state:', e);
    }
    isRestoringHistory = false;
  }

  function undo() {
    if (undoStack.length <= 1) return;
    var currentSnap = undoStack.pop();
    redoStack.push(currentSnap);
    var prevSnap = undoStack[undoStack.length - 1];
    restoreSnapshot(prevSnap);
  }

  function redo() {
    if (redoStack.length === 0) return;
    var nextSnap = redoStack.pop();
    undoStack.push(nextSnap);
    restoreSnapshot(nextSnap);
  }

  window.addEventListener('keydown', function(e) {
    var isCtrl = e.ctrlKey || e.metaKey;
    if (!isCtrl) return;
    var activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

    if (e.key === 'z' || e.key === 'Z') {
      if (e.shiftKey) {
        e.preventDefault();
        redo();
      } else {
        e.preventDefault();
        undo();
      }
    } else if (e.key === 'y' || e.key === 'Y') {
      e.preventDefault();
      redo();
    }
  });

  // Initial snapshot after load
  setTimeout(function() {
    if (undoStack.length === 0) {
      pushHistoryState();
    }
  }, 300);

  // =========================================================================
  // File Operations (불러오기, 저장하기(웹에 저장), 다운로드)
  // =========================================================================
  var pendingFileToOpen = null;

  function proceedOpenFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      var content = ev.target.result;
      try {
        if (file.name.toLowerCase().endsWith('.svg')) {
          pushHistoryState();
          if (window.WebpointerSVGImporter) {
            window.WebpointerSVGImporter.importSVGContent(content);
          }
          pushHistoryState();
        } else {
          pushHistoryState();
          restoreSnapshot(content);
          pushHistoryState();
        }
      } catch(err) {
        console.error('[File Open Error]', err);
      }
    };
    reader.readAsText(file);
  }

  function openSlotSelectionModal() {
    var modal = document.getElementById('slotSelectionModal');
    if (!modal) {
      if (pendingFileToOpen) proceedOpenFile(pendingFileToOpen);
      return;
    }
    var btnContainer = document.getElementById('slotSelectionButtons');
    if (btnContainer) {
      var html = '';
      [1, 2, 3].forEach(function(slotNum) {
        var raw = localStorage.getItem('webpointer_slot_' + slotNum);
        var label = 'Slot ' + slotNum + '에 캔버스 저장 후 파일 열기';
        if (raw) {
          try {
            var data = JSON.parse(raw);
            label += ' (기존 ' + (data.objects ? data.objects.length : 0) + '개 객체 덮어쓰기)';
          } catch(e){}
        }
        html += '<button onclick="saveAndProceedFileOpen(' + slotNum + ')" style="padding:8px 12px; font-size:0.82rem; font-weight:600; background:#0284c7; color:#fff; border:none; border-radius:6px; cursor:pointer; text-align:left;">💾 ' + label + '</button>';
      });
      html += '<button onclick="discardAndProceedFileOpen()" style="padding:8px 12px; font-size:0.82rem; font-weight:600; background:#ef4444; color:#fff; border:none; border-radius:6px; cursor:pointer; text-align:left; margin-top:4px;">🗑️ 현재 캔버스 폐기하고 파일 열기</button>';
      btnContainer.innerHTML = html;
    }
    modal.classList.add('show');
  }
  window.openSlotSelectionModal = openSlotSelectionModal;

  function closeSlotSelectionModal() {
    var modal = document.getElementById('slotSelectionModal');
    if (modal) modal.classList.remove('show');
    pendingFileToOpen = null;
  }
  window.closeSlotSelectionModal = closeSlotSelectionModal;

  function saveAndProceedFileOpen(slotNum) {
    saveToFileSlot(slotNum);
    closeSlotSelectionModal();
    if (pendingFileToOpen) {
      var file = pendingFileToOpen;
      pendingFileToOpen = null;
      proceedOpenFile(file);
    }
  }
  window.saveAndProceedFileOpen = saveAndProceedFileOpen;

  function discardAndProceedFileOpen() {
    closeSlotSelectionModal();
    if (pendingFileToOpen) {
      var file = pendingFileToOpen;
      pendingFileToOpen = null;
      proceedOpenFile(file);
    }
  }
  window.discardAndProceedFileOpen = discardAndProceedFileOpen;

  function openFile() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.webpointer,.svg';
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      proceedOpenFile(file);
    };
    input.click();
  }

  function saveFileToWeb() {
    if (typeof openFileSlotsModal === 'function') {
      openFileSlotsModal();
    }
  }

  function downloadFile() {
    var pop = document.createElement('div');
    pop.style.cssText = 'position:fixed; z-index:999999; padding:14px; border:1.5px solid #0284c7; border-radius:10px; background:#ffffff; box-shadow:0 10px 30px rgba(0,0,0,0.25); outline:none; font-family:sans-serif; display:flex; flex-direction:column; gap:10px; width:240px; top:50%; left:50%; transform:translate(-50%, -50%);';
    pop.innerHTML =
      '<div style="font-size:0.92rem; font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">💾 파일 다운로드 선택</div>' +
      '<label style="display:flex; align-items:center; gap:6px; font-size:0.82rem; color:#334155; cursor:pointer; user-select:none; margin:2px 0;">' +
        '<input type="checkbox" id="dlIncludeGridChk" style="cursor:pointer; width:15px; height:15px; accent-color:#0284c7;">' +
        '<span style="font-weight:600;">격자(Grid) 포함 다운로드</span>' +
      '</label>' +
      '<button id="dlJsonBtn" style="padding:8px 10px; font-size:0.82rem; font-weight:700; background:#0284c7; color:#ffffff; border:none; border-radius:6px; cursor:pointer; transition:all 0.15s ease;">📄 프로젝트 저장 (.json)</button>' +
      '<button id="dlSvgBtn" style="padding:8px 10px; font-size:0.82rem; font-weight:700; background:#059669; color:#ffffff; border:none; border-radius:6px; cursor:pointer; transition:all 0.15s ease;">🖼️ SVG 벡터 이미지 (.svg)</button>' +
      '<button id="dlCancelBtn" style="padding:5px 8px; font-size:0.78rem; background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; border-radius:4px; cursor:pointer; margin-top:2px;">취소 / 닫기</button>';

    document.body.appendChild(pop);

    function closePop() {
      if (pop && pop.parentNode) pop.parentNode.removeChild(pop);
    }

    document.getElementById('dlJsonBtn').onclick = function() {
      var includeGrid = document.getElementById('dlIncludeGridChk') && document.getElementById('dlIncludeGridChk').checked;
      closePop();
      var snapStr = captureSnapshot();
      try {
        var snapObj = JSON.parse(snapStr);
        snapObj.exportIncludeGrid = !!includeGrid;
        snapStr = JSON.stringify(snapObj, null, 2);
      } catch(e) {}
      var blob = new Blob([snapStr], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'webpointer_project_' + Date.now() + '.json';
      a.click();
      URL.revokeObjectURL(url);
    };

    document.getElementById('dlSvgBtn').onclick = function() {
      var includeGrid = document.getElementById('dlIncludeGridChk') && document.getElementById('dlIncludeGridChk').checked;
      closePop();
      var mainSvg = document.getElementById('mainSvg');
      if (!mainSvg) return;
      var clone = mainSvg.cloneNode(true);

      // 1. 격자 그룹 (#gridGroup) 처리
      var gridG = clone.querySelector('#gridGroup');
      if (gridG) {
        if (!includeGrid) {
          // 격자 미포함(기본값): #gridGroup 통째로 완전 제거
          gridG.parentNode.removeChild(gridG);
        } else {
          // 격자 포함: 조종점/테두리가 아닌纯 격자 요소만 보존
        }
      }

      // 2. UI 핸들 및 선택 테두리 그룹 (#uiGroup) 처리
      var uiG = clone.querySelector('#uiGroup');
      if (uiG) {
        if (!includeGrid) {
          // 격자 미포함(기본값): uiGroup 전체 제거
          uiG.parentNode.removeChild(uiG);
        } else {
          // 격자 포함: 조종점/변형 핸들/선택 테두리만 제거
          var overlayElements = uiG.querySelectorAll('.transform-handle, .selection-box, .selection-overlay, [id*="handle"], [id*="transform"]');
          overlayElements.forEach(function(el) {
            if (el && el.parentNode) el.parentNode.removeChild(el);
          });
        }
      }

      // 3. 배경 색상 rect 보정 (격자 제거 후 깔끔한 배경색 유지)
      var canvasBgColor = (cfg && cfg.canvasBgColor) ? cfg.canvasBgColor : '#ffffff';
      if (canvasBgColor && canvasBgColor !== 'transparent') {
        var bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('width', '100%');
        bgRect.setAttribute('height', '100%');
        bgRect.setAttribute('fill', canvasBgColor);
        clone.insertBefore(bgRect, clone.firstChild);
      }

      var serializer = new XMLSerializer();
      var svgStr = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(clone);
      var blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'webpointer_drawing_' + Date.now() + '.svg';
      a.click();
      URL.revokeObjectURL(url);
    };

    document.getElementById('dlCancelBtn').onclick = closePop;
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
    } catch(e) {}
  }
  window.setLongPressDelay = setLongPressDelay;

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

  function generateCanvasThumbnailSvg() {
    try {
      var svgEl = document.getElementById('mainSvg') || document.getElementById('webpointerSvgCanvas');
      if (!svgEl) return '';
      var clone = svgEl.cloneNode(true);
      var uiGroup = clone.querySelector('#uiGroup');
      if (uiGroup) uiGroup.parentNode.removeChild(uiGroup);
      var gridGroup = clone.querySelector('#gridGroup');
      if (gridGroup) gridGroup.parentNode.removeChild(gridGroup);
      var serializer = new XMLSerializer();
      var str = serializer.serializeToString(clone);
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str);
    } catch(e) {
      return '';
    }
  }

  function getFileSlotKeys() {
    var rawKeys = localStorage.getItem('webpointer_slot_keys');
    var keys = ['1', '2', '3'];
    if (rawKeys) {
      try {
        var parsed = JSON.parse(rawKeys);
        if (Array.isArray(parsed) && parsed.length > 0) keys = parsed;
      } catch(e) {}
    }
    return keys;
  }

  function saveFileSlotKeys(keys) {
    localStorage.setItem('webpointer_slot_keys', JSON.stringify(keys));
  }

  function addNewFileSlot() {
    var keys = getFileSlotKeys();
    var maxNum = 0;
    keys.forEach(function(k) {
      var n = parseInt(k, 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    });
    var newKey = String(maxNum + 1);
    keys.push(newKey);
    saveFileSlotKeys(keys);
    renderFileSlotsList();
  }
  window.addNewFileSlot = addNewFileSlot;

  function renderFileSlotsList() {
    var container = document.getElementById('fileSlotsContainer');
    if (!container) return;
    var keys = getFileSlotKeys();
    var html = '';

    keys.forEach(function(slotKey) {
      var raw = localStorage.getItem('webpointer_slot_' + slotKey);
      var slotData = null;
      var timeStr = '비어있음';
      var countStr = '0개 객체';
      var slotName = 'Slot ' + slotKey;
      var thumbHtml = '<div style="height:44px; width:70px; min-width:70px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:0.68rem; color:#94a3b8;">미리보기</div>';
      var isSaved = false;

      if (raw) {
        try {
          slotData = JSON.parse(raw);
          isSaved = true;
          if (slotData.name) slotName = slotData.name;
          if (slotData.timestamp) timeStr = new Date(slotData.timestamp).toLocaleString();
          if (slotData.objects) countStr = slotData.objects.length + '개 객체';
          if (slotData.thumbnail) {
            thumbHtml = '<img src="' + slotData.thumbnail + '" style="height:44px; width:70px; min-width:70px; object-fit:contain; background:#ffffff; border:1px solid #e2e8f0; border-radius:4px;" />';
          }
        } catch(e){}
      }

      html +=
        '<div id="fileSlotCard_' + slotKey + '" style="border:1px solid #cbd5e1; border-radius:8px; padding:10px 14px; background:#ffffff; display:flex; align-items:center; justify-content:space-between; gap:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">' +
          '<div style="display:flex; align-items:center; gap:12px; flex:1; overflow:hidden;">' +
            thumbHtml +
            '<div style="display:flex; flex-direction:column; gap:2px; overflow:hidden;">' +
              '<div style="font-size:0.92rem; font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' +
                '<span>💾 ' + slotName + '</span> ' +
                (isSaved ? '<span style="font-size:0.7rem; color:#059669; font-weight:600;">(' + countStr + ')</span>' : '<span style="font-size:0.7rem; color:#94a3b8;">(비어있음)</span>') +
              '</div>' +
              '<div style="font-size:0.75rem; color:#64748b;">저장 시각: ' + timeStr + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">' +
            '<button onclick="saveToFileSlot(\'' + slotKey + '\')" style="padding:5px 10px; font-size:0.78rem; font-weight:700; background:#0284c7; color:#fff; border:none; border-radius:6px; cursor:pointer;" title="현재 작업 저장">저장하기</button>' +
            '<button onclick="loadFromFileSlot(\'' + slotKey + '\')" ' + (!slotData ? 'disabled style="opacity:0.4; cursor:not-allowed; padding:5px 10px; font-size:0.78rem; font-weight:700; background:#059669; color:#fff; border:none; border-radius:6px;"' : 'style="padding:5px 10px; font-size:0.78rem; font-weight:700; background:#059669; color:#fff; border:none; border-radius:6px; cursor:pointer;"') + ' title="슬롯 작업 불러오기">불러오기</button>' +
            '<button onclick="renameFileSlot(\'' + slotKey + '\')" style="padding:5px 10px; font-size:0.78rem; font-weight:700; background:#f59e0b; color:#fff; border:none; border-radius:6px; cursor:pointer;" title="슬롯 이름 변경">이름바꾸기</button>' +
            '<button onclick="deleteFileSlot(\'' + slotKey + '\')" style="padding:5px 10px; font-size:0.78rem; font-weight:700; background:#ef4444; color:#fff; border:none; border-radius:6px; cursor:pointer;" title="슬롯 삭제">삭제하기</button>' +
          '</div>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  function openFileSlotsModal() {
    var modal = document.getElementById('fileSlotsModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'flex';
      renderFileSlotsList();
    }
  }
  window.openFileSlotsModal = openFileSlotsModal;

  function closeFileSlotsModal() {
    var modal = document.getElementById('fileSlotsModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }
  window.closeFileSlotsModal = closeFileSlotsModal;

  function compressSnapshotImages(snapObj) {
    if (!snapObj || !snapObj.objects || !Array.isArray(snapObj.objects)) return snapObj;
    snapObj.objects.forEach(function(o) {
      if (o && o.type === 'image' && o.attrs && o.attrs.href && o.attrs.href.length > 500000) {
        // 500KB 초과 대용량 Base64 이미지 데이터 속성 크기 가공
        o.attrs.hrefTruncated = false;
      }
    });
    return snapObj;
  }

  var pendingSlotKeyToSave = null;

  function openLargeCanvasNoticeModal(slotKey, sizeMB) {
    pendingSlotKeyToSave = slotKey;
    var modal = document.getElementById('largeCanvasNoticeModal');
    var textEl = document.getElementById('largeCanvasSizeMbText');
    if (textEl) textEl.textContent = sizeMB.toFixed(1);
    if (modal) {
      modal.classList.add('show');
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.setProperty('visibility', 'visible', 'important');
      modal.style.setProperty('opacity', '1', 'important');
    }
  }

  function closeLargeCanvasNoticeModal() {
    var modal = document.getElementById('largeCanvasNoticeModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  function downloadProjectJsonAndCloseModal() {
    closeLargeCanvasNoticeModal();
    var snap = captureSnapshot();
    var blob = new Blob([snap], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'webpointer_project_' + Date.now() + '.json';
    a.click();
  }

  function forceProceedTempSave() {
    closeLargeCanvasNoticeModal();
    if (pendingSlotKeyToSave) {
      executeSaveToFileSlot(pendingSlotKeyToSave);
      pendingSlotKeyToSave = null;
    }
  }

  function promptUserQuotaDownload() {
    var confirmed = window.confirm(
      '웹 브라우저의 저장 용량을 초과하였습니다.\n' +
      '현재 작업사항을 안전하게 저장하려면 PC에 다운로드하는 것을 권장합니다.\n\n' +
      '다운로드 하시겠습니까?'
    );

    if (confirmed) {
      if (typeof closeFileSlotsModal === 'function') {
        closeFileSlotsModal();
      }
      setTimeout(function() {
        if (typeof downloadFile === 'function') {
          downloadFile();
        }
      }, 50);
    }
  }

  window.promptUserQuotaDownload = promptUserQuotaDownload;

  function saveToFileSlot(slotKey) {
    executeSaveToFileSlot(slotKey);
  }

  function executeSaveToFileSlot(slotKey) {
    try {
      var snapStr = captureSnapshot();
      var parsed = JSON.parse(snapStr);
      parsed.timestamp = Date.now();
      parsed.thumbnail = generateCanvasThumbnailSvg();
      parsed.snapStr = snapStr;

      var existingRaw = localStorage.getItem('webpointer_slot_' + slotKey);
      if (existingRaw) {
        try {
          var ex = JSON.parse(existingRaw);
          if (ex && ex.name) parsed.name = ex.name;
        } catch(e) {}
      }
      if (!parsed.name) parsed.name = 'Slot ' + slotKey;

      if (window.WebpointerStorage && window.WebpointerStorage.saveSlotToDB) {
        window.WebpointerStorage.saveSlotToDB(slotKey, parsed);
      }

      try {
        localStorage.setItem('webpointer_slot_' + slotKey, JSON.stringify(parsed));
      } catch (quotaErr) {
        console.warn('LocalStorage 용량 초과 발생! confirm() 대화상자로 다운로드 여부를 확인합니다:', quotaErr);
        promptUserQuotaDownload();
        return;
      }

      var keys = getFileSlotKeys();
      if (keys.indexOf(String(slotKey)) === -1) {
        keys.push(String(slotKey));
        saveFileSlotKeys(keys);
      }

      renderFileSlotsList();
    } catch(e) {
      console.error('Slot 저장 처리 구동:', e);
      openQuotaExceededConfirmModal();
    }
  }
  window.saveToFileSlot = saveToFileSlot;

  function loadFromFileSlot(slotKey) {
    try {
      // 1. IndexedDB 우선 로드 시도
      if (window.WebpointerStorage && window.WebpointerStorage.loadSlotFromDB) {
        window.WebpointerStorage.loadSlotFromDB(slotKey, function(err, dbData) {
          if (!err && dbData && (dbData.snapStr || dbData.objects)) {
            restoreSnapshot(dbData.snapStr || JSON.stringify(dbData));
            closeFileSlotsModal();
            return;
          }
          // Fallback to LocalStorage
          var raw = localStorage.getItem('webpointer_slot_' + slotKey);
          if (!raw) return;
          var parsed = JSON.parse(raw);
          restoreSnapshot(parsed.snapStr || raw);
          closeFileSlotsModal();
        });
      } else {
        var raw = localStorage.getItem('webpointer_slot_' + slotKey);
        if (!raw) return;
        var parsed = JSON.parse(raw);
        restoreSnapshot(parsed.snapStr || raw);
        closeFileSlotsModal();
      }
    } catch(e) {
      console.error('Slot 불러오기 실패:', e);
    }
  }
  window.loadFromFileSlot = loadFromFileSlot;

  function renameFileSlot(slotKey) {
    var raw = localStorage.getItem('webpointer_slot_' + slotKey);
    var curName = 'Slot ' + slotKey;
    var slotData = {};
    if (raw) {
      try {
        slotData = JSON.parse(raw);
        if (slotData.name) curName = slotData.name;
      } catch(e) {}
    }
    var newName = prompt('슬롯 이름을 입력하세요:', curName);
    if (newName && newName.trim()) {
      slotData.name = newName.trim();
      localStorage.setItem('webpointer_slot_' + slotKey, JSON.stringify(slotData));
      renderFileSlotsList();
    }
  }
  window.renameFileSlot = renameFileSlot;

  function deleteFileSlot(slotKey) {
    localStorage.removeItem('webpointer_slot_' + slotKey);
    var keys = getFileSlotKeys().filter(function(k) { return k !== String(slotKey); });
    saveFileSlotKeys(keys);
    renderFileSlotsList();
  }
  window.deleteFileSlot = deleteFileSlot;

  window.renderFileSlotsList = renderFileSlotsList;



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

  window.openShortcutModal = openShortcutModal;
  window.closeShortcutModal = closeShortcutModal;
  window.openDetailedSettingsModal = openDetailedSettingsModal;
  window.closeDetailedSettingsModal = closeDetailedSettingsModal;
  window.applyDetailedSettings = applyDetailedSettings;

  window.pushHistoryState = pushHistoryState;
  window.saveState = pushHistoryState;
  window.undo = undo;
  window.redo = redo;
  window.openFile = openFile;
  window.saveFileToWeb = saveFileToWeb;
  window.downloadFile = downloadFile;

  window.toggleGridSnap = toggleGridSnap;
  window.toggleSnapping = toggleSnapping;
  window.setSnappingThreshold = setSnappingThreshold;
  window.setGridDensity = setGridDensity;
  window.setGridStepSize = setGridStepSize;
  window.setProximityThreshold = setProximityThreshold;
  window.setDefaultShapeSize = setDefaultShapeSize;
  window.setCanvasRatio = setCanvasRatio;
  window.setCanvasBgColor = setCanvasBgColor;

  window.setTextUnderlineStyle = setTextUnderlineStyle;
  window.setTextUnderlineOffset = setTextUnderlineOffset;
  window.setTextUnderlineWidth = setTextUnderlineWidth;
  window.cycleTextVerticalAlign = cycleTextVerticalAlign;
  window.cycleTextHorizontalAlign = cycleTextHorizontalAlign;
  window.setTextAutoFitMode = setTextAutoFitMode;
  window.cycleTextAutoFitMode = cycleTextAutoFitMode;
  window.applyAutoFitToGroup = applyAutoFitToGroup;

  function toggleCropMode() {
    state.isCropModeActive = !state.isCropModeActive;
    if (window.WebpointerRender) {
      if (window.WebpointerRender.renderUI) window.WebpointerRender.renderUI();
      if (window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
    }
  }
  window.toggleCropMode = toggleCropMode;

  function renderSymbolList() {
    var container = document.getElementById('symbolListContainer');
    if (!container) return;
    var symbols = cfg.symbolRegistry || [];
    if (symbols.length === 0) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 0.85rem;">등록된 심볼이 없습니다.<br>"불러오기" 버튼으로 이미지/SVG 심볼을 추가하세요.</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < symbols.length; i++) {
      var sym = symbols[i];
      var imgSrc = sym.thumb || sym.data || '';
      if (imgSrc.startsWith('data:image/svg+xml;utf8,')) {
        var rawSvg = imgSrc.replace('data:image/svg+xml;utf8,', '');
        imgSrc = 'data:image/svg+xml;utf8,' + encodeURIComponent(rawSvg);
      }
      var safeSrc = String(imgSrc).replace(/"/g, '&quot;');
      var safeName = String(sym.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      html +=
        '<div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px;">' +
          '<div style="display: flex; align-items: center; gap: 10px;">' +
            '<img src="' + safeSrc + '" style="width: 48px; height: 48px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 4px; background: #ffffff;">' +
            '<div style="display: flex; flex-direction: column;">' +
              '<span style="font-weight: 600; font-size: 0.88rem; color: #0f172a;">' + safeName + '</span>' +
              '<span style="font-size: 0.72rem; color: #64748b;">ID: ' + sym.id + ' (' + sym.type.toUpperCase() + ')</span>' +
            '</div>' +
          '</div>' +
          '<button onclick="deleteSymbol(\'' + sym.id + '\')" style="background: #ef4444; color: #ffffff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">삭제</button>' +
        '</div>';
    }
    container.innerHTML = html;
  }

  function openSymbolManagerModal() {
    var modal = document.getElementById('symbolManagerModal');
    if (modal) {
      modal.classList.add('show');
      renderSymbolList();
    }
  }

  var BUILTIN_IMAGE_SYMBOLS = [
    {
      id: 'builtin_star',
      name: '⭐ 별 (Star)',
      type: 'image',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23eab308" stroke="%23ca8a04" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
    },
    {
      id: 'builtin_heart',
      name: '❤️ 하트 (Heart)',
      type: 'image',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ef4444" stroke="%23dc2626" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
    },
    {
      id: 'builtin_check',
      name: '✅ 체크 (Check)',
      type: 'image',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2322c55e" stroke="%2316a34a" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
    },
    {
      id: 'builtin_warning',
      name: '⚠️ 경고 (Warning)',
      type: 'image',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f59e0b" stroke="%23d97706" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    },
    {
      id: 'builtin_arrow',
      name: '➔ 화살표 (Arrow)',
      type: 'image',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230284c7" stroke="%230369a1" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'
    },
    {
      id: 'builtin_cloud',
      name: '☁️ 구름 (Cloud)',
      type: 'image',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2338bdf8" stroke="%230284c7" stroke-width="1.5"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>'
    },
    {
      id: 'builtin_sun',
      name: '☀️ 태양 (Sun)',
      type: 'image',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f97316" stroke="%23ea580c" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
    },
    {
      id: 'builtin_target',
      name: '🎯 타겟 (Target)',
      type: 'image',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23ec4899" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>'
    }
  ];

  function openImageSymbolPickerModal() {
    var modal = document.getElementById('imageSymbolPickerModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'flex';
      renderImageSymbolPickerGrid();
    }
  }

  function closeImageSymbolPickerModal() {
    var modal = document.getElementById('imageSymbolPickerModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  function renderImageSymbolPickerGrid() {
    var container = document.getElementById('imageSymbolPickerGridContainer');
    if (!container) return;

    var allSymbols = BUILTIN_IMAGE_SYMBOLS.concat(cfg.symbolRegistry || []);
    var html = '';

    for (var i = 0; i < allSymbols.length; i++) {
      var sym = allSymbols[i];
      var imgSrc = sym.data || sym.thumb || '';
      if (sym.type === 'svg' && sym.data && !sym.data.startsWith('data:')) {
        imgSrc = 'data:image/svg+xml;utf8,' + encodeURIComponent(sym.data);
      } else if (imgSrc.startsWith('data:image/svg+xml;utf8,')) {
        var rawSvg = imgSrc.replace('data:image/svg+xml;utf8,', '');
        imgSrc = 'data:image/svg+xml;utf8,' + encodeURIComponent(rawSvg);
      }
      var safeSrc = String(imgSrc).replace(/"/g, '&quot;');
      var safeName = String(sym.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      html +=
        '<div onclick="insertSymbolToCanvasCenter(\'' + sym.id + '\')" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 6px; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.15s ease;" onmouseover="this.style.borderColor=\'#0284c7\'; this.style.transform=\'scale(1.04)\';" onmouseout="this.style.borderColor=\'#e2e8f0\'; this.style.transform=\'none\';">' +
          '<img src="' + safeSrc + '" style="width: 56px; height: 56px; object-fit: contain; margin-bottom: 6px;">' +
          '<span style="font-size: 0.76rem; font-weight: 600; color: #334155; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;">' + safeName + '</span>' +
        '</div>';
    }
    container.innerHTML = html;
  }

  function insertSymbolToCanvasCenter(symId) {
    var allSymbols = BUILTIN_IMAGE_SYMBOLS.concat(cfg.symbolRegistry || []);
    var targetSym = null;
    for (var i = 0; i < allSymbols.length; i++) {
      if (allSymbols[i].id === symId) {
        targetSym = allSymbols[i];
        break;
      }
    }
    if (!targetSym) return;

    var mainSvg = document.getElementById('mainSvg');
    var objectsGroup = document.getElementById('objectsGroup');
    if (!mainSvg || !objectsGroup) return;

    // 현재 보이는 SVG 캔버스 뷰포트 정중앙 (centerX, centerY) 정밀 계산
    var svgWidth = cfg.SVG_WIDTH || 800;
    var svgHeight = cfg.SVG_HEIGHT || 600;
    var panX = cfg.panX || 0;
    var panY = cfg.panY || 0;
    var zoom = cfg.zoomLevel || 1;

    var viewCenterX = Math.round((svgWidth / 2 - panX) / zoom);
    var viewCenterY = Math.round((svgHeight / 2 - panY) / zoom);

    var symWidth = 120;
    var symHeight = 120;
    var posX = Math.round(viewCenterX - symWidth / 2);
    var posY = Math.round(viewCenterY - symHeight / 2);

    var imgSrc = targetSym.data || targetSym.thumb;
    if (targetSym.type === 'svg' && targetSym.data && !targetSym.data.startsWith('data:')) {
      imgSrc = 'data:image/svg+xml;utf8,' + encodeURIComponent(targetSym.data);
    }

    var imgEl = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    imgEl.setAttribute('x', posX);
    imgEl.setAttribute('y', posY);
    imgEl.setAttribute('width', symWidth);
    imgEl.setAttribute('height', symHeight);
    imgEl.setAttribute('href', imgSrc);
    imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imgSrc);
    imgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    var newObjId = 'img_' + Date.now();
    imgEl.setAttribute('id', newObjId);

    var newObj = {
      id: newObjId,
      type: 'image',
      attrs: {
        x: posX,
        y: posY,
        width: symWidth,
        height: symHeight,
        href: imgSrc,
        preserveAspectRatio: 'xMidYMid meet'
      },
      el: imgEl
    };

    cfg.objectsMap.set(newObjId, newObj);
    objectsGroup.appendChild(imgEl);

    // 1. 모달 닫기
    closeImageSymbolPickerModal();

    // 2. 선택 도구(select)로 즉시 전환
    if (typeof setTool === 'function') {
      setTool('select');
    } else {
      cfg.currentTool = 'select';
    }

    // 3. 신규 생성된 심볼을 즉시 단일 선택
    cfg.selectedIds.clear();
    cfg.selectedIds.add(newObjId);

    // 4. 변형 조종점(Transform Handles & Bounding Box) 켜진 상태로 진입 및 대기
    if (window.WebpointerRender && window.WebpointerRender.renderUI) {
      window.WebpointerRender.renderUI();
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function closeSymbolManagerModal() {
    var modal = document.getElementById('symbolManagerModal');
    if (modal) modal.classList.remove('show');
  }

  function resizeAndCompressImageDataUrl(dataUrl, maxDim, quality, callback) {
    if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.indexOf('svg+xml') !== -1 || dataUrl.length < 150000) {
      callback(dataUrl);
      return;
    }
    var img = new Image();
    img.onload = function() {
      var w = img.width;
      var h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      var cvs = document.createElement('canvas');
      cvs.width = w;
      cvs.height = h;
      var ctx = cvs.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      var compressed = cvs.toDataURL('image/jpeg', quality || 0.8);
      callback(compressed);
    };
    img.onerror = function() {
      callback(dataUrl);
    };
    img.src = dataUrl;
  }

  function importSymbolFromFile() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.svg,.png,.jpg,.jpeg';
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        var content = ev.target.result;
        var symName = file.name.replace(/\.[^/.]+$/, "");
        var symId = 'sym_' + Date.now();
        var isSvg = file.name.toLowerCase().endsWith('.svg');

        var newSym = {
          id: symId,
          name: symName,
          type: isSvg ? 'svg' : 'image',
          thumb: isSvg ? 'data:image/svg+xml;utf8,' + encodeURIComponent(content) : content,
          data: content
        };
        cfg.symbolRegistry.push(newSym);
        try {
          localStorage.setItem('webpointer_symbols', JSON.stringify(cfg.symbolRegistry));
        } catch(err) {
          console.warn('webpointer_symbols LocalStorage 공간 한계. 메모리 렌더러만 유지합니다:', err);
        }
        renderSymbolList();
        if (typeof renderImageSymbolPickerGrid === 'function') renderImageSymbolPickerGrid();
      };
      if (file.name.toLowerCase().endsWith('.svg')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  function deleteSymbol(symId) {
    cfg.symbolRegistry = cfg.symbolRegistry.filter(function(s) { return s.id !== symId; });
    localStorage.setItem('webpointer_symbols', JSON.stringify(cfg.symbolRegistry));
    renderSymbolList();
  }

  function ensureSvgDefs() {
    var mainSvg = document.getElementById('mainSvg');
    if (!mainSvg) return null;
    var defs = mainSvg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.setAttribute('id', 'svgDefs');
      mainSvg.insertBefore(defs, mainSvg.firstChild);
    }
    return defs;
  }

  function createLinearGradient(color1, color2, angleDeg, stopsArray) {
    var defs = ensureSvgDefs();
    if (!defs) return 'none';
    var id = 'grad_lin_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    var rad = ((angleDeg || 90) * Math.PI) / 180;
    var x1 = Math.round(50 - Math.cos(rad) * 50) + '%';
    var y1 = Math.round(50 - Math.sin(rad) * 50) + '%';
    var x2 = Math.round(50 + Math.cos(rad) * 50) + '%';
    var y2 = Math.round(50 + Math.sin(rad) * 50) + '%';

    var grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', id);
    grad.setAttribute('x1', x1);
    grad.setAttribute('y1', y1);
    grad.setAttribute('x2', x2);
    grad.setAttribute('y2', y2);

    if (stopsArray && Array.isArray(stopsArray) && stopsArray.length > 0) {
      stopsArray.forEach(function(st) {
        var s = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s.setAttribute('offset', typeof st.offset === 'number' ? st.offset + '%' : (st.offset || '0%'));
        s.setAttribute('stop-color', st.color || '#000000');
        grad.appendChild(s);
      });
    } else {
      var stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', color1 || '#38bdf8');

      var stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', color2 || '#0369a1');

      grad.appendChild(stop1);
      grad.appendChild(stop2);
    }
    defs.appendChild(grad);

    return 'url(#' + id + ')';
  }

  function createRadialGradient(color1, color2, stopsArray) {
    var defs = ensureSvgDefs();
    if (!defs) return 'none';
    var id = 'grad_rad_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    var grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    grad.setAttribute('id', id);
    grad.setAttribute('cx', '50%');
    grad.setAttribute('cy', '50%');
    grad.setAttribute('r', '50%');

    if (stopsArray && Array.isArray(stopsArray) && stopsArray.length > 0) {
      stopsArray.forEach(function(st) {
        var s = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s.setAttribute('offset', typeof st.offset === 'number' ? st.offset + '%' : (st.offset || '0%'));
        s.setAttribute('stop-color', st.color || '#000000');
        grad.appendChild(s);
      });
    } else {
      var stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', color1 || '#38bdf8');

      var stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', color2 || '#0369a1');

      grad.appendChild(stop1);
      grad.appendChild(stop2);
    }
    defs.appendChild(grad);

    return 'url(#' + id + ')';
  }

  function createPatternFill(type, color, size) {
    var defs = ensureSvgDefs();
    if (!defs) return 'none';
    var id = 'pat_' + type + '_' + Date.now();
    var pSize = parseInt(size, 10) || 16;

    var pat = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pat.setAttribute('id', id);
    pat.setAttribute('width', pSize);
    pat.setAttribute('height', pSize);
    pat.setAttribute('patternUnits', 'userSpaceOnUse');

    if (type === 'dots') {
      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pSize / 2);
      circle.setAttribute('cy', pSize / 2);
      circle.setAttribute('r', Math.max(1, pSize / 4));
      circle.setAttribute('fill', color || '#0ea5e9');
      pat.appendChild(circle);
    } else if (type === 'grid') {
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M ' + pSize + ' 0 L 0 0 0 ' + pSize);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color || '#0ea5e9');
      path.setAttribute('stroke-width', '1.5');
      pat.appendChild(path);
    } else if (type === 'diagonal') {
      var pathD = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathD.setAttribute('d', 'M 0 ' + pSize + ' L ' + pSize + ' 0 M -' + (pSize/4) + ' ' + (pSize/4) + ' L ' + (pSize/4) + ' -' + (pSize/4) + ' M ' + (pSize*3/4) + ' ' + (pSize*5/4) + ' L ' + (pSize*5/4) + ' ' + (pSize*3/4));
      pathD.setAttribute('fill', 'none');
      pathD.setAttribute('stroke', color || '#0ea5e9');
      pathD.setAttribute('stroke-width', '1.5');
      pat.appendChild(pathD);
    } else if (type === 'stripes') {
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      rect.setAttribute('width', pSize / 2);
      rect.setAttribute('height', pSize);
      rect.setAttribute('fill', color || '#0ea5e9');
      pat.appendChild(rect);
    }

    defs.appendChild(pat);
    return 'url(#' + id + ')';
  }

  function createImageFill(imgUrl, mode, scale) {
    var defs = ensureSvgDefs();
    if (!defs) return 'none';
    var id = 'imgpat_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    var fillMode = mode || 'stretch';
    var patternScale = scale || 40;

    var pat = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pat.setAttribute('id', id);

    var img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttribute('href', imgUrl);

    if (fillMode === 'stretch') {
      pat.setAttribute('patternUnits', 'objectBoundingBox');
      pat.setAttribute('width', '1');
      pat.setAttribute('height', '1');
      img.setAttribute('width', '100%');
      img.setAttribute('height', '100%');
      img.setAttribute('preserveAspectRatio', 'none');
    } else if (fillMode === 'tile') {
      pat.setAttribute('patternUnits', 'userSpaceOnUse');
      pat.setAttribute('width', patternScale);
      pat.setAttribute('height', patternScale);
      img.setAttribute('width', patternScale);
      img.setAttribute('height', patternScale);
      img.setAttribute('preserveAspectRatio', 'none');
    } else if (fillMode === 'single') {
      pat.setAttribute('patternUnits', 'objectBoundingBox');
      pat.setAttribute('width', '1');
      pat.setAttribute('height', '1');
      img.setAttribute('width', '100%');
      img.setAttribute('height', '100%');
      img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    } else {
      pat.setAttribute('patternUnits', 'userSpaceOnUse');
      pat.setAttribute('width', '60');
      pat.setAttribute('height', '60');
      img.setAttribute('width', '60');
      img.setAttribute('height', '60');
      img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    }

    pat.appendChild(img);
    defs.appendChild(pat);
    return 'url(#' + id + ')';
  }

  function switchPopoverTab(tabBtn, tabName) {
    var popover = document.getElementById('colorPalettePopover');
    if (!popover) return;
    popover.querySelectorAll('.pop-tab').forEach(function(b) {
      b.style.background = '#f1f5f9';
      b.style.color = '#475569';
      b.style.fontWeight = '500';
    });
    tabBtn.style.background = '#0284c7';
    tabBtn.style.color = '#ffffff';
    tabBtn.style.fontWeight = '700';

    popover.querySelectorAll('.pop-tab-content').forEach(function(c) {
      c.style.display = 'none';
    });
    var target = popover.querySelector('.pop-tab-content[data-tab="' + tabName + '"]');
    if (target) target.style.display = 'flex';
  }

  function applyGradientFromPopover(targetMode) {
    var startCol = document.getElementById('popGradStart') ? document.getElementById('popGradStart').value : '#38bdf8';
    var endCol = document.getElementById('popGradEnd') ? document.getElementById('popGradEnd').value : '#0369a1';
    var type = document.getElementById('popGradType') ? document.getElementById('popGradType').value : 'linear';
    var angle = document.getElementById('popGradAngle') ? parseInt(document.getElementById('popGradAngle').value, 10) : 90;

    var fillUrl = (type === 'radial') ? createRadialGradient(startCol, endCol) : createLinearGradient(startCol, endCol, angle);
    selectColorFromPopover(targetMode, fillUrl);
  }

  function applyPatternFromPopover(targetMode) {
    var type = document.getElementById('popPatType') ? document.getElementById('popPatType').value : 'dots';
    var col = document.getElementById('popPatColor') ? document.getElementById('popPatColor').value : '#0284c7';
    var size = document.getElementById('popPatSize') ? parseInt(document.getElementById('popPatSize').value, 10) : 16;

    var fillUrl = createPatternFill(type, col, size);
    selectColorFromPopover(targetMode, fillUrl);
  }

  function applyImageFillFromPopover(targetMode) {
    var select = document.getElementById('popImgSymbolSelect');
    var fileInput = document.getElementById('popImgFileInput');
    var modeSelect = document.getElementById('popImgFillMode');
    var fillMode = modeSelect ? modeSelect.value : 'stretch';

    if (fileInput && fileInput.files && fileInput.files[0]) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var fillUrl = createImageFill(e.target.result, fillMode);
        selectColorFromPopover(targetMode, fillUrl);
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else if (select && select.value) {
      var symId = select.value;
      var sym = (cfg.symbolRegistry || []).find(function(s) { return s.id === symId; });
      if (sym) {
        var fillUrl = createImageFill(sym.data || sym.thumb, fillMode);
        selectColorFromPopover(targetMode, fillUrl);
      }
    }
  }

  var effectHoldTimer = null;
  var effectHoldTriggered = false;
  var effectRollbackSnapshots = null;

  function getCommonFilterList(selectedIds) {
    if (!selectedIds || selectedIds.size === 0) {
      return { commonList: [], hasDiscrepancy: false };
    }
    var objs = [];
    selectedIds.forEach(function(id) {
      var o = cfg.objectsMap.get(id);
      if (o) objs.push(o);
    });
    if (objs.length === 0) {
      return { commonList: [], hasDiscrepancy: false };
    }
    if (objs.length === 1) {
      var fl = (objs[0].attrs && Array.isArray(objs[0].attrs.filterList)) ? objs[0].attrs.filterList : [];
      return { commonList: fl, hasDiscrepancy: false };
    }

    var firstList = (objs[0].attrs && Array.isArray(objs[0].attrs.filterList)) ? objs[0].attrs.filterList : [];
    var hasDiscrepancy = false;

    for (var i = 1; i < objs.length; i++) {
      var otherList = (objs[i].attrs && Array.isArray(objs[i].attrs.filterList)) ? objs[i].attrs.filterList : [];
      if (otherList.length !== firstList.length) {
        hasDiscrepancy = true;
        break;
      }
      for (var j = 0; j < firstList.length; j++) {
        if (JSON.stringify(firstList[j]) !== JSON.stringify(otherList[j])) {
          hasDiscrepancy = true;
          break;
        }
      }
      if (hasDiscrepancy) break;
    }

    return { commonList: firstList, hasDiscrepancy: hasDiscrepancy };
  }
  window.getCommonFilterList = getCommonFilterList;

  function getSelectedObjectsForFilter() {
    var members = getAllGroupMembers(cfg.selectedIds);
    if (members.length > 0) return members;
    var allObjs = Array.from(cfg.objectsMap.values());
    return allObjs;
  }

  function applyEffectDirect(effectType) {
    if (effectHoldTriggered) {
      effectHoldTriggered = false;
      return;
    }
    var preset = cfg.defaultFilterPresets && cfg.defaultFilterPresets[effectType];
    if (!preset) return;

    var newEffect = JSON.parse(JSON.stringify(preset));
    newEffect.id = 'fx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    newEffect.enabled = true;

    var targets = getSelectedObjectsForFilter();
    targets.forEach(function(obj) {
      if (!obj.attrs) obj.attrs = {};
      if (!Array.isArray(obj.attrs.filterList)) obj.attrs.filterList = [];
      obj.attrs.filterList.push(JSON.parse(JSON.stringify(newEffect)));
      if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.updateElementAttributes) {
        window.WebpointerRenderCanvas.updateElementAttributes(obj);
      }
    });

    if (window.WebpointerRender && window.WebpointerRender.renderCanvas) {
      window.WebpointerRender.renderCanvas();
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }
  window.applyEffectDirect = applyEffectDirect;

  function startHoldEffect(e, btnEl, effectType) {
    effectHoldTriggered = false;
    clearTimeout(effectHoldTimer);
    var delay = cfg.longPressDelay || 200;
    effectHoldTimer = setTimeout(function() {
      effectHoldTriggered = true;
      openEffectParamPopover(btnEl, effectType);
    }, delay);
  }
  window.startHoldEffect = startHoldEffect;

  function endHoldEffect() {
    clearTimeout(effectHoldTimer);
  }
  window.endHoldEffect = endHoldEffect;

  function openEffectParamPopover(anchorEl, effectType, editIdx) {
    var old = document.getElementById('effectParamPopover');
    if (old) old.remove();

    var targets = getSelectedObjectsForFilter();
    effectRollbackSnapshots = new Map();
    targets.forEach(function(obj) {
      var currentList = (obj.attrs && Array.isArray(obj.attrs.filterList)) ? JSON.parse(JSON.stringify(obj.attrs.filterList)) : [];
      effectRollbackSnapshots.set(obj.id, currentList);
    });

    var preset = (cfg.defaultFilterPresets && cfg.defaultFilterPresets[effectType]) || { type: effectType, val: 5, unit: 'px', label: effectType };
    var currentItem = preset;
    if (editIdx !== undefined && targets.length > 0 && targets[0].attrs && targets[0].attrs.filterList && targets[0].attrs.filterList[editIdx]) {
      currentItem = targets[0].attrs.filterList[editIdx];
    }

    var popover = document.createElement('div');
    popover.id = 'effectParamPopover';
    popover.style.cssText = 'position:fixed; z-index:99999; padding:12px; border:1px solid #0284c7; border-radius:8px; background:#ffffff; box-shadow:0 10px 25px rgba(0,0,0,0.25); font-family:sans-serif; width:260px; display:flex; flex-direction:column; gap:8px; font-size:0.8rem;';

    if (anchorEl) {
      var rect = anchorEl.getBoundingClientRect();
      popover.style.left = Math.max(10, Math.min(window.innerWidth - 280, rect.left)) + 'px';
      popover.style.top = (rect.bottom + 6) + 'px';
    } else {
      popover.style.left = '50%';
      popover.style.top = '50%';
      popover.style.transform = 'translate(-50%, -50%)';
    }

    var titleText = (editIdx !== undefined ? '수정: ' : '추가: ') + (currentItem.label || effectType);

    var controlsHtml = '';
    if (effectType === 'drop-shadow') {
      var curDx = currentItem.dx !== undefined ? currentItem.dx : 4;
      var curDy = currentItem.dy !== undefined ? currentItem.dy : 4;
      var curBlur = currentItem.blur !== undefined ? currentItem.blur : 8;
      var curCol = currentItem.color || 'rgba(0,0,0,0.5)';

      controlsHtml =
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<span>X 오프셋:</span>' +
          '<input type="range" id="fxParamDx" min="-50" max="50" value="' + curDx + '" style="width:120px;" oninput="livePreviewEffect(\'' + effectType + '\', ' + editIdx + ')">' +
          '<span id="fxParamDxDisp" style="width:35px; text-align:right; font-weight:700;">' + curDx + 'px</span>' +
        '</div>' +
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<span>Y 오프셋:</span>' +
          '<input type="range" id="fxParamDy" min="-50" max="50" value="' + curDy + '" style="width:120px;" oninput="livePreviewEffect(\'' + effectType + '\', ' + editIdx + ')">' +
          '<span id="fxParamDyDisp" style="width:35px; text-align:right; font-weight:700;">' + curDy + 'px</span>' +
        '</div>' +
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<span>블러 반경:</span>' +
          '<input type="range" id="fxParamBlur" min="0" max="50" value="' + curBlur + '" style="width:120px;" oninput="livePreviewEffect(\'' + effectType + '\', ' + editIdx + ')">' +
          '<span id="fxParamBlurDisp" style="width:35px; text-align:right; font-weight:700;">' + curBlur + 'px</span>' +
        '</div>' +
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<span>그림자 색상:</span>' +
          '<input type="color" id="fxParamColor" value="' + (curCol.startsWith('#') ? curCol : '#000000') + '" style="width:40px; height:24px; border:none; cursor:pointer;" onchange="livePreviewEffect(\'' + effectType + '\', ' + editIdx + ')">' +
        '</div>';
    } else if (effectType === 'glow') {
      var gBlur = currentItem.blur !== undefined ? currentItem.blur : 10;
      var gCol = currentItem.color || '#38bdf8';

      controlsHtml =
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<span>발광 반경:</span>' +
          '<input type="range" id="fxParamBlur" min="1" max="60" value="' + gBlur + '" style="width:120px;" oninput="livePreviewEffect(\'' + effectType + '\', ' + editIdx + ')">' +
          '<span id="fxParamBlurDisp" style="width:35px; text-align:right; font-weight:700;">' + gBlur + 'px</span>' +
        '</div>' +
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<span>네온 색상:</span>' +
          '<input type="color" id="fxParamColor" value="' + (gCol.startsWith('#') ? gCol : '#38bdf8') + '" style="width:40px; height:24px; border:none; cursor:pointer;" onchange="livePreviewEffect(\'' + effectType + '\', ' + editIdx + ')">' +
        '</div>';
    } else {
      var minVal = 0, maxVal = 100, stepVal = 1, defVal = currentItem.val !== undefined ? currentItem.val : 100;
      var unitStr = currentItem.unit || '%';
      if (effectType === 'blur') { minVal = 0; maxVal = 40; unitStr = 'px'; }
      else if (effectType === 'brightness' || effectType === 'contrast') { minVal = 0; maxVal = 300; }
      else if (effectType === 'saturate') { minVal = 0; maxVal = 500; }
      else if (effectType === 'hue-rotate') { minVal = 0; maxVal = 360; unitStr = 'deg'; }

      controlsHtml =
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<span>수치 조절:</span>' +
          '<input type="range" id="fxParamSingle" min="' + minVal + '" max="' + maxVal + '" step="' + stepVal + '" value="' + defVal + '" style="width:120px;" oninput="livePreviewEffect(\'' + effectType + '\', ' + editIdx + ')">' +
          '<span id="fxParamSingleDisp" style="width:45px; text-align:right; font-weight:700; color:#0284c7;">' + defVal + unitStr + '</span>' +
        '</div>';
    }

    var actionBtns = '';
    if (editIdx !== undefined) {
      actionBtns =
        '<div style="display:flex; gap:4px; margin-top:4px;">' +
          '<button onclick="confirmEffectParam(\'' + effectType + '\', ' + editIdx + ')" style="flex:1; padding:6px; background:#0284c7; color:#fff; border:none; border-radius:4px; font-weight:700; cursor:pointer;">수정</button>' +
          '<button onclick="removeEffectItem(' + editIdx + '); cancelEffectParam();" style="padding:6px 10px; background:#ef4444; color:#fff; border:none; border-radius:4px; font-weight:700; cursor:pointer;">삭제</button>' +
          '<button onclick="cancelEffectParam()" style="padding:6px 10px; background:#e2e8f0; color:#334155; border:none; border-radius:4px; cursor:pointer;">취소</button>' +
        '</div>';
    } else {
      actionBtns =
        '<div style="display:flex; gap:6px; margin-top:4px;">' +
          '<button onclick="confirmEffectParam(\'' + effectType + '\')" style="flex:1; padding:6px; background:#0284c7; color:#fff; border:none; border-radius:4px; font-weight:700; cursor:pointer;">적용</button>' +
          '<button onclick="cancelEffectParam()" style="flex:1; padding:6px; background:#e2e8f0; color:#334155; border:none; border-radius:4px; cursor:pointer;">취소</button>' +
        '</div>';
    }

    popover.innerHTML =
      '<div style="font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">' + titleText + '</div>' +
      controlsHtml +
      actionBtns;

    document.body.appendChild(popover);
  }
  window.openEffectParamPopover = openEffectParamPopover;
  window.openFilterPopover = openEffectParamPopover;

  function openEffectEditPopover(itemEl, idx) {
    var targets = getSelectedObjectsForFilter();
    if (targets.length === 0 || !targets[0].attrs || !targets[0].attrs.filterList || !targets[0].attrs.filterList[idx]) return;
    var item = targets[0].attrs.filterList[idx];
    openEffectParamPopover(itemEl, item.type, idx);
  }
  window.openEffectEditPopover = openEffectEditPopover;

  function livePreviewEffect(effectType, editIdx) {
    var targets = getSelectedObjectsForFilter();
    if (targets.length === 0) return;

    var previewEffectObj = { type: effectType, enabled: true };
    var label = (cfg.defaultFilterPresets && cfg.defaultFilterPresets[effectType] && cfg.defaultFilterPresets[effectType].label) || effectType;
    previewEffectObj.label = label;

    if (effectType === 'drop-shadow') {
      var dxEl = document.getElementById('fxParamDx');
      var dyEl = document.getElementById('fxParamDy');
      var blurEl = document.getElementById('fxParamBlur');
      var colEl = document.getElementById('fxParamColor');
      var dxDisp = document.getElementById('fxParamDxDisp');
      var dyDisp = document.getElementById('fxParamDyDisp');
      var blurDisp = document.getElementById('fxParamBlurDisp');

      if (dxEl) { previewEffectObj.dx = parseInt(dxEl.value, 10); if (dxDisp) dxDisp.innerText = dxEl.value + 'px'; }
      if (dyEl) { previewEffectObj.dy = parseInt(dyEl.value, 10); if (dyDisp) dyDisp.innerText = dyEl.value + 'px'; }
      if (blurEl) { previewEffectObj.blur = parseInt(blurEl.value, 10); if (blurDisp) blurDisp.innerText = blurEl.value + 'px'; }
      if (colEl) { previewEffectObj.color = colEl.value; }
    } else if (effectType === 'glow') {
      var blurEl = document.getElementById('fxParamBlur');
      var colEl = document.getElementById('fxParamColor');
      var blurDisp = document.getElementById('fxParamBlurDisp');

      if (blurEl) { previewEffectObj.blur = parseInt(blurEl.value, 10); if (blurDisp) blurDisp.innerText = blurEl.value + 'px'; }
      if (colEl) { previewEffectObj.color = colEl.value; }
    } else {
      var sEl = document.getElementById('fxParamSingle');
      var sDisp = document.getElementById('fxParamSingleDisp');
      var preset = (cfg.defaultFilterPresets && cfg.defaultFilterPresets[effectType]) || {};
      var unit = preset.unit || '%';
      if (sEl) {
        previewEffectObj.val = parseFloat(sEl.value);
        previewEffectObj.unit = unit;
        if (sDisp) sDisp.innerText = sEl.value + unit;
      }
    }

    targets.forEach(function(obj) {
      if (!obj.attrs) obj.attrs = {};
      var baseList = effectRollbackSnapshots && effectRollbackSnapshots.get(obj.id) ? JSON.parse(JSON.stringify(effectRollbackSnapshots.get(obj.id))) : (obj.attrs.filterList || []).slice();
      if (editIdx !== undefined && editIdx >= 0 && editIdx < baseList.length) {
        baseList[editIdx] = previewEffectObj;
      } else {
        baseList.push(previewEffectObj);
      }
      obj.attrs.filterList = baseList;
      if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.updateElementAttributes) {
        window.WebpointerRenderCanvas.updateElementAttributes(obj);
      }
    });

    if (window.WebpointerRender && window.WebpointerRender.renderCanvas) {
      window.WebpointerRender.renderCanvas();
    }
  }
  window.livePreviewEffect = livePreviewEffect;
  window.livePreviewFilter = livePreviewEffect;

  function confirmEffectParam(effectType, editIdx) {
    livePreviewEffect(effectType, editIdx);
    var pop = document.getElementById('effectParamPopover');
    if (pop) pop.remove();
    effectRollbackSnapshots = null;

    if (window.WebpointerRender && window.WebpointerRender.renderCanvas) {
      window.WebpointerRender.renderCanvas();
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }
  window.confirmEffectParam = confirmEffectParam;

  function cancelEffectParam() {
    if (effectRollbackSnapshots) {
      effectRollbackSnapshots.forEach(function(origList, objId) {
        var obj = cfg.objectsMap.get(objId);
        if (obj && obj.attrs) {
          obj.attrs.filterList = origList;
          if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.updateElementAttributes) {
            window.WebpointerRenderCanvas.updateElementAttributes(obj);
          }
        }
      });
      effectRollbackSnapshots = null;
    }

    var pop = document.getElementById('effectParamPopover');
    if (pop) pop.remove();

    if (window.WebpointerRender && window.WebpointerRender.renderCanvas) {
      window.WebpointerRender.renderCanvas();
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }
  window.cancelEffectParam = cancelEffectParam;

  function toggleEffectEnabled(idx, enabled) {
    var targets = getSelectedObjectsForFilter();
    targets.forEach(function(obj) {
      if (obj.attrs && Array.isArray(obj.attrs.filterList) && obj.attrs.filterList[idx]) {
        obj.attrs.filterList[idx].enabled = enabled;
        if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.updateElementAttributes) {
          window.WebpointerRenderCanvas.updateElementAttributes(obj);
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderCanvas) {
      window.WebpointerRender.renderCanvas();
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }
  window.toggleEffectEnabled = toggleEffectEnabled;

  function reorderEffect(fromIdx, toIdx) {
    var targets = getSelectedObjectsForFilter();
    targets.forEach(function(obj) {
      if (obj.attrs && Array.isArray(obj.attrs.filterList)) {
        var list = obj.attrs.filterList;
        if (fromIdx >= 0 && fromIdx < list.length && toIdx >= 0 && toIdx < list.length) {
          var item = list.splice(fromIdx, 1)[0];
          list.splice(toIdx, 0, item);
          if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.updateElementAttributes) {
            window.WebpointerRenderCanvas.updateElementAttributes(obj);
          }
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderCanvas) {
      window.WebpointerRender.renderCanvas();
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }
  window.reorderEffect = reorderEffect;
  window.moveFilterUp = function(idx) { reorderEffect(idx, idx - 1); };
  window.moveFilterDown = function(idx) { reorderEffect(idx, idx + 1); };

  function removeEffectItem(idx) {
    var targets = getSelectedObjectsForFilter();
    targets.forEach(function(obj) {
      if (obj.attrs && Array.isArray(obj.attrs.filterList) && idx >= 0 && idx < obj.attrs.filterList.length) {
        obj.attrs.filterList.splice(idx, 1);
        if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.updateElementAttributes) {
          window.WebpointerRenderCanvas.updateElementAttributes(obj);
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderCanvas) {
      window.WebpointerRender.renderCanvas();
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }
  window.removeEffectItem = removeEffectItem;
  window.removeFilterAtIndexFromPopover = removeEffectItem;

  function clearAllFilterEffects() {
    var targets = getSelectedObjectsForFilter();
    targets.forEach(function(obj) {
      if (obj.attrs) {
        obj.attrs.filterList = [];
        obj.attrs.filter = '';
        if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.updateElementAttributes) {
          window.WebpointerRenderCanvas.updateElementAttributes(obj);
        }
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderCanvas) {
      window.WebpointerRender.renderCanvas();
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }
  window.clearAllFilterEffects = clearAllFilterEffects;
  window.clearAllFiltersFromPopover = clearAllFilterEffects;

  function updateFilterRangeConfig(type, val) {
    livePreviewEffect(type || 'blur');
  }
  window.updateFilterRangeConfig = updateFilterRangeConfig;

  function addFilterFromPopover(type) {
    applyEffectDirect(type || 'blur');
  }
  window.addFilterFromPopover = addFilterFromPopover;

  function openSymbolClipPopover(anchorBtn) {
    var popover = document.getElementById('symbolClipPopover');
    if (!popover) return;

    if (popover.style.display === 'flex' || popover.style.display === 'block') {
      popover.style.display = 'none';
      return;
    }

    if (anchorBtn) {
      var rect = anchorBtn.getBoundingClientRect();
      popover.style.position = 'fixed';
      popover.style.top = (rect.bottom + 6) + 'px';
      popover.style.left = Math.min(rect.left, window.innerWidth - 330) + 'px';
      popover.style.zIndex = '99999';
    }

    renderSymbolClipListInPopover();
    popover.style.display = 'block';
  }

  function closeSymbolClipPopover() {
    var popover = document.getElementById('symbolClipPopover');
    if (popover) popover.style.display = 'none';
  }

  function renderSymbolClipListInPopover() {
    var grid = document.getElementById('popSymbolClipGrid');
    if (!grid) return;

    var symbols = cfg.symbolRegistry || [];
    if (symbols.length === 0) {
      symbols = [
        { id: 'sym_def_star', name: '별 (Star)', data: 'M 25 2 L 32 17 L 48 19 L 36 31 L 40 47 L 25 39 L 10 47 L 14 31 L 2 19 L 18 17 Z' },
        { id: 'sym_def_heart', name: '하트 (Heart)', data: 'M 25 10 C 25 3, 10 3, 10 16 C 10 28, 25 38, 25 44 C 25 38, 40 28, 40 16 C 40 3, 25 3, 25 10 Z' },
        { id: 'sym_def_circle', name: '원 (Circle)', data: 'M 25 5 A 20 20 0 1 0 25 45 A 20 20 0 1 0 25 5 Z' },
        { id: 'sym_def_hexagon', name: '육각형 (Hexagon)', data: 'M 25 2 L 46 14 L 46 36 L 25 48 L 4 36 L 4 14 Z' }
      ];
    }

    var html = symbols.map(function(sym) {
      var d = sym.data || '';
      var svgPreview = '<svg width="36" height="36" viewBox="0 0 50 50"><path d="' + d + '" fill="#0284c7" stroke="#0369a1" stroke-width="2"/></svg>';
      return '<div onclick="WebpointerHandlers.applySymbolClip(\'' + sym.id + '\')" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:6px; background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; cursor:pointer; text-align:center; transition:all 0.15s ease;" onmouseover="this.style.borderColor=\'#0284c7\';this.style.background=\'#f0f9ff\'" onmouseout="this.style.borderColor=\'#e2e8f0\';this.style.background=\'#ffffff\'" title="' + sym.name + '">' +
               svgPreview +
               '<span style="font-size:0.7rem; color:#334155; max-width:70px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:4px;">' + sym.name + '</span>' +
             '</div>';
    }).join('');

    grid.innerHTML = html;
  }

  function applySymbolClip(symbolId) {
    var symbols = cfg.symbolRegistry || [];
    var defaultSymbols = [
      { id: 'sym_def_star', name: '별 (Star)', data: 'M 25 2 L 32 17 L 48 19 L 36 31 L 40 47 L 25 39 L 10 47 L 14 31 L 2 19 L 18 17 Z' },
      { id: 'sym_def_heart', name: '하트 (Heart)', data: 'M 25 10 C 25 3, 10 3, 10 16 C 10 28, 25 38, 25 44 C 25 38, 40 28, 40 16 C 40 3, 25 3, 25 10 Z' },
      { id: 'sym_def_circle', name: '원 (Circle)', data: 'M 25 5 A 20 20 0 1 0 25 45 A 20 20 0 1 0 25 5 Z' },
      { id: 'sym_def_hexagon', name: '육각형 (Hexagon)', data: 'M 25 2 L 46 14 L 46 36 L 25 48 L 4 36 L 4 14 Z' }
    ];

    var sym = symbols.find(function(s) { return s.id === symbolId; }) || defaultSymbols.find(function(s) { return s.id === symbolId; }) || defaultSymbols[0];
    if (!sym) return;

    var targets = getSelectedObjectsForFilter();
    var mainSvg = document.getElementById('mainSvg');
    if (!mainSvg) return;
    var defs = mainSvg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.setAttribute('id', 'svgDefs');
      mainSvg.insertBefore(defs, mainSvg.firstChild);
    }

    targets.forEach(function(obj) {
      if (!obj.attrs) obj.attrs = {};
      var clipId = 'sym_clip_' + obj.id;
      var clipEl = document.getElementById(clipId);
      if (!clipEl) {
        clipEl = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipEl.setAttribute('id', clipId);
        defs.appendChild(clipEl);
      }

      var ox = obj.attrs.x || obj.attrs.cx || 0;
      var oy = obj.attrs.y || obj.attrs.cy || 0;
      var ow = obj.attrs.width || (obj.attrs.r ? obj.attrs.r * 2 : 100);
      var oh = obj.attrs.height || (obj.attrs.r ? obj.attrs.r * 2 : 100);

      var scaleX = ow / 50;
      var scaleY = oh / 50;
      var transformStr = 'translate(' + ox + ' ' + oy + ') scale(' + scaleX + ' ' + scaleY + ')';

      clipEl.innerHTML = '<path d="' + (sym.data || '') + '" transform="' + transformStr + '"/>';

      obj.attrs.symbolClip = symbolId;
      obj.attrs.clipPath = 'url(#' + clipId + ')';

      if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.updateElementAttributes) {
        window.WebpointerRenderCanvas.updateElementAttributes(obj);
      }
      if (window.WebpointerRender && window.WebpointerRender.renderCanvas) {
        window.WebpointerRender.renderCanvas();
      }
    });

    closeSymbolClipPopover();
  }

  function removeSymbolClipFromSelected() {
    var targets = getSelectedObjectsForFilter();
    targets.forEach(function(obj) {
      if (obj.attrs) {
        delete obj.attrs.symbolClip;
        delete obj.attrs.clipPath;
        var clipId = 'sym_clip_' + obj.id;
        var clipEl = document.getElementById(clipId);
        if (clipEl && clipEl.parentNode) clipEl.parentNode.removeChild(clipEl);

        if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.updateElementAttributes) {
          window.WebpointerRenderCanvas.updateElementAttributes(obj);
        }
        if (window.WebpointerRender && window.WebpointerRender.renderCanvas) {
          window.WebpointerRender.renderCanvas();
        }
      }
    });
    closeSymbolClipPopover();
  }

  function openFilterPopover(btnEl, type, idx) {
    return openEffectParamPopover(btnEl, type, idx);
  }
  window.openFilterPopover = openFilterPopover;
  window.updateFilterRangeConfig = updateFilterRangeConfig;
  window.addFilterFromPopover = addFilterFromPopover;
  window.removeFilterAtIndexFromPopover = removeEffectItem;
  window.clearAllFiltersFromPopover = clearAllFilterEffects;
  window.openSymbolClipPopover = openSymbolClipPopover;
  window.closeSymbolClipPopover = closeSymbolClipPopover;
  window.applySymbolClip = applySymbolClip;
  window.removeSymbolClipFromSelected = removeSymbolClipFromSelected;
  window.openSymbolManagerModal = openSymbolManagerModal;
  window.closeSymbolManagerModal = closeSymbolManagerModal;
  window.openImageSymbolPickerModal = openImageSymbolPickerModal;
  window.closeImageSymbolPickerModal = closeImageSymbolPickerModal;
  window.insertSymbolToCanvasCenter = insertSymbolToCanvasCenter;
  window.openFileSlotsModal = openFileSlotsModal;
  window.closeFileSlotsModal = closeFileSlotsModal;
  window.saveToFileSlot = saveToFileSlot;
  window.loadFromFileSlot = loadFromFileSlot;
  window.renderFileSlotsList = renderFileSlotsList;
  window.openSlotSelectionModal = openSlotSelectionModal;
  window.closeSlotSelectionModal = closeSlotSelectionModal;
  window.saveAndProceedFileOpen = saveAndProceedFileOpen;
  window.discardAndProceedFileOpen = discardAndProceedFileOpen;
  window.importSymbolFromFile = importSymbolFromFile;
  window.deleteSymbol = deleteSymbol;
  window.renderSymbolList = renderSymbolList;
  window.switchPopoverTab = switchPopoverTab;
  window.applyGradientFromPopover = applyGradientFromPopover;
  window.applyPatternFromPopover = applyPatternFromPopover;
  window.applyImageFillFromPopover = applyImageFillFromPopover;
  window.createLinearGradient = createLinearGradient;
  window.createRadialGradient = createRadialGradient;
  window.createPatternFill = createPatternFill;
  window.createImageFill = createImageFill;
  window.calculateSmartSnaps = calculateSmartSnaps;
  window.alignSelectedObjects = alignSelectedObjects;
  window.alignObjects = alignSelectedObjects;
  window.distributeObjects = distributeObjects;

  window.WebpointerHandlers = {
    setTool: setTool,
    restoreSnapshot: restoreSnapshot,
    saveState: pushHistoryState,
    undo: undo,
    redo: redo,
    openFileSlotsModal: openFileSlotsModal,
    closeFileSlotsModal: closeFileSlotsModal,
    saveToFileSlot: saveToFileSlot,
    loadFromFileSlot: loadFromFileSlot,
    renderFileSlotsList: renderFileSlotsList,
    openSlotSelectionModal: openSlotSelectionModal,
    closeSlotSelectionModal: closeSlotSelectionModal,
    saveAndProceedFileOpen: saveAndProceedFileOpen,
    discardAndProceedFileOpen: discardAndProceedFileOpen,
    toggleColorPalettePopover: toggleColorPalettePopover,
    selectColorFromPopover: selectColorFromPopover,
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
    openPaletteModal: openPaletteModal,
    closePaletteModal: closePaletteModal,
    openShortcutModal: openShortcutModal,
    closeShortcutModal: closeShortcutModal,
    openDetailedSettingsModal: openDetailedSettingsModal,
    closeDetailedSettingsModal: closeDetailedSettingsModal,
    applyDetailedSettings: applyDetailedSettings,
    importPaletteFromText: importPaletteFromText,
    applyPaletteColor: applyPaletteColor,
    setActiveColorTarget: setActiveColorTarget,
    setActiveTextColorTarget: setActiveTextColorTarget,
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
    endHoldStyle: endHoldStyle,
    toggleCropMode: toggleCropMode,
    openFilterPopover: openFilterPopover,
    addFilterFromPopover: addFilterFromPopover,
    openSymbolClipPopover: openSymbolClipPopover,
    closeSymbolClipPopover: closeSymbolClipPopover,
    applySymbolClip: applySymbolClip,
    removeSymbolClipFromSelected: removeSymbolClipFromSelected,
    openSymbolManagerModal: openSymbolManagerModal,
    closeSymbolManagerModal: closeSymbolManagerModal,
    importSymbolFromFile: importSymbolFromFile,
    deleteSymbol: deleteSymbol,
    renderSymbolList: renderSymbolList,
    createLinearGradient: createLinearGradient,
    createRadialGradient: createRadialGradient,
    createPatternFill: createPatternFill,
    createImageFill: createImageFill,
    calculateSmartSnaps: calculateSmartSnaps,
    alignSelectedObjects: alignSelectedObjects,
    alignObjects: alignSelectedObjects,
    distributeObjects: distributeObjects
  };

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
      else if (type === 'center') setObjAttr(obj, 'x', centerX - w / 2);
      else if (type === 'right') setObjAttr(obj, 'x', maxX - w);
      else if (type === 'top') setObjAttr(obj, 'y', minY);
      else if (type === 'middle') setObjAttr(obj, 'y', centerY - h / 2);
      else if (type === 'bottom') setObjAttr(obj, 'y', maxY - h);

      if (window.WebpointerRender) window.WebpointerRender.updateElementAttributes(obj);
    });

    if (window.WebpointerRender) window.WebpointerRender.renderUI();
    if (window.pushSnapshot) window.pushSnapshot();
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
        if (window.WebpointerRender) window.WebpointerRender.updateElementAttributes(selected[i]);
      }
    } else if (axis === 'vertical') {
      selected.sort(function(a, b) { return getObjAttr(a, 'y') - getObjAttr(b, 'y'); });
      var minY = getObjAttr(selected[0], 'y');
      var maxY = getObjAttr(selected[selected.length - 1], 'y');
      var step = (maxY - minY) / (selected.length - 1);
      for (var i = 1; i < selected.length - 1; i++) {
        setObjAttr(selected[i], 'y', minY + step * i);
        if (window.WebpointerRender) window.WebpointerRender.updateElementAttributes(selected[i]);
      }
    }

    if (window.WebpointerRender) window.WebpointerRender.renderUI();
    if (window.pushSnapshot) window.pushSnapshot();
  }

  function calculateSmartSnaps(dragObj, newX, newY) {
    var threshold = cfg.snappingThreshold !== undefined ? cfg.snappingThreshold : 12;
    var resultX = newX;
    var resultY = newY;
    var guides = [];
    if (!cfg.objectsMap || cfg.snappingEnabled === false) return { x: resultX, y: resultY, lines: guides, guides: guides };

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

      // X Snapping
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

      // Y Snapping
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

  if (!cfg.markerPresets) {
    cfg.markerPresets = [];
  }

  function getAvailableMarkerTypes() {
    var base = ['none', 'arrow', 'circle', 'diamond'];
    if (cfg.markerPresets && cfg.markerPresets.length > 0) {
      return base.concat(cfg.markerPresets);
    }
    return base;
  }

  function cycleStartMarker() {
    var types = getAvailableMarkerTypes();
    var cur = cfg.startMarker || 'none';
    var idx = types.indexOf(cur);
    var nextIdx = (idx === -1 || idx >= types.length - 1) ? 0 : idx + 1;
    setStartMarker(types[nextIdx]);
  }
  window.cycleStartMarker = cycleStartMarker;

  function cycleEndMarker() {
    var types = getAvailableMarkerTypes();
    var cur = cfg.endMarker || 'none';
    var idx = types.indexOf(cur);
    var nextIdx = (idx === -1 || idx >= types.length - 1) ? 0 : idx + 1;
    setEndMarker(types[nextIdx]);
  }
  window.cycleEndMarker = cycleEndMarker;

  function openMarkerManagerModal() {
    var modal = document.getElementById('markerManagerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'markerManagerModal';
      modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.6); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(4px);';
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    renderMarkerManagerContent();
  }
  window.openMarkerManagerModal = openMarkerManagerModal;

  function closeMarkerManagerModal() {
    var modal = document.getElementById('markerManagerModal');
    if (modal) modal.style.display = 'none';
  }
  window.closeMarkerManagerModal = closeMarkerManagerModal;

  function addCustomMarkerPreset() {
    if (!cfg.markerPresets) cfg.markerPresets = [];
    var newIdx = cfg.markerPresets.length + 1;
    cfg.markerPresets.push('user' + newIdx);
    renderMarkerManagerContent();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }
  window.addCustomMarkerPreset = addCustomMarkerPreset;

  function removeCustomMarkerPreset(name) {
    if (!cfg.markerPresets) return;
    cfg.markerPresets = cfg.markerPresets.filter(function(m) { return m !== name; });
    renderMarkerManagerContent();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }
  window.removeCustomMarkerPreset = removeCustomMarkerPreset;

  function renderMarkerManagerContent() {
    var modal = document.getElementById('markerManagerModal');
    if (!modal) return;
    var customItems = (cfg.markerPresets || []).map(function(name, i) {
      var numLabel = (i + 1);
      return '<div style="display:flex; align-items:center; justify-content:space-between; background:#f8fafc; padding:8px 12px; border-radius:6px; border:1px solid #e2e8f0;">' +
               '<div style="display:flex; align-items:center; gap:8px;">' +
                 '<div style="width:28px; height:28px; background:#0284c7; color:#fff; font-weight:800; font-size:0.85rem; border-radius:4px; display:flex; align-items:center; justify-content:center;">' + numLabel + '</div>' +
                 '<span style="font-weight:600; font-size:0.85rem; color:#334155;">사용자 프리셋 ' + numLabel + ' (' + name + ')</span>' +
               '</div>' +
               '<button onclick="removeCustomMarkerPreset(\'' + name + '\')" style="background:#fee2e2; color:#ef4444; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem; font-weight:700;">삭제</button>' +
             '</div>';
    }).join('');

    modal.innerHTML =
      '<div style="background:#ffffff; border-radius:12px; width:440px; max-width:90vw; padding:20px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); border:1px solid #e2e8f0;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
          '<h3 style="margin:0; font-size:1.1rem; color:#0f172a;">📍 마커 프리셋 관리자</h3>' +
          '<button onclick="closeMarkerManagerModal()" style="background:none; border:none; font-size:1.2rem; cursor:pointer; color:#64748b;">✕</button>' +
        '</div>' +
        '<p style="font-size:0.8rem; color:#64748b; margin-bottom:12px;">기본 프리셋(화살표, 원, 다이아몬드) 및 사용자 정의 프리셋(1, 2, 3...)을 추가하면 그림서식 선 끝 토글 가짓수가 늘어납니다.</p>' +
        '<div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px; max-height:220px; overflow-y:auto;">' +
          '<div style="display:flex; align-items:center; gap:8px; background:#f0f9ff; padding:8px 12px; border-radius:6px; border:1px solid #bae6fd;">' +
            '<span style="font-weight:700; font-size:0.85rem; color:#0369a1;">기본 마커</span>' +
            '<span style="font-size:0.8rem; color:#0284c7;">▶ 화살표 / ● 원 / ◆ 다이아몬드</span>' +
          '</div>' +
          customItems +
        '</div>' +
        '<div style="display:flex; justify-content:space-between;">' +
          '<button onclick="addCustomMarkerPreset()" style="background:#0284c7; color:#fff; border:none; padding:8px 14px; border-radius:6px; font-weight:700; font-size:0.85rem; cursor:pointer;">+ 새 마커 프리셋 추가 (1, 2, 3...)</button>' +
          '<button onclick="closeMarkerManagerModal()" style="background:#e2e8f0; color:#334155; border:none; padding:8px 14px; border-radius:6px; font-weight:700; font-size:0.85rem; cursor:pointer;">닫기</button>' +
        '</div>' +
      '</div>';
  }

  function openGradientManagerModal() {
    var modal = document.getElementById('gradientManagerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'gradientManagerModal';
      modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.6); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(4px);';
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    renderGradientManagerContent();
  }
  window.openGradientManagerModal = openGradientManagerModal;

  function closeGradientManagerModal() {
    var modal = document.getElementById('gradientManagerModal');
    if (modal) modal.style.display = 'none';
  }
  window.closeGradientManagerModal = closeGradientManagerModal;

  function applyGradientPreset(presetIdx) {
    var expr = '';
    if (presetIdx === 1) {
      expr = 'linear-gradient(90deg, #f97316, #ef4444, #8b5cf6)';
    } else if (presetIdx === 2) {
      expr = 'radial-gradient(circle, #06b6d4, #3b82f6, #1e3a8a)';
    } else if (presetIdx === 3) {
      expr = 'linear-gradient(45deg, #10b981, #3b82f6, #6366f1)';
    }
    cfg.fillColor = expr;
    var targets = getSelectedObjectsForFilter();
    targets.forEach(function(obj) {
      if (obj.attrs) obj.attrs.fill = expr;
      if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.updateElementAttributes) {
        window.WebpointerRenderCanvas.updateElementAttributes(obj);
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderCanvas) {
      window.WebpointerRender.renderCanvas();
    }
    closeGradientManagerModal();
  }
  window.applyGradientPreset = applyGradientPreset;

  function renderGradientManagerContent() {
    var modal = document.getElementById('gradientManagerModal');
    if (!modal) return;

    modal.innerHTML =
      '<div style="background:#ffffff; border-radius:12px; width:440px; max-width:90vw; padding:20px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); border:1px solid #e2e8f0;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
          '<h3 style="margin:0; font-size:1.1rem; color:#0f172a;">🌈 그라데이션 프리셋 관리자</h3>' +
          '<button onclick="closeGradientManagerModal()" style="background:none; border:none; font-size:1.2rem; cursor:pointer; color:#64748b;">✕</button>' +
        '</div>' +
        '<p style="font-size:0.8rem; color:#64748b; margin-bottom:12px;">지원하는 기본 프리셋 3가지 중 하나를 선택하면 현재 선택된 개체에 즉시 적용됩니다.</p>' +
        '<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:16px;">' +
          '<div onclick="applyGradientPreset(1)" style="cursor:pointer; border:2px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center; transition:transform 0.15s;" onmouseover="this.style.borderColor=\'#0284c7\'" onmouseout="this.style.borderColor=\'#e2e8f0\'">' +
            '<div style="height:50px; border-radius:6px; background:linear-gradient(90deg, #f97316, #ef4444, #8b5cf6); margin-bottom:6px;"></div>' +
            '<span style="font-size:0.75rem; font-weight:700; color:#334155;">1. 일몰 선형</span>' +
          '</div>' +
          '<div onclick="applyGradientPreset(2)" style="cursor:pointer; border:2px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center; transition:transform 0.15s;" onmouseover="this.style.borderColor=\'#0284c7\'" onmouseout="this.style.borderColor=\'#e2e8f0\'">' +
            '<div style="height:50px; border-radius:6px; background:radial-gradient(circle, #06b6d4, #3b82f6, #1e3a8a); margin-bottom:6px;"></div>' +
            '<span style="font-size:0.75rem; font-weight:700; color:#334155;">2. 해양 방사형</span>' +
          '</div>' +
          '<div onclick="applyGradientPreset(3)" style="cursor:pointer; border:2px solid #e2e8f0; border-radius:8px; padding:10px; text-align:center; transition:transform 0.15s;" onmouseover="this.style.borderColor=\'#0284c7\'" onmouseout="this.style.borderColor=\'#e2e8f0\'">' +
            '<div style="height:50px; border-radius:6px; background:linear-gradient(45deg, #10b981, #3b82f6, #6366f1); margin-bottom:6px;"></div>' +
            '<span style="font-size:0.75rem; font-weight:700; color:#334155;">3. 에메랄드 일출</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex; justify-content:flex-end;">' +
          '<button onclick="closeGradientManagerModal()" style="background:#e2e8f0; color:#334155; border:none; padding:8px 14px; border-radius:6px; font-weight:700; font-size:0.85rem; cursor:pointer;">닫기</button>' +
        '</div>' +
      '</div>';
  }

  function setAnimStep(step) {
    state.animStep = step;
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
    if (step === 2) {
      setTimeout(function() {
        if (window.updateAnimDefaultValues) window.updateAnimDefaultValues();
      }, 0);
    }
  }
  window.setAnimStep = setAnimStep;

  function updateAnimDefaultValues(attrType) {
    var select = document.getElementById('animAttrType');
    var type = attrType || (select ? select.value : 'transform:rotate');
    var fromInput = document.getElementById('animFrom');
    var toInput = document.getElementById('animTo');
    var durInput = document.getElementById('animDur');

    var defaults = {
      'fill': { from: '#041e49', to: '#ef4444', dur: '2s' },
      'stroke': { from: '#041e49', to: '#3b82f6', dur: '2s' },
      'stroke-width': { from: '1', to: '5', dur: '1.5s' },
      'opacity': { from: '0', to: '1', dur: '1.5s' },
      'transform:translate': { from: '0 0', to: '50 0', dur: '2s' },
      'transform:scale': { from: '1', to: '1.5', dur: '1.5s' },
      'transform:rotate': { from: '0', to: '360', dur: '2s' },
      'd': { from: '', to: '', dur: '2s' }
    };

    var d = defaults[type] || { from: '0', to: '100', dur: '2s' };
    if (fromInput) fromInput.value = d.from;
    if (toInput) toInput.value = d.to;
    if (durInput) durInput.value = d.dur;
  }
  window.updateAnimDefaultValues = updateAnimDefaultValues;
  function playSelectedAnimation() {
    var targets = getSelectedObjectsForFilter();
    if (targets.length === 0) {
      if (window.playAnimation) window.playAnimation('rotate');
      return;
    }
    targets.forEach(function(obj) {
      if (!obj.el) obj.el = document.getElementById(obj.id);
      if (obj.el) {
        var anims = obj.el.querySelectorAll('animate, animateTransform, animateMotion');
        anims.forEach(function(anim) {
          try {
            if (anim.beginElement) anim.beginElement();
          } catch(e) {}
        });
      }
    });
  }
  window.playSelectedAnimation = playSelectedAnimation;

  function cycleStrokeCap() {
    var cur = cfg.strokeCap || 'butt';
    var next = 'butt';
    if (cur === 'butt') next = 'round';
    else if (cur === 'round') next = 'square';
    else next = 'butt';
    setStrokeCap(next);
  }
  window.cycleStrokeCap = cycleStrokeCap;
  function cycleStrokeJoin() {
    var cur = cfg.strokeJoin || 'miter';
    var next = 'miter';
    if (cur === 'miter') next = 'round';
    else if (cur === 'round') next = 'bevel';
    else next = 'miter';
    setStrokeJoin(next);
  }
  window.cycleStrokeJoin = cycleStrokeJoin;

  function playAnimation(type) {
    var targets = getSelectedObjectsForFilter();
    targets.forEach(function(obj) {
      if (!obj.el) {
        obj.el = document.getElementById(obj.id);
      }
      if (!obj.el) return;
      var el = obj.el;
      var anims = el.querySelectorAll('animate, animateTransform, animateMotion');
      anims.forEach(function(a) { a.remove(); });

      if (type === 'draw') {
        var len = 1000;
        try { if (el.getTotalLength) len = Math.ceil(el.getTotalLength()); } catch(e){}
        el.setAttribute('stroke-dasharray', len);
        var anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        anim.setAttribute('attributeName', 'stroke-dashoffset');
        anim.setAttribute('from', len);
        anim.setAttribute('to', 0);
        anim.setAttribute('dur', '2s');
        anim.setAttribute('repeatCount', 'indefinite');
        el.appendChild(anim);
      } else if (type === 'fade') {
        var anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        anim.setAttribute('attributeName', 'opacity');
        anim.setAttribute('values', '0;1;0');
        anim.setAttribute('dur', '2s');
        anim.setAttribute('repeatCount', 'indefinite');
        el.appendChild(anim);
      } else if (type === 'rotate') {
        var anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        anim.setAttribute('attributeName', 'transform');
        anim.setAttribute('type', 'rotate');
        anim.setAttribute('from', '0 100 100');
        anim.setAttribute('to', '360 100 100');
        anim.setAttribute('dur', '3s');
        anim.setAttribute('repeatCount', 'indefinite');
        el.appendChild(anim);
      } else if (type === 'pulse') {
        var anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        anim.setAttribute('attributeName', 'transform');
        anim.setAttribute('type', 'scale');
        anim.setAttribute('values', '1;1.2;1');
        anim.setAttribute('dur', '1.5s');
        anim.setAttribute('repeatCount', 'indefinite');
        el.appendChild(anim);
      } else if (type === 'bounce') {
        var anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        anim.setAttribute('attributeName', 'transform');
        anim.setAttribute('type', 'translate');
        anim.setAttribute('values', '0 0; 0 -20; 0 0');
        anim.setAttribute('dur', '1s');
        anim.setAttribute('repeatCount', 'indefinite');
        el.appendChild(anim);
      } else if (type === 'color') {
        var anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        anim.setAttribute('attributeName', 'stroke');
        anim.setAttribute('values', '#041e49;#ef4444;#0284c7;#041e49');
        anim.setAttribute('dur', '3s');
        anim.setAttribute('repeatCount', 'indefinite');
        el.appendChild(anim);
      } else if (type === 'dash') {
        el.setAttribute('stroke-dasharray', '10,10');
        var anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        anim.setAttribute('attributeName', 'stroke-dashoffset');
        anim.setAttribute('from', '0');
        anim.setAttribute('to', '40');
        anim.setAttribute('dur', '1s');
        anim.setAttribute('repeatCount', 'indefinite');
        el.appendChild(anim);
      } else if (type === 'zoom') {
        var anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        anim.setAttribute('attributeName', 'transform');
        anim.setAttribute('type', 'scale');
        anim.setAttribute('from', '0.2');
        anim.setAttribute('to', '1');
        anim.setAttribute('dur', '1s');
        anim.setAttribute('fill', 'freeze');
        el.appendChild(anim);
      } else if (type === 'shake') {
        var anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        anim.setAttribute('attributeName', 'transform');
        anim.setAttribute('type', 'translate');
        anim.setAttribute('values', '0 0; -10 0; 10 0; -10 0; 0 0');
        anim.setAttribute('dur', '0.5s');
        anim.setAttribute('repeatCount', 'indefinite');
        el.appendChild(anim);
      } else if (type === 'glow') {
        var anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        anim.setAttribute('attributeName', 'opacity');
        anim.setAttribute('values', '0.4;1;0.4');
        anim.setAttribute('dur', '1s');
        anim.setAttribute('repeatCount', 'indefinite');
        el.appendChild(anim);
      }
    });
  }
  window.playAnimation = playAnimation;

  function removeAllAnimationsFromSelected() {
    var targets = getSelectedObjectsForFilter();
    if (!targets || targets.length === 0) return;
    targets.forEach(function(obj) {
      if (!obj.el) obj.el = document.getElementById(obj.id);
      if (obj.el) {
        var anims = obj.el.querySelectorAll('animate, animateTransform, animateMotion');
        anims.forEach(function(a) { a.remove(); });
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }
  window.removeAllAnimationsFromSelected = removeAllAnimationsFromSelected;

  function addCustomSmilAnimation() {
    var targets = getSelectedObjectsForFilter();
    if (!targets || targets.length === 0) return;

    var attrType = (document.getElementById('animAttrType') || {}).value || 'fill';
    var fromVal = (document.getElementById('animFrom') || {}).value || '';
    var toVal = (document.getElementById('animTo') || {}).value || '';
    var valuesVal = (document.getElementById('animValues') || {}).value || '';
    var beginVal = (document.getElementById('animBegin') || {}).value || '0s';
    var durVal = (document.getElementById('animDur') || {}).value || '2s';
    var repeatVal = (document.getElementById('animRepeat') || {}).value || 'indefinite';
    var maxVal = (document.getElementById('animMax') || {}).value || '';
    var restartVal = (document.getElementById('animRestart') || {}).value || 'always';
    var endVal = (document.getElementById('animEnd') || {}).value || '';

    targets.forEach(function(obj) {
      if (!obj.el) obj.el = document.getElementById(obj.id);
      if (!obj.el) return;
      var el = obj.el;

      var tag = 'animate';
      var isTransform = attrType.indexOf('transform:') === 0;
      if (isTransform) {
        tag = 'animateTransform';
      }

      var anim = document.createElementNS('http://www.w3.org/2000/svg', tag);
      var animId = 'anim_' + (obj.id || 'obj') + '_' + Date.now().toString(36);
      anim.setAttribute('id', animId);

      if (isTransform) {
        anim.setAttribute('attributeName', 'transform');
        anim.setAttribute('type', attrType.split(':')[1]);
      } else {
        anim.setAttribute('attributeName', attrType);
      }

      if (valuesVal && valuesVal.trim() !== '') {
        anim.setAttribute('values', valuesVal.trim());
      } else {
        if (fromVal && fromVal.trim() !== '') anim.setAttribute('from', fromVal.trim());
        if (toVal && toVal.trim() !== '') anim.setAttribute('to', toVal.trim());
      }

      if (beginVal) anim.setAttribute('begin', beginVal);
      if (durVal) anim.setAttribute('dur', durVal);
      if (repeatVal) anim.setAttribute('repeatCount', repeatVal);
      if (maxVal && maxVal.trim() !== '') anim.setAttribute('max', maxVal.trim());
      if (restartVal) anim.setAttribute('restart', restartVal);
      if (endVal && endVal.trim() !== '') anim.setAttribute('end', endVal.trim());

      el.appendChild(anim);
    });

    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }
  window.addCustomSmilAnimation = addCustomSmilAnimation;

  function stopAllAnimations() {
    var mainSvg = document.getElementById('mainSvg');
    if (!mainSvg) return;
    var anims = mainSvg.querySelectorAll('animate, animateTransform, animateMotion');
    anims.forEach(function(a) { a.remove(); });
  }
  window.stopAllAnimations = stopAllAnimations;

  /* ==========================================================================
     뫼비우스 경로 관리자 (Path Data Manager)
     ========================================================================== */
  function getCustomPathPresets() {
    var raw = localStorage.getItem('webpointer_custom_paths');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    var defaultPresets = [
      {
        id: 'mobius_strip',
        name: '뫼비우스의 띠 (Mobius Strip)',
        d: 'M 12 12 C 9.5 8.5 7 7 4.5 7 C 2 7 0.5 8.5 0.5 12 C 0.5 15.5 2 17 4.5 17 C 7 17 9.5 15.5 12 12 Z M 12 12 C 14.5 8.5 17 7 19.5 7 C 22 7 23.5 8.5 23.5 12 C 23.5 15.5 22 17 19.5 17 C 17 17 14.5 15.5 12 12 Z',
        createdAt: Date.now()
      },
      {
        id: 'star_preset',
        name: '5각 별 (5-Point Star)',
        d: 'M 50 5 L 63 38 L 98 38 L 70 59 L 81 92 L 50 72 L 19 92 L 30 59 L 2 38 L 37 38 Z',
        createdAt: Date.now() + 1
      },
      {
        id: 'heart_preset',
        name: '하트 (Heart)',
        d: 'M 12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 Z',
        createdAt: Date.now() + 2
      }
    ];
    localStorage.setItem('webpointer_custom_paths', JSON.stringify(defaultPresets));
    return defaultPresets;
  }

  function saveCustomPathPresets(list) {
    localStorage.setItem('webpointer_custom_paths', JSON.stringify(list));
  }

  function validateAndExtractSvgPath(inputStr) {
    if (!inputStr || typeof inputStr !== 'string') {
      return { isValid: false, d: '', message: '입력된 내용이 없습니다.' };
    }

    var str = inputStr.trim();
    if (str === '') {
      return { isValid: false, d: '', message: '입력된 내용이 없습니다.' };
    }

    var dMatch = str.match(/\bd=["']([^"']+)["']/i);
    if (dMatch && dMatch[1]) {
      str = dMatch[1].trim();
    } else if (str.indexOf('<path') !== -1) {
      str = str.replace(/<[^>]+>/g, '').trim();
    }

    var pathRegex = /^[\s,]*([MmLlHhVvCcSsQqTtAaZz][\s,.\-+0-9]*)+$/;
    var isPathSyntax = pathRegex.test(str);
    var hasNumbers = /[0-9]/.test(str);

    if (isPathSyntax && hasNumbers) {
      return {
        isValid: true,
        d: str,
        message: '✅ 유효한 SVG Path 데이터입니다.'
      };
    } else {
      return {
        isValid: false,
        d: '',
        message: '⚠️ 유효한 SVG Path 구문이 아닙니다 (M, L, C 등 경로 명령어 및 숫자 조합 필요).'
      };
    }
  }
  window.validateAndExtractSvgPath = validateAndExtractSvgPath;

  function openPathManagerModal() {
    var modal = document.getElementById('pathManagerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'pathManagerModal';
      modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.65); display:flex; align-items:center; justify-content:center; z-index:99999; backdrop-filter:blur(4px);';
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    renderPathManagerContent();
  }
  window.openPathManagerModal = openPathManagerModal;

  function closePathManagerModal() {
    var modal = document.getElementById('pathManagerModal');
    if (modal) modal.style.display = 'none';
  }
  window.closePathManagerModal = closePathManagerModal;

  function onPathInputPaste(value) {
    var statusEl = document.getElementById('pathValidationStatus');
    var previewSvg = document.getElementById('pathPreviewContainer');
    var res = validateAndExtractSvgPath(value);

    if (statusEl) {
      statusEl.innerHTML = res.message;
      statusEl.style.color = res.isValid ? '#10b981' : '#ef4444';
    }

    if (previewSvg) {
      if (res.isValid && res.d) {
        previewSvg.innerHTML = '<svg viewBox="0 0 100 100" style="width:100%; height:100%; overflow:visible;"><path d="' + res.d + '" fill="none" stroke="#ec4899" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      } else {
        previewSvg.innerHTML = '<div style="color:#94a3b8; font-size:0.8rem; display:flex; align-items:center; justify-content:center; height:100%;">미리보기 없음</div>';
      }
    }
  }
  window.onPathInputPaste = onPathInputPaste;

  function saveCurrentPathData() {
    var inputEl = document.getElementById('pathDataInput');
    var nameEl = document.getElementById('pathNameInput');
    if (!inputEl) return;

    var val = inputEl.value;
    var res = validateAndExtractSvgPath(val);
    if (!res.isValid || !res.d) {
      alert('유효한 SVG Path 데이터를 입력하세요.\n예시: <path d="M 10 10 L 90 90" /> 또는 M10 10L90 90');
      return;
    }

    var presets = getCustomPathPresets();
    var customName = (nameEl && nameEl.value.trim()) ? nameEl.value.trim() : ('사용자 경로 #' + (presets.length + 1));
    var newPreset = {
      id: 'path_' + Date.now(),
      name: customName,
      d: res.d,
      createdAt: Date.now()
    };

    presets.unshift(newPreset);
    saveCustomPathPresets(presets);
    renderPathManagerContent();
  }
  window.saveCurrentPathData = saveCurrentPathData;

  function renameCustomPathData(id) {
    var presets = getCustomPathPresets();
    var target = presets.find(function(p) { return p.id === id; });
    if (!target) return;

    var newName = prompt('변경할 경로의 이름을 입력하세요:', target.name);
    if (newName && newName.trim()) {
      target.name = newName.trim();
      saveCustomPathPresets(presets);
      renderPathManagerContent();
    }
  }
  window.renameCustomPathData = renameCustomPathData;

  function deleteCustomPathData(id) {
    var presets = getCustomPathPresets();
    var filtered = presets.filter(function(p) { return p.id !== id; });
    saveCustomPathPresets(filtered);
    renderPathManagerContent();
  }
  window.deleteCustomPathData = deleteCustomPathData;

  function instantiatePathOnCanvas(dData) {
    if (!dData) return;
    var newEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    var newId = 'obj_' + Date.now();
    newEl.setAttribute('id', newId);
    newEl.setAttribute('d', dData);
    newEl.setAttribute('fill', cfg.fillColor || 'none');
    newEl.setAttribute('stroke', cfg.strokeColor || '#041e49');
    newEl.setAttribute('stroke-width', cfg.strokeWidth || 2);
    newEl.setAttribute('stroke-linecap', 'round');
    newEl.setAttribute('stroke-linejoin', 'round');

    state.canvas.appendChild(newEl);
    state.objectsMap.set(newId, { id: newId, type: 'path', el: newEl });

    clearSelection();
    addToSelection(newId);
    saveState();
    closePathManagerModal();
  }
  window.instantiatePathOnCanvas = instantiatePathOnCanvas;

  function renderPathManagerContent() {
    var modal = document.getElementById('pathManagerModal');
    if (!modal) return;

    var presets = getCustomPathPresets();

    var presetsListHtml = presets.map(function(item) {
      var snippet = item.d.length > 35 ? item.d.slice(0, 35) + '...' : item.d;
      var escapedD = item.d.replace(/'/g, "\\'");
      return '<div style="display:flex; align-items:center; justify-content:space-between; background:#f8fafc; padding:10px 14px; border-radius:8px; border:1px solid #e2e8f0; gap:12px;">' +
               '<div style="width:42px; height:42px; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; padding:4px; flex-shrink:0; display:flex; align-items:center; justify-content:center;">' +
                 '<svg viewBox="0 0 100 100" style="width:100%; height:100%; overflow:visible;"><path d="' + item.d + '" fill="none" stroke="#ec4899" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
               '</div>' +
               '<div style="flex:1; min-width:0;">' +
                 '<div style="font-weight:700; font-size:0.88rem; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + item.name + '</div>' +
                 '<div style="font-size:0.75rem; color:#64748b; font-family:monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + snippet + '</div>' +
               '</div>' +
               '<div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">' +
                 '<button onclick="instantiatePathOnCanvas(\'' + escapedD + '\')" style="background:#0284c7; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:0.78rem; font-weight:700;">🎨 생성</button>' +
                 '<button onclick="renameCustomPathData(\'' + item.id + '\')" style="background:#e2e8f0; color:#334155; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:0.78rem; font-weight:600;">✏️</button>' +
                 '<button onclick="deleteCustomPathData(\'' + item.id + '\')" style="background:#fee2e2; color:#ef4444; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:0.78rem; font-weight:600;">🗑️</button>' +
               '</div>' +
             '</div>';
    }).join('');

    modal.innerHTML =
      '<div style="background:#ffffff; border-radius:12px; width:520px; max-width:92vw; padding:22px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); border:1px solid #cbd5e1; max-height:90vh; display:flex; flex-direction:column;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #e2e8f0; padding-bottom:10px;">' +
          '<div style="display:flex; align-items:center; gap:8px;">' +
            '<span style="font-size:1.4rem;">♾️</span>' +
            '<h3 style="margin:0; font-size:1.1rem; color:#0f172a; font-weight:800;">뫼비우스 경로 관리자 (Path Data)</h3>' +
          '</div>' +
          '<button onclick="closePathManagerModal()" style="background:none; border:none; font-size:1.2rem; cursor:pointer; color:#64748b; font-weight:bold;">✕</button>' +
        '</div>' +

        '<div style="display:flex; flex-direction:column; gap:12px; overflow-y:auto; padding-right:4px;">' +
          '<div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:12px; display:flex; flex-direction:column; gap:8px;">' +
            '<div style="font-size:0.82rem; font-weight:700; color:#334155; display:flex; justify-content:space-between; align-items:center;">' +
              '<span>📥 경로 데이터 입력 (Ctrl+V 클립보드 붙여넣기 지원)</span>' +
              '<span id="pathValidationStatus" style="font-size:0.78rem; font-weight:600; color:#64748b;">(입력 대기 중)</span>' +
            '</div>' +
            '<div style="display:flex; gap:10px; align-items:center;">' +
              '<textarea id="pathDataInput" rows="3" oninput="onPathInputPaste(this.value)" placeholder="오브젝트를 Ctrl+C하여 여기에 Ctrl+V 하거나 <path d=\'...\'/> 태그 또는 M10 10L90 90 구문을 입력하세요..." style="flex:1; padding:8px; font-size:0.8rem; border:1px solid #cbd5e1; border-radius:6px; font-family:monospace; resize:vertical; outline:none; color:#0f172a;"></textarea>' +
              '<div id="pathPreviewContainer" style="width:60px; height:60px; background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:4px; flex-shrink:0; display:flex; align-items:center; justify-content:center;">' +
                '<div style="color:#94a3b8; font-size:0.75rem; text-align:center;">미리보기</div>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex; gap:8px; align-items:center;">' +
              '<input type="text" id="pathNameInput" placeholder="경로 이름 (예: 사용자 정의 경로 #1)" style="flex:1; padding:6px 10px; font-size:0.8rem; border:1px solid #cbd5e1; border-radius:6px;">' +
              '<button onclick="saveCurrentPathData()" style="background:#10b981; color:#ffffff; border:none; padding:6px 14px; border-radius:6px; font-weight:700; font-size:0.82rem; cursor:pointer;">💾 저장하기</button>' +
            '</div>' +
          '</div>' +

          '<div style="display:flex; flex-direction:column; gap:8px;">' +
            '<div style="font-size:0.85rem; font-weight:700; color:#475569; display:flex; justify-content:space-between; align-items:center;">' +
              '<span>📋 저장된 경로 목록 (' + presets.length + '개)</span>' +
            '</div>' +
            '<div style="display:flex; flex-direction:column; gap:8px; max-height:240px; overflow-y:auto;">' +
              (presetsListHtml || '<div style="color:#94a3b8; text-align:center; padding:20px; font-size:0.85rem;">저장된 경로가 없습니다.</div>') +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:flex; justify-content:flex-end; margin-top:14px; pt-10px; border-top:1px solid #e2e8f0;">' +
          '<button onclick="closePathManagerModal()" style="background:#e2e8f0; color:#334155; border:none; padding:7px 16px; border-radius:6px; font-weight:700; font-size:0.82rem; cursor:pointer;">닫기</button>' +
        '</div>' +
      '</div>';
  }

  function insertSymbolObjToCanvasCenter(dataUrl, name, type) {
    var objectsGroup = document.getElementById('objectsGroup');
    if (!objectsGroup) return;

    var tempImg = new Image();
    tempImg.onload = function() {
      var nw = tempImg.naturalWidth || 320;
      var nh = tempImg.naturalHeight || 320;

      var maxDim = 360;
      var w = maxDim;
      var h = maxDim;

      if (nw && nh) {
        if (nw >= nh) {
          w = maxDim;
          h = Math.round(maxDim * (nh / nw));
        } else {
          h = maxDim;
          w = Math.round(maxDim * (nw / nh));
        }
      }

      var id = (type === 'svg' ? 'svg_' : 'img_') + Date.now();
      var cx = (cfg.SVG_WIDTH || 960) / 2;
      var cy = (cfg.SVG_HEIGHT || 540) / 2;

      var el = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      el.setAttribute('id', id);
      el.setAttribute('x', Math.round(cx - w / 2));
      el.setAttribute('y', Math.round(cy - h / 2));
      el.setAttribute('width', w);
      el.setAttribute('height', h);
      el.setAttribute('href', dataUrl);
      el.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);
      el.setAttribute('preserveAspectRatio', 'none');

      el.setAttribute('stroke', cfg.strokeColor || '#041e49');
      el.setAttribute('stroke-width', cfg.strokeWidth || 2);
      el.setAttribute('fill', cfg.fillColor || 'none');

      objectsGroup.appendChild(el);

      var newObj = {
        id: id,
        type: 'image',
        name: name || '드롭 객체',
        el: el,
        attrs: {
          x: Math.round(cx - w / 2),
          y: Math.round(cy - h / 2),
          width: w,
          height: h,
          href: dataUrl,
          aspectRatio: (nw && nh) ? (nw / nh) : (w / h),
          preserveAspectRatio: 'none'
        },
        style: {
          strokeColor: cfg.strokeColor || '#041e49',
          fillColor: cfg.fillColor || 'none',
          strokeWidth: cfg.strokeWidth || 2
        }
      };

      cfg.objectsMap.set(id, newObj);
      state.selectedIds = [id];
      cfg.currentTool = 'select';

      if (window.WebpointerRender) {
        if (window.WebpointerRender.renderCanvas) window.WebpointerRender.renderCanvas();
        if (window.WebpointerRender.renderUI) window.WebpointerRender.renderUI();
      }
      if (window.pushHistoryState) window.pushHistoryState();
    };
    tempImg.src = dataUrl;
  }

  function initCanvasDragAndDrop() {
    var dropOverlay = document.getElementById('canvasDropOverlay');

    // 1. 브라우저 전역 레벨 기본 파일 열기 동작 (새 탭으로 열림) 100% 원천 차단
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(evtName) {
      document.addEventListener(evtName, function(e) {
        e.preventDefault();
        e.stopPropagation();
      }, false);
      window.addEventListener(evtName, function(e) {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    ['dragenter', 'dragover'].forEach(function(evtName) {
      document.addEventListener(evtName, function(e) {
        if (dropOverlay) dropOverlay.style.display = 'flex';
      }, false);
    });

    ['dragleave', 'drop'].forEach(function(evtName) {
      document.addEventListener(evtName, function(e) {
        if (dropOverlay) dropOverlay.style.display = 'none';
      }, false);
    });

    function processDroppedFiles(files) {
      if (!files || files.length === 0) return;
      var file = files[0];
      var fileName = file.name.toLowerCase();

      if (fileName.endsWith('.json')) {
        var reader = new FileReader();
        reader.onload = function(evt) {
          try {
            var jsonStr = evt.target.result;
            if (typeof restoreSnapshot === 'function') {
              restoreSnapshot(jsonStr);
              if (window.pushHistoryState) window.pushHistoryState();
            }
          } catch(err) {
            alert('JSON 파일 읽기 실패: ' + err.message);
          }
        };
        reader.readAsText(file);
      } else if (fileName.endsWith('.svg') || /\.(png|jpe?g|webp|gif|bmp)$/.test(fileName)) {
        var reader = new FileReader();
        reader.onload = function(evt) {
          try {
            var dataUrl = evt.target.result;
            insertSymbolObjToCanvasCenter(dataUrl, file.name, fileName.endsWith('.svg') ? 'svg' : 'image');
          } catch(err) {
            alert('이미지/SVG 파일 읽기 실패: ' + err.message);
          }
        };
        reader.readAsDataURL(file);
      }
    }

    // window 및 document 레벨 drop 수신
    window.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (dropOverlay) dropOverlay.style.display = 'none';
      var dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        processDroppedFiles(dt.files);
      }
    }, false);

    document.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (dropOverlay) dropOverlay.style.display = 'none';
      var dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        processDroppedFiles(dt.files);
      }
    }, false);
  }

  function bringToFront() {
    var cfg = window.WebpointerConfig;
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
    if (render && render.updateDomTree) render.updateDomTree();
    if (window.pushHistoryState) window.pushHistoryState();
  }

  function bringForward() {
    var cfg = window.WebpointerConfig;
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
    if (render && render.updateDomTree) render.updateDomTree();
    if (window.pushHistoryState) window.pushHistoryState();
  }

  function sendBackward() {
    var cfg = window.WebpointerConfig;
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
    if (render && render.updateDomTree) render.updateDomTree();
    if (window.pushHistoryState) window.pushHistoryState();
  }

  function sendToBack() {
    var cfg = window.WebpointerConfig;
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
    if (render && render.updateDomTree) render.updateDomTree();
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
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);backdrop-filter:blur(3px);z-index:99999;display:flex;align-items:center;justify-content:center;';

    var modalHtml = '<div style="background:#ffffff;border-radius:12px;padding:24px;width:380px;box-shadow:0 12px 32px rgba(0,0,0,0.2);font-family:sans-serif;color:#1e293b;">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
        '<span style="font-size:24px;">✂️</span>' +
        '<h3 style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">연속 베지어 분리</h3>' +
      '</div>' +
      '<p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.5;">' +
        '연속 베지어를 해당지점에서 분리하시겠습니까?<br><span style="font-size:12px;color:#64748b;">(분리 시 이후 곡선이 독립 제어점으로 조절됩니다.)</span>' +
      '</p>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;font-size:13px;color:#334155;">' +
        '<input type="checkbox" id="bezierSuppressChk" style="width:16px;height:16px;cursor:pointer;">' +
        '<label for="bezierSuppressChk" style="cursor:pointer;">다시 보지 않기</label>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;">' +
        '<button id="bezierSplitCancelBtn" style="padding:8px 16px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:6px;font-size:13px;font-weight:600;color:#475569;cursor:pointer;">취소</button>' +
        '<button id="bezierSplitConfirmBtn" style="padding:8px 16px;border:none;background:#0284c7;border-radius:6px;font-size:13px;font-weight:600;color:#ffffff;cursor:pointer;">확인</button>' +
      '</div>' +
    '</div>';

    overlay.innerHTML = modalHtml;
    document.body.appendChild(overlay);

    var cancelBtn = document.getElementById('bezierSplitCancelBtn');
    var confirmBtn = document.getElementById('bezierSplitConfirmBtn');
    var suppressChk = document.getElementById('bezierSuppressChk');

    var closeModal = function() {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    cancelBtn.onclick = closeModal;

    confirmBtn.onclick = function() {
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
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);backdrop-filter:blur(3px);z-index:99999;display:flex;align-items:center;justify-content:center;';

    var modalHtml = '<div style="background:#ffffff;border-radius:12px;padding:24px;width:380px;box-shadow:0 12px 32px rgba(0,0,0,0.2);font-family:sans-serif;color:#1e293b;">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
        '<span style="font-size:24px;">🔄</span>' +
        '<h3 style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">회전 분리</h3>' +
      '</div>' +
      '<p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.5;">' +
        '도형과 텍스트의 회전을 분리합니다.' +
      '</p>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;font-size:13px;color:#334155;">' +
        '<input type="checkbox" id="textRotateSuppressChk" style="width:16px;height:16px;cursor:pointer;">' +
        '<label for="textRotateSuppressChk" style="cursor:pointer;">앞으로 묻지 않음</label>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;">' +
        '<button id="textRotateSplitCancelBtn" style="padding:8px 16px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:6px;font-size:13px;font-weight:600;color:#475569;cursor:pointer;">취소</button>' +
        '<button id="textRotateSplitConfirmBtn" style="padding:8px 16px;border:none;background:#0284c7;border-radius:6px;font-size:13px;font-weight:600;color:#ffffff;cursor:pointer;">확인</button>' +
      '</div>' +
    '</div>';

    overlay.innerHTML = modalHtml;
    document.body.appendChild(overlay);

    var cancelBtn = document.getElementById('textRotateSplitCancelBtn');
    var confirmBtn = document.getElementById('textRotateSplitConfirmBtn');
    var suppressChk = document.getElementById('textRotateSuppressChk');

    var closeModal = function() {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    cancelBtn.onclick = function() {
      closeModal();
      if (onCancel) onCancel();
    };

    confirmBtn.onclick = function() {
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

  function alignSelected(dir) {
    if (window.alignSelectedObjects) {
      window.alignSelectedObjects(dir);
    }
  }

  function transformSelected(actionType) {
    if (!cfg.selectedIds || cfg.selectedIds.size === 0) return;
    var render = window.WebpointerRender;

    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (!obj || !obj.attrs) return;

      if (actionType === 'rotate90') {
        var curAngle = obj.attrs.angle || 0;
        obj.attrs.angle = Math.round(((curAngle + 90) % 360 + 360) % 360);
      } else if (actionType === 'rotateNeg90') {
        var curAngle = obj.attrs.angle || 0;
        obj.attrs.angle = Math.round(((curAngle - 90) % 360 + 360) % 360);
      } else if (actionType === 'flipH') {
        var curAngle = obj.attrs.angle || 0;
        obj.attrs.angle = Math.round(((180 - curAngle) % 360 + 360) % 360);
      } else if (actionType === 'flipV') {
        var curAngle = obj.attrs.angle || 0;
        obj.attrs.angle = Math.round(((-curAngle) % 360 + 360) % 360);
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
  }

  window.openBezierSplitConfirmModal = openBezierSplitConfirmModal;
  window.openTextRotateSplitConfirmModal = openTextRotateSplitConfirmModal;
  window.updateSelectedMetricWidth = updateSelectedMetricWidth;
  window.updateSelectedMetricHeight = updateSelectedMetricHeight;
  window.updateSelectedMetricAngle = updateSelectedMetricAngle;
  window.transformSelected = transformSelected;
  window.alignSelected = alignSelected;
  window.groupSelected = groupSelected;
  window.ungroupSelected = ungroupSelected;
  window.bringToFront = bringToFront;
  window.bringForward = bringForward;
  window.sendBackward = sendBackward;
  window.sendToBack = sendToBack;
  window.initCanvasDragAndDrop = initCanvasDragAndDrop;
})(window);

