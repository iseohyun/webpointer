/**
 * @file module/tools/historyManager.js
 * @description Undo/Redo 히스토리 스택 관리 및 캔버스 스냅샷 캡처/복원 모듈
 */
(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;
  var undoStack = [];
  var redoStack = [];
  var isRestoringHistory = false;

  function captureSnapshot() {
    var objs = [];
    cfg.objectsMap.forEach(function(obj) {
      objs.push({
        id: obj.id,
        type: obj.type,
        parentId: obj.parentId,
        attrs: JSON.parse(JSON.stringify(obj.attrs || {}))
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
          else if (oData.type === 'arc' || oData.type === 'bez2' || oData.type === 'bez3' || oData.type === 'path') tag = 'path';
          else if (oData.type === 'text') tag = 'text';
          else if (oData.type === 'image') tag = 'image';

          var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
          el.setAttribute('id', oData.id);
          if (objectsGroup) objectsGroup.appendChild(el);

          var newObj = {
            id: oData.id,
            type: oData.type,
            parentId: oData.parentId,
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
    } catch (e) {
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

  setTimeout(function() {
    if (undoStack.length === 0) {
      pushHistoryState();
    }
  }, 300);

  window.captureSnapshot = captureSnapshot;
  window.pushHistoryState = pushHistoryState;
  window.saveState = pushHistoryState;
  window.pushSnapshot = pushHistoryState;
  window.restoreSnapshot = restoreSnapshot;
  window.undo = undo;
  window.redo = redo;

  window.WebpointerHistory = {
    captureSnapshot: captureSnapshot,
    pushHistoryState: pushHistoryState,
    restoreSnapshot: restoreSnapshot,
    undo: undo,
    redo: redo
  };
})(window);
