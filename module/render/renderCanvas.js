(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;

  function compileFilterString(filterList) {
    if (!filterList || !Array.isArray(filterList)) return '';
    var parts = [];
    filterList.forEach(function(item) {
      if (item && item.enabled !== false) {
        if (typeof item === 'string') {
          parts.push(item);
        } else if (item.type === 'drop-shadow') {
          var dx = item.dx !== undefined ? item.dx : 4;
          var dy = item.dy !== undefined ? item.dy : 4;
          var blur = item.blur !== undefined ? item.blur : 8;
          var color = item.color || 'rgba(0,0,0,0.5)';
          parts.push('drop-shadow(' + dx + 'px ' + dy + 'px ' + blur + 'px ' + color + ')');
        } else if (item.type === 'glow') {
          var gBlur = item.blur !== undefined ? item.blur : 10;
          var gColor = item.color || '#38bdf8';
          parts.push('drop-shadow(0px 0px ' + gBlur + 'px ' + gColor + ')');
        } else if (item.type) {
          var val = item.val !== undefined ? item.val : (item.value !== undefined ? item.value : 0);
          var unit = item.unit || (item.type === 'blur' ? 'px' : (item.type === 'hue-rotate' ? 'deg' : '%'));
          parts.push(item.type + '(' + val + unit + ')');
        }
      }
    });
    return parts.join(' ');
  }

  function updateElementAttributes(obj) {
    if (!obj || !obj.el) return;
    var a = obj.attrs;

    if (obj.type === 'point') {
      var safeCX = (a.cx !== undefined && a.cx !== null && !isNaN(parseFloat(a.cx))) ? parseFloat(a.cx) : 0;
      var safeCY = (a.cy !== undefined && a.cy !== null && !isNaN(parseFloat(a.cy))) ? parseFloat(a.cy) : 0;
      obj.el.setAttribute('cx', safeCX);
      obj.el.setAttribute('cy', safeCY);
      obj.el.setAttribute('r', a.r || cfg.pointRadius || 5);
    } else if (obj.type === 'line') {
      var safeX1 = (a.x1 !== undefined && a.x1 !== null && !isNaN(parseFloat(a.x1))) ? parseFloat(a.x1) : 0;
      var safeY1 = (a.y1 !== undefined && a.y1 !== null && !isNaN(parseFloat(a.y1))) ? parseFloat(a.y1) : 0;
      var safeX2 = (a.x2 !== undefined && a.x2 !== null && !isNaN(parseFloat(a.x2))) ? parseFloat(a.x2) : 0;
      var safeY2 = (a.y2 !== undefined && a.y2 !== null && !isNaN(parseFloat(a.y2))) ? parseFloat(a.y2) : 0;
      obj.el.setAttribute('x1', safeX1);
      obj.el.setAttribute('y1', safeY1);
      obj.el.setAttribute('x2', safeX2);
      obj.el.setAttribute('y2', safeY2);
    } else if (obj.type === 'rect' || obj.type === 'rounded' || obj.type === 'image') {
      var safeX = (a.x !== undefined && a.x !== null && !isNaN(parseFloat(a.x))) ? parseFloat(a.x) : 0;
      var safeY = (a.y !== undefined && a.y !== null && !isNaN(parseFloat(a.y))) ? parseFloat(a.y) : 0;
      obj.el.setAttribute('x', safeX);
      obj.el.setAttribute('y', safeY);
      obj.el.setAttribute('width', Math.max(1, (!isNaN(parseFloat(a.width)) ? parseFloat(a.width) : 100)));
      obj.el.setAttribute('height', Math.max(1, (!isNaN(parseFloat(a.height)) ? parseFloat(a.height) : 100)));
      if (obj.type === 'rounded') {
        obj.el.setAttribute('rx', (a.rx !== undefined && !isNaN(parseFloat(a.rx))) ? parseFloat(a.rx) : 15);
      }
      if (obj.type === 'image' && a.href) {
        obj.el.setAttribute('href', a.href);
        obj.el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', a.href);
        if (a.preserveAspectRatio) {
          obj.el.setAttribute('preserveAspectRatio', a.preserveAspectRatio);
        }
      }
      if (a.angle) {
        var center = window.WebpointerObjects ? window.WebpointerObjects.getObjectCenter(obj) : { x: safeX + (a.width || 100) / 2, y: safeY + (a.height || 100) / 2 };
        obj.el.setAttribute('transform', 'rotate(' + a.angle + ' ' + center.x + ' ' + center.y + ')');
      } else {
        obj.el.removeAttribute('transform');
      }
    } else if (obj.type === 'ellipse') {
      var safeCX = (a.cx !== undefined && a.cx !== null && !isNaN(parseFloat(a.cx))) ? parseFloat(a.cx) : 0;
      var safeCY = (a.cy !== undefined && a.cy !== null && !isNaN(parseFloat(a.cy))) ? parseFloat(a.cy) : 0;
      obj.el.setAttribute('cx', safeCX);
      obj.el.setAttribute('cy', safeCY);
      obj.el.setAttribute('rx', Math.max(1, (!isNaN(parseFloat(a.rx)) ? parseFloat(a.rx) : 10)));
      obj.el.setAttribute('ry', Math.max(1, (!isNaN(parseFloat(a.ry)) ? parseFloat(a.ry) : 10)));
      if (a.angle) {
        obj.el.setAttribute('transform', 'rotate(' + a.angle + ' ' + safeCX + ' ' + safeCY + ')');
      } else {
        obj.el.removeAttribute('transform');
      }
    } else if (obj.type === 'arc') {
      var safeCX = (a.cx !== undefined && a.cx !== null && !isNaN(parseFloat(a.cx))) ? parseFloat(a.cx) : 0;
      var safeCY = (a.cy !== undefined && a.cy !== null && !isNaN(parseFloat(a.cy))) ? parseFloat(a.cy) : 0;
      obj.el.setAttribute('cx', safeCX);
      obj.el.setAttribute('cy', safeCY);
      obj.el.setAttribute('rx', Math.max(1, (!isNaN(parseFloat(a.rx)) ? parseFloat(a.rx) : 10)));
      obj.el.setAttribute('ry', Math.max(1, (!isNaN(parseFloat(a.ry)) ? parseFloat(a.ry) : 10)));

      var rot = a.angle || 0;
      var sAng = a.startAngle !== undefined ? a.startAngle : -90;
      var eAng = a.endAngle !== undefined ? a.endAngle : 0;

      function getArcPoint(cx, cy, rx, ry, deg, rotDeg) {
        var rad = deg * (Math.PI / 180);
        var rotRad = rotDeg * (Math.PI / 180);
        var px = rx * Math.cos(rad);
        var py = ry * Math.sin(rad);
        var rxRot = px * Math.cos(rotRad) - py * Math.sin(rotRad);
        var ryRot = px * Math.sin(rotRad) + py * Math.cos(rotRad);
        return { x: cx + rxRot, y: cy + ryRot };
      }

      var p1 = getArcPoint(a.cx, a.cy, a.rx, a.ry, sAng, rot);
      var p2 = getArcPoint(a.cx, a.cy, a.rx, a.ry, eAng, rot);

      var sweepDiff = (eAng - sAng + 360) % 360;
      var largeArcFlag = sweepDiff > 180 ? 1 : 0;

      var d = 'M ' + p1.x + ' ' + p1.y +
              ' A ' + a.rx + ' ' + a.ry + ' ' + rot + ' ' + largeArcFlag + ' 1 ' + p2.x + ' ' + p2.y;
      obj.el.setAttribute('d', d);
    } else if (obj.type === 'bez2' || obj.type === 'bez3') {
      if (a.pathD) {
        obj.el.setAttribute('d', a.pathD);
      } else if (obj.type === 'bez2') {
        obj.el.setAttribute('d', 'M ' + a.x1 + ' ' + a.y1 + ' Q ' + a.cx + ' ' + a.cy + ' ' + a.x2 + ' ' + a.y2);
      } else if (obj.type === 'bez3') {
        obj.el.setAttribute('d', 'M ' + a.x1 + ' ' + a.y1 + ' C ' + a.c1x + ' ' + a.c1y + ', ' + a.c2x + ' ' + a.c2y + ', ' + a.x2 + ' ' + a.y2);
      }
    } else if (obj.type === 'text') {
      var safeX = (a.x !== undefined && a.x !== null && !isNaN(parseFloat(a.x))) ? parseFloat(a.x) : 0;
      var safeY = (a.y !== undefined && a.y !== null && !isNaN(parseFloat(a.y))) ? parseFloat(a.y) : 0;
      obj.el.setAttribute('x', safeX);
      obj.el.setAttribute('y', safeY);
      var fSize = a.fontSize !== undefined ? a.fontSize : (cfg.fontSize || 20);
      var fFamily = a.fontFamily || cfg.fontFamily || 'sans-serif';
      var fWeight = a.fontWeight || cfg.fontWeight || 'normal';
      var fStyle = a.fontStyle || cfg.fontStyle || 'normal';
      var tDeco = a.textDecoration || cfg.textDecoration || 'none';
      var tAnchor = a.textAnchor || cfg.textAnchor || 'start';
      var lHeight = a.lineHeight !== undefined ? a.lineHeight : (cfg.lineHeight || 1.2);

      var dBase = a.dominantBaseline || cfg.textDominantBaseline || 'hanging';
      var wMode = a.writingMode || cfg.textWritingMode || 'horizontal-tb';

      var uColor  = a.underlineColor || cfg.textUnderlineColor || 'currentColor';
      var uStyle  = a.underlineStyle || cfg.textUnderlineStyle || 'solid';
      var uOffset = a.underlineOffset !== undefined ? a.underlineOffset : (cfg.textUnderlineOffset !== undefined ? cfg.textUnderlineOffset : 3);
      var uWidth  = a.underlineWidth !== undefined ? a.underlineWidth : (cfg.textUnderlineWidth !== undefined ? cfg.textUnderlineWidth : 1);

      obj.el.setAttribute('font-size', fSize);
      obj.el.setAttribute('font-family', fFamily);
      obj.el.setAttribute('font-weight', fWeight);
      obj.el.setAttribute('font-style', fStyle);
      var isJustify = (tAnchor === 'justify');
      obj.el.setAttribute('dominant-baseline', dBase);
      obj.el.setAttribute('writing-mode', wMode);

      var textFill = (a.fill !== undefined && a.fill !== null) ? a.fill : (cfg.textFillColor || cfg.textColor || '#041e49');
      obj.el.setAttribute('fill', textFill);

      var textStroke = (a.stroke !== undefined && a.stroke !== null) ? a.stroke : (cfg.textStrokeColor || 'none');
      if (textStroke && textStroke !== 'none') {
        obj.el.setAttribute('stroke', textStroke);
        var tStrokeWidth = a.strokeWidth !== undefined ? a.strokeWidth : (cfg.textStrokeWidth || 1);
        obj.el.setAttribute('stroke-width', tStrokeWidth);
        obj.el.setAttribute('paint-order', 'stroke fill');
      } else {
        obj.el.removeAttribute('stroke');
        obj.el.removeAttribute('stroke-width');
        obj.el.removeAttribute('paint-order');
      }

      var hostShape = null;
      if (obj.parentId) {
        cfg.objectsMap.forEach(function(o) {
          if (o.parentId === obj.parentId && o.type !== 'text') {
            hostShape = o;
          }
        });
      }

      var pad = 10;
      var hostBounds = hostShape ? (window.WebpointerObjects ? window.WebpointerObjects.getObjectBounds(hostShape) : null) : null;

      if (isJustify && hostBounds) {
        safeX = Math.round(hostBounds.minX + pad);
        a.x = safeX;
        obj.el.setAttribute('x', safeX);
      }

      obj.el.setAttribute('text-anchor', isJustify ? 'start' : tAnchor);

      var lines = (a.text || '').split('\n');
      obj.el.innerHTML = '';
      if (lines.length <= 1) {
        obj.el.textContent = a.text || '';
      } else {
        var fontSizeNum = parseInt(fSize, 10);
        lines.forEach(function(lineStr, idx) {
          var tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tspan.setAttribute('x', safeX);
          if (idx === 0) {
            tspan.setAttribute('dy', 0);
          } else {
            tspan.setAttribute('dy', (fontSizeNum * lHeight) + 'px');
          }
          tspan.textContent = lineStr || '\u200B';
          obj.el.appendChild(tspan);
        });
      }

      var existingTspans = obj.el.querySelectorAll('tspan');
      if (isJustify) {
        var hostDimension = 0;
        var isVertical = (wMode === 'vertical-rl' || wMode === 'tb-rl');
        if (hostBounds) {
          hostDimension = isVertical ? (hostBounds.maxY - hostBounds.minY) : (hostBounds.maxX - hostBounds.minX);
        } else if (isVertical) {
          hostDimension = a.height || 100;
        } else {
          hostDimension = a.width || 100;
        }

        var targetDim = Math.max(10, hostDimension - (pad * 2));

        if (existingTspans && existingTspans.length > 0) {
          existingTspans.forEach(function(ts) {
            var lineStr = ts.textContent || '';
            var spaceCount = (lineStr.match(/ /g) || []).length;
            var lineLen = 0;
            try {
              lineLen = ts.getComputedTextLength ? ts.getComputedTextLength() : 0;
            } catch(e) {}

            if (spaceCount > 0 && targetDim > lineLen && lineLen > 0) {
              var extraWordSpace = (targetDim - lineLen) / spaceCount;
              ts.style.wordSpacing = extraWordSpace.toFixed(2) + 'px';
            } else if (spaceCount > 0 && targetDim > 0) {
              var estCharW = (parseInt(fSize, 10) || 20) * 0.6;
              var estLen = (lineStr.length - spaceCount) * estCharW + spaceCount * (estCharW * 0.5);
              if (targetDim > estLen) {
                var extraWordSpaceEst = (targetDim - estLen) / spaceCount;
                ts.style.wordSpacing = extraWordSpaceEst.toFixed(2) + 'px';
              } else {
                ts.style.wordSpacing = '';
              }
            } else {
              ts.style.wordSpacing = '';
            }
          });
          obj.el.style.wordSpacing = '';
        } else {
          // Single-line text justification
          var textContent = a.text || obj.el.textContent || '';
          var spaceCountSingle = (textContent.match(/ /g) || []).length;
          var computedLenSingle = 0;
          try {
            computedLenSingle = obj.el.getComputedTextLength ? obj.el.getComputedTextLength() : 0;
          } catch(e) {}

          if (spaceCountSingle > 0 && targetDim > computedLenSingle && computedLenSingle > 0) {
            var extraSingle = (targetDim - computedLenSingle) / spaceCountSingle;
            obj.el.style.wordSpacing = extraSingle.toFixed(2) + 'px';
          } else if (spaceCountSingle > 0 && targetDim > 0) {
            var estCharW2 = (parseInt(fSize, 10) || 20) * 0.6;
            var estLen2 = (textContent.length - spaceCountSingle) * estCharW2 + spaceCountSingle * (estCharW2 * 0.5);
            if (targetDim > estLen2) {
              var extraSingleEst = (targetDim - estLen2) / spaceCountSingle;
              obj.el.style.wordSpacing = extraSingleEst.toFixed(2) + 'px';
            } else {
              obj.el.style.wordSpacing = '';
            }
          } else {
            obj.el.style.wordSpacing = '';
          }
        }
      } else {
        obj.el.style.wordSpacing = '';
        if (existingTspans && existingTspans.length > 0) {
          existingTspans.forEach(function(ts) {
            ts.style.wordSpacing = '';
          });
        }
      }

      // Render Custom SVG Underline Path Element
      if (uStyle !== 'none') {
        if (!obj.underlineEl) {
          var uEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          uEl.setAttribute('class', 'custom-text-underline');
          obj.underlineEl = uEl;
        }
        var objectsGroup = document.getElementById('objectsGroup');
        if (objectsGroup && (!obj.underlineEl.parentNode || obj.underlineEl.parentNode !== objectsGroup)) {
          objectsGroup.appendChild(obj.underlineEl);
        }

        var fontSizeNum = parseInt(fSize, 10);
        var strokeDash = 'none';
        if (uStyle === 'dashed') strokeDash = '6,4';
        else if (uStyle === 'dotted') strokeDash = '2,3';

        var dPath = '';
        lines.forEach(function(lineStr, idx) {
          var lineY = safeY + (idx * fontSizeNum * lHeight);
          var uY = lineY + uOffset;

          var lWidth = (lineStr || '').length * fontSizeNum * 0.55;
          try {
            if (obj.el && obj.el.getBBox) {
              var bb = obj.el.getBBox();
              if (bb.width > 0) lWidth = bb.width;
            }
          } catch(e) {}

          var x1 = safeX;
          var x2 = safeX + lWidth;
          if (tAnchor === 'middle') {
            x1 = a.x - (lWidth / 2);
            x2 = a.x + (lWidth / 2);
          } else if (tAnchor === 'end') {
            x1 = a.x - lWidth;
            x2 = a.x;
          }

          if (uStyle === 'double') {
            dPath += 'M ' + x1 + ' ' + uY + ' L ' + x2 + ' ' + uY + ' ';
            dPath += 'M ' + x1 + ' ' + (uY + Math.max(2, uWidth + 1)) + ' L ' + x2 + ' ' + (uY + Math.max(2, uWidth + 1)) + ' ';
          } else if (uStyle === 'wavy') {
            dPath += 'M ' + x1 + ' ' + uY + ' ';
            for (var wx = x1; wx < x2; wx += 6) {
              var nextX = Math.min(x2, wx + 6);
              var midX = (wx + nextX) / 2;
              dPath += 'Q ' + midX + ' ' + (uY - 2.5) + ' ' + nextX + ' ' + uY + ' ';
            }
          } else {
            dPath += 'M ' + x1 + ' ' + uY + ' L ' + x2 + ' ' + uY + ' ';
          }
        });

        obj.underlineEl.setAttribute('d', dPath);
        obj.underlineEl.setAttribute('stroke', uColor);
        obj.underlineEl.setAttribute('stroke-width', uWidth);
        obj.underlineEl.setAttribute('fill', 'none');
        obj.underlineEl.setAttribute('stroke-linecap', 'round');
        if (strokeDash !== 'none') {
          obj.underlineEl.setAttribute('stroke-dasharray', strokeDash);
        } else {
          obj.underlineEl.removeAttribute('stroke-dasharray');
        }

        var opVal = a.opacity !== undefined ? a.opacity : (cfg.opacity !== undefined ? cfg.opacity : 1);
        if (opVal < 1) {
          obj.underlineEl.setAttribute('opacity', opVal);
        } else {
          obj.underlineEl.removeAttribute('opacity');
        }
      } else {
        if (obj.underlineEl) {
          if (obj.underlineEl.parentNode) {
            obj.underlineEl.parentNode.removeChild(obj.underlineEl);
          }
          obj.underlineEl = null;
        }
      }

      var textBounds = window.WebpointerObjects ? window.WebpointerObjects.getObjectBounds(obj) : null;
      var textCX = textBounds ? (textBounds.minX + textBounds.maxX) / 2 : a.x;
      var textCY = textBounds ? (textBounds.minY + textBounds.maxY) / 2 : a.y;
      if (a.angle) {
        obj.el.setAttribute('transform', 'rotate(' + a.angle + ' ' + textCX + ' ' + textCY + ')');
        if (obj.underlineEl) {
          obj.underlineEl.setAttribute('transform', 'rotate(' + a.angle + ' ' + textCX + ' ' + textCY + ')');
        }
      } else {
        obj.el.removeAttribute('transform');
        if (obj.underlineEl) {
          obj.underlineEl.removeAttribute('transform');
        }
      }
    }

    if (obj.type !== 'text') {
      if (a.stroke !== undefined) obj.el.setAttribute('stroke', a.stroke);
      if (a.fill !== undefined) obj.el.setAttribute('fill', a.fill);
      if (a.strokeWidth !== undefined) obj.el.setAttribute('stroke-width', a.strokeWidth);
    }

    var op = a.opacity !== undefined ? a.opacity : (cfg.opacity !== undefined ? cfg.opacity : 1);
    if (op < 1) {
      obj.el.setAttribute('opacity', op);
    } else {
      obj.el.removeAttribute('opacity');
    }

    if (a.fillOpacity !== undefined && parseFloat(a.fillOpacity) < 1) {
      obj.el.setAttribute('fill-opacity', a.fillOpacity);
    } else {
      obj.el.removeAttribute('fill-opacity');
    }

    if (a.strokeOpacity !== undefined && parseFloat(a.strokeOpacity) < 1) {
      obj.el.setAttribute('stroke-opacity', a.strokeOpacity);
    } else {
      obj.el.removeAttribute('stroke-opacity');
    }

    var dashStyle = a.strokeDashStyle || 'solid';
    var dashArray = a.strokeDashArray || '6,6';
    if (dashStyle === 'dashed' && dashArray) {
      obj.el.setAttribute('stroke-dasharray', dashArray);
    } else {
      obj.el.removeAttribute('stroke-dasharray');
    }

    var strokeCap = a.strokeCap || cfg.strokeCap || 'butt';
    var strokeJoin = a.strokeJoin || cfg.strokeJoin || 'miter';
    obj.el.setAttribute('stroke-linecap', strokeCap);
    obj.el.setAttribute('stroke-linejoin', strokeJoin);

    // Stacked Non-destructive Filter Effects
    var filterStr = '';
    if (a.filterList && Array.isArray(a.filterList) && a.filterList.length > 0) {
      filterStr = compileFilterString(a.filterList);
    } else if (a.filter) {
      filterStr = a.filter;
    } else if (cfg.filterStr) {
      filterStr = cfg.filterStr;
    }

    if (filterStr) {
      obj.el.setAttribute('filter', filterStr);
      obj.el.style.filter = filterStr;
    } else {
      obj.el.removeAttribute('filter');
      obj.el.style.filter = '';
    }

    // Non-destructive Clip-path Cropping
    var mainSvg = document.getElementById('mainSvg');
    if (mainSvg) {
      var clipId = 'crop_clip_' + obj.id;
      var existingClip = document.getElementById(clipId);
      var cL = a.cropLeft || 0, cT = a.cropTop || 0, cR = a.cropRight || 0, cB = a.cropBottom || 0;
      var hasCrop = a.crop || (cL > 0 || cT > 0 || cR > 0 || cB > 0);
      if (hasCrop) {
        var defs = mainSvg.querySelector('defs');
        if (!defs) {
          defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          defs.setAttribute('id', 'svgDefs');
          mainSvg.insertBefore(defs, mainSvg.firstChild);
        }
        if (!existingClip) {
          existingClip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
          existingClip.setAttribute('id', clipId);
          defs.appendChild(existingClip);
        }
        var cx = a.x || 0, cy = a.y || 0, cw = a.width || a.w || 100, ch = a.height || a.h || 100;
        var cL = a.cropLeft || 0, cT = a.cropTop || 0, cR = a.cropRight || 0, cB = a.cropBottom || 0;
        if (a.crop) {
          cx = a.crop.x; cy = a.crop.y; cw = a.crop.w; ch = a.crop.h;
        } else {
          cx = (a.x || 0) + (cw * cL);
          cy = (a.y || 0) + (ch * cT);
          cw = cw * (1 - cL - cR);
          ch = ch * (1 - cT - cB);
        }
        var rectChild = existingClip.querySelector('rect');
        if (!rectChild) {
          rectChild = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          existingClip.appendChild(rectChild);
        }
        rectChild.setAttribute('x', cx);
        rectChild.setAttribute('y', cy);
        rectChild.setAttribute('width', Math.max(1, cw));
        rectChild.setAttribute('height', Math.max(1, ch));
        obj.el.setAttribute('clip-path', 'url(#' + clipId + ')');
      } else if (a.clipPath || a.symbolClip) {
        var symClipId = 'sym_clip_' + obj.id;
        var clipUrl = a.clipPath || ('url(#' + symClipId + ')');
        obj.el.setAttribute('clip-path', clipUrl);
      } else {
        if (existingClip && existingClip.parentNode) {
          existingClip.parentNode.removeChild(existingClip);
        }
        obj.el.removeAttribute('clip-path');
      }
    }

    if (cfg.currentTool === 'select') {
      if (cfg.selectedIds.has(obj.id)) {
        obj.el.style.cursor = 'move';
      } else {
        obj.el.style.cursor = 'pointer';
      }
    } else {
      obj.el.style.cursor = 'crosshair';
    }
  }

  function createHandleNode(x, y, objId, handleType, idx, isSpecial, customStyle) {
    var uiGroup = document.getElementById('uiGroup');
    if (!uiGroup) return;

    var safeX = (x !== undefined && !isNaN(parseFloat(x))) ? parseFloat(x) : 0;
    var safeY = (y !== undefined && !isNaN(parseFloat(y))) ? parseFloat(y) : 0;

    var handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    handle.setAttribute('cx', safeX);
    handle.setAttribute('cy', safeY);
    var radius = (customStyle && customStyle.r) ? customStyle.r : (isSpecial ? 5 : 4.5);
    var fillColor = (customStyle && customStyle.fill) ? customStyle.fill : (isSpecial ? '#0284c7' : '#ffffff');
    var strokeColor = (customStyle && customStyle.stroke) ? customStyle.stroke : '#0284c7';
    var strokeWidth = (customStyle && customStyle.strokeWidth) ? customStyle.strokeWidth : '1.5';

    handle.setAttribute('r', radius);
    handle.setAttribute('fill', fillColor);
    handle.setAttribute('stroke', strokeColor);
    handle.setAttribute('stroke-width', strokeWidth);
    if (customStyle && customStyle.dashArray) {
      handle.setAttribute('stroke-dasharray', customStyle.dashArray);
    }
    handle.setAttribute('class', 'handle-node');
    handle.dataset.objId = objId;
    handle.dataset.handleType = handleType;
    handle.dataset.idx = idx;
    uiGroup.appendChild(handle);
  }

  function renderUI() {
    var uiGroup = document.getElementById('uiGroup');
    if (!uiGroup) return;

    var activeCaret = document.getElementById('canvasBlinkingCaret');
    var activeSelGroup = document.getElementById('canvasTextSelectionGroup');

    uiGroup.innerHTML = '';

    if (activeSelGroup) uiGroup.appendChild(activeSelGroup);
    if (activeCaret) uiGroup.appendChild(activeCaret);

    if (cfg.selectedIds.size === 0) return;

    var self = this;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (!obj) return;
      var a = obj.attrs || obj;

      if (obj.type === 'point') {
        var r = a.r || 5;
        minX = Math.min(minX, a.cx - r);
        maxX = Math.max(maxX, a.cx + r);
        minY = Math.min(minY, a.cy - r);
        maxY = Math.max(maxY, a.cy + r);
      } else if (obj.type === 'line') {
        minX = Math.min(minX, a.x1, a.x2);
        maxX = Math.max(maxX, a.x1, a.x2);
        minY = Math.min(minY, a.y1, a.y2);
        maxY = Math.max(maxY, a.y1, a.y2);
      } else if (obj.type === 'rect' || obj.type === 'rounded' || obj.type === 'image') {
        var b = window.WebpointerObjects ? window.WebpointerObjects.getObjectBounds(obj) : { minX: a.x, maxX: a.x + a.width, minY: a.y, maxY: a.y + a.height };
        minX = Math.min(minX, b.minX);
        maxX = Math.max(maxX, b.maxX);
        minY = Math.min(minY, b.minY);
        maxY = Math.max(maxY, b.maxY);
      } else if (obj.type === 'ellipse' || obj.type === 'arc') {
        minX = Math.min(minX, a.cx - a.rx);
        maxX = Math.max(maxX, a.cx + a.rx);
        minY = Math.min(minY, a.cy - a.ry);
        maxY = Math.max(maxY, a.cy + a.ry);
      } else if (obj.type === 'bez2' || obj.type === 'bez3') {
        if (a.points && a.points.length > 0) {
          a.points.forEach(function(pt) {
            minX = Math.min(minX, pt.px);
            maxX = Math.max(maxX, pt.px);
            minY = Math.min(minY, pt.py);
            maxY = Math.max(maxY, pt.py);
          });
        } else {
          minX = Math.min(minX, a.x1, a.x2, a.cx !== undefined ? a.cx : a.x1);
          maxX = Math.max(maxX, a.x1, a.x2, a.cx !== undefined ? a.cx : a.x1);
          minY = Math.min(minY, a.y1, a.y2, a.cy !== undefined ? a.cy : a.y1);
          maxY = Math.max(maxY, a.y1, a.y2, a.cy !== undefined ? a.cy : a.y1);
        }
      } else if (obj.type === 'text') {
        var hasBBox = false;
        try {
          if (obj.el) {
            var bb = obj.el.getBBox();
            if (bb && bb.width > 0 && bb.height > 0) {
              minX = Math.min(minX, bb.x);
              maxX = Math.max(maxX, bb.x + bb.width);
              minY = Math.min(minY, bb.y);
              maxY = Math.max(maxY, bb.y + bb.height);
              hasBBox = true;
            }
          }
        } catch(e) {}
        if (!hasBBox) {
          var fontSize = parseInt(a.fontSize || 20, 10);
          var approxW = (a.text || '').length * (fontSize * 0.55);
          minX = Math.min(minX, a.x);
          maxX = Math.max(maxX, a.x + approxW);
          minY = Math.min(minY, a.y - fontSize);
          maxY = Math.max(maxY, a.y + 4);
        }
      }
    });

    if (minX !== Infinity && isFinite(minX) && isFinite(maxX) && isFinite(minY) && isFinite(maxY) && !isNaN(minX) && !isNaN(maxX)) {
      var pad = 4;
      var boxRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      boxRect.setAttribute('x', minX - pad);
      boxRect.setAttribute('y', minY - pad);
      boxRect.setAttribute('width', Math.max(1, (maxX - minX) + pad * 2));
      boxRect.setAttribute('height', Math.max(1, (maxY - minY) + pad * 2));
      boxRect.setAttribute('fill', 'none');
      boxRect.setAttribute('stroke', '#0284c7');
      boxRect.setAttribute('stroke-width', '1.2');
      boxRect.setAttribute('stroke-dasharray', '4,4');
      boxRect.setAttribute('pointer-events', 'stroke');
      boxRect.style.cursor = 'move';

      var targetAngleObj = null;
      if (cfg.selectedIds.size >= 1) {
        cfg.selectedIds.forEach(function(sId) {
          var sObj = cfg.objectsMap.get(sId);
          if (sObj && sObj.attrs && sObj.attrs.angle && !targetAngleObj) {
            targetAngleObj = sObj;
          }
        });
      }
      if (targetAngleObj) {
        var center = window.WebpointerObjects ? window.WebpointerObjects.getObjectCenter(targetAngleObj) : { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
        boxRect.setAttribute('transform', 'rotate(' + targetAngleObj.attrs.angle + ' ' + center.x + ' ' + center.y + ')');
      }
      uiGroup.appendChild(boxRect);
    }

    // Render Active Crop Overlay & 4 Side Drag Handles
    var state = window.WebpointerState || {};
    if (state.isCropModeActive && cfg.selectedIds.size === 1) {
      var cropId = Array.from(cfg.selectedIds)[0];
      var cropObj = cfg.objectsMap.get(cropId);
      if (cropObj) {
        var bounds = window.WebpointerObjects ? window.WebpointerObjects.getObjectBounds(cropObj) : null;
        if (bounds) {
          var bX = bounds.minX;
          var bY = bounds.minY;
          var bW = Math.max(1, bounds.maxX - bounds.minX);
          var bH = Math.max(1, bounds.maxY - bounds.minY);

          var cL = cropObj.attrs.cropLeft || 0;
          var cT = cropObj.attrs.cropTop || 0;
          var cR = cropObj.attrs.cropRight || 0;
          var cB = cropObj.attrs.cropBottom || 0;

          var cX = bX + bW * cL;
          var cY = bY + bH * cT;
          var cW = Math.max(1, bW * (1 - cL - cR));
          var cH = Math.max(1, bH * (1 - cT - cB));

          function createDimRect(rx, ry, rw, rh) {
            if (rw <= 0 || rh <= 0) return;
            var dimEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            dimEl.setAttribute('x', rx); dimEl.setAttribute('y', ry);
            dimEl.setAttribute('width', rw); dimEl.setAttribute('height', rh);
            dimEl.setAttribute('fill', 'rgba(15, 23, 42, 0.45)');
            dimEl.setAttribute('pointer-events', 'none');
            uiGroup.appendChild(dimEl);
          }

          createDimRect(bX, bY, bW, cY - bY);
          createDimRect(bX, cY + cH, bW, (bY + bH) - (cY + cH));
          createDimRect(bX, cY, cX - bX, cH);
          createDimRect(cX + cW, cY, (bX + bW) - (cX + cW), cH);

          var cropBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          cropBorder.setAttribute('x', cX); cropBorder.setAttribute('y', cY);
          cropBorder.setAttribute('width', cW); cropBorder.setAttribute('height', cH);
          cropBorder.setAttribute('fill', 'none'); cropBorder.setAttribute('stroke', '#0284c7');
          cropBorder.setAttribute('stroke-width', '2');
          uiGroup.appendChild(cropBorder);

          createHandleNode(cX + cW / 2, cY, cropObj.id, 'crop_top', 1, true);
          createHandleNode(cX + cW / 2, cY + cH, cropObj.id, 'crop_bottom', 2, true);
          createHandleNode(cX, cY + cH / 2, cropObj.id, 'crop_left', 3, true);
          createHandleNode(cX + cW, cY + cH / 2, cropObj.id, 'crop_right', 4, true);
        }
      }
    }

    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (!obj) return;
      var a = obj.attrs;

      if (obj.type === 'point') {
        createHandleNode(a.cx, a.cy, id, 'point_center', 1, false);
      } else if (obj.type === 'ellipse') {
        var angleRad = (a.angle || 0) * (Math.PI / 180);
        function getRotatedPoint(px, py) {
          var dx = px - a.cx;
          var dy = py - a.cy;
          var rxRot = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
          var ryRot = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
          return { x: a.cx + rxRot, y: a.cy + ryRot };
        }
        var ptCenter = { x: a.cx, y: a.cy };
        var ptWidth  = getRotatedPoint(a.cx + a.rx, a.cy);
        var ptHeight = getRotatedPoint(a.cx, a.cy - a.ry);
        var ptRotate = getRotatedPoint(a.cx, a.cy - a.ry - 25);

        var rotStem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rotStem.setAttribute('x1', ptHeight.x); rotStem.setAttribute('y1', ptHeight.y);
        rotStem.setAttribute('x2', ptRotate.x); rotStem.setAttribute('y2', ptRotate.y);
        rotStem.setAttribute('stroke', '#0284c7'); rotStem.setAttribute('stroke-dasharray', '3,3');
        rotStem.setAttribute('stroke-width', '1.5');
        uiGroup.appendChild(rotStem);

        createHandleNode(ptCenter.x, ptCenter.y, id, 'ellipse_center', 1, false);
        createHandleNode(ptWidth.x, ptWidth.y, id, 'ellipse_width', 2, false);
        createHandleNode(ptHeight.x, ptHeight.y, id, 'ellipse_height', 3, false);
        createHandleNode(ptRotate.x, ptRotate.y, id, 'ellipse_rotate', 4, true);

      } else if (obj.type === 'line') {
        createHandleNode(a.x1, a.y1, id, 'start', 1, false);
        createHandleNode(a.x2, a.y2, id, 'end', 2, false);
      } else if (obj.type === 'point') {
        createHandleNode(a.cx, a.cy, id, 'point_center', 1, false);
      } else if (obj.type === 'arc') {
        createHandleNode(a.cx, a.cy, id, 'ellipse_center', 1, false);
        var rx = a.rx || 30;
        var ry = a.ry || 30;
        var rot = a.angle || 0;
        var sAng = a.startAngle !== undefined ? a.startAngle : -90;
        var eAng = a.endAngle !== undefined ? a.endAngle : 0;

        function getArcHandlePoint(cx, cy, rx, ry, deg, rotDeg) {
          var rad = deg * (Math.PI / 180);
          var rotRad = rotDeg * (Math.PI / 180);
          var px = rx * Math.cos(rad);
          var py = ry * Math.sin(rad);
          var rxRot = px * Math.cos(rotRad) - py * Math.sin(rotRad);
          var ryRot = px * Math.sin(rotRad) + py * Math.cos(rotRad);
          return { x: cx + rxRot, y: cy + ryRot };
        }

        var ptWidth = getArcHandlePoint(a.cx, a.cy, rx, ry, 0, rot);
        var ptHeight = getArcHandlePoint(a.cx, a.cy, rx, ry, -90, rot);
        var ptRotate = getArcHandlePoint(a.cx, a.cy, rx, ry + 25, -90, rot);

        var rotStemArc = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rotStemArc.setAttribute('x1', ptHeight.x); rotStemArc.setAttribute('y1', ptHeight.y);
        rotStemArc.setAttribute('x2', ptRotate.x); rotStemArc.setAttribute('y2', ptRotate.y);
        rotStemArc.setAttribute('stroke', '#0284c7'); rotStemArc.setAttribute('stroke-dasharray', '3,3');
        rotStemArc.setAttribute('stroke-width', '1.5');
        uiGroup.appendChild(rotStemArc);

        createHandleNode(ptWidth.x, ptWidth.y, id, 'ellipse_width', 4, false);
        createHandleNode(ptHeight.x, ptHeight.y, id, 'ellipse_height', 5, false);
        createHandleNode(ptRotate.x, ptRotate.y, id, 'ellipse_rotate', 6, true);

        var pStartHandle = getArcHandlePoint(a.cx, a.cy, rx, ry, sAng, rot);
        var pEndHandle = getArcHandlePoint(a.cx, a.cy, rx, ry, eAng, rot);

        var stemLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        stemLine1.setAttribute('x1', a.cx); stemLine1.setAttribute('y1', a.cy);
        stemLine1.setAttribute('x2', pStartHandle.x); stemLine1.setAttribute('y2', pStartHandle.y);
        stemLine1.setAttribute('stroke', '#0284c7'); stemLine1.setAttribute('stroke-dasharray', '3,3');
        stemLine1.setAttribute('stroke-width', '1.2');
        uiGroup.appendChild(stemLine1);

        var stemLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        stemLine2.setAttribute('x1', a.cx); stemLine2.setAttribute('y1', a.cy);
        stemLine2.setAttribute('x2', pEndHandle.x); stemLine2.setAttribute('y2', pEndHandle.y);
        stemLine2.setAttribute('stroke', '#f97316'); stemLine2.setAttribute('stroke-dasharray', '3,3');
        stemLine2.setAttribute('stroke-width', '1.2');
        uiGroup.appendChild(stemLine2);

        createHandleNode(pStartHandle.x, pStartHandle.y, id, 'arc_start', 2, true, { fill: '#38bdf8', stroke: '#0284c7', r: 6 });
        createHandleNode(pEndHandle.x, pEndHandle.y, id, 'arc_end', 3, true, { fill: '#f97316', stroke: '#c2410c', r: 6 });
      } else if (obj.type === 'rect' || obj.type === 'rounded' || obj.type === 'text' || obj.type === 'image') {
        if (obj.type === 'text') {
          var isInsideOrGroupedWithShape = false;
          if (obj.parentId) {
            isInsideOrGroupedWithShape = true;
          } else {
            cfg.selectedIds.forEach(function(sId) {
              var sObj = cfg.objectsMap.get(sId);
              if (sObj && sObj.id !== obj.id && sObj.type !== 'text') {
                isInsideOrGroupedWithShape = true;
              }
            });
          }
          if (isInsideOrGroupedWithShape) return;
        }

        var bounds = window.WebpointerObjects ? window.WebpointerObjects.getObjectBounds(obj) : { minX: a.x, maxX: a.x + (a.width || 80), minY: a.y, maxY: a.y + (a.height || 40) };
        var cX = (bounds.minX + bounds.maxX) / 2;
        var cY = (bounds.minY + bounds.maxY) / 2;
        var rot = a.angle || 0;

        function getBoxRotPoint(px, py) {
          if (!rot) return { x: px, y: py };
          var rad = rot * (Math.PI / 180);
          var dx = px - cX;
          var dy = py - cY;
          var rxRot = dx * Math.cos(rad) - dy * Math.sin(rad);
          var ryRot = dx * Math.sin(rad) + dy * Math.cos(rad);
          return { x: cX + rxRot, y: cY + ryRot };
        }

        var ptTL = getBoxRotPoint(bounds.minX, bounds.minY);
        var ptBR = getBoxRotPoint(bounds.maxX, bounds.maxY);
        createHandleNode(ptTL.x, ptTL.y, id, 'top_left', 1, false);
        createHandleNode(ptBR.x, ptBR.y, id, 'bottom_right', 2, false);

        if (obj.type === 'rounded') {
          var cornerRx = a.rx !== undefined ? a.rx : 15;
          var ptCorner = getBoxRotPoint(bounds.minX + cornerRx, bounds.minY);
          createHandleNode(ptCorner.x, ptCorner.y, id, 'corner_rx', 3, true);
        }

        var ptTopMid = getBoxRotPoint(cX, bounds.minY);
        var ptRotRect = getBoxRotPoint(cX, bounds.minY - 25);

        var rStemRect = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rStemRect.setAttribute('x1', ptTopMid.x); rStemRect.setAttribute('y1', ptTopMid.y);
        rStemRect.setAttribute('x2', ptRotRect.x); rStemRect.setAttribute('y2', ptRotRect.y);
        rStemRect.setAttribute('stroke', '#0284c7'); rStemRect.setAttribute('stroke-dasharray', '3,3');
        rStemRect.setAttribute('stroke-width', '1.5');
        uiGroup.appendChild(rStemRect);

        createHandleNode(ptRotRect.x, ptRotRect.y, id, 'ellipse_rotate', 4, true);
      } else if (obj.type === 'bez2') {
        var pts = a.points || [];
        pts.forEach(function(pt, idx) {
          createHandleNode(pt.px, pt.py, id, 'bez_vertex', idx, false);
        });
        if (pts.length >= 2) {
          var P0 = pts[0];
          var P1 = pts[1];
          var c1x = a.firstCtrl ? a.firstCtrl.cx : Math.round((P0.px + P1.px) / 2);
          var c1y = a.firstCtrl ? a.firstCtrl.cy : (Math.min(P0.py, P1.py) - 100);

          createHandleNode(c1x, c1y, id, 'bez2_ctrl', 0, true, { fill: '#0284c7', stroke: '#0369a1', r: 5 });

          var createDashedLine = function(x1, y1, x2, y2, color) {
            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1); line.setAttribute('y1', y1);
            line.setAttribute('x2', x2); line.setAttribute('y2', y2);
            line.setAttribute('stroke', color || '#0284c7');
            line.setAttribute('stroke-dasharray', '3,3');
            line.setAttribute('stroke-width', '1.2');
            uiGroup.appendChild(line);
          };

          createDashedLine(P0.px, P0.py, c1x, c1y);
          createDashedLine(c1x, c1y, P1.px, P1.py);

          var prevC = { x: c1x, y: c1y };
          for (var i = 2; i < pts.length; i++) {
            var segIdx = i - 1;
            var prevP = pts[i - 1];
            var currP = pts[i];
            var isSplit = a.ctrls2 && a.ctrls2[segIdx];
            var ctrlX, ctrlY;

            if (isSplit) {
              ctrlX = a.ctrls2[segIdx].cx;
              ctrlY = a.ctrls2[segIdx].cy;
              createHandleNode(ctrlX, ctrlY, id, 'bez2_ctrl', segIdx, true, { fill: '#f97316', stroke: '#c2410c', r: 6 });
              createDashedLine(prevP.px, prevP.py, ctrlX, ctrlY, '#f97316');
              createDashedLine(ctrlX, ctrlY, currP.px, currP.py, '#f97316');
              prevC = { x: ctrlX, y: ctrlY };
            } else {
              ctrlX = 2 * prevP.px - prevC.x;
              ctrlY = 2 * prevP.py - prevC.y;
              createHandleNode(ctrlX, ctrlY, id, 'bez2_ctrl', segIdx, true, { fill: '#38bdf8', stroke: '#0284c7', r: 5 });
              createDashedLine(prevP.px, prevP.py, ctrlX, ctrlY, '#38bdf8');
              createDashedLine(ctrlX, ctrlY, currP.px, currP.py, '#38bdf8');
              prevC = { x: ctrlX, y: ctrlY };
            }
          }
        }
      } else if (obj.type === 'bez3') {
        var pts3 = a.points || [];
        pts3.forEach(function(pt, idx) {
          createHandleNode(pt.px, pt.py, id, 'bez_vertex', idx, false);
        });
        var ctrls = a.ctrls3 || [];
        var prevC2 = null;

        var createDashedLine3 = function(x1, y1, x2, y2, color) {
          var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x1); line.setAttribute('y1', y1);
          line.setAttribute('x2', x2); line.setAttribute('y2', y2);
          line.setAttribute('stroke', color || '#0284c7');
          line.setAttribute('stroke-dasharray', '3,3');
          line.setAttribute('stroke-width', '1.2');
          uiGroup.appendChild(line);
        };

        for (var seg = 0; seg < pts3.length - 1; seg++) {
          var pStart = pts3[seg];
          var pEnd = pts3[seg + 1];
          var ctrl1, ctrl2;

          var defaultC2 = { x: pEnd.px, y: Math.round((pStart.py + pEnd.py) / 2 - 50) };
          ctrl2 = (ctrls[seg] && ctrls[seg].c2) ? ctrls[seg].c2 : defaultC2;

          if (seg === 0) {
            var defaultC1 = { x: pStart.px, y: Math.round((pStart.py + pEnd.py) / 2 - 50) };
            ctrl1 = (ctrls[0] && ctrls[0].c1) ? ctrls[0].c1 : defaultC1;
            createHandleNode(ctrl1.x, ctrl1.y, id, 'bez3_c1', seg, true, { fill: '#0284c7', stroke: '#0369a1', r: 5 });
            createDashedLine3(pStart.px, pStart.py, ctrl1.x, ctrl1.y, '#0284c7');
          } else {
            var isC1Split = ctrls[seg] && ctrls[seg].c1;
            if (isC1Split) {
              ctrl1 = ctrls[seg].c1;
              createHandleNode(ctrl1.x, ctrl1.y, id, 'bez3_c1', seg, true, { fill: '#f97316', stroke: '#c2410c', r: 6 });
              createDashedLine3(pStart.px, pStart.py, ctrl1.x, ctrl1.y, '#f97316');
            } else {
              var basePrevC2 = prevC2 || { x: pStart.px, y: pStart.py };
              ctrl1 = { x: 2 * pStart.px - basePrevC2.x, y: 2 * pStart.py - basePrevC2.y };
              createHandleNode(ctrl1.x, ctrl1.y, id, 'bez3_c1', seg, true, { fill: '#38bdf8', stroke: '#0284c7', r: 5 });
              createDashedLine3(pStart.px, pStart.py, ctrl1.x, ctrl1.y, '#38bdf8');
            }
          }

          var isC2Split = ctrls[seg] && ctrls[seg].c2;
          createHandleNode(ctrl2.x, ctrl2.y, id, 'bez3_c2', seg, true, isC2Split ? { fill: '#f97316', stroke: '#c2410c', r: 6 } : { fill: '#0284c7', stroke: '#0369a1', r: 5 });
          createDashedLine3(pEnd.px, pEnd.py, ctrl2.x, ctrl2.y, isC2Split ? '#f97316' : '#0284c7');

          prevC2 = ctrl2;
        }
      }

      if (obj.attrs && obj.attrs.fill && typeof obj.attrs.fill === 'string' && obj.attrs.fill.indexOf('url(#grad_') !== -1) {
        var gMinX = a.x !== undefined ? a.x : (a.cx !== undefined ? a.cx - (a.rx || 30) : 100);
        var gMinY = a.y !== undefined ? a.y : (a.cy !== undefined ? a.cy - (a.ry || 30) : 100);
        var gW = a.width || (a.rx ? a.rx * 2 : 80);
        var gH = a.height || (a.ry ? a.ry * 2 : 80);

        var gStartX = gMinX;
        var gStartY = gMinY + gH / 2;
        var gEndX = gMinX + gW;
        var gEndY = gMinY + gH / 2;

        var gStem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gStem.setAttribute('x1', gStartX); gStem.setAttribute('y1', gStartY);
        gStem.setAttribute('x2', gEndX); gStem.setAttribute('y2', gEndY);
        gStem.setAttribute('stroke', '#eab308'); gStem.setAttribute('stroke-dasharray', '4,4');
        gStem.setAttribute('stroke-width', '2');
        uiGroup.appendChild(gStem);

        createHandleNode(gStartX, gStartY, id, 'gradient_start', 10, true);
        createHandleNode(gEndX, gEndY, id, 'gradient_end', 11, true);
      }
    });
  }

  function renderGrid() {
    var gridGroup = document.getElementById('gridGroup');
    if (!gridGroup) return;
    gridGroup.innerHTML = '';
    gridGroup.style.display = 'block';

    var w = cfg.SVG_WIDTH || 960;
    var h = cfg.SVG_HEIGHT || 540;
    var bgColor = cfg.canvasBgColor || '#ffffff';

    var bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', '0');
    bgRect.setAttribute('width', w);
    bgRect.setAttribute('height', h);
    bgRect.setAttribute('fill', bgColor);
    gridGroup.appendChild(bgRect);

    if (cfg.gridSnapEnabled) {
      var stepSize = cfg.gridStepSize || 24;

      var countX = Math.floor(w / stepSize);
      for (var i = 0; i <= countX; i++) {
        var x = i * stepSize;
        var lineX = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lineX.setAttribute('x1', x); lineX.setAttribute('y1', 0);
        lineX.setAttribute('x2', x); lineX.setAttribute('y2', h);
        lineX.setAttribute('stroke', (i % 5 === 0) ? '#cbd5e1' : '#f1f5f9');
        lineX.setAttribute('stroke-width', (i % 5 === 0) ? '1' : '0.5');
        gridGroup.appendChild(lineX);
      }

      var countY = Math.floor(h / stepSize);
      for (var j = 0; j <= countY; j++) {
        var y = j * stepSize;
        var lineY = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lineY.setAttribute('x1', 0); lineY.setAttribute('y1', y);
        lineY.setAttribute('x2', w); lineY.setAttribute('y2', y);
        lineY.setAttribute('stroke', (j % 5 === 0) ? '#cbd5e1' : '#f1f5f9');
        lineY.setAttribute('stroke-width', (j % 5 === 0) ? '1' : '0.5');
        gridGroup.appendChild(lineY);
      }
    }
  }

  function updateSvgDefs() {
    var defs = document.getElementById('markerDefs');
    if (!defs) return;
    defs.innerHTML = '';

    ['arrow', 'circle', 'square', 'diamond'].forEach(function(mType) {
      ['start', 'end'].forEach(function(pos) {
        var isStart = (pos === 'start');
        var isHollow = isStart ? (cfg.startMarkerFillStyle === 'hollow') : (cfg.endMarkerFillStyle === 'hollow');

        var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'marker-' + pos + '-' + mType);
        marker.setAttribute('viewBox', '0 0 10 10');
        marker.setAttribute('refX', '5');
        marker.setAttribute('refY', '5');
        marker.setAttribute('markerWidth', '6');
        marker.setAttribute('markerHeight', '6');
        marker.setAttribute('orient', 'auto-start-reverse');

        var strokeColor = cfg.strokeColor || '#041e49';
        var fillColor = isHollow ? '#ffffff' : strokeColor;

        if (mType === 'arrow') {
          var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', isStart ? 'M 10 0 L 0 5 L 10 10 z' : 'M 0 0 L 10 5 L 0 10 z');
          path.setAttribute('fill', fillColor);
          path.setAttribute('stroke', strokeColor);
          path.setAttribute('stroke-width', '1');
          marker.appendChild(path);
        } else if (mType === 'circle') {
          var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', '5'); circle.setAttribute('cy', '5'); circle.setAttribute('r', '4');
          circle.setAttribute('fill', fillColor);
          circle.setAttribute('stroke', strokeColor);
          circle.setAttribute('stroke-width', '1');
          marker.appendChild(circle);
        } else if (mType === 'square') {
          var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', '1'); rect.setAttribute('y', '1');
          rect.setAttribute('width', '8'); rect.setAttribute('height', '8');
          rect.setAttribute('fill', fillColor);
          rect.setAttribute('stroke', strokeColor);
          rect.setAttribute('stroke-width', '1');
          marker.appendChild(rect);
        } else if (mType === 'diamond') {
          var diamond = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          diamond.setAttribute('d', 'M 5 0 L 10 5 L 5 10 L 0 5 z');
          diamond.setAttribute('fill', fillColor);
          diamond.setAttribute('stroke', strokeColor);
          diamond.setAttribute('stroke-width', '1');
          marker.appendChild(diamond);
        }
        defs.appendChild(marker);
      });
    });
  }

  function updateDomTree() {}

  function renderCanvas() {
    if (!cfg.objectsMap) return;
    cfg.objectsMap.forEach(function(obj) {
      updateElementAttributes(obj);
    });
  }

  function renderSnapGuides(lines) {
    var group = document.getElementById('snapGuidesGroup');
    if (!group) return;
    group.innerHTML = '';
    if (!lines || !lines.length) return;
    lines.forEach(function(l) {
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', l.x1);
      line.setAttribute('y1', l.y1);
      line.setAttribute('x2', l.x2);
      line.setAttribute('y2', l.y2);
      line.setAttribute('stroke', l.color || '#ec4899');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '4 4');
      line.setAttribute('pointer-events', 'none');
      group.appendChild(line);
    });
  }

  function clearSnapGuides() {
    var group = document.getElementById('snapGuidesGroup');
    if (group) group.innerHTML = '';
  }

  window.WebpointerRenderCanvas = {
    updateElementAttributes: updateElementAttributes,
    createHandleNode: createHandleNode,
    renderUI: renderUI,
    renderGrid: renderGrid,
    updateSvgDefs: updateSvgDefs,
    updateDomTree: updateDomTree,
    renderCanvas: renderCanvas,
    renderAllObjects: renderCanvas,
    renderSnapGuides: renderSnapGuides,
    clearSnapGuides: clearSnapGuides,
    compileFilterString: compileFilterString
  };
})(window);
