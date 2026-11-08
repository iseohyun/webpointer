/**
 * @file module/tools/effectClipManager.js
 * @description SVG 필터 이펙트(드롭 섀도우, 블러, 네온 등) 스택 및 쿠키커터 심볼 클리핑 모듈
 */
(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;
  var state = window.WebpointerState;
  var effectHoldTimer = null;
  var effectHoldTriggered = false;
  var effectRollbackSnapshots = null;

  var DEFAULT_CLIP_SYMBOLS = [
    { id: 'sym_def_star', name: '별 (Star)', data: 'M 25 2 L 32 17 L 48 19 L 36 31 L 40 47 L 25 39 L 10 47 L 14 31 L 2 19 L 18 17 Z' },
    { id: 'sym_def_heart', name: '하트 (Heart)', data: 'M 25 10 C 25 3, 10 3, 10 16 C 10 28, 25 38, 25 44 C 25 38, 40 28, 40 16 C 40 3, 25 3, 25 10 Z' },
    { id: 'sym_def_circle', name: '원 (Circle)', data: 'M 25 5 A 20 20 0 1 0 25 45 A 20 20 0 1 0 25 5 Z' },
    { id: 'sym_def_hexagon', name: '육각형 (Hexagon)', data: 'M 25 2 L 46 14 L 46 36 L 25 48 L 4 36 L 4 14 Z' }
  ];

  function getSelectedObjectsForFilter() {
    var members = window.getAllGroupMembers ? window.getAllGroupMembers(cfg.selectedIds) : [];
    if (members.length > 0) return members;
    return Array.from(cfg.objectsMap.values());
  }

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

  function startHoldEffect(e, btnEl, effectType) {
    effectHoldTriggered = false;
    clearTimeout(effectHoldTimer);
    var delay = cfg.longPressDelay || 200;
    effectHoldTimer = setTimeout(function() {
      effectHoldTriggered = true;
      openEffectParamPopover(btnEl, effectType);
    }, delay);
  }

  function endHoldEffect() {
    clearTimeout(effectHoldTimer);
  }

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

  function openEffectEditPopover(itemEl, idx) {
    var targets = getSelectedObjectsForFilter();
    if (targets.length === 0 || !targets[0].attrs || !targets[0].attrs.filterList || !targets[0].attrs.filterList[idx]) return;
    var item = targets[0].attrs.filterList[idx];
    openEffectParamPopover(itemEl, item.type, idx);
  }

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
      var gBlurEl = document.getElementById('fxParamBlur');
      var gColEl = document.getElementById('fxParamColor');
      var gBlurDisp = document.getElementById('fxParamBlurDisp');

      if (gBlurEl) { previewEffectObj.blur = parseInt(gBlurEl.value, 10); if (gBlurDisp) gBlurDisp.innerText = gBlurEl.value + 'px'; }
      if (gColEl) { previewEffectObj.color = gColEl.value; }
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

  function updateFilterRangeConfig(type) {
    livePreviewEffect(type || 'blur');
  }

  function addFilterFromPopover(type) {
    applyEffectDirect(type || 'blur');
  }

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

    var symbols = (cfg.symbolRegistry && cfg.symbolRegistry.length > 0) ? cfg.symbolRegistry : DEFAULT_CLIP_SYMBOLS;

    var html = symbols.map(function(sym) {
      var d = sym.data || '';
      var svgPreview = '<svg width="36" height="36" viewBox="0 0 50 50"><path d="' + d + '" fill="#0284c7" stroke="#0369a1" stroke-width="2"/></svg>';
      return '<div onclick="applySymbolClip(\'' + sym.id + '\')" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:6px; background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; cursor:pointer; text-align:center; transition:all 0.15s ease;" onmouseover="this.style.borderColor=\'#0284c7\';this.style.background=\'#f0f9ff\'" onmouseout="this.style.borderColor=\'#e2e8f0\';this.style.background=\'#ffffff\'" title="' + sym.name + '">' +
               svgPreview +
               '<span style="font-size:0.7rem; color:#334155; max-width:70px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:4px;">' + sym.name + '</span>' +
             '</div>';
    }).join('');

    grid.innerHTML = html;
  }

  function applySymbolClip(symbolId) {
    var symbols = cfg.symbolRegistry || [];
    var sym = symbols.find(function(s) { return s.id === symbolId; }) ||
              DEFAULT_CLIP_SYMBOLS.find(function(s) { return s.id === symbolId; }) ||
              DEFAULT_CLIP_SYMBOLS[0];
    if (!sym) return;

    var targets = getSelectedObjectsForFilter();
    var defs = window.ensureSvgDefs ? window.ensureSvgDefs() : document.getElementById('svgDefs');
    if (!defs) return;

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

  function toggleCropMode() {
    state.isCropModeActive = !state.isCropModeActive;
    if (window.WebpointerRender) {
      if (window.WebpointerRender.renderUI) window.WebpointerRender.renderUI();
      if (window.WebpointerRender.renderRibbon) window.WebpointerRender.renderRibbon();
    }
  }

  window.getSelectedObjectsForFilter = getSelectedObjectsForFilter;
  window.getCommonFilterList = getCommonFilterList;
  window.applyEffectDirect = applyEffectDirect;
  window.startHoldEffect = startHoldEffect;
  window.endHoldEffect = endHoldEffect;
  window.openEffectParamPopover = openEffectParamPopover;
  window.openFilterPopover = openEffectParamPopover;
  window.openEffectEditPopover = openEffectEditPopover;
  window.livePreviewEffect = livePreviewEffect;
  window.livePreviewFilter = livePreviewEffect;
  window.confirmEffectParam = confirmEffectParam;
  window.cancelEffectParam = cancelEffectParam;
  window.toggleEffectEnabled = toggleEffectEnabled;
  window.reorderEffect = reorderEffect;
  window.moveFilterUp = function(idx) { reorderEffect(idx, idx - 1); };
  window.moveFilterDown = function(idx) { reorderEffect(idx, idx + 1); };
  window.removeEffectItem = removeEffectItem;
  window.removeFilterAtIndexFromPopover = removeEffectItem;
  window.clearAllFilterEffects = clearAllFilterEffects;
  window.clearAllFiltersFromPopover = clearAllFilterEffects;
  window.updateFilterRangeConfig = updateFilterRangeConfig;
  window.addFilterFromPopover = addFilterFromPopover;
  window.openSymbolClipPopover = openSymbolClipPopover;
  window.closeSymbolClipPopover = closeSymbolClipPopover;
  window.applySymbolClip = applySymbolClip;
  window.removeSymbolClipFromSelected = removeSymbolClipFromSelected;
  window.toggleCropMode = toggleCropMode;

  window.WebpointerEffectClip = {
    getSelectedObjectsForFilter: getSelectedObjectsForFilter,
    getCommonFilterList: getCommonFilterList,
    openFilterPopover: openEffectParamPopover,
    addFilterFromPopover: addFilterFromPopover,
    openSymbolClipPopover: openSymbolClipPopover,
    closeSymbolClipPopover: closeSymbolClipPopover,
    applySymbolClip: applySymbolClip,
    removeSymbolClipFromSelected: removeSymbolClipFromSelected,
    toggleCropMode: toggleCropMode
  };
})(window);
