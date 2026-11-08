(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;

  var WebpointerClipboard = {
    copiedObjects: [],
    pasteCount: 0,

    copySelectedObjects: function() {
      if (!cfg || !cfg.selectedIds || cfg.selectedIds.size === 0) return false;
      this.copiedObjects = [];
      this.pasteCount = 0;

      var selectedList = [];
      cfg.selectedIds.forEach(function(id) {
        var obj = cfg.objectsMap.get(id);
        if (obj) {
          selectedList.push(JSON.parse(JSON.stringify(obj)));
        }
      });

      if (selectedList.length === 0) return false;
      this.copiedObjects = selectedList;

      // Copy JSON string to system clipboard
      try {
        var jsonStr = JSON.stringify({ type: 'webpointer_clipboard', data: selectedList });
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(jsonStr).catch(function() {
            // Graceful fallback for unfocused iframe test environment
          });
        }
      } catch (err) {
        // Fallback
      }

      return true;
    },

    pasteClipboardObjects: function() {
      if (!this.copiedObjects || this.copiedObjects.length === 0) return false;

      this.pasteCount++;
      var offsetDelta = 15 * this.pasteCount;
      var newSelectedIds = new Set();
      var render = window.WebpointerRender;
      var objectsHelper = window.WebpointerObjects;
      var groupMap = {}; // Map old group IDs to new group IDs

      this.copiedObjects.forEach(function(item) {
        var newObj = JSON.parse(JSON.stringify(item));
        var newId = 'obj_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        newObj.id = newId;

        // Group mapping for pasted units
        if (newObj.parentId) {
          if (!groupMap[newObj.parentId]) {
            groupMap[newObj.parentId] = 'group_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          }
          newObj.parentId = groupMap[newObj.parentId];
        }

        // Apply cumulative diagonal cascading offset
        if (newObj.attrs) {
          if (newObj.attrs.x !== undefined) newObj.attrs.x += offsetDelta;
          if (newObj.attrs.y !== undefined) newObj.attrs.y += offsetDelta;
          if (newObj.attrs.cx !== undefined) newObj.attrs.cx += offsetDelta;
          if (newObj.attrs.cy !== undefined) newObj.attrs.cy += offsetDelta;
          if (newObj.attrs.x1 !== undefined) {
            newObj.attrs.x1 += offsetDelta;
            newObj.attrs.x2 += offsetDelta;
            newObj.attrs.y1 += offsetDelta;
            newObj.attrs.y2 += offsetDelta;
          }
        }

        // Create DOM element for object
        if (objectsHelper && objectsHelper.createDomElementForObject) {
          newObj.el = objectsHelper.createDomElementForObject(newObj);
        } else {
          var mainSvg = document.getElementById('mainSvg');
          var objectsGroup = document.getElementById('objectsGroup') || mainSvg;
          var el;
          if (newObj.type === 'rect') el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          else if (newObj.type === 'ellipse') el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
          else if (newObj.type === 'line') el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          else if (newObj.type === 'text') el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          else if (newObj.type === 'image') el = document.createElementNS('http://www.w3.org/2000/svg', 'image');
          else el = document.createElementNS('http://www.w3.org/2000/svg', 'path');

          el.setAttribute('id', newObj.id);
          if (objectsGroup) objectsGroup.appendChild(el);
          newObj.el = el;
        }

        cfg.objectsMap.set(newId, newObj);
        if (render && render.updateElementAttributes) {
          render.updateElementAttributes(newObj);
        }
        newSelectedIds.add(newId);
      });

      // Auto-select pasted objects
      cfg.selectedIds.clear();
      newSelectedIds.forEach(function(id) {
        cfg.selectedIds.add(id);
      });

      if (render && render.renderUI) render.renderUI();
      if (render && render.renderRibbon) render.renderRibbon();
      if (window.pushHistoryState) window.pushHistoryState();

      return true;
    },

    pasteSVGFromClipboard: function(svgCode) {
      if (!svgCode || typeof svgCode !== 'string') return false;
      if (!svgCode.includes('<svg') && !svgCode.includes('<path') && !svgCode.includes('<rect') && !svgCode.includes('<g')) {
        return false;
      }

      var importer = window.WebpointerSVGImporter;
      if (!importer || !importer.importSVGContent) return false;

      var existingKeys = new Set(cfg.objectsMap.keys());
      importer.importSVGContent(svgCode);

      var newKeys = [];
      cfg.objectsMap.forEach(function(val, key) {
        if (!existingKeys.has(key)) {
          newKeys.push(key);
        }
      });

      if (newKeys.length > 0) {
        cfg.selectedIds.clear();
        newKeys.forEach(function(id) {
          cfg.selectedIds.add(id);
        });
        if (window.WebpointerRender && window.WebpointerRender.renderUI) {
          window.WebpointerRender.renderUI();
          window.WebpointerRender.renderRibbon();
        }
        if (window.pushHistoryState) window.pushHistoryState();
        return true;
      }

      return false;
    },

    pasteTextIntoSelectedShape: function(pastedText) {
      if (!pastedText || typeof pastedText !== 'string') return false;
      if (!cfg || !cfg.selectedIds || cfg.selectedIds.size === 0) return false;

      var selId = Array.from(cfg.selectedIds)[0];
      var targetShape = cfg.objectsMap.get(selId);
      if (!targetShape || targetShape.type === 'text') return false;

      var render = window.WebpointerRender;

      var existingText = null;
      if (targetShape.parentId) {
        cfg.objectsMap.forEach(function(o) {
          if (o.parentId === targetShape.parentId && o.type === 'text') {
            existingText = o;
          }
        });
      }

      if (existingText) {
        existingText.attrs.text = pastedText;
        if (render && render.updateElementAttributes) render.updateElementAttributes(existingText);
      } else {
        if (!targetShape.parentId) {
          targetShape.parentId = 'group_' + (cfg.nextId++);
        }
        var newId = 'obj_' + (cfg.nextId++);
        var el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        el.setAttribute('id', newId);
        var objectsGroup = document.getElementById('objectsGroup');
        if (objectsGroup) objectsGroup.appendChild(el);

        var bounds = window.WebpointerObjects ? window.WebpointerObjects.getObjectBounds(targetShape) : null;
        var attrs = {
          x: bounds ? bounds.minX : (targetShape.attrs.x || 0),
          y: bounds ? bounds.minY : (targetShape.attrs.y || 0),
          width: bounds ? Math.max(1, bounds.maxX - bounds.minX) : 100,
          height: bounds ? Math.max(1, bounds.maxY - bounds.minY) : 100,
          angle: targetShape.attrs.angle || 0,
          text: pastedText,
          fill: (cfg.strokeColor && cfg.strokeColor !== 'none') ? cfg.strokeColor : '#041e49',
          fontSize: cfg.fontSize || 20,
          fontFamily: cfg.fontFamily || 'sans-serif',
          textAnchor: cfg.textAnchor || 'start',
          dominantBaseline: 'hanging'
        };

        var textObj = { id: newId, type: 'text', parentId: targetShape.parentId, attrs: attrs, el: el };
        cfg.objectsMap.set(newId, textObj);
        if (render && render.updateElementAttributes) render.updateElementAttributes(textObj);
      }

      if (window.WebpointerObjects && window.WebpointerObjects.syncShapeTextBounds) {
        window.WebpointerObjects.syncShapeTextBounds(targetShape);
      }

      if (render && render.renderUI) render.renderUI();
      if (render && render.renderRibbon) render.renderRibbon();
      if (window.pushHistoryState) window.pushHistoryState();

      return true;
    },

    pasteStandaloneText: function(textStr) {
      if (!textStr || typeof textStr !== 'string') return false;
      var render = window.WebpointerRender;

      var newId = 'obj_' + (cfg.nextId++);
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      el.setAttribute('id', newId);
      var objectsGroup = document.getElementById('objectsGroup');
      if (objectsGroup) objectsGroup.appendChild(el);

      var cx = Math.round(((cfg.SVG_WIDTH || 960) / 2) - 60);
      var cy = Math.round(((cfg.SVG_HEIGHT || 540) / 2) - 10);

      var attrs = {
        x: cx,
        y: cy,
        text: textStr,
        fill: (cfg.strokeColor && cfg.strokeColor !== 'none') ? cfg.strokeColor : '#041e49',
        fontSize: cfg.fontSize || 20,
        fontFamily: cfg.fontFamily || 'sans-serif',
        textAnchor: cfg.textAnchor || 'start',
        dominantBaseline: 'hanging'
      };

      var textObj = { id: newId, type: 'text', attrs: attrs, el: el };
      cfg.objectsMap.set(newId, textObj);
      if (render && render.updateElementAttributes) render.updateElementAttributes(textObj);

      cfg.selectedIds.clear();
      cfg.selectedIds.add(newId);

      if (render && render.renderUI) render.renderUI();
      if (render && render.renderRibbon) render.renderRibbon();
      if (window.pushHistoryState) window.pushHistoryState();

      return true;
    }
  };

  window.WebpointerClipboard = WebpointerClipboard;
})(window);
