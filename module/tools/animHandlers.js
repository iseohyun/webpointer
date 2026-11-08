/**
 * @file module/tools/animHandlers.js
 * @description SVG SMIL 애니메이션 제어, 위저드 단계 관리 및 프리셋 재생 모듈
 */
(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;
  var state = window.WebpointerState;

  function getSelectedObjectsForAnim() {
    if (window.getSelectedObjectsForFilter) {
      return window.getSelectedObjectsForFilter();
    }
    var list = [];
    if (cfg.selectedIds && cfg.selectedIds.size > 0) {
      cfg.selectedIds.forEach(function(id) {
        var o = cfg.objectsMap.get(id);
        if (o) list.push(o);
      });
    } else {
      cfg.objectsMap.forEach(function(o) {
        list.push(o);
      });
    }
    return list;
  }

  function setAnimStep(step) {
    state.animStep = step;
    if (window.WebpointerRender && window.WebpointerRender.renderRibbon) {
      window.WebpointerRender.renderRibbon();
    }
    if (step === 2) {
      setTimeout(function() {
        updateAnimDefaultValues();
      }, 0);
    }
  }

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

  function playSelectedAnimation() {
    var targets = getSelectedObjectsForAnim();
    if (targets.length === 0) {
      playAnimation('rotate');
      return;
    }
    targets.forEach(function(obj) {
      if (!obj.el) obj.el = document.getElementById(obj.id);
      if (obj.el) {
        var anims = obj.el.querySelectorAll('animate, animateTransform, animateMotion');
        anims.forEach(function(anim) {
          try {
            if (anim.beginElement) anim.beginElement();
          } catch (e) {}
        });
      }
    });
  }

  function removeAllAnimationsFromSelected() {
    var targets = getSelectedObjectsForAnim();
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
    var targets = getSelectedObjectsForAnim();
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
    var targets = getSelectedObjectsForAnim();
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
        try { if (el.getTotalLength) len = Math.ceil(el.getTotalLength()); } catch (e) {}
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

  window.setAnimStep = setAnimStep;
  window.updateAnimDefaultValues = updateAnimDefaultValues;
  window.playSelectedAnimation = playSelectedAnimation;
  window.removeAllAnimationsFromSelected = removeAllAnimationsFromSelected;
  window.addCustomSmilAnimation = addCustomSmilAnimation;
  window.playAnimation = playAnimation;
  window.stopAllAnimations = stopAllAnimations;

  window.WebpointerAnim = {
    setAnimStep: setAnimStep,
    updateAnimDefaultValues: updateAnimDefaultValues,
    playSelectedAnimation: playSelectedAnimation,
    removeAllAnimationsFromSelected: removeAllAnimationsFromSelected,
    addCustomSmilAnimation: addCustomSmilAnimation,
    playAnimation: playAnimation,
    stopAllAnimations: stopAllAnimations
  };
})(window);
