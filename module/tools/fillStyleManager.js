/**
 * @file module/tools/fillStyleManager.js
 * @description 단색/그라데이션/패턴/이미지 채우기 팝오버, 팔레트 가져오기 모달 및 SVG <defs> 생성 모듈
 */
(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;
  var colorHoldTimer = null;
  var isColorHoldTriggered = false;

  function getGroupMembersHelper(selectedIds) {
    if (window.getAllGroupMembers) {
      return window.getAllGroupMembers(selectedIds);
    }
    var list = [];
    (selectedIds || new Set()).forEach(function(id) {
      var o = cfg.objectsMap.get(id);
      if (o) list.push(o);
    });
    return list;
  }

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
      if (window.setStrokeColor) window.setStrokeColor(cfg.strokeColor || '#0284c7');
    } else if (targetMode === 'fill') {
      if (window.setFillColor) window.setFillColor(cfg.fillColor || '#38bdf8');
    } else if (targetMode === 'text_stroke' || targetMode === 'text') {
      var sColor = cfg.textStrokeColor !== undefined ? cfg.textStrokeColor : 'none';
      var members = getGroupMembersHelper(cfg.selectedIds);
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
      var members = getGroupMembersHelper(cfg.selectedIds);
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
      var members = getGroupMembersHelper(cfg.selectedIds);
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
    var basePalette = cfg.paletteColors || cfg.customPalette || [];
    var userColors = basePalette.slice();
    while (userColors.length < 24) {
      userColors.push(basePalette[userColors.length % Math.max(1, basePalette.length)] || '#041e49');
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
      if (window.setStrokeColor) window.setStrokeColor(hex);
    } else if (targetMode === 'fill') {
      if (window.setFillColor) window.setFillColor(hex);
    } else if (targetMode === 'text_stroke' || targetMode === 'text') {
      cfg.textStrokeColor = hex;
      var members = getGroupMembersHelper(cfg.selectedIds);
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
      var members = getGroupMembersHelper(cfg.selectedIds);
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
      var members = getGroupMembersHelper(cfg.selectedIds);
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

  function openPaletteModal() {
    var modal = document.getElementById('paletteModal');
    if (modal) {
      var textarea = document.getElementById('paletteTextarea');
      if (textarea) {
        textarea.value = '';
        textarea.focus();
      }
      modal.classList.add('show');
      modal.style.display = 'flex';
    }
  }

  function closePaletteModal() {
    var modal = document.getElementById('paletteModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  function importPaletteFromText() {
    var textarea = document.getElementById('paletteTextarea');
    if (!textarea) return;
    var rawText = textarea.value.trim();
    if (!rawText) { closePaletteModal(); return; }

    var matches = rawText.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g);
    if (matches && matches.length > 0) {
      var sliced = matches.slice(0, 27);
      cfg.customPalette = sliced;
      cfg.paletteColors = sliced;
      if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
    }
    closePaletteModal();
  }

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
      var members = getGroupMembersHelper(cfg.selectedIds);
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
        if (window.setStrokeColor) window.setStrokeColor(hex);
      } else {
        if (window.setFillColor) window.setFillColor(hex);
      }
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
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
      pathD.setAttribute('d', 'M 0 ' + pSize + ' L ' + pSize + ' 0 M -' + (pSize / 4) + ' ' + (pSize / 4) + ' L ' + (pSize / 4) + ' -' + (pSize / 4) + ' M ' + (pSize * 3 / 4) + ' ' + (pSize * 5 / 4) + ' L ' + (pSize * 5 / 4) + ' ' + (pSize * 3 / 4));
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

  window.startHoldColorBtn = startHoldColorBtn;
  window.endHoldColorBtn = endHoldColorBtn;
  window.handleColorBtnClick = handleColorBtnClick;
  window.applyCurrentColorDirectly = applyCurrentColorDirectly;
  window.toggleColorPalettePopover = toggleColorPalettePopover;
  window.selectColorFromPopover = selectColorFromPopover;
  window.openPaletteModal = openPaletteModal;
  window.closePaletteModal = closePaletteModal;
  window.importPaletteFromText = importPaletteFromText;
  window.applyImportedPalette = importPaletteFromText;
  window.setActiveColorTarget = setActiveColorTarget;
  window.setActiveTextColorTarget = setActiveTextColorTarget;
  window.applyPaletteColor = applyPaletteColor;
  window.ensureSvgDefs = ensureSvgDefs;
  window.createLinearGradient = createLinearGradient;
  window.createRadialGradient = createRadialGradient;
  window.createPatternFill = createPatternFill;
  window.createImageFill = createImageFill;
  window.switchPopoverTab = switchPopoverTab;
  window.applyGradientFromPopover = applyGradientFromPopover;
  window.applyPatternFromPopover = applyPatternFromPopover;
  window.applyImageFillFromPopover = applyImageFillFromPopover;

  window.WebpointerFillStyles = {
    toggleColorPalettePopover: toggleColorPalettePopover,
    selectColorFromPopover: selectColorFromPopover,
    openPaletteModal: openPaletteModal,
    closePaletteModal: closePaletteModal,
    importPaletteFromText: importPaletteFromText,
    applyPaletteColor: applyPaletteColor,
    setActiveColorTarget: setActiveColorTarget,
    setActiveTextColorTarget: setActiveTextColorTarget,
    createLinearGradient: createLinearGradient,
    createRadialGradient: createRadialGradient,
    createPatternFill: createPatternFill,
    createImageFill: createImageFill
  };
})(window);
