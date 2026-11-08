/**
 * @file module/tools/fileSlotManager.js
 * @description 로컬 스토리지/IndexedDB 파일 슬롯 관리, 파일 열기/다운로드 및 캔버스 드래그 앤 드롭 로더
 */
(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;
  var pendingFileToOpen = null;
  var pendingSlotKeyToSave = null;

  function proceedOpenFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      var content = ev.target.result;
      try {
        if (file.name.toLowerCase().endsWith('.svg')) {
          if (window.pushHistoryState) window.pushHistoryState();
          if (window.WebpointerSVGImporter) {
            window.WebpointerSVGImporter.importSVGContent(content);
          }
          if (window.pushHistoryState) window.pushHistoryState();
        } else {
          if (window.pushHistoryState) window.pushHistoryState();
          if (window.restoreSnapshot) window.restoreSnapshot(content);
          if (window.pushHistoryState) window.pushHistoryState();
        }
      } catch (err) {
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
          } catch (e) {}
        }
        html += '<button onclick="saveAndProceedFileOpen(' + slotNum + ')" style="padding:8px 12px; font-size:0.82rem; font-weight:600; background:#0284c7; color:#fff; border:none; border-radius:6px; cursor:pointer; text-align:left;">💾 ' + label + '</button>';
      });
      html += '<button onclick="discardAndProceedFileOpen()" style="padding:8px 12px; font-size:0.82rem; font-weight:600; background:#ef4444; color:#fff; border:none; border-radius:6px; cursor:pointer; text-align:left; margin-top:4px;">🗑️ 현재 캔버스 폐기하고 파일 열기</button>';
      btnContainer.innerHTML = html;
    }
    modal.classList.add('show');
  }

  function closeSlotSelectionModal() {
    var modal = document.getElementById('slotSelectionModal');
    if (modal) modal.classList.remove('show');
    pendingFileToOpen = null;
  }

  function closeCanvasDefenseModal() {
    var modal = document.getElementById('canvasDefenseModal');
    if (modal) modal.classList.remove('show');
  }

  function saveAndProceedFileOpen(slotNum) {
    saveToFileSlot(slotNum || 1);
    closeSlotSelectionModal();
    closeCanvasDefenseModal();
    if (pendingFileToOpen) {
      var file = pendingFileToOpen;
      pendingFileToOpen = null;
      proceedOpenFile(file);
    }
  }

  function discardAndProceedFileOpen() {
    closeSlotSelectionModal();
    closeCanvasDefenseModal();
    if (pendingFileToOpen) {
      var file = pendingFileToOpen;
      pendingFileToOpen = null;
      proceedOpenFile(file);
    }
  }

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
    openFileSlotsModal();
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
      var snapStr = window.captureSnapshot ? window.captureSnapshot() : '{}';
      try {
        var snapObj = JSON.parse(snapStr);
        snapObj.exportIncludeGrid = !!includeGrid;
        snapStr = JSON.stringify(snapObj, null, 2);
      } catch (e) {}
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

      var gridG = clone.querySelector('#gridGroup');
      if (gridG && !includeGrid) {
        gridG.parentNode.removeChild(gridG);
      }

      var uiG = clone.querySelector('#uiGroup');
      if (uiG) {
        if (!includeGrid) {
          uiG.parentNode.removeChild(uiG);
        } else {
          var overlayElements = uiG.querySelectorAll('.transform-handle, .selection-box, .selection-overlay, [id*="handle"], [id*="transform"]');
          overlayElements.forEach(function(el) {
            if (el && el.parentNode) el.parentNode.removeChild(el);
          });
        }
      }

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
    } catch (e) {
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
      } catch (e) {}
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
          if (slotData.name) slotName = String(slotData.name).replace(/</g, '&lt;').replace(/>/g, '&gt;');
          if (slotData.timestamp) timeStr = new Date(slotData.timestamp).toLocaleString();
          if (slotData.objects) countStr = slotData.objects.length + '개 객체';
          if (slotData.thumbnail) {
            thumbHtml = '<img src="' + slotData.thumbnail + '" style="height:44px; width:70px; min-width:70px; object-fit:contain; background:#ffffff; border:1px solid #e2e8f0; border-radius:4px;" />';
          }
        } catch (e) {}
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

  function closeFileSlotsModal() {
    var modal = document.getElementById('fileSlotsModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

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
    var snap = window.captureSnapshot ? window.captureSnapshot() : '{}';
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
      closeFileSlotsModal();
      setTimeout(function() {
        downloadFile();
      }, 50);
    }
  }

  function saveToFileSlot(slotKey) {
    executeSaveToFileSlot(slotKey);
  }

  function executeSaveToFileSlot(slotKey) {
    try {
      var snapStr = window.captureSnapshot ? window.captureSnapshot() : '{}';
      var parsed = JSON.parse(snapStr);
      parsed.timestamp = Date.now();
      parsed.thumbnail = generateCanvasThumbnailSvg();
      parsed.snapStr = snapStr;

      var existingRaw = localStorage.getItem('webpointer_slot_' + slotKey);
      if (existingRaw) {
        try {
          var ex = JSON.parse(existingRaw);
          if (ex && ex.name) parsed.name = ex.name;
        } catch (e) {}
      }
      if (!parsed.name) parsed.name = 'Slot ' + slotKey;

      if (window.WebpointerStorage && window.WebpointerStorage.saveSlotToDB) {
        window.WebpointerStorage.saveSlotToDB(slotKey, parsed);
      }

      try {
        localStorage.setItem('webpointer_slot_' + slotKey, JSON.stringify(parsed));
      } catch (quotaErr) {
        console.warn('LocalStorage 용량 초과 발생:', quotaErr);
        promptUserQuotaDownload();
        return;
      }

      var keys = getFileSlotKeys();
      if (keys.indexOf(String(slotKey)) === -1) {
        keys.push(String(slotKey));
        saveFileSlotKeys(keys);
      }

      renderFileSlotsList();
    } catch (e) {
      console.error('Slot 저장 처리 오류:', e);
      promptUserQuotaDownload();
    }
  }

  function loadFromFileSlot(slotKey) {
    try {
      if (window.WebpointerStorage && window.WebpointerStorage.loadSlotFromDB) {
        window.WebpointerStorage.loadSlotFromDB(slotKey, function(err, dbData) {
          if (!err && dbData && (dbData.snapStr || dbData.objects)) {
            if (window.restoreSnapshot) window.restoreSnapshot(dbData.snapStr || JSON.stringify(dbData));
            closeFileSlotsModal();
            return;
          }
          var raw = localStorage.getItem('webpointer_slot_' + slotKey);
          if (!raw) return;
          var parsed = JSON.parse(raw);
          if (window.restoreSnapshot) window.restoreSnapshot(parsed.snapStr || raw);
          closeFileSlotsModal();
        });
      } else {
        var raw = localStorage.getItem('webpointer_slot_' + slotKey);
        if (!raw) return;
        var parsed = JSON.parse(raw);
        if (window.restoreSnapshot) window.restoreSnapshot(parsed.snapStr || raw);
        closeFileSlotsModal();
      }
    } catch (e) {
      console.error('Slot 불러오기 실패:', e);
    }
  }

  function renameFileSlot(slotKey) {
    var raw = localStorage.getItem('webpointer_slot_' + slotKey);
    var curName = 'Slot ' + slotKey;
    var slotData = {};
    if (raw) {
      try {
        slotData = JSON.parse(raw);
        if (slotData.name) curName = slotData.name;
      } catch (e) {}
    }
    var newName = prompt('슬롯 이름을 입력하세요:', curName);
    if (newName && newName.trim()) {
      slotData.name = newName.trim();
      localStorage.setItem('webpointer_slot_' + slotKey, JSON.stringify(slotData));
      renderFileSlotsList();
    }
  }

  function deleteFileSlot(slotKey) {
    localStorage.removeItem('webpointer_slot_' + slotKey);
    var keys = getFileSlotKeys().filter(function(k) { return k !== String(slotKey); });
    saveFileSlotKeys(keys);
    renderFileSlotsList();
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
      cfg.selectedIds.clear();
      cfg.selectedIds.add(id);
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
      document.addEventListener(evtName, function() {
        if (dropOverlay) dropOverlay.style.display = 'flex';
      }, false);
    });

    ['dragleave', 'drop'].forEach(function(evtName) {
      document.addEventListener(evtName, function() {
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
            if (window.restoreSnapshot) {
              window.restoreSnapshot(jsonStr);
              if (window.pushHistoryState) window.pushHistoryState();
            }
          } catch (err) {
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
          } catch (err) {
            alert('이미지/SVG 파일 읽기 실패: ' + err.message);
          }
        };
        reader.readAsDataURL(file);
      }
    }

    function onDropHandler(e) {
      e.preventDefault();
      e.stopPropagation();
      if (dropOverlay) dropOverlay.style.display = 'none';
      var dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        processDroppedFiles(dt.files);
      }
    }

    window.addEventListener('drop', onDropHandler, false);
    document.addEventListener('drop', onDropHandler, false);
  }

  window.openSlotSelectionModal = openSlotSelectionModal;
  window.closeSlotSelectionModal = closeSlotSelectionModal;
  window.closeCanvasDefenseModal = closeCanvasDefenseModal;
  window.saveAndProceedFileOpen = saveAndProceedFileOpen;
  window.discardAndProceedFileOpen = discardAndProceedFileOpen;
  window.autoSaveCurrentCanvasAndProceedOpen = saveAndProceedFileOpen;
  window.discardCanvasAndProceedOpen = discardAndProceedFileOpen;
  window.openFile = openFile;
  window.saveFileToWeb = saveFileToWeb;
  window.downloadFile = downloadFile;
  window.addNewFileSlot = addNewFileSlot;
  window.renderFileSlotsList = renderFileSlotsList;
  window.openFileSlotsModal = openFileSlotsModal;
  window.closeFileSlotsModal = closeFileSlotsModal;
  window.openLargeCanvasNoticeModal = openLargeCanvasNoticeModal;
  window.closeLargeCanvasNoticeModal = closeLargeCanvasNoticeModal;
  window.downloadProjectJsonAndCloseModal = downloadProjectJsonAndCloseModal;
  window.forceProceedTempSave = forceProceedTempSave;
  window.promptUserQuotaDownload = promptUserQuotaDownload;
  window.openQuotaExceededConfirmModal = promptUserQuotaDownload;
  window.saveToFileSlot = saveToFileSlot;
  window.loadFromFileSlot = loadFromFileSlot;
  window.renameFileSlot = renameFileSlot;
  window.deleteFileSlot = deleteFileSlot;
  window.initCanvasDragAndDrop = initCanvasDragAndDrop;

  window.WebpointerFileSlots = {
    openFile: openFile,
    saveFileToWeb: saveFileToWeb,
    downloadFile: downloadFile,
    openFileSlotsModal: openFileSlotsModal,
    closeFileSlotsModal: closeFileSlotsModal,
    saveToFileSlot: saveToFileSlot,
    loadFromFileSlot: loadFromFileSlot,
    renderFileSlotsList: renderFileSlotsList,
    openSlotSelectionModal: openSlotSelectionModal,
    closeSlotSelectionModal: closeSlotSelectionModal,
    saveAndProceedFileOpen: saveAndProceedFileOpen,
    discardAndProceedFileOpen: discardAndProceedFileOpen,
    initCanvasDragAndDrop: initCanvasDragAndDrop
  };
})(window);
