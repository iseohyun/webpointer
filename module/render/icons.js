(function(window) {
  'use strict';

  var WebpointerIcons = {
    pan: '<svg viewBox="0 0 24 24"><path d="M18 11V6a2 2 0 0 0-4 0v5-5a2 2 0 0 0-4 0v5-3a2 2 0 0 0-4 0v6a8 8 0 0 0 16 0v-3a2 2 0 0 0-4 0z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    select: '<svg viewBox="0 0 24 24"><path d="M3 3l7 18 3-7 7-3L3 3z"/></svg>',
    point: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>',
    line: '<svg viewBox="0 0 24 24"><line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" stroke-width="2"/></svg>',
    rect: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    rounded: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    ellipse: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    arc: '<svg viewBox="0 0 24 24"><path d="M 4 20 A 16 16 0 0 1 20 4" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    bez2: '<svg viewBox="0 0 24 24"><path d="M 4 20 Q 12 4 20 20" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    bez3: '<svg viewBox="0 0 24 24"><path d="M 4 20 C 8 4 16 4 20 20" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    bringToFront: '<svg viewBox="0 0 24 24"><rect x="11" y="11" width="10" height="10" fill="#ffffff" stroke="#475569" stroke-width="1.3" rx="1"/><rect x="7" y="7" width="10" height="10" fill="#ffffff" stroke="#475569" stroke-width="1.3" rx="1"/><rect x="3" y="3" width="10" height="10" fill="#f59e0b" stroke="#b45309" stroke-width="1.3" rx="1"/></svg>',
    bringForward: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" fill="#ffffff" stroke="#475569" stroke-width="1.3" rx="1"/><rect x="3" y="3" width="12" height="12" fill="#f59e0b" stroke="#b45309" stroke-width="1.3" rx="1"/></svg>',
    sendBackward: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" fill="#f59e0b" stroke="#b45309" stroke-width="1.3" rx="1"/><rect x="3" y="3" width="12" height="12" fill="#ffffff" stroke="#475569" stroke-width="1.3" rx="1"/></svg>',
    sendToBack: '<svg viewBox="0 0 24 24"><rect x="11" y="11" width="10" height="10" fill="#f59e0b" stroke="#b45309" stroke-width="1.3" rx="1"/><rect x="7" y="7" width="10" height="10" fill="#ffffff" stroke="#475569" stroke-width="1.3" rx="1"/><rect x="3" y="3" width="10" height="10" fill="#ffffff" stroke="#475569" stroke-width="1.3" rx="1"/></svg>',
    group: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" stroke-dasharray="3,3"/><rect x="6" y="6" width="6" height="6"/><rect x="12" y="12" width="6" height="6"/></svg>',
    ungroup: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" stroke-dasharray="2,2"/><rect x="13" y="13" width="8" height="8" stroke-dasharray="2,2"/></svg>',
    alignLeft: '<svg viewBox="0 0 24 24"><path d="M4 2v20M8 6h12v4H8zM8 14h8v4H8z"/></svg>',
    alignHcenter: '<svg viewBox="0 0 24 24"><path d="M12 2v20M6 6h12v4H6zM8 14h8v4H8z"/></svg>',
    alignRight: '<svg viewBox="0 0 24 24"><path d="M20 2v20M4 6h12v4H4zM8 14h8v4H8z"/></svg>',
    alignTop: '<svg viewBox="0 0 24 24"><path d="M2 4h20M6 8v12h4V8zM14 8v8h4V8z"/></svg>',
    alignVcenter: '<svg viewBox="0 0 24 24"><path d="M2 12h20M6 6v12h4V6zM14 8v8h4V8z"/></svg>',
    alignBottom: '<svg viewBox="0 0 24 24"><path d="M2 20h20M6 4v12h4V4zM14 8v8h4V4z"/></svg>',
    alignHspace: '<svg viewBox="0 0 24 24"><path d="M2 2v20M22 2v20M6 6h3v12H6zM15 6h3v12h-3z"/></svg>',
    alignVspace: '<svg viewBox="0 0 24 24"><path d="M2 2h20M2 22h20M6 6h12v3H6zM6 15h12v3H6z"/></svg>',
    flipH: '<svg viewBox="0 0 24 24"><path d="M12 3v18M16 6l5 6-5 6V6zM8 6L3 12l5 6V6z"/></svg>',
    flipV: '<svg viewBox="0 0 24 24"><path d="M3 12h18M6 8l6-5 6 5H6zM6 16l6 5 6-5H6z"/></svg>',
    rotate90: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.4 2.6L21 3v6h-6l2.5-2.5A6.9 6.9 0 1 0 19 12"/></svg>',
    rotateNeg90: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9c-2.5 0-4.8 1-6.4 2.6L3 3v6h6L6.5 6.5A6.9 6.9 0 1 1 5 12"/></svg>',
    targetStroke: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="none" stroke="#ef4444" stroke-width="4.5" rx="3"/></svg>',
    targetFill: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="#ef4444" rx="3"/></svg>',
    textFillIcon: '<svg viewBox="0 0 24 24"><text x="12" y="20" font-size="22" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle" fill="#ef4444">A</text></svg>',
    textStrokeIcon: '<svg viewBox="0 0 24 24"><text x="12" y="20" font-size="22" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">A</text></svg>',
    textUnderlineIcon: '<svg viewBox="0 0 24 24"><path d="M 2 12 Q 7.5 4 13 12 T 22 12" fill="none" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round"/></svg>',
    getShapeFillIcon: function(c) {
      var fillC = (c && c !== 'none') ? c : 'transparent';
      return '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="' + fillC + '" stroke="' + (fillC === 'transparent' ? '#ef4444' : 'none') + '" stroke-width="2" rx="3"/>' + (fillC === 'transparent' ? '<line x1="3" y1="21" x2="21" y2="3" stroke="#ef4444" stroke-width="2"/>' : '') + '</svg>';
    },
    getShapeStrokeIcon: function(c) {
      var strokeC = (c && c !== 'none') ? c : '#ef4444';
      return '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="none" stroke="' + strokeC + '" stroke-width="4.5" rx="3"/></svg>';
    },
    getTextFillIcon: function(c) {
      var fillC = (c && c !== 'none') ? c : '#ef4444';
      return '<svg viewBox="0 0 24 24"><text x="12" y="20" font-size="22" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle" fill="' + fillC + '">A</text></svg>';
    },
    getTextStrokeIcon: function(c) {
      var strokeC = (c && c !== 'none') ? c : '#ef4444';
      return '<svg viewBox="0 0 24 24"><text x="12" y="20" font-size="22" font-weight="900" font-family="Arial, sans-serif" text-anchor="middle" fill="none" stroke="' + strokeC + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">A</text></svg>';
    },
    getTextUnderlineIcon: function(c) {
      var uC = (c && c !== 'none') ? c : '#ef4444';
      return '<svg viewBox="0 0 24 24"><path d="M 2 12 Q 7.5 4 13 12 T 22 12" fill="none" stroke="' + uC + '" stroke-width="4.5" stroke-linecap="round"/></svg>';
    },
    halfDiskIcon: '<svg viewBox="0 0 24 24"><path d="M4 4h10l6 6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="none" stroke="#64748b" stroke-width="2"/><path d="M4 4h6v7H4z" fill="#0284c7"/><rect x="6" y="14" width="12" height="6" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/></svg>',
    smileyIcon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#0284c7" stroke-width="2"/><circle cx="9" cy="9.5" r="1.5" fill="#0284c7"/><circle cx="15" cy="9.5" r="1.5" fill="#0284c7"/><path d="M 8 14 Q 12 18 16 14" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round"/></svg>',
    markerIcon: '<svg viewBox="0 0 24 24"><path d="M 3 12 L 18 12 M 13 6 L 20 12 L 13 18" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    gradientPresetIcon: '<svg viewBox="0 0 24 24"><defs><linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f97316"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs><rect x="3" y="3" width="18" height="18" fill="url(#iconGrad)" rx="4"/></svg>',
    mobiusStripIcon: '<svg viewBox="0 0 24 24"><path d="M 12 12 C 9.5 8.5 7 7 4.5 7 C 2 7 0.5 8.5 0.5 12 C 0.5 15.5 2 17 4.5 17 C 7 17 9.5 15.5 12 12 Z M 12 12 C 14.5 8.5 17 7 19.5 7 C 22 7 23.5 8.5 23.5 12 C 23.5 15.5 22 17 19.5 17 C 17 17 14.5 15.5 12 12 Z" fill="none" stroke="#ec4899" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    openPalette: '<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    importPalette: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    lineSolid: '<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="3"/></svg>',
    lineDashed: '<svg viewBox="0 0 24 24"><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="3.5" stroke-dasharray="5,4.5" stroke-linecap="round"/></svg>',
    markerPlus: '<svg viewBox="0 0 24 24" style="width:14px; height:14px;"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5"/></svg>',
    markerMinus: '<svg viewBox="0 0 24 24" style="width:14px; height:14px;"><path d="M5 12h14" stroke="currentColor" stroke-width="2.5"/></svg>',
    startNone: '<svg viewBox="0 0 24 24"><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2"/><line x1="4" y1="7" x2="4" y2="17" stroke="currentColor" stroke-width="2"/></svg>',
    startArrow: '<svg viewBox="0 0 24 24"><line x1="21" y1="12" x2="8" y2="12" stroke="currentColor" stroke-width="2"/><path d="M10 6L4 12l6 6z" fill="currentColor"/></svg>',
    startCircle: '<svg viewBox="0 0 24 24"><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="12" r="4" fill="currentColor"/></svg>',
    startDiamond: '<svg viewBox="0 0 24 24"><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2"/><path d="M6 7l4 5-4 5-4-5z" fill="currentColor"/></svg>',
    startSolid: '<svg viewBox="0 0 24 24"><path d="M14 5L4 12l10 7z" fill="currentColor"/><line x1="14" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2"/></svg>',
    startHollow: '<svg viewBox="0 0 24 24"><path d="M14 5L4 12l10 7z" fill="#ffffff" stroke="currentColor" stroke-width="2"/><line x1="14" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2"/></svg>',
    endNone: '<svg viewBox="0 0 24 24"><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2"/><line x1="20" y1="7" x2="20" y2="17" stroke="currentColor" stroke-width="2"/></svg>',
    endArrow: '<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/><path d="M14 6l6 6-6 6z" fill="currentColor"/></svg>',
    endCircle: '<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="15" y2="12" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="12" r="4" fill="currentColor"/></svg>',
    endDiamond: '<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="15" y2="12" stroke="currentColor" stroke-width="2"/><path d="M18 7l4 5-4 5-4-5z" fill="currentColor"/></svg>',
    endSolid: '<svg viewBox="0 0 24 24"><path d="M10 5l10 7-10 7z" fill="currentColor"/><line x1="2" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="2"/></svg>',
    endHollow: '<svg viewBox="0 0 24 24"><path d="M10 5l10 7-10 7z" fill="#ffffff" stroke="currentColor" stroke-width="2"/><line x1="2" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="2"/></svg>',
    capButt: '<svg viewBox="0 0 24 24" style="width:26px; height:26px;"><line x1="2" y1="12" x2="13" y2="12" stroke="currentColor" stroke-width="12" stroke-linecap="butt"/><line x1="13" y1="2" x2="13" y2="22" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="2,2"/><circle cx="13" cy="12" r="2.5" fill="#ef4444" stroke="#ffffff" stroke-width="0.8"/></svg>',
    capRound: '<svg viewBox="0 0 24 24" style="width:26px; height:26px;"><line x1="2" y1="12" x2="13" y2="12" stroke="currentColor" stroke-width="12" stroke-linecap="round"/><line x1="13" y1="2" x2="13" y2="22" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="2,2"/><circle cx="13" cy="12" r="2.5" fill="#ef4444" stroke="#ffffff" stroke-width="0.8"/></svg>',
    capSquare: '<svg viewBox="0 0 24 24" style="width:26px; height:26px;"><line x1="2" y1="12" x2="13" y2="12" stroke="currentColor" stroke-width="12" stroke-linecap="square"/><line x1="13" y1="2" x2="13" y2="22" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="2,2"/><circle cx="13" cy="12" r="2.5" fill="#ef4444" stroke="#ffffff" stroke-width="0.8"/></svg>',
    crop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>',
    joinMiter: '<svg viewBox="0 0 24 24" style="width:26px; height:26px;"><path d="M 3 21 L 12 5 L 21 21" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="miter" stroke-linecap="butt"/><circle cx="12" cy="5" r="2.5" fill="#ef4444" stroke="#ffffff" stroke-width="0.8"/></svg>',
    joinRound: '<svg viewBox="0 0 24 24" style="width:26px; height:26px;"><path d="M 3 21 L 12 5 L 21 21" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/><circle cx="12" cy="7" r="2.5" fill="#ef4444" stroke="#ffffff" stroke-width="0.8"/></svg>',
    joinBevel: '<svg viewBox="0 0 24 24" style="width:26px; height:26px;"><path d="M 3 21 L 12 5 L 21 21" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="bevel" stroke-linecap="butt"/><circle cx="12" cy="8" r="2.5" fill="#ef4444" stroke="#ffffff" stroke-width="0.8"/></svg>',
    addText: '<svg viewBox="0 0 24 24"><path d="M4 7V4h16v3M12 4v16M9 20h6"/></svg>',
    animDraw: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>',
    animFade: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-dasharray="4,4"/></svg>',
    strikethrough: '<svg viewBox="0 0 24 24"><path d="M17.5 10.5c.3-3-2-5.5-5.5-5.5-3.5 0-5.5 2-5.5 4.5 0 1.8 1.1 3 3 3.5M4 12h16M7 16.5c.5 2.5 3 3.5 5.5 3.5 3.5 0 5.5-2 5.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    alignTextLeft: '<svg viewBox="0 0 24 24"><path d="M3 6h18M3 10h12M3 14h18M3 18h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    alignTextCenter: '<svg viewBox="0 0 24 24"><path d="M3 6h18M6 10h12M3 14h18M7 18h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    alignTextRight: '<svg viewBox="0 0 24 24"><path d="M3 6h18M9 10h12M3 14h18M11 18h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    alignTextJustify: '<svg viewBox="0 0 24 24"><path d="M3 6h18M3 10h18M3 14h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    lineHeight: '<svg viewBox="0 0 24 24"><path d="M6 4v16M3 7l3-3 3 3M3 17l3 3 3-3M12 6h9M12 12h9M12 18h9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    textDirection: '<svg viewBox="0 0 24 24"><path d="M12 3v15M8 14l4 4 4-4M5 7h14M5 11h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    alignVertTop: '<svg viewBox="0 0 24 24"><path d="M3 4h18M7 8v12M17 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    alignVertMiddle: '<svg viewBox="0 0 24 24"><path d="M3 12h18M7 6v12M17 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    alignVertBottom: '<svg viewBox="0 0 24 24"><path d="M3 20h18M7 4v12M17 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    autoFitShape: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="3,3"/><path d="M7 15V9h2a2 2 0 0 1 0 4H7" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M17 7l3-3m0 0h-4m4 0v4" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg>',
    autoFitText: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 15V9h2a2 2 0 0 1 0 4H8" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M15 15l-3-3m0 0h3m-3 0v3" stroke="#0284c7" stroke-width="2" stroke-linecap="round"/></svg>',
    autoFitNone: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 15V9h2a2 2 0 0 1 0 4H8" stroke="currentColor" stroke-width="1.8" fill="none"/><line x1="15" y1="9" x2="19" y2="15" stroke="#94a3b8" stroke-width="2"/></svg>',
    openFile: '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    saveFile: '<svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="17 21 17 13 7 13 7 21" fill="none" stroke="currentColor" stroke-width="1.8"/><polyline points="7 3 7 8 15 8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    downloadFile: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="7 10 12 15 17 10" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M3 7v6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    redo: '<svg viewBox="0 0 24 24"><path d="M21 7v6h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    settingsGear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    keyboardShortcut: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="6" y1="8" x2="6" y2="8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="10" y1="8" x2="10" y2="8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="14" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="18" y1="8" x2="18" y2="8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="6" y1="12" x2="6" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="10" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="14" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="18" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="7" y1="16" x2="17" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };

  window.WebpointerIcons = WebpointerIcons;
})(window);
