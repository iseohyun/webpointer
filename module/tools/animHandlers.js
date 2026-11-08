/**
 * Webpointer SVG SMIL Animation Suite Handler Module
 */
(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;

  function getSelectedObjectsForFilter() {
    if (!cfg || !cfg.selectedIds || cfg.selectedIds.size === 0) return [];
    var list = [];
    cfg.selectedIds.forEach(function(id) {
      var obj = cfg.objectsMap.get(id);
      if (obj) list.push(obj);
    });
    return list;
  }

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

  function playAnimation(type) {
    var targets = getSelectedObjectsForFilter();
    targets.forEach(function(obj) {
      if (!obj.el) obj.el = document.getElementById(obj.id);
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

  function stopAllAnimations() {
    var mainSvg = document.getElementById('mainSvg');
    if (!mainSvg) return;
    var anims = mainSvg.querySelectorAll('animate, animateTransform, animateMotion');
    anims.forEach(function(a) { a.remove(); });
  }

  window.removeAllAnimationsFromSelected = removeAllAnimationsFromSelected;
  window.addCustomSmilAnimation = addCustomSmilAnimation;
  window.playAnimation = playAnimation;
  window.stopAllAnimations = stopAllAnimations;

})(window);
