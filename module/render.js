(function(window) {
  'use strict';

  var Canvas = window.WebpointerRenderCanvas;
  var Ribbon = window.WebpointerRenderRibbon;

  var WebpointerRender = {
    updateElementAttributes: function(obj) {
      if (window.WebpointerRenderCanvas) {
        window.WebpointerRenderCanvas.updateElementAttributes(obj);
      }
    },
    createHandleNode: function(x, y, objId, handleType, idx, isSpecial) {
      if (window.WebpointerRenderCanvas) {
        window.WebpointerRenderCanvas.createHandleNode(x, y, objId, handleType, idx, isSpecial);
      }
    },
    renderUI: function() {
      if (window.WebpointerRenderCanvas) {
        window.WebpointerRenderCanvas.renderUI();
      }
    },
    renderGrid: function() {
      if (window.WebpointerRenderCanvas) {
        window.WebpointerRenderCanvas.renderGrid();
      }
    },
    updateSvgDefs: function() {
      if (window.WebpointerRenderCanvas) {
        window.WebpointerRenderCanvas.updateSvgDefs();
      }
    },
    updateDomTree: function() {
      if (window.WebpointerRenderCanvas) {
        window.WebpointerRenderCanvas.updateDomTree();
      }
    },
    createCapSvg: function(capType) {
      return window.WebpointerRenderRibbon ? window.WebpointerRenderRibbon.createCapSvg(capType) : '';
    },
    createJoinSvg: function(joinType) {
      return window.WebpointerRenderRibbon ? window.WebpointerRenderRibbon.createJoinSvg(joinType) : '';
    },
    renderRibbon: function() {
      if (window.WebpointerRenderRibbon) {
        window.WebpointerRenderRibbon.renderRibbon();
      }
    },
    renderSnapGuides: function(lines) {
      if (window.WebpointerRenderCanvas) {
        window.WebpointerRenderCanvas.renderSnapGuides(lines);
      }
    },
    clearSnapGuides: function() {
      if (window.WebpointerRenderCanvas) {
        window.WebpointerRenderCanvas.clearSnapGuides();
      }
    },
    renderAllObjects: function() {
      if (window.WebpointerRenderCanvas) {
        window.WebpointerRenderCanvas.renderAllObjects();
      }
    },
    renderCanvas: function() {
      if (window.WebpointerRenderCanvas) {
        window.WebpointerRenderCanvas.renderCanvas();
      }
    }
  };

  window.WebpointerRender = WebpointerRender;
})(window);
