(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;

  function parseMatrixTransform(transformStr) {
    if (!transformStr) return null;
    var matrixMatch = transformStr.match(/matrix\(([^)]+)\)/);
    if (matrixMatch) {
      var parts = matrixMatch[1].trim().split(/[\s,]+/).map(Number);
      if (parts.length === 6) {
        return parts; // [a, b, c, d, e, f]
      }
    }
    var translateMatch = transformStr.match(/translate\(([^)]+)\)/);
    if (translateMatch) {
      var partsTr = translateMatch[1].trim().split(/[\s,]+/).map(Number);
      var tx = partsTr[0] || 0;
      var ty = partsTr[1] !== undefined ? partsTr[1] : 0;
      return [1, 0, 0, 1, tx, ty];
    }
    return null;
  }

  function combineTransforms(parentMatrix, childMatrixStr) {
    var childMatrix = parseMatrixTransform(childMatrixStr);
    if (!parentMatrix && !childMatrix) return null;
    if (!parentMatrix) return childMatrix;
    if (!childMatrix) return parentMatrix;

    var a1 = parentMatrix[0], b1 = parentMatrix[1], c1 = parentMatrix[2], d1 = parentMatrix[3], e1 = parentMatrix[4], f1 = parentMatrix[5];
    var a2 = childMatrix[0], b2 = childMatrix[1], c2 = childMatrix[2], d2 = childMatrix[3], e2 = childMatrix[4], f2 = childMatrix[5];

    return [
      a1 * a2 + c1 * b2,
      b1 * a2 + d1 * b2,
      a1 * c2 + c1 * d2,
      b1 * c2 + d1 * d2,
      a1 * e2 + c1 * f2 + e1,
      b1 * e2 + d1 * f2 + f1
    ];
  }

  function getInheritedStyle(node, attrName, defaultValue) {
    var val = node.getAttribute(attrName);
    if (val !== null && val !== '') return val;

    var styleAttr = node.getAttribute('style');
    if (styleAttr) {
      var match = new RegExp('(?:^|;)\\s*' + attrName + '\\s*:\\s*([^;]+)').exec(styleAttr);
      if (match) return match[1].trim();
    }

    var current = node.parentElement;
    while (current && current.nodeName !== 'svg') {
      var parentVal = current.getAttribute(attrName);
      if (parentVal !== null && parentVal !== '') return parentVal;
      var parentStyle = current.getAttribute('style');
      if (parentStyle) {
        var pMatch = new RegExp('(?:^|;)\\s*' + attrName + '\\s*:\\s*([^;]+)').exec(parentStyle);
        if (pMatch) return pMatch[1].trim();
      }
      current = current.parentElement;
    }
    return defaultValue;
  }

  function parseFilterStringToEffects(filterStr) {
    if (!filterStr || typeof filterStr !== 'string') return [];
    var effects = [];
    var regex = /([a-z-]+)\(([^)]+)\)/gi;
    var match;
    while ((match = regex.exec(filterStr)) !== null) {
      var type = match[1].toLowerCase();
      var rawVal = match[2].trim();
      var effectObj = { id: 'fx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), type: type, enabled: true };

      if (type === 'drop-shadow') {
        var dsParts = rawVal.split(/\s+/);
        var nums = [];
        var colParts = [];
        dsParts.forEach(function(p) {
          var num = parseFloat(p);
          if (!isNaN(num) && (p.endsWith('px') || /^-?\d+(\.\d+)?$/.test(p))) {
            nums.push(num);
          } else {
            colParts.push(p);
          }
        });
        effectObj.dx = nums[0] !== undefined ? nums[0] : 4;
        effectObj.dy = nums[1] !== undefined ? nums[1] : 4;
        effectObj.blur = nums[2] !== undefined ? nums[2] : 8;
        effectObj.color = colParts.join(' ') || 'rgba(0,0,0,0.5)';
        effectObj.label = '그림자';
      } else {
        var num = parseFloat(rawVal);
        var unit = rawVal.replace(/^[-\d.]+/, '').trim() || (type === 'blur' ? 'px' : (type === 'hue-rotate' ? 'deg' : '%'));
        effectObj.val = !isNaN(num) ? num : 100;
        effectObj.unit = unit;
        var preset = cfg.defaultFilterPresets && cfg.defaultFilterPresets[type];
        effectObj.label = preset ? preset.label : type;
      }
      effects.push(effectObj);
    }
    return effects;
  }

  function importSVGContent(svgString) {
    if (!svgString || typeof svgString !== 'string' || !svgString.trim()) {
      return false;
    }

    var parser = new DOMParser();
    var doc = parser.parseFromString(svgString, 'image/svg+xml');
    var parserError = doc.querySelector('parsererror');
    if (parserError) {
      return false;
    }

    var svgEl = doc.querySelector('svg');
    if (!svgEl) {
      return false;
    }

    var objectsGroup = document.getElementById('objectsGroup');
    if (!objectsGroup) {
      return false;
    }

    // Requirement 2: Wipe all existing objects on file import
    cfg.objectsMap.clear();
    cfg.selectedIds.clear();
    objectsGroup.innerHTML = '';
    var uiGroup = document.getElementById('uiGroup');
    if (uiGroup) uiGroup.innerHTML = '';

    var importedCount = 0;
    var unsupportedElements = [];

    function traverseNode(node, currentMatrix) {
      var nodeName = node.nodeName.toLowerCase();
      if (nodeName === '#text' || nodeName === '#comment' || nodeName === 'defs' || nodeName === 'style' || nodeName === 'title' || nodeName === 'desc') {
        return;
      }

      var transformAttr = node.getAttribute('transform');
      var nodeMatrix = combineTransforms(currentMatrix, transformAttr);

      if (nodeName === 'use') {
        var href = node.getAttribute('href') || node.getAttribute('xlink:href');
        if (href && href.startsWith('#')) {
          var targetEl = doc.querySelector(href);
          if (targetEl) {
            var useX = parseFloat(node.getAttribute('x') || 0);
            var useY = parseFloat(node.getAttribute('y') || 0);
            var useMatrix = combineTransforms(nodeMatrix, 'translate(' + useX + ',' + useY + ')');
            traverseNode(targetEl, useMatrix);
            return;
          }
        }
      }

      if (nodeName === 'svg' || nodeName === 'g') {
        for (var i = 0; i < node.childNodes.length; i++) {
          traverseNode(node.childNodes[i], nodeMatrix);
        }
        return;
      }

      var fill = getInheritedStyle(node, 'fill', '');
      var stroke = getInheritedStyle(node, 'stroke', 'none');
      var strokeWidth = parseFloat(getInheritedStyle(node, 'stroke-width', '1'));
      var opacity = parseFloat(getInheritedStyle(node, 'opacity', '1'));
      var fillOpacity = parseFloat(getInheritedStyle(node, 'fill-opacity', '1'));
      var strokeOpacity = parseFloat(getInheritedStyle(node, 'stroke-opacity', '1'));

      var id = 'obj_' + (cfg.nextId++);
      var type = null;
      var attrs = {
        fill: fill,
        stroke: stroke,
        strokeWidth: isNaN(strokeWidth) ? 1 : strokeWidth,
        opacity: isNaN(opacity) ? 1 : opacity,
        fillOpacity: isNaN(fillOpacity) ? 1 : fillOpacity,
        strokeOpacity: isNaN(strokeOpacity) ? 1 : strokeOpacity
      };

      var el = null;

      if (nodeName === 'rect') {
        type = 'rect';
        el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        var rX = node.getAttribute('x');
        var rY = node.getAttribute('y');
        attrs.x = rX !== null ? parseFloat(rX) : (nodeMatrix ? nodeMatrix[4] : 0);
        attrs.y = rY !== null ? parseFloat(rY) : (nodeMatrix ? nodeMatrix[5] : 0);
        if (rX === null && rY === null && nodeMatrix) {
          nodeMatrix = [nodeMatrix[0], nodeMatrix[1], nodeMatrix[2], nodeMatrix[3], 0, 0];
        }
        attrs.width = parseFloat(node.getAttribute('width') || 0);
        attrs.height = parseFloat(node.getAttribute('height') || 0);
        attrs.rx = parseFloat(node.getAttribute('rx') || 0);
      } else if (nodeName === 'circle' || nodeName === 'ellipse') {
        type = 'ellipse';
        el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        var rawCx = node.getAttribute('cx');
        var rawCy = node.getAttribute('cy');
        attrs.cx = rawCx !== null ? parseFloat(rawCx) : (nodeMatrix ? nodeMatrix[4] : 0);
        attrs.cy = rawCy !== null ? parseFloat(rawCy) : (nodeMatrix ? nodeMatrix[5] : 0);
        if (rawCx === null && rawCy === null && nodeMatrix) {
          nodeMatrix = [nodeMatrix[0], nodeMatrix[1], nodeMatrix[2], nodeMatrix[3], 0, 0];
        }
        if (nodeName === 'circle') {
          var r = parseFloat(node.getAttribute('r') || 0);
          attrs.rx = r;
          attrs.ry = r;
        } else {
          attrs.rx = parseFloat(node.getAttribute('rx') || 0);
          attrs.ry = parseFloat(node.getAttribute('ry') || 0);
        }
      } else if (nodeName === 'line') {
        type = 'line';
        el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        attrs.x1 = parseFloat(node.getAttribute('x1') || 0);
        attrs.y1 = parseFloat(node.getAttribute('y1') || 0);
        attrs.x2 = parseFloat(node.getAttribute('x2') || 0);
        attrs.y2 = parseFloat(node.getAttribute('y2') || 0);
      } else if (nodeName === 'polyline' || nodeName === 'polygon') {
        type = 'bez3';
        el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        var ptsStr = (node.getAttribute('points') || '').trim();
        var rawCoords = ptsStr.split(/[\s,]+/).map(Number).filter(function(n) { return !isNaN(n); });
        var pairs = [];
        for (var p = 0; p < rawCoords.length; p += 2) {
          if (rawCoords[p + 1] !== undefined) {
            pairs.push(rawCoords[p] + ' ' + rawCoords[p + 1]);
          }
        }
        if (pairs.length > 0) {
          attrs.pathD = 'M ' + pairs.join(' L ') + (nodeName === 'polygon' ? ' Z' : '');
        } else {
          attrs.pathD = '';
        }
      } else if (nodeName === 'path') {
        type = 'bez3';
        el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        attrs.pathD = node.getAttribute('d') || '';
      } else if (nodeName === 'text') {
        type = 'text';
        el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        var textStr = node.textContent || '';
        attrs.text = textStr.trim();
        var rawTX = node.getAttribute('x');
        var rawTY = node.getAttribute('y');
        var parsedTX = rawTX !== null ? parseFloat(rawTX) : NaN;
        var parsedTY = rawTY !== null ? parseFloat(rawTY) : NaN;
        attrs.x = !isNaN(parsedTX) ? parsedTX : (nodeMatrix && !isNaN(nodeMatrix[4]) ? nodeMatrix[4] : 0);
        attrs.y = !isNaN(parsedTY) ? parsedTY : (nodeMatrix && !isNaN(nodeMatrix[5]) ? nodeMatrix[5] : 0);
        if (rawTX === null && rawTY === null && nodeMatrix) {
          nodeMatrix = [nodeMatrix[0], nodeMatrix[1], nodeMatrix[2], nodeMatrix[3], 0, 0];
        }
        var rawFS = parseFloat(node.getAttribute('font-size') || getInheritedStyle(node, 'font-size', '16'));
        attrs.fontSize = !isNaN(rawFS) ? rawFS : 16;
        attrs.fontFamily = node.getAttribute('font-family') || getInheritedStyle(node, 'font-family', 'sans-serif');
        attrs.fontWeight = node.getAttribute('font-weight') || getInheritedStyle(node, 'font-weight', 'normal');
        attrs.fontStyle = node.getAttribute('font-style') || getInheritedStyle(node, 'font-style', 'normal');
      } else if (nodeName === 'image') {
        type = 'image';
        el = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        attrs.x = parseFloat(node.getAttribute('x') || 0);
        attrs.y = parseFloat(node.getAttribute('y') || 0);
        attrs.width = parseFloat(node.getAttribute('width') || 100);
        attrs.height = parseFloat(node.getAttribute('height') || 100);
        attrs.href = node.getAttribute('href') || node.getAttribute('xlink:href') || '';
        el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', attrs.href);
      } else {
        unsupportedElements.push(nodeName);
        return;
      }

      if (el && type) {
        var filterAttr = getInheritedStyle(node, 'filter', '');
        if (filterAttr) {
          attrs.filter = filterAttr;
          attrs.filterList = parseFilterStringToEffects(filterAttr);
        }

        el.setAttribute('id', id);
        if (nodeMatrix) {
          el.setAttribute('transform', 'matrix(' + nodeMatrix.join(' ') + ')');
        }

        var objData = { id: id, type: type, attrs: attrs, el: el };
        cfg.objectsMap.set(id, objData);
        if (window.WebpointerRender && window.WebpointerRender.updateElementAttributes) {
          window.WebpointerRender.updateElementAttributes(objData);
        }
        objectsGroup.appendChild(el);
        importedCount++;
      }
    }

    for (var j = 0; j < svgEl.childNodes.length; j++) {
      traverseNode(svgEl.childNodes[j], null);
    }

    // Requirement 3: Auto-fit width 100% and resize canvas height if graphic is taller
    var mainSvg = document.getElementById('mainSvg');
    if (mainSvg) {
      var viewBoxAttr = svgEl.getAttribute('viewBox');
      var svgW = parseFloat(svgEl.getAttribute('width'));
      var svgH = parseFloat(svgEl.getAttribute('height'));

      if (viewBoxAttr) {
        var vbParts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
        if (vbParts.length === 4 && vbParts[2] > 0 && vbParts[3] > 0) {
          svgW = vbParts[2];
          svgH = vbParts[3];
        }
      }

      if (!svgW || isNaN(svgW)) svgW = 960;
      if (!svgH || isNaN(svgH)) svgH = 540;

      cfg.SVG_WIDTH = svgW;
      cfg.SVG_HEIGHT = svgH;
      mainSvg.setAttribute('viewBox', '0 0 ' + svgW + ' ' + svgH);
      mainSvg.style.height = 'auto';

      var svgWrapper = document.getElementById('svgWrapper');
      if (svgWrapper) {
        if (svgW < svgH) {
          // Portrait (tall) graphic: constrain wrapper max-width to comfortable reading size (e.g. 640px)
          svgWrapper.style.maxWidth = Math.min(640, Math.round(960 * (svgW / svgH))) + 'px';
        } else {
          svgWrapper.style.maxWidth = '960px';
        }
      }
    }

    if (window.WebpointerRender) {
      window.WebpointerRender.renderGrid();
      window.WebpointerRender.renderUI();
      window.WebpointerRender.renderRibbon();
    }

    return true;
  }

  window.WebpointerSVGImporter = {
    importSVGContent: importSVGContent,
    parseMatrixTransform: parseMatrixTransform,
    combineTransforms: combineTransforms,
    parseFilterStringToEffects: parseFilterStringToEffects
  };
  window.WebpointerSvgImporter = window.WebpointerSVGImporter;
})(window);
