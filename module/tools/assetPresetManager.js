/**
 * @file module/tools/assetPresetManager.js
 * @description 심볼/이미지 라이브러리, 마커 프리셋 매니저, 그라데이션 프리셋 매니저, 뫼비우스 경로(Path) 매니저 모듈
 */
(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;

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
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f59e0b" stroke="%23d97706" stroke-width="1.5"><path d="M10.29 3.86L.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
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

  function closeSymbolManagerModal() {
    var modal = document.getElementById('symbolManagerModal');
    if (modal) modal.classList.remove('show');
  }

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

    closeImageSymbolPickerModal();

    if (window.setTool) {
      window.setTool('select');
    } else {
      cfg.currentTool = 'select';
    }

    cfg.selectedIds.clear();
    cfg.selectedIds.add(newObjId);

    if (window.WebpointerRender && window.WebpointerRender.renderUI) {
      window.WebpointerRender.renderUI();
    }
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
    if (window.pushHistoryState) window.pushHistoryState();
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
        var symName = file.name.replace(/\.[^/.]+$/, '');
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
        } catch (err) {
          console.warn('webpointer_symbols LocalStorage 공간 한계:', err);
        }
        renderSymbolList();
        renderImageSymbolPickerGrid();
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

  // =========================================================================
  // Marker Preset Manager
  // =========================================================================
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
    if (window.setStartMarker) window.setStartMarker(types[nextIdx]);
  }

  function cycleEndMarker() {
    var types = getAvailableMarkerTypes();
    var cur = cfg.endMarker || 'none';
    var idx = types.indexOf(cur);
    var nextIdx = (idx === -1 || idx >= types.length - 1) ? 0 : idx + 1;
    if (window.setEndMarker) window.setEndMarker(types[nextIdx]);
  }

  function openMarkerManagerModal() {
    var modal = document.getElementById('markerManagerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'markerManagerModal';
      modal.className = 'palette-modal-backdrop';
      document.body.appendChild(modal);
    }
    modal.classList.add('show');
    modal.style.display = 'flex';
    renderMarkerManagerContent();
  }

  function closeMarkerManagerModal() {
    var modal = document.getElementById('markerManagerModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  function addCustomMarkerPreset() {
    if (!cfg.markerPresets) cfg.markerPresets = [];
    var newIdx = cfg.markerPresets.length + 1;
    cfg.markerPresets.push('user' + newIdx);
    renderMarkerManagerContent();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function removeCustomMarkerPreset(name) {
    if (!cfg.markerPresets) return;
    cfg.markerPresets = cfg.markerPresets.filter(function(m) { return m !== name; });
    renderMarkerManagerContent();
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
  }

  function renderMarkerManagerContent() {
    var modal = document.getElementById('markerManagerModal');
    if (!modal) return;
    var customItems = (cfg.markerPresets || []).map(function(name, i) {
      var numLabel = (i + 1);
      var safeName = String(name).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return '<div style="display:flex; align-items:center; justify-content:space-between; background:#f8fafc; padding:8px 12px; border-radius:6px; border:1px solid #e2e8f0;">' +
               '<div style="display:flex; align-items:center; gap:8px;">' +
                 '<div style="width:28px; height:28px; background:#0284c7; color:#fff; font-weight:800; font-size:0.85rem; border-radius:4px; display:flex; align-items:center; justify-content:center;">' + numLabel + '</div>' +
                 '<span style="font-weight:600; font-size:0.85rem; color:#334155;">사용자 프리셋 ' + numLabel + ' (' + safeName + ')</span>' +
               '</div>' +
               '<button onclick="removeCustomMarkerPreset(\'' + safeName + '\')" style="background:#fee2e2; color:#ef4444; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem; font-weight:700;">삭제</button>' +
             '</div>';
    }).join('');

    modal.innerHTML =
      '<div class="palette-modal-card" style="width:440px;">' +
        '<div class="palette-modal-header">' +
          '<h3 style="margin:0; font-size:1.1rem; color:#0f172a;">📍 마커 프리셋 관리자</h3>' +
          '<button onclick="closeMarkerManagerModal()" style="background:none; border:none; font-size:1.2rem; cursor:pointer; color:#64748b;">✕</button>' +
        '</div>' +
        '<p class="palette-modal-desc" style="margin:0;">기본 프리셋(화살표, 원, 다이아몬드) 및 사용자 정의 프리셋(1, 2, 3...)을 추가하면 그림서식 선 끝 토글 가짓수가 늘어납니다.</p>' +
        '<div style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto;">' +
          '<div style="display:flex; align-items:center; gap:8px; background:#f0f9ff; padding:8px 12px; border-radius:6px; border:1px solid #bae6fd;">' +
            '<span style="font-weight:700; font-size:0.85rem; color:#0369a1;">기본 마커</span>' +
            '<span style="font-size:0.8rem; color:#0284c7;">▶ 화살표 / ● 원 / ◆ 다이아몬드</span>' +
          '</div>' +
          customItems +
        '</div>' +
        '<div style="display:flex; justify-content:space-between;">' +
          '<button class="palette-modal-btn primary" onclick="addCustomMarkerPreset()">+ 새 마커 프리셋 추가 (1, 2, 3...)</button>' +
          '<button class="palette-modal-btn secondary" onclick="closeMarkerManagerModal()">닫기</button>' +
        '</div>' +
      '</div>';
  }

  // =========================================================================
  // Gradient Preset Manager
  // =========================================================================
  function openGradientManagerModal() {
    var modal = document.getElementById('gradientManagerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'gradientManagerModal';
      modal.className = 'palette-modal-backdrop';
      document.body.appendChild(modal);
    }
    modal.classList.add('show');
    modal.style.display = 'flex';
    renderGradientManagerContent();
  }

  function closeGradientManagerModal() {
    var modal = document.getElementById('gradientManagerModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  function applyGradientPreset(presetIdx) {
    var fillUrl = 'none';
    if (presetIdx === 1 && window.createLinearGradient) {
      fillUrl = window.createLinearGradient('#f97316', '#8b5cf6', 90, [
        { offset: '0%', color: '#f97316' },
        { offset: '50%', color: '#ef4444' },
        { offset: '100%', color: '#8b5cf6' }
      ]);
    } else if (presetIdx === 2 && window.createRadialGradient) {
      fillUrl = window.createRadialGradient('#06b6d4', '#1e3a8a', [
        { offset: '0%', color: '#06b6d4' },
        { offset: '50%', color: '#3b82f6' },
        { offset: '100%', color: '#1e3a8a' }
      ]);
    } else if (presetIdx === 3 && window.createLinearGradient) {
      fillUrl = window.createLinearGradient('#10b981', '#6366f1', 45, [
        { offset: '0%', color: '#10b981' },
        { offset: '50%', color: '#3b82f6' },
        { offset: '100%', color: '#6366f1' }
      ]);
    }
    cfg.fillColor = fillUrl;
    var targets = window.getSelectedObjectsForFilter ? window.getSelectedObjectsForFilter() : [];
    targets.forEach(function(obj) {
      if (obj.attrs) obj.attrs.fill = fillUrl;
      if (window.WebpointerRenderCanvas && window.WebpointerRenderCanvas.updateElementAttributes) {
        window.WebpointerRenderCanvas.updateElementAttributes(obj);
      }
    });
    if (window.WebpointerRender && window.WebpointerRender.renderCanvas) {
      window.WebpointerRender.renderCanvas();
    }
    if (window.pushHistoryState) window.pushHistoryState();
    closeGradientManagerModal();
  }

  function renderGradientManagerContent() {
    var modal = document.getElementById('gradientManagerModal');
    if (!modal) return;

    modal.innerHTML =
      '<div class="palette-modal-card" style="width:440px;">' +
        '<div class="palette-modal-header">' +
          '<h3 style="margin:0; font-size:1.1rem; color:#0f172a;">🌈 그라데이션 프리셋 관리자</h3>' +
          '<button onclick="closeGradientManagerModal()" style="background:none; border:none; font-size:1.2rem; cursor:pointer; color:#64748b;">✕</button>' +
        '</div>' +
        '<p class="palette-modal-desc" style="margin:0;">지원하는 기본 프리셋 3가지 중 하나를 선택하면 현재 선택된 개체에 즉시 적용됩니다.</p>' +
        '<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px;">' +
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
        '<div class="palette-modal-actions">' +
          '<button class="palette-modal-btn secondary" onclick="closeGradientManagerModal()">닫기</button>' +
        '</div>' +
      '</div>';
  }

  // =========================================================================
  // Mobius Path Data Manager
  // =========================================================================
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

  function openPathManagerModal() {
    var modal = document.getElementById('pathManagerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'pathManagerModal';
      modal.className = 'palette-modal-backdrop';
      document.body.appendChild(modal);
    }
    modal.classList.add('show');
    modal.style.display = 'flex';
    renderPathManagerContent();
  }

  function closePathManagerModal() {
    var modal = document.getElementById('pathManagerModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

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

  function deleteCustomPathData(id) {
    var presets = getCustomPathPresets();
    var filtered = presets.filter(function(p) { return p.id !== id; });
    saveCustomPathPresets(filtered);
    renderPathManagerContent();
  }

  function instantiatePathOnCanvas(dData) {
    if (!dData) return;
    var objectsGroup = document.getElementById('objectsGroup');
    if (!objectsGroup) return;

    var newEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    var newId = 'obj_' + (cfg.nextId++);
    newEl.setAttribute('id', newId);
    newEl.setAttribute('d', dData);
    newEl.setAttribute('fill', cfg.fillColor || 'none');
    newEl.setAttribute('stroke', cfg.strokeColor || '#041e49');
    newEl.setAttribute('stroke-width', cfg.strokeWidth || 2);
    newEl.setAttribute('stroke-linecap', 'round');
    newEl.setAttribute('stroke-linejoin', 'round');

    objectsGroup.appendChild(newEl);
    var newObj = {
      id: newId,
      type: 'path',
      el: newEl,
      attrs: {
        d: dData,
        fill: cfg.fillColor || 'none',
        stroke: cfg.strokeColor || '#041e49',
        strokeWidth: cfg.strokeWidth || 2,
        strokeCap: 'round',
        strokeJoin: 'round'
      }
    };
    cfg.objectsMap.set(newId, newObj);
    cfg.selectedIds.clear();
    cfg.selectedIds.add(newId);

    if (window.WebpointerRender) {
      if (window.WebpointerRender.renderUI) window.WebpointerRender.renderUI();
      if (window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
    }
    if (window.pushHistoryState) window.pushHistoryState();
    closePathManagerModal();
  }

  function renderPathManagerContent() {
    var modal = document.getElementById('pathManagerModal');
    if (!modal) return;

    var presets = getCustomPathPresets();

    var presetsListHtml = presets.map(function(item) {
      var snippet = item.d.length > 35 ? item.d.slice(0, 35) + '...' : item.d;
      var escapedD = item.d.replace(/'/g, "\\'");
      var safeName = String(item.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return '<div style="display:flex; align-items:center; justify-content:space-between; background:#f8fafc; padding:10px 14px; border-radius:8px; border:1px solid #e2e8f0; gap:12px;">' +
               '<div style="width:42px; height:42px; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; padding:4px; flex-shrink:0; display:flex; align-items:center; justify-content:center;">' +
                 '<svg viewBox="0 0 100 100" style="width:100%; height:100%; overflow:visible;"><path d="' + item.d + '" fill="none" stroke="#ec4899" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
               '</div>' +
               '<div style="flex:1; min-width:0;">' +
                 '<div style="font-weight:700; font-size:0.88rem; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + safeName + '</div>' +
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
      '<div class="palette-modal-card" style="width:520px; max-height:90vh;">' +
        '<div class="palette-modal-header">' +
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
            '<div style="font-size:0.85rem; font-weight:700; color:#475569;">' +
              '<span>📋 저장된 경로 목록 (' + presets.length + '개)</span>' +
            '</div>' +
            '<div style="display:flex; flex-direction:column; gap:8px; max-height:240px; overflow-y:auto;">' +
              (presetsListHtml || '<div style="color:#94a3b8; text-align:center; padding:20px; font-size:0.85rem;">저장된 경로가 없습니다.</div>') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="palette-modal-actions" style="border-top:1px solid #e2e8f0; padding-top:10px;">' +
          '<button class="palette-modal-btn secondary" onclick="closePathManagerModal()">닫기</button>' +
        '</div>' +
      '</div>';
  }

  window.renderSymbolList = renderSymbolList;
  window.openSymbolManagerModal = openSymbolManagerModal;
  window.closeSymbolManagerModal = closeSymbolManagerModal;
  window.openImageSymbolPickerModal = openImageSymbolPickerModal;
  window.closeImageSymbolPickerModal = closeImageSymbolPickerModal;
  window.renderImageSymbolPickerGrid = renderImageSymbolPickerGrid;
  window.insertSymbolToCanvasCenter = insertSymbolToCanvasCenter;
  window.importSymbolFromFile = importSymbolFromFile;
  window.deleteSymbol = deleteSymbol;
  window.cycleStartMarker = cycleStartMarker;
  window.cycleEndMarker = cycleEndMarker;
  window.openMarkerManagerModal = openMarkerManagerModal;
  window.closeMarkerManagerModal = closeMarkerManagerModal;
  window.addCustomMarkerPreset = addCustomMarkerPreset;
  window.removeCustomMarkerPreset = removeCustomMarkerPreset;
  window.openGradientManagerModal = openGradientManagerModal;
  window.closeGradientManagerModal = closeGradientManagerModal;
  window.applyGradientPreset = applyGradientPreset;
  window.validateAndExtractSvgPath = validateAndExtractSvgPath;
  window.openPathManagerModal = openPathManagerModal;
  window.closePathManagerModal = closePathManagerModal;
  window.onPathInputPaste = onPathInputPaste;
  window.saveCurrentPathData = saveCurrentPathData;
  window.renameCustomPathData = renameCustomPathData;
  window.deleteCustomPathData = deleteCustomPathData;
  window.instantiatePathOnCanvas = instantiatePathOnCanvas;

  window.WebpointerAssetPresets = {
    openSymbolManagerModal: openSymbolManagerModal,
    closeSymbolManagerModal: closeSymbolManagerModal,
    openImageSymbolPickerModal: openImageSymbolPickerModal,
    closeImageSymbolPickerModal: closeImageSymbolPickerModal,
    insertSymbolToCanvasCenter: insertSymbolToCanvasCenter,
    importSymbolFromFile: importSymbolFromFile,
    deleteSymbol: deleteSymbol,
    renderSymbolList: renderSymbolList,
    openMarkerManagerModal: openMarkerManagerModal,
    closeMarkerManagerModal: closeMarkerManagerModal,
    openGradientManagerModal: openGradientManagerModal,
    closeGradientManagerModal: closeGradientManagerModal,
    applyGradientPreset: applyGradientPreset,
    openPathManagerModal: openPathManagerModal,
    closePathManagerModal: closePathManagerModal,
    instantiatePathOnCanvas: instantiatePathOnCanvas
  };
})(window);
