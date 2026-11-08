(function(window) {
  'use strict';

  var cfg = window.WebpointerConfig;
  var state = window.WebpointerState;

  var default24Colors = [
    "#660000", "#660000", "#086600", "#006627", "#002e66", "#000080", "#3a0066", "#660031",
    "#e44d1b", "#c27800", "#669900", "#00a879", "#009dd1", "#4182fb", "#a760e2", "#d94594",
    "#ff976b", "#ffbb00", "#aae43f", "#00f5c0", "#00eaff", "#85caff", "#ec99ff", "#ff8fda"
  ];

  function getOutermostGroupEl(el) {
    if (!el) return null;
    var objectsGroup = document.getElementById('objectsGroup');
    var current = el.parentElement;
    var topG = null;
    while (current && current !== objectsGroup && current.tagName && current.tagName.toLowerCase() === 'g') {
      topG = current;
      current = current.parentElement;
    }
    return topG;
  }

  function build3RowGridHtml(itemsHtmlArray) {
    var colCount = Math.ceil(itemsHtmlArray.length / 3);
    return '<div class="category-grid" style="grid-template-columns: repeat(' + colCount + ', 34px);">' + itemsHtmlArray.join('') + '</div>';
  }

  function buildCategoryHtml(catKey, catTitle, contentHtml) {
    var isCollapsed = cfg.collapsedCategories && cfg.collapsedCategories.has(catKey);
    return '<div class="ribbon-category ' + (isCollapsed ? 'collapsed' : '') + '">' +
             '<div class="category-content">' + contentHtml + '</div>' +
             '<div class="category-title" onclick="toggleCategoryCollapse(\'' + catKey + '\')" title="클릭하여 접기/펼치기">' +
               '<span class="title-text">' + catTitle + '</span>' +
               '<span class="toggle-icon">' + (isCollapsed ? '▲' : '▼') + '</span>' +
             '</div>' +
           '</div>';
  }

  function buildEffectsCategoryHtml() {
    var icons = window.WebpointerIcons || {};
    var effectTypes = [
      { type: 'blur', label: '블러', icon: icons.filterBlur || '💧' },
      { type: 'brightness', label: '밝기', icon: icons.filterBrightness || '☀️' },
      { type: 'contrast', label: '대비', icon: icons.filterContrast || '🌓' },
      { type: 'grayscale', label: '흑백', icon: icons.filterGrayscale || '🏁' },
      { type: 'hue-rotate', label: '색상회전', icon: icons.filterHueRotate || '🔄' },
      { type: 'invert', label: '반전', icon: icons.filterInvert || '🔲' },
      { type: 'opacity', label: '불투명도', icon: icons.filterOpacity || '👁️' },
      { type: 'saturate', label: '채도', icon: icons.filterSaturate || '🎨' },
      { type: 'sepia', label: '세피아', icon: icons.filterSepia || '📜' },
      { type: 'drop-shadow', label: '그림자', icon: icons.filterDropShadow || '👥' },
      { type: 'glow', label: '네온발광', icon: icons.filterGlow || '💡' },
      { type: 'clear', label: '효과초기화', icon: '🧹' }
    ];

    var btnHtmlList = effectTypes.map(function(item) {
      if (item.type === 'clear') {
        return '<button class="tool-btn" onclick="clearAllFilterEffects()" style="width:34px; height:34px; color:#ef4444;"><span class="alt-badge">C</span>' + item.icon + '<span class="tooltip-text">효과 전체 삭제</span></button>';
      }
      return '<button class="tool-btn" onclick="applyEffectDirect(\'' + item.type + '\')" onmousedown="startHoldEffect(event, this, \'' + item.type + '\')" onmouseup="endHoldEffect()" onmouseleave="endHoldEffect()" style="width:34px; height:34px;">' +
               item.icon +
               '<span class="tooltip-text">' + item.label + ' (' + item.type + ') (클릭: 기본 적용 / 길게 누름: 세부 설정)</span>' +
             '</button>';
    });

    var gridHtml = build3RowGridHtml(btnHtmlList);
    var listboxHtml = renderEffectsListboxContent();

    return '<div style="display:flex; flex-direction:row; align-items:center; gap:8px;">' +
             gridHtml +
             '<div style="display:flex; flex-direction:column; gap:2px;">' +
               '<div style="font-size:0.7rem; font-weight:700; color:#475569; display:flex; justify-content:space-between; align-items:center;">' +
                 '<span>적용된 효과 목록</span>' +
               '</div>' +
               listboxHtml +
             '</div>' +
           '</div>';
  }

  function renderEffectsListboxContent() {
    var hasSelection = (cfg.selectedIds && cfg.selectedIds.size > 0);
    if (!hasSelection) {
      return '<div id="appliedEffectsListbox" style="width:190px; height:72px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:2px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; color:#94a3b8;">' +
               '선택된 객체 없음' +
             '</div>';
    }

    var commonData = window.getCommonFilterList ? window.getCommonFilterList(cfg.selectedIds) : { commonList: [], hasDiscrepancy: false };
    var list = commonData.commonList || [];

    if (list.length === 0) {
      var emptyNotice = commonData.hasDiscrepancy ?
        '<div style="font-size:0.68rem; color:#d97706; text-align:center;">* 일부 개체에 개별 효과 있음</div>' :
        '<div style="font-size:0.72rem; color:#94a3b8; text-align:center; padding-top:20px;">적용된 효과 없음</div>';

      return '<div id="appliedEffectsListbox" style="width:190px; height:72px; background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:4px; overflow-y:auto; display:flex; flex-direction:column; justify-content:center;">' +
               emptyNotice +
             '</div>';
    }

    var itemsHtml = list.map(function(item, idx) {
      var summary = '';
      if (item.type === 'drop-shadow') {
        summary = item.dx + ',' + item.dy + ' ' + (item.blur || 8) + 'px';
      } else if (item.type === 'glow') {
        summary = (item.blur || 10) + 'px';
      } else {
        var val = item.val !== undefined ? item.val : (item.value !== undefined ? item.value : '');
        var unit = item.unit || '';
        summary = val + unit;
      }

      var isChecked = item.enabled !== false;
      var label = item.label || item.type;

      return '<div class="effect-list-item" style="display:flex; align-items:center; justify-content:space-between; padding:2px 4px; border-radius:4px; font-size:0.73rem; background:' + (isChecked ? '#f1f5f9' : '#f8fafc') + '; opacity:' + (isChecked ? '1' : '0.6') + '; border:1px solid #e2e8f0; cursor:pointer;" onclick="openEffectEditPopover(this, ' + idx + ')">' +
               '<div style="display:flex; align-items:center; gap:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">' +
                 '<input type="checkbox" ' + (isChecked ? 'checked' : '') + ' onclick="event.stopPropagation(); toggleEffectEnabled(' + idx + ', this.checked)" style="cursor:pointer;" title="효과 활성화/비활성화">' +
                 '<span style="font-weight:600; color:#1e293b;">' + label + '</span>' +
                 '<span style="color:#64748b; font-size:0.68rem;">(' + summary + ')</span>' +
               '</div>' +
               '<div style="display:flex; align-items:center; gap:1px;" onclick="event.stopPropagation();">' +
                 '<button onclick="reorderEffect(' + idx + ', ' + (idx - 1) + ')" style="border:none; background:none; cursor:pointer; padding:0 2px; font-size:0.65rem; color:#64748b;" title="위로 이동">▲</button>' +
                 '<button onclick="reorderEffect(' + idx + ', ' + (idx + 1) + ')" style="border:none; background:none; cursor:pointer; padding:0 2px; font-size:0.65rem; color:#64748b;" title="아래로 이동">▼</button>' +
                 '<button onclick="removeEffectItem(' + idx + ')" style="border:none; background:none; cursor:pointer; padding:0 2px; font-size:0.75rem; color:#ef4444;" title="삭제">✕</button>' +
               '</div>' +
             '</div>';
    }).join('');

    var discrepancyBadge = commonData.hasDiscrepancy ?
      '<div style="font-size:0.65rem; color:#b45309; background:#fef3c7; border:1px solid #fde68a; border-radius:3px; padding:1px 3px; text-align:center; margin-top:2px;">* 일부 개체에 개별 효과 포함됨</div>' : '';

    return '<div id="appliedEffectsListbox" style="width:190px; height:72px; background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:3px; overflow-y:auto; display:flex; flex-direction:column; gap:3px;">' +
             itemsHtml +
             discrepancyBadge +
           '</div>';
  }

  function renderRibbon() {
    var ribbonBar = document.getElementById('ribbonBar') || document.getElementById('ribbonContainer');
    if (!ribbonBar) return;
    var self = this;
    var icons = window.WebpointerIcons || {};

    if (cfg.currentTab === 'file') {
      var openFileBtn  = '<button class="tool-btn" onclick="openFile()" style="width:34px; height:34px;"><span class="alt-badge">O</span>' + (icons.openFile || '') + '<span class="tooltip-text">불러오기 (.json / .webpointer / .svg)</span></button>';
      var saveWebBtn   = '<button class="tool-btn" onclick="openFileSlotsModal()" style="width:34px; height:34px;"><span class="alt-badge">S</span>' + (icons.saveFile || '') + '<span class="tooltip-text">저장하기 (슬롯 임시저장 관리자)</span></button>';
      var downloadBtn  = '<button class="tool-btn" onclick="downloadFile()" style="width:34px; height:34px;"><span class="alt-badge">D</span>' + (icons.downloadFile || '') + '<span class="tooltip-text">다운로드 (.json 프로젝트 / .svg 이미지)</span></button>';

      var fileOpsTools = [openFileBtn, saveWebBtn, downloadBtn];
      var fileOpsContent = build3RowGridHtml(fileOpsTools);

      var symbolBtn    = '<button class="tool-btn" onclick="openSymbolManagerModal()"><span class="alt-badge">M</span>' + (icons.smileyIcon || icons.shapes || '') + '<span class="tooltip-text">심볼 (Symbol Manager)</span></button>';
      var markerBtn    = '<button class="tool-btn" onclick="openMarkerManagerModal()"><span class="alt-badge">K</span>' + (icons.markerIcon || icons.line || '') + '<span class="tooltip-text">마커 (화살표/원/다이아몬드/사용자1,2,3)</span></button>';
      var gradientBtn  = '<button class="tool-btn" onclick="openGradientManagerModal()"><span class="alt-badge">G</span>' + (icons.gradientPresetIcon || icons.targetFill || '') + '<span class="tooltip-text">그라데이션 (3가지 기본 프리셋)</span></button>';
      var pathBtn      = '<button class="tool-btn" onclick="openPathManagerModal()"><span class="alt-badge">P</span>' + (icons.mobiusStripIcon || '') + '<span class="tooltip-text">경로 관리 (뫼비우스 띠: Path 데이터 검증 및 저장)</span></button>';

      var metadataTools = [symbolBtn, markerBtn, gradientBtn, pathBtn];
      var metadataContent = build3RowGridHtml(metadataTools);

      var undoBtn = '<button class="tool-btn" onclick="undo()" style="width:34px; height:34px;"><span class="alt-badge">Ctrl+Z</span>' + (icons.undo || '') + '<span class="tooltip-text">뒤로가기 (Ctrl + Z)</span></button>';
      var redoBtn = '<button class="tool-btn" onclick="redo()" style="width:34px; height:34px;"><span class="alt-badge">Ctrl+Y</span>' + (icons.redo || '') + '<span class="tooltip-text">앞으로가기 (Ctrl + Y / Ctrl+Shift+Z)</span></button>';

      var historyContent =
        '<div style="display:flex; flex-direction:row; gap:4px; align-items:center;">' +
          undoBtn + redoBtn +
        '</div>';

      ribbonBar.innerHTML =
        buildCategoryHtml('file_ops', '파일 입출력', fileOpsContent) +
        buildCategoryHtml('file_history', '작업 히스토리', historyContent) +
        buildCategoryHtml('file_metadata', '메타데이터 관리', metadataContent);
    } else if (cfg.currentTab === 'insert') {
      var shapeTools = [
        '<button class="tool-btn ' + (cfg.currentTool==='pan'?'active':'') + '" onclick="setTool(\'pan\')"><span class="alt-badge">H</span>' + (icons.pan || '') + '<span class="tooltip-text">캔버스 화면 잡아서 밀기 (손/팬 도구 - H)</span></button>',
        '<button class="tool-btn ' + (cfg.currentTool==='select'?'active':'') + '" onclick="setTool(\'select\')"><span class="alt-badge">V</span>' + (icons.select || '') + '<span class="tooltip-text">선택 도구 (V)</span></button>',
        '<button class="tool-btn" onclick="openImageSymbolPickerModal()"><span class="alt-badge">I</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg><span class="tooltip-text">그림/심볼 삽입 (I) - 중앙에 그림 삽입 및 선택 변형</span></button>',
        '<button class="tool-btn ' + (cfg.currentTool==='text'?'active':'') + '" onclick="setTool(\'text\')"><span class="alt-badge">T</span>' + (icons.addText || '') + '<span class="tooltip-text">텍스트 상자 도구 (T)</span></button>',
        '<button class="tool-btn ' + (cfg.currentTool==='point'?'active':'') + '" onclick="setTool(\'point\')"><span class="alt-badge">P</span>' + (icons.point || '') + '<span class="tooltip-text">점 도구 (P)</span></button>',
        '<button class="tool-btn ' + (cfg.currentTool==='line'?'active':'') + '" onclick="setTool(\'line\')"><span class="alt-badge">L</span>' + (icons.line || '') + '<span class="tooltip-text">직선 도구 (L)</span></button>',
        '<button class="tool-btn ' + (cfg.currentTool==='rect'?'active':'') + '" onclick="setTool(\'rect\')"><span class="alt-badge">R</span>' + (icons.rect || '') + '<span class="tooltip-text">직사각형 도구 (R)</span></button>',
        '<button class="tool-btn ' + (cfg.currentTool==='rounded'?'active':'') + '" onclick="setTool(\'rounded\')"><span class="alt-badge">U</span>' + (icons.rounded || '') + '<span class="tooltip-text">둥근 사각형 도구 (U)</span></button>',
        '<button class="tool-btn ' + (cfg.currentTool==='ellipse'?'active':'') + '" onclick="setTool(\'ellipse\')"><span class="alt-badge">E</span>' + (icons.ellipse || '') + '<span class="tooltip-text">타원/원 도구 (E)</span></button>',
        '<button class="tool-btn ' + (cfg.currentTool==='arc'?'active':'') + '" onclick="setTool(\'arc\')"><span class="alt-badge">A</span>' + (icons.arc || '') + '<span class="tooltip-text">호 도구 (A)</span></button>',
        '<button class="tool-btn ' + (cfg.currentTool==='bez2'?'active':'') + '" onclick="setTool(\'bez2\')"><span class="alt-badge">Q</span>' + (icons.bez2 || '') + '<span class="tooltip-text">2차 베지어 곡선 (Q)</span></button>',
        '<button class="tool-btn ' + (cfg.currentTool==='bez3'?'active':'') + '" onclick="setTool(\'bez3\')"><span class="alt-badge">C</span>' + (icons.bez3 || '') + '<span class="tooltip-text">3차 베지어 곡선 (C)</span></button>'
      ];

      var blankSlotHtml = '<div style="width:34px; height:34px;"></div>';

      var layerTools = [
        '<button class="tool-btn" onclick="bringToFront()"><span class="alt-badge">Shift+]</span>' + (icons.bringToFront || '') + '<span class="tooltip-text">맨 앞으로 가져오기</span></button>',
        '<button class="tool-btn" onclick="bringForward()"><span class="alt-badge">]</span>' + (icons.bringForward || '') + '<span class="tooltip-text">앞으로 가져오기</span></button>',
        blankSlotHtml,
        '<button class="tool-btn" onclick="sendBackward()"><span class="alt-badge">[</span>' + (icons.sendBackward || '') + '<span class="tooltip-text">뒤로 보내기</span></button>',
        '<button class="tool-btn" onclick="sendToBack()"><span class="alt-badge">Shift+[</span>' + (icons.sendToBack || '') + '<span class="tooltip-text">맨 뒤로 보내기</span></button>'
      ];

      var topLevelUnits = new Set();
      var canUngroup = false;

      (cfg.selectedIds || new Set()).forEach(function(id) {
        var obj = cfg.objectsMap.get(id);
        if (obj && obj.el) {
          var outerG = getOutermostGroupEl(obj.el);
          if (outerG) {
            topLevelUnits.add(outerG);
            canUngroup = true;
          } else {
            topLevelUnits.add(obj.el);
          }
        }
      });

      var selectedTopCount = topLevelUnits.size;
      var canGroup = selectedTopCount >= 2;
      var canAlign2 = selectedTopCount >= 2;
      var canAlign3 = selectedTopCount >= 3;
      var canTransform = (cfg.selectedIds || new Set()).size >= 1;

      var groupTools = [
        '<button class="tool-btn ' + (canGroup ? '' : 'disabled') + '" ' + (canGroup ? 'onclick="groupSelected()"' : 'disabled style="opacity:0.4; cursor:not-allowed;"') + '><span class="alt-badge">G</span>' + (icons.group || '') + '<span class="tooltip-text">' + (canGroup ? '그룹화 (<g>)' : '그룹화 (독립 단위 2개 이상 선택 필요)') + '</span></button>',
        '<button class="tool-btn ' + (canUngroup ? '' : 'disabled') + '" ' + (canUngroup ? 'onclick="ungroupSelected()"' : 'disabled style="opacity:0.4; cursor:not-allowed;"') + '><span class="alt-badge">U</span>' + (icons.ungroup || '') + '<span class="tooltip-text">' + (canUngroup ? '그룹 해제' : '그룹 해제 (그룹 객체 선택 필요)') + '</span></button>'
      ];

      var alignTools = [
        '<button class="tool-btn ' + (canAlign2 ? '' : 'disabled') + '" ' + (canAlign2 ? 'onclick="alignSelected(\'left\')"' : 'disabled style="opacity:0.4; cursor:not-allowed;"') + '><span class="alt-badge">Alt+L</span>' + (icons.alignLeft || '') + '<span class="tooltip-text">' + (canAlign2 ? '왼쪽 정렬' : '왼쪽 정렬 (독립 단위 2개 이상 필요)') + '</span></button>',
        '<button class="tool-btn ' + (canAlign2 ? '' : 'disabled') + '" ' + (canAlign2 ? 'onclick="alignSelected(\'hcenter\')"' : 'disabled style="opacity:0.4; cursor:not-allowed;"') + '><span class="alt-badge">Alt+C</span>' + (icons.alignHcenter || '') + '<span class="tooltip-text">' + (canAlign2 ? '가로 중앙 정렬' : '가로 중앙 정렬 (독립 단위 2개 이상 필요)') + '</span></button>',
        '<button class="tool-btn ' + (canAlign2 ? '' : 'disabled') + '" ' + (canAlign2 ? 'onclick="alignSelected(\'right\')"' : 'disabled style="opacity:0.4; cursor:not-allowed;"') + '><span class="alt-badge">Alt+R</span>' + (icons.alignRight || '') + '<span class="tooltip-text">' + (canAlign2 ? '오른쪽 정렬' : '오른쪽 정렬 (독립 단위 2개 이상 필요)') + '</span></button>',
        '<button class="tool-btn ' + (canAlign2 ? '' : 'disabled') + '" ' + (canAlign2 ? 'onclick="alignSelected(\'top\')"' : 'disabled style="opacity:0.4; cursor:not-allowed;"') + '><span class="alt-badge">Alt+T</span>' + (icons.alignTop || '') + '<span class="tooltip-text">' + (canAlign2 ? '위쪽 정렬' : '위쪽 정렬 (독립 단위 2개 이상 필요)') + '</span></button>',
        '<button class="tool-btn ' + (canAlign2 ? '' : 'disabled') + '" ' + (canAlign2 ? 'onclick="alignSelected(\'vcenter\')"' : 'disabled style="opacity:0.4; cursor:not-allowed;"') + '><span class="alt-badge">Alt+M</span>' + (icons.alignVcenter || '') + '<span class="tooltip-text">' + (canAlign2 ? '세로 중앙 정렬' : '세로 중앙 정렬 (독립 단위 2개 이상 필요)') + '</span></button>',
        '<button class="tool-btn ' + (canAlign2 ? '' : 'disabled') + '" ' + (canAlign2 ? 'onclick="alignSelected(\'bottom\')"' : 'disabled style="opacity:0.4; cursor:not-allowed;"') + '><span class="alt-badge">Alt+B</span>' + (icons.alignBottom || '') + '<span class="tooltip-text">' + (canAlign2 ? '아래쪽 정렬' : '아래쪽 정렬 (독립 단위 2개 이상 필요)') + '</span></button>',
        '<button class="tool-btn ' + (canAlign3 ? '' : 'disabled') + '" ' + (canAlign3 ? 'onclick="alignSelected(\'hspace\')"' : 'disabled style="opacity:0.4; cursor:not-allowed;"') + '><span class="alt-badge">Alt+H</span>' + (icons.alignHspace || '') + '<span class="tooltip-text">' + (canAlign3 ? '가로 간격 동일하게' : '가로 간격 동일하게 (독립 단위 3개 이상 필요)') + '</span></button>',
        '<button class="tool-btn ' + (canAlign3 ? '' : 'disabled') + '" ' + (canAlign3 ? 'onclick="alignSelected(\'vspace\')"' : 'disabled style="opacity:0.4; cursor:not-allowed;"') + '><span class="alt-badge">Alt+V</span>' + (icons.alignVspace || '') + '<span class="tooltip-text">' + (canAlign3 ? '세로 간격 동일하게' : '세로 간격 동일하게 (독립 단위 3개 이상 필요)') + '</span></button>'
      ];

      var transformTools = [
        '<button class="tool-btn ' + (canTransform ? '' : 'disabled') + '" ' + (canTransform ? 'onclick="transformSelected(\'flipH\')"' : 'disabled style="opacity:0.4; cursor:not-allowed;"') + '><span class="alt-badge">F</span>' + (icons.flipH || '') + '<span class="tooltip-text">' + (canTransform ? '좌우 대칭' : '좌우 대칭 (객체 선택 필요)') + '</span></button>',
        '<button class="tool-btn ' + (canTransform ? '' : 'disabled') + '" ' + (canTransform ? 'onclick="transformSelected(\'flipV\')"' : 'disabled style="opacity:0.4; cursor:not-allowed;"') + '><span class="alt-badge">K</span>' + (icons.flipV || '') + '<span class="tooltip-text">' + (canTransform ? '상하 대칭' : '상하 대칭 (객체 선택 필요)') + '</span></button>',
        blankSlotHtml,
        '<button class="tool-btn ' + (canTransform ? '' : 'disabled') + '" ' + (canTransform ? 'onclick="transformSelected(\'rotate90\')"' : 'disabled style="opacity:0.4; cursor:not-allowed;"') + '><span class="alt-badge">R</span>' + (icons.rotate90 || '') + '<span class="tooltip-text">' + (canTransform ? '90도 회전 (시계방향)' : '90도 회전 (객체 선택 필요)') + '</span></button>',
        '<button class="tool-btn ' + (canTransform ? '' : 'disabled') + '" ' + (canTransform ? 'onclick="transformSelected(\'rotateNeg90\')"' : 'disabled style="opacity:0.4; cursor:not-allowed;"') + '><span class="alt-badge">L</span>' + (icons.rotateNeg90 || '') + '<span class="tooltip-text">' + (canTransform ? '-90도 회전 (반시계방향)' : '-90도 회전 (객체 선택 필요)') + '</span></button>'
      ];

      var metricW = 0, metricH = 0, metricRot = 0;
      var hasMetricSelection = (cfg.selectedIds && cfg.selectedIds.size > 0);
      if (hasMetricSelection) {
        var firstId = Array.from(cfg.selectedIds)[0];
        var firstObj = cfg.objectsMap.get(firstId);
        if (firstObj) {
          var b = window.WebpointerObjects ? window.WebpointerObjects.getObjectBounds(firstObj) : null;
          if (b) {
            metricW = Math.round(b.maxX - b.minX);
            metricH = Math.round(b.maxY - b.minY);
          }
          metricRot = firstObj.attrs.angle || 0;
        }
      }

      var metricsContentHtml =
        '<div style="display:flex; flex-direction:column; gap:2px; justify-content:center; padding:1px 2px;">' +
          '<div style="display:flex; align-items:center; gap:4px; font-size:0.75rem; font-weight:600; color:#334155;">' +
            '<span style="width:42px; color:#475569;">가로:</span>' +
            '<input type="number" min="1" max="9999" value="' + (hasMetricSelection ? metricW : '') + '" placeholder="0" ' + (hasMetricSelection ? '' : 'disabled ') + 'oninput="updateSelectedMetricWidth(this.value)" onchange="updateSelectedMetricWidth(this.value)" style="width:55px; padding:1px 4px; font-size:0.75rem; border:1px solid #cbd5e1; border-radius:4px; text-align:right;" title="가로 크기 (Width)"> px' +
          '</div>' +
          '<div style="display:flex; align-items:center; gap:4px; font-size:0.75rem; font-weight:600; color:#334155;">' +
            '<span style="width:42px; color:#475569;">세로:</span>' +
            '<input type="number" min="1" max="9999" value="' + (hasMetricSelection ? metricH : '') + '" placeholder="0" ' + (hasMetricSelection ? '' : 'disabled ') + 'oninput="updateSelectedMetricHeight(this.value)" onchange="updateSelectedMetricHeight(this.value)" style="width:55px; padding:1px 4px; font-size:0.75rem; border:1px solid #cbd5e1; border-radius:4px; text-align:right;" title="세로 크기 (Height)"> px' +
          '</div>' +
          '<div style="display:flex; align-items:center; gap:4px; font-size:0.75rem; font-weight:600; color:#334155;">' +
            '<span style="width:48px; color:#475569;">회전각:</span>' +
            '<input type="number" min="-360" max="360" value="' + (hasMetricSelection ? metricRot : '') + '" placeholder="0" ' + (hasMetricSelection ? '' : 'disabled ') + 'oninput="updateSelectedMetricAngle(this.value)" onchange="updateSelectedMetricAngle(this.value)" style="width:49px; padding:1px 4px; font-size:0.75rem; border:1px solid #cbd5e1; border-radius:4px; text-align:right;" title="회전 각도 (Angle)"> °' +
          '</div>' +
        '</div>';

      ribbonBar.innerHTML =
        buildCategoryHtml('insert_shapes', '도형 삽입', build3RowGridHtml(shapeTools)) +
        buildCategoryHtml('insert_layer', '레이어 순서', build3RowGridHtml(layerTools)) +
        buildCategoryHtml('insert_group', '그룹화', build3RowGridHtml(groupTools)) +
        buildCategoryHtml('insert_align', '정렬 및 간격', build3RowGridHtml(alignTools)) +
        buildCategoryHtml('insert_transform', '회전 및 대칭', build3RowGridHtml(transformTools)) +
        buildCategoryHtml('insert_metrics', '수치', metricsContentHtml);
    } else if (cfg.currentTab === 'view') {
      var stepPx = cfg.gridStepSize || 24;

      var canvasSettingsContentHtml =
        '<div style="display:flex; flex-direction:column; gap:4px; justify-content:flex-start;">' +
          '<div style="display:flex; flex-direction:row; align-items:center; gap:6px;">' +
            '<span style="font-size:0.78rem; font-weight:600; color:#475569;">격자</span>' +
            '<input type="checkbox" id="chkGridToggle" ' + (cfg.gridSnapEnabled ? 'checked' : '') + ' onchange="toggleGridSnap(this.checked)" style="width:16px; height:16px; cursor:pointer;" title="격자 스냅">' +
            '<input type="number" min="5" max="200" value="' + stepPx + '" oninput="setGridStepSize(this.value)" onchange="setGridStepSize(this.value)" style="width:45px; padding:2px 4px; font-size:0.8rem; border:1px solid #cbd5e1; border-radius:4px; text-align:center;" title="격자 크기 (px)">' +
            '<span style="font-size:0.78rem; font-weight:600; color:#475569; margin-left:4px;">자석</span>' +
            '<input type="checkbox" id="chkSnapToggle" ' + (cfg.enableSnapping !== false ? 'checked' : '') + ' onchange="toggleSnapping(this.checked)" style="width:16px; height:16px; cursor:pointer;" title="객체 자동 맞춤 자석 스냅">' +
            '<input type="number" min="1" max="50" value="' + (cfg.snappingThreshold || 6) + '" oninput="setSnappingThreshold(this.value)" onchange="setSnappingThreshold(this.value)" style="width:40px; padding:2px 4px; font-size:0.8rem; border:1px solid #cbd5e1; border-radius:4px; text-align:center;" title="자석 거리 (px)">' +
          '</div>' +
          '<div style="display:flex; flex-direction:row; align-items:center; gap:6px;">' +
            '<select onchange="setCanvasRatio(this.value)" style="width:130px; padding:2px 4px; font-size:0.78rem; border:1px solid #cbd5e1; border-radius:4px;" title="캔버스 크기">' +
              '<option value="960x540" ' + ((cfg.canvasRatio||'960x540')==='960x540'?'selected':'') + '>16:9 (960×540)</option>' +
              '<option value="1280x720" ' + (cfg.canvasRatio==='1280x720'?'selected':'') + '>16:9 HD (1280×720)</option>' +
              '<option value="800x600" ' + (cfg.canvasRatio==='800x600'?'selected':'') + '>4:3 (800×600)</option>' +
              '<option value="600x600" ' + (cfg.canvasRatio==='600x600'?'selected':'') + '>1:1 (600×600)</option>' +
            '</select>' +
            '<input type="color" value="' + (cfg.canvasBgColor || '#ffffff') + '" onchange="setCanvasBgColor(this.value)" style="width:34px; height:24px; padding:0; border:1px solid #cbd5e1; border-radius:4px; cursor:pointer;" title="캔버스 색상">' +
          '</div>' +
        '</div>';

      var openDetailedBtnHtml = '<button class="tool-btn" id="btnDetailedSettings" onclick="openDetailedSettingsModal()" style="width:34px; height:34px;"><span class="alt-badge">S</span>' + (icons.settingsGear || '⚙') + '<span class="tooltip-text">세부 설정 (근접선택거리, 기본크기, 투명도단계)</span></button>';
      var openShortcutBtnHtml = '<button class="tool-btn" id="btnShortcutGuide" onclick="openShortcutModal()" style="width:34px; height:34px;"><span class="alt-badge">K</span>' + (icons.keyboardShortcut || '⌨') + '<span class="tooltip-text">단축키 안내 (전체 키보드 매핑)</span></button>';

      var settingsContentHtml =
        '<div style="display:flex; flex-direction:row; gap:4px; align-items:center;">' +
          openDetailedBtnHtml + openShortcutBtnHtml +
        '</div>';

      var openPaletteBtnHtml   = '<button class="tool-btn" onclick="window.open(\'https://iseohyun.github.io/UniPalette/\', \'_blank\')" style="width:34px; height:34px;"><span class="alt-badge">O</span>' + (icons.openPalette || '') + '<span class="tooltip-text">기본색상 정하기 (UniPalette 새탭)</span></button>';
      var importPaletteBtnHtml = '<button class="tool-btn" onclick="openPaletteModal()" style="width:34px; height:34px;"><span class="alt-badge">I</span>' + (icons.importPalette || '') + '<span class="tooltip-text">기본색상 가져오기 (코드 붙여넣기)</span></button>';

      var themeSettingsHtml =
        '<div style="display:flex; flex-direction:row; gap:4px; align-items:center;">' +
          openPaletteBtnHtml + importPaletteBtnHtml +
        '</div>';

      ribbonBar.innerHTML =
        buildCategoryHtml('view_canvas', '캔버스 설정', canvasSettingsContentHtml) +
        buildCategoryHtml('view_settings', '설정', settingsContentHtml) +
        buildCategoryHtml('view_theme', '테마', themeSettingsHtml);
    } else if (cfg.currentTab === 'style') {
      var strokeIconHtml = icons.getShapeStrokeIcon ? icons.getShapeStrokeIcon(cfg.strokeColor) : (icons.targetStroke || '');
      var fillIconHtml   = icons.getShapeFillIcon ? icons.getShapeFillIcon(cfg.fillColor) : (icons.targetFill || '');
      var strokeBtnHtml = '<button class="tool-btn" onclick="handleColorBtnClick(this, \'stroke\')" onmousedown="startHoldColorBtn(event, this, \'stroke\')" onmouseup="endHoldColorBtn()" onmouseleave="endHoldColorBtn()" style="width:34px; height:34px; position:relative;">' + strokeIconHtml + '<span class="tooltip-text">선 색상 (클릭: 색상 적용 / 길게 누름: 팔레트 열기)</span></button>';
      var fillBtnHtml   = '<button class="tool-btn" onclick="handleColorBtnClick(this, \'fill\')" onmousedown="startHoldColorBtn(event, this, \'fill\')" onmouseup="endHoldColorBtn()" onmouseleave="endHoldColorBtn()" style="width:34px; height:34px; position:relative;">' + fillIconHtml + '<span class="tooltip-text">면 채우기 색상 (클릭: 색상 적용 / 길게 누름: 팔레트 열기)</span></button>';

      var widthInputHtml = '<input type="number" min="1" max="50" value="' + cfg.strokeWidth + '" oninput="setStrokeWidth(this.value)" onchange="setStrokeWidth(this.value)" style="width:34px; height:34px; box-sizing:border-box; padding:2px; font-size:0.85rem; font-weight:700; border:1px solid #cbd5e1; border-radius:6px; text-align:center; outline:none; background:#ffffff; color:#0f172a;" title="선 두께 (px)">';

      var isDashed = cfg.strokeDashStyle === 'dashed';
      var dashedLineBtn = '<button class="tool-btn ' + (isDashed ? 'active' : '') + '" onclick="toggleStrokeDashStyle()" onmousedown="startHoldDashArray(event, this)" onmouseup="endHoldDashArray()" onmouseleave="endHoldDashArray()" style="width:34px; height:34px;">' + (icons.lineDashed || '') + '<span class="tooltip-text">선 모양: 점선 (클릭 토글 / 길게 눌러 패턴 설정)</span></button>';

      var stepVal = 1 / (cfg.alphaStepCount || 5);
      var curAlpha = cfg.opacity !== undefined ? cfg.opacity : 1;
      var alphaPct = Math.round(curAlpha * 100);

      var alphaRangeHtml =
        '<div style="display:flex; flex-direction:column; justify-content:center; align-items:center; gap:2px; height:72px; padding:0 4px; border-left:1px solid #cbd5e1;">' +
          '<span style="font-size:0.72rem; font-weight:700; color:#475569;">a: ' + alphaPct + '%</span>' +
          '<input type="range" min="0" max="1" step="' + stepVal + '" value="' + curAlpha + '" oninput="setElementOpacity(this.value)" style="width:72px; cursor:pointer;" title="투명도(Alpha)">' +
        '</div>';

      var lineGridHtml =
        '<div style="display:flex; flex-direction:row; align-items:center; gap:6px;">' +
          '<div style="display:grid; grid-template-columns:34px 34px; grid-template-rows:34px 34px; gap:4px;">' +
            strokeBtnHtml + fillBtnHtml +
            widthInputHtml + dashedLineBtn +
          '</div>' +
        '</div>';

      var curStartMarker = cfg.startMarker || 'none';
      var curEndMarker   = cfg.endMarker || 'none';

      var startCycleBtn = '<button class="tool-btn active" onclick="cycleStartMarker()" style="width:34px; height:34px;">' + (icons['start' + (curStartMarker.charAt(0).toUpperCase() + curStartMarker.slice(1))] || icons.startNone || '▶') + '<span class="tooltip-text">시작 마커 토글: ' + curStartMarker + ' (클릭 시 순환: 없음/화살표/원/다이아몬드)</span></button>';
      var isStartSolid = (cfg.startMarkerFillStyle || 'solid') === 'solid';
      var startFillToggleBtn = '<button class="tool-btn ' + (isStartSolid ? 'active' : '') + '" onclick="toggleStartMarkerFillStyle()" style="width:34px; height:34px;">' + (isStartSolid ? (icons.startSolid || '') : (icons.startHollow || '')) + '<span class="tooltip-text">시작 마커 채우기 (클릭 토글: 꽉찬/빈모양)</span></button>';
      var startScalePlus = '<button class="tool-btn" onclick="scaleMarker(\'start\', 1.25)" style="width:34px; height:34px;"><span class="alt-badge">+</span>' + (icons.markerPlus || '') + '<span class="tooltip-text">시작 마커 크기 키우기 (+)</span></button>';
      var startScaleMinus = '<button class="tool-btn" onclick="scaleMarker(\'start\', 0.8)" style="width:34px; height:34px;"><span class="alt-badge">-</span>' + (icons.markerMinus || '') + '<span class="tooltip-text">시작 마커 크기 줄이기 (-)</span></button>';

      var endCycleBtn = '<button class="tool-btn active" onclick="cycleEndMarker()" style="width:34px; height:34px;">' + (icons['end' + (curEndMarker.charAt(0).toUpperCase() + curEndMarker.slice(1))] || icons.endNone || '◀') + '<span class="tooltip-text">끝 마커 토글: ' + curEndMarker + ' (클릭 시 순환: 없음/화살표/원/다이아몬드)</span></button>';
      var isEndSolid = (cfg.endMarkerFillStyle || 'solid') === 'solid';
      var endFillToggleBtn = '<button class="tool-btn ' + (isEndSolid ? 'active' : '') + '" onclick="toggleEndMarkerFillStyle()" style="width:34px; height:34px;">' + (isEndSolid ? (icons.endSolid || '') : (icons.endHollow || '')) + '<span class="tooltip-text">끝 마커 채우기 (클릭 토글: 꽉찬/빈모양)</span></button>';
      var endScalePlus = '<button class="tool-btn" onclick="scaleMarker(\'end\', 1.25)" style="width:34px; height:34px;"><span class="alt-badge">+</span>' + (icons.markerPlus || '') + '<span class="tooltip-text">끝 마커 크기 키우기 (+)</span></button>';
      var endScaleMinus = '<button class="tool-btn" onclick="scaleMarker(\'end\', 0.8)" style="width:34px; height:34px;"><span class="alt-badge">-</span>' + (icons.markerMinus || '') + '<span class="tooltip-text">끝 마커 크기 줄이기 (-)</span></button>';

      var lineEndsContent =
        '<div style="display:flex; flex-direction:column; gap:4px; justify-content:flex-start;">' +
          '<div style="display:flex; flex-direction:row; align-items:center; gap:4px;">' +
            startCycleBtn +
            '<div style="width:1px; height:28px; background:#cbd5e1; margin:0 3px;"></div>' +
            startFillToggleBtn +
            '<div style="width:1px; height:28px; background:#cbd5e1; margin:0 3px;"></div>' +
            '<div style="display:flex; flex-direction:row; gap:2px;">' + startScalePlus + startScaleMinus + '</div>' +
          '</div>' +
          '<div style="display:flex; flex-direction:row; align-items:center; gap:4px;">' +
            endCycleBtn +
            '<div style="width:1px; height:28px; background:#cbd5e1; margin:0 3px;"></div>' +
            endFillToggleBtn +
            '<div style="width:1px; height:28px; background:#cbd5e1; margin:0 3px;"></div>' +
            '<div style="display:flex; flex-direction:row; gap:2px;">' + endScalePlus + endScaleMinus + '</div>' +
          '</div>' +
        '</div>';

      var curCap = cfg.strokeCap || 'butt';
      var curJoin = cfg.strokeJoin || 'miter';

      var capCycleBtn = '<button class="tool-btn active" onclick="cycleStrokeCap()" style="width:34px; height:34px;">' + (icons['cap' + (curCap.charAt(0).toUpperCase() + curCap.slice(1))] || '—') + '<span class="tooltip-text">선 마감 토글: ' + curCap + ' (클릭 시 순환: butt/round/square)</span></button>';
      var joinCycleBtn = '<button class="tool-btn active" onclick="cycleStrokeJoin()" style="width:34px; height:34px;">' + (icons['join' + (curJoin.charAt(0).toUpperCase() + curJoin.slice(1))] || '┌') + '<span class="tooltip-text">모서리 마감 토글: ' + curJoin + ' (클릭 시 순환: miter/round/bevel)</span></button>';

      var capJoinContent =
        '<div style="display:flex; flex-direction:column; gap:4px; justify-content:flex-start;">' +
          '<div style="display:flex; flex-direction:row; align-items:center; gap:6px;">' +
            '<span style="font-size:0.75rem; color:#475569; font-weight:600; min-width:32px;">끝:</span>' +
            capCycleBtn +
          '</div>' +
          '<div style="display:flex; flex-direction:row; align-items:center; gap:6px;">' +
            '<span style="font-size:0.75rem; color:#475569; font-weight:600; min-width:32px;">꺾임:</span>' +
            joinCycleBtn +
          '</div>' +
        '</div>';

      var cropBtnHtml = '<button class="tool-btn ' + (state.isCropModeActive ? 'active' : '') + '" onclick="toggleCropMode()" style="width:34px; height:34px;">' + (icons.crop || '✂️') + '<span class="tooltip-text">자르기 (마우스 드래그로 자르기 영역 조절)</span></button>';
      var clipSymbolBtnHtml = '<button class="tool-btn" onclick="openSymbolClipPopover(this)" style="width:34px; height:34px;">🔪<span class="tooltip-text">오리기: 심볼 사용 (등록된 심볼 모양으로 비파괴 쿠키커터 오리기)</span></button>';
      var filterBtnHtml = '<button class="tool-btn" onclick="openFilterPopover(this)" style="width:34px; height:34px;">🪄<span class="tooltip-text">필터 효과 설정 (blur, brightness, contrast, drop-shadow 등 중복 선택 가능)</span></button>';

      var editContent =
        '<div style="display:flex; flex-direction:row; align-items:center; gap:4px;">' +
          cropBtnHtml + clipSymbolBtnHtml + filterBtnHtml +
        '</div>';

      var effectsCategoryHtml = buildEffectsCategoryHtml();

      ribbonBar.innerHTML =
        buildCategoryHtml('style_line', '선 및 색상', lineGridHtml) +
        buildCategoryHtml('style_lineEnds', '선 끝', lineEndsContent) +
        buildCategoryHtml('style_capJoin', '마감', capJoinContent) +
        buildCategoryHtml('style_effects', '효과', effectsCategoryHtml) +
        buildCategoryHtml('style_edit', '편집', editContent);
    } else if (cfg.currentTab === 'text') {
      var curFontFamily = cfg.fontFamily || 'sans-serif';
      var curFontSize = cfg.fontSize || 20;
      var curFontWeight = cfg.fontWeight || 'normal';
      var curFontStyle = cfg.fontStyle || 'normal';
      var curTextAnchor = cfg.textAnchor || 'start';

      var systemFonts = cfg.systemFonts || [
        "맑은 고딕", "나눔고딕", "나눔명조", "굴림", "돋움", "바탕", "궁서",
        "Arial", "Calibri", "Comic Sans MS", "Consolas", "Courier New", "Georgia",
        "Impact", "Segoe UI", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana",
        "sans-serif", "serif", "monospace"
      ];

      var fontOptionsStr = systemFonts.map(function(fName) {
        var isSel = (curFontFamily === fName) ? 'selected' : '';
        return '<option value="' + fName + '" ' + isSel + '>' + fName + '</option>';
      }).join('');

      var isBoldActive = (curFontWeight === 'bold' || parseInt(curFontWeight, 10) >= 600);
      var isItalicActive = (curFontStyle === 'italic' || curFontStyle === 'oblique');
      var isStrikethroughActive = (cfg.textDecoration === 'line-through');

      var boldBtnHtml =
        '<button class="tool-btn ' + (isBoldActive ? 'active' : '') + '" onclick="toggleTextBold()" onmousedown="startHoldWeight(event, this)" onmouseup="endHoldWeight()" onmouseleave="endHoldWeight()" style="width:34px; height:34px; font-weight:bold; font-size:1.1rem; font-family:serif;">' +
          'B' +
          '<span class="tooltip-text">글자 두께 (클릭: Bold, 길게누르기: 100~900)</span>' +
        '</button>';

      var italicBtnHtml =
        '<button class="tool-btn ' + (isItalicActive ? 'active' : '') + '" onclick="toggleTextItalic()" onmousedown="startHoldStyle(event, this)" onmouseup="endHoldStyle()" onmouseleave="endHoldStyle()" style="width:34px; height:34px; font-style:italic; font-size:1.1rem; font-family:serif;">' +
          'I' +
          '<span class="tooltip-text">글자 기울임 (클릭: Italic, 길게누르기: Normal/Italic/Oblique)</span>' +
        '</button>';

      var strikethroughBtnHtml =
        '<button class="tool-btn ' + (isStrikethroughActive ? 'active' : '') + '" onclick="toggleTextStrikethrough()" style="width:34px; height:34px;">' +
          (icons.strikethrough || 'S') +
          '<span class="tooltip-text">취소선</span>' +
        '</button>';

      var lineHeightBtnHtml =
        '<button class="tool-btn" onclick="toggleTextLineHeight()" onmousedown="startHoldLineHeight(event, this)" onmouseup="endHoldLineHeight()" onmouseleave="endHoldLineHeight()" style="width:34px; height:34px;">' +
          (icons.lineHeight || '↕') +
          '<span class="tooltip-text">줄간격 (클릭: 1.2/1.5 토글, 길게누르기: 선택)</span>' +
        '</button>';

      var hIconSvg = icons.alignTextLeft;
      var hTooltipText = "왼쪽 맞춤 (클릭 시 좌/중/우/양쪽 순환)";
      if (curTextAnchor === 'middle') {
        hIconSvg = icons.alignTextCenter;
        hTooltipText = "가운데 맞춤 (클릭 시 좌/중/우/양쪽 순환)";
      } else if (curTextAnchor === 'end') {
        hIconSvg = icons.alignTextRight;
        hTooltipText = "오른쪽 맞춤 (클릭 시 좌/중/우/양쪽 순환)";
      } else if (curTextAnchor === 'justify') {
        hIconSvg = icons.alignTextJustify;
        hTooltipText = "양쪽 맞춤 (클릭 시 좌/중/우/양쪽 순환)";
      }

      var alignHorizCycleBtnHtml =
        '<button class="tool-btn active" onclick="cycleTextHorizontalAlign()" style="width:34px; height:34px;">' +
          (hIconSvg || '≡') +
          '<span class="tooltip-text">' + hTooltipText + '</span>' +
        '</button>';

      var isVertical = (cfg.textWritingMode === 'vertical-rl' || cfg.textWritingMode === 'vertical');
      var textDirectionBtnHtml =
        '<button class="tool-btn ' + (isVertical ? 'active' : '') + '" onclick="toggleTextWritingMode()" style="width:34px; height:34px;">' +
          (icons.textDirection || 'T↓') +
          '<span class="tooltip-text">텍스트 방향 (클릭 토글: 가로/세로)</span>' +
        '</button>';

      var curVertAlign = cfg.textDominantBaseline || 'alphabetic';
      var vIconSvg = icons.alignVertBottom;
      var vTooltipText = "아래쪽 맞춤 (클릭 시 위/중앙/아래 순환)";
      if (curVertAlign === 'hanging') {
        vIconSvg = icons.alignVertTop;
        vTooltipText = "위쪽 맞춤 (클릭 시 위/중앙/아래 순환)";
      } else if (curVertAlign === 'central' || curVertAlign === 'middle') {
        vIconSvg = icons.alignVertMiddle;
        vTooltipText = "중앙 맞춤 (클릭 시 위/중앙/아래 순환)";
      }

      var alignVertCycleBtnHtml =
        '<button class="tool-btn active" onclick="cycleTextVerticalAlign()" style="width:34px; height:34px;">' +
          (vIconSvg || '↕') +
          '<span class="tooltip-text">' + vTooltipText + '</span>' +
        '</button>';

      var curAutoFit = cfg.textAutoFitMode || 'fitShapeToText';
      var fitIconSvg = icons.autoFitShape;
      var fitTooltipText = "텍스트에 맞춤 (기본): 글자가 도형을 넘어가면 도형 크기를 키움 (클릭 시 순환)";
      if (curAutoFit === 'fitTextToShape') {
        fitIconSvg = icons.autoFitText;
        fitTooltipText = "도형에 맞춤: 텍스트가 도형을 넘어가면 텍스트 크기를 줄임 (클릭 시 순환)";
      } else if (curAutoFit === 'none') {
        fitIconSvg = icons.autoFitNone;
        fitTooltipText = "안 맞춤: 도형이나 텍스트 크기를 변경하지 않음 (클릭 시 순환)";
      }

      var autoFitCycleBtnHtml =
        '<button class="tool-btn active" onclick="cycleTextAutoFitMode()" style="width:34px; height:34px;">' +
          (fitIconSvg || '⇱') +
          '<span class="tooltip-text">' + fitTooltipText + '</span>' +
        '</button>';

      var fontOptionsHtml =
        '<div style="display:flex; flex-direction:column; gap:3px;">' +
          '<div style="display:flex; flex-direction:row; align-items:center; gap:4px;">' +
            '<select onfocus="fetchLocalSystemFonts()" onchange="setTextFontFamily(this.value)" style="max-width:125px; padding:2px 4px; font-size:0.78rem; border:1px solid #cbd5e1; border-radius:4px;">' +
              fontOptionsStr +
            '</select>' +
            '<input type="number" min="8" max="200" value="' + curFontSize + '" oninput="setTextFontSize(this.value)" onchange="setTextFontSize(this.value)" style="width:45px; padding:2px 4px; font-size:0.78rem; border:1px solid #cbd5e1; border-radius:4px; text-align:center;">' +
          '</div>' +
          '<div style="display:flex; flex-direction:row; align-items:center; gap:4px;">' +
            boldBtnHtml +
            italicBtnHtml +
            strikethroughBtnHtml +
            lineHeightBtnHtml +
            textDirectionBtnHtml +
          '</div>' +
          '<div style="display:flex; flex-direction:row; align-items:center; gap:4px;">' +
            alignHorizCycleBtnHtml +
            alignVertCycleBtnHtml +
            autoFitCycleBtnHtml +
          '</div>' +
        '</div>';

      var strokeColor = cfg.textStrokeColor || cfg.strokeColor || 'none';
      var fillColor   = cfg.textFillColor || cfg.fillColor || '#041e49';
      var strokeWidth = cfg.textStrokeWidth !== undefined ? cfg.textStrokeWidth : 1;

      var textFillIconHtml   = icons.getTextFillIcon ? icons.getTextFillIcon(fillColor) : (icons.textFillIcon || icons.targetFill || '');
      var textStrokeIconHtml = icons.getTextStrokeIcon ? icons.getTextStrokeIcon(strokeColor) : (icons.textStrokeIcon || icons.targetStroke || '');
      var textFillBtnHtml   = '<button class="tool-btn" onclick="handleColorBtnClick(this, \'text_fill\')" onmousedown="startHoldColorBtn(event, this, \'text_fill\')" onmouseup="endHoldColorBtn()" onmouseleave="endHoldColorBtn()" style="width:34px; height:34px; position:relative;"><span class="alt-badge">F</span>' + textFillIconHtml + '<span class="tooltip-text">글자 채우기 색상 (클릭: 색상 적용 / 길게 누름: 팔레트 열기)</span></button>';
      var textStrokeBtnHtml = '<button class="tool-btn" onclick="handleColorBtnClick(this, \'text_stroke\')" onmousedown="startHoldColorBtn(event, this, \'text_stroke\')" onmouseup="endHoldColorBtn()" onmouseleave="endHoldColorBtn()" style="width:34px; height:34px; position:relative;"><span class="alt-badge">S</span>' + textStrokeIconHtml + '<span class="tooltip-text">글자 테두리 색상 (클릭: 색상 적용 / 길게 누름: 팔레트 열기)</span></button>';
      var strokeWidthInputHtml = '<input type="number" min="0" max="50" value="' + strokeWidth + '" oninput="setTextStrokeWidth(this.value)" onchange="setTextStrokeWidth(this.value)" style="width:34px; height:34px; box-sizing:border-box; padding:2px; font-size:0.85rem; font-weight:700; border:1px solid #cbd5e1; border-radius:6px; text-align:center; outline:none; background:#ffffff; color:#0f172a;" title="글자 테두리 두께 (px)">';
      var textFilterBtnHtml = '<button class="tool-btn" onclick="openFilterPopover(this)" style="width:34px; height:34px;">🪄<span class="tooltip-text">필터 효과 설정 (blur, brightness, contrast 등)</span></button>';

      var textColorTools = [textFillBtnHtml, textStrokeBtnHtml, strokeWidthInputHtml];
      var textColorContent = build3RowGridHtml(textColorTools);

      var underlineColor   = cfg.textUnderlineColor || cfg.strokeColor || '#041e49';
      var underlineStyle   = cfg.textUnderlineStyle || 'none';
      var underlineOffset  = cfg.textUnderlineOffset !== undefined ? cfg.textUnderlineOffset : 3;
      var underlineWidth   = cfg.textUnderlineWidth !== undefined ? cfg.textUnderlineWidth : 1;

      var underlineIconHtml = icons.getTextUnderlineIcon ? icons.getTextUnderlineIcon(underlineColor) : (icons.textUnderlineIcon || icons.targetStroke || '');
      var underlineColorBtnHtml = '<button class="tool-btn" onclick="handleColorBtnClick(this, \'text_underline\')" onmousedown="startHoldColorBtn(event, this, \'text_underline\')" onmouseup="endHoldColorBtn()" onmouseleave="endHoldColorBtn()" style="width:34px; height:34px; position:relative;"><span class="alt-badge">U</span>' + underlineIconHtml + '<span class="tooltip-text">밑줄 색상 (클릭: 색상 적용 / 길게 누름: 팔레트 열기)</span></button>';

      var underlineStyleSelectHtml =
        '<select onchange="setTextUnderlineStyle(this.value)" style="padding:2px 4px; font-size:0.78rem; border:1px solid #cbd5e1; border-radius:4px; height:34px; max-width:95px;" title="밑줄 종류">' +
          '<option value="none" ' + (underlineStyle==='none'?'selected':'') + '>없음</option>' +
          '<option value="solid" ' + (underlineStyle==='solid'?'selected':'') + '>실선</option>' +
          '<option value="dashed" ' + (underlineStyle==='dashed'?'selected':'') + '>점선</option>' +
          '<option value="dotted" ' + (underlineStyle==='dotted'?'selected':'') + '>점</option>' +
          '<option value="double" ' + (underlineStyle==='double'?'selected':'') + '>이중선</option>' +
          '<option value="wavy" ' + (underlineStyle==='wavy'?'selected':'') + '>물결선</option>' +
        '</select>';

      var underlineOffsetInputHtml =
        '<div style="display:flex; flex-direction:row; align-items:center; gap:2px;">' +
          '<span style="font-size:0.75rem; font-weight:600; color:#475569;">거리:</span>' +
          '<input type="number" min="0" max="30" value="' + underlineOffset + '" oninput="setTextUnderlineOffset(this.value)" onchange="setTextUnderlineOffset(this.value)" style="width:36px; padding:2px 4px; font-size:0.8rem; border:1px solid #cbd5e1; border-radius:4px; text-align:center;" title="밑줄 거리">' +
        '</div>';

      var underlineWidthInputHtml =
        '<div style="display:flex; flex-direction:row; align-items:center; gap:2px;">' +
          '<span style="font-size:0.75rem; font-weight:600; color:#475569;">두께:</span>' +
          '<input type="number" min="1" max="20" value="' + underlineWidth + '" oninput="setTextUnderlineWidth(this.value)" onchange="setTextUnderlineWidth(this.value)" style="width:36px; padding:2px 4px; font-size:0.8rem; border:1px solid #cbd5e1; border-radius:4px; text-align:center;" title="밑줄 두께">' +
        '</div>';

      var underlineCategoryContent =
        '<div style="display:flex; flex-direction:column; gap:2px; justify-content:center;">' +
          '<div style="display:flex; flex-direction:row; align-items:center; gap:4px;">' +
            underlineStyleSelectHtml + underlineColorBtnHtml +
          '</div>' +
          underlineOffsetInputHtml +
          underlineWidthInputHtml +
        '</div>';

      var padSyncChecked = cfg.padSync !== false ? 'checked' : '';
      var paddingCategoryContent =
        '<div style="display:flex; flex-direction:column; gap:2px; justify-content:center;">' +
          '<div style="display:flex; flex-direction:row; align-items:center; gap:4px;">' +
            '<span style="font-size:0.75rem; font-weight:600; color:#475569; width:16px;">상:</span>' +
            '<input type="number" min="0" max="200" value="' + (cfg.padTop !== undefined ? cfg.padTop : 10) + '" oninput="setTextPadding(\'top\', this.value)" onchange="setTextPadding(\'top\', this.value)" style="width:36px; padding:2px; font-size:0.78rem; border:1px solid #cbd5e1; border-radius:4px; text-align:center;" title="상단 패딩 (px)">' +
            '<span style="font-size:0.75rem; font-weight:600; color:#475569; width:16px;">하:</span>' +
            '<input type="number" min="0" max="200" value="' + (cfg.padBottom !== undefined ? cfg.padBottom : 10) + '" oninput="setTextPadding(\'bottom\', this.value)" onchange="setTextPadding(\'bottom\', this.value)" style="width:36px; padding:2px; font-size:0.78rem; border:1px solid #cbd5e1; border-radius:4px; text-align:center;" title="하단 패딩 (px)">' +
          '</div>' +
          '<div style="display:flex; flex-direction:row; align-items:center; gap:4px;">' +
            '<span style="font-size:0.75rem; font-weight:600; color:#475569; width:16px;">좌:</span>' +
            '<input type="number" min="0" max="200" value="' + (cfg.padLeft !== undefined ? cfg.padLeft : 10) + '" oninput="setTextPadding(\'left\', this.value)" onchange="setTextPadding(\'left\', this.value)" style="width:36px; padding:2px; font-size:0.78rem; border:1px solid #cbd5e1; border-radius:4px; text-align:center;" title="좌측 패딩 (px)">' +
            '<span style="font-size:0.75rem; font-weight:600; color:#475569; width:16px;">우:</span>' +
            '<input type="number" min="0" max="200" value="' + (cfg.padRight !== undefined ? cfg.padRight : 10) + '" oninput="setTextPadding(\'right\', this.value)" onchange="setTextPadding(\'right\', this.value)" style="width:36px; padding:2px; font-size:0.78rem; border:1px solid #cbd5e1; border-radius:4px; text-align:center;" title="우측 패딩 (px)">' +
          '</div>' +
          '<div style="display:flex; flex-direction:row; align-items:center; gap:3px; margin-top:2px;">' +
            '<input type="checkbox" id="padSyncCheck" ' + padSyncChecked + ' onchange="toggleTextPaddingSync()" style="cursor:pointer;">' +
            '<label for="padSyncCheck" style="font-size:0.75rem; font-weight:600; color:#334155; cursor:pointer;">상하좌우 일치</label>' +
          '</div>' +
        '</div>';

      var textPanBtn    = '<button class="tool-btn ' + (cfg.currentTool==='pan'?'active':'') + '" onclick="setTool(\'pan\')"><span class="alt-badge">H</span>' + (icons.pan || '') + '<span class="tooltip-text">캔버스 화면 잡아서 밀기 (H)</span></button>';
      var textSelectBtn = '<button class="tool-btn ' + (cfg.currentTool==='select'?'active':'') + '" onclick="setTool(\'select\')"><span class="alt-badge">V</span>' + (icons.select || '') + '<span class="tooltip-text">선택 도구 (V)</span></button>';
      var textBoxBtn    = '<button class="tool-btn ' + (cfg.currentTool==='text'?'active':'') + '" onclick="setTool(\'text\')"><span class="alt-badge">T</span>' + (icons.addText || '') + '<span class="tooltip-text">텍스트 상자 도구 (T)</span></button>';

      var textInsertTools = [textPanBtn, textSelectBtn, textBoxBtn];
      var textInsertContent = build3RowGridHtml(textInsertTools);

      ribbonBar.innerHTML =
        buildCategoryHtml('text_insert', '삽입', textInsertContent) +
        buildCategoryHtml('text_font', '글꼴', fontOptionsHtml) +
        buildCategoryHtml('text_color', '색', textColorContent) +
        buildCategoryHtml('text_underline', '밑줄', underlineCategoryContent) +
        buildCategoryHtml('text_padding', '패딩', paddingCategoryContent);
    } else if (cfg.currentTab === 'anim') {
      var selId = cfg.selectedIds && cfg.selectedIds.size > 0 ? Array.from(cfg.selectedIds)[0] : null;
      var hasAnim = false;
      if (selId && cfg.objectsMap) {
        var selObj = cfg.objectsMap.get(selId);
        if (selObj && selObj.el && selObj.el.querySelector('animate, animateTransform, animateMotion')) {
          hasAnim = true;
        }
      }

      if (state.animStep === undefined || state.animStep === null) {
        state.animStep = hasAnim ? 5 : 1;
      }
      var curStep = state.animStep;

      // STEP 1: 1. 효과 (Effect)
      var step1Content = '';
      if (!selId) {
        step1Content = '<div style="font-size:0.8rem; font-weight:600; color:#94a3b8; padding:4px 0;">대상을 선택하세요</div>';
      } else {
        step1Content =
          '<div style="display:flex; flex-direction:column; gap:6px;">' +
            '<div style="display:flex; align-items:center; gap:6px;">' +
              '<select id="animAttrType" onchange="updateAnimDefaultValues(this.value)" style="background:#0f172a; color:#f8fafc; border:1px solid #334155; border-radius:4px; padding:3px 6px; font-size:0.78rem;">' +
                '<option value="transform:rotate">🔄 회전 (transform:rotate)</option>' +
                '<option value="opacity">👻 페이드 / 투명도 (opacity)</option>' +
                '<option value="transform:translate">↔️ 위치 이동 (transform:translate)</option>' +
                '<option value="transform:scale">🔍 크기 변경 (transform:scale)</option>' +
                '<option value="fill">🎨 fill (색상 변경)</option>' +
                '<option value="stroke">🖊️ stroke (선 색상)</option>' +
                '<option value="stroke-width">📏 stroke-width (선 두께)</option>' +
                '<option value="d">🦎 d (경로/패스 변형)</option>' +
              '</select>' +
              '<button class="tool-btn" onclick="setAnimStep(2); updateAnimDefaultValues();" style="background:#0284c7; color:#fff; padding:3px 10px; font-weight:700; border-radius:4px;">다음 ➔</button>' +
            '</div>' +
          '</div>';
      }

      // STEP 2: 2. 목표 값 (Target Values)
      var step2Content =
        '<div style="display:flex; flex-direction:column; gap:6px;">' +
          '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px;">' +
            '<input type="text" id="animFrom" placeholder="시작값 (from: 0)" style="background:#0f172a; color:#fff; border:1px solid #334155; border-radius:4px; padding:3px 6px; font-size:0.75rem;" />' +
            '<input type="text" id="animTo" placeholder="목표값 (to: 360)" style="background:#0f172a; color:#fff; border:1px solid #334155; border-radius:4px; padding:3px 6px; font-size:0.75rem;" />' +
          '</div>' +
          '<div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">' +
            '<button class="tool-btn" onclick="setAnimStep(1)" style="background:#475569; color:#fff; padding:3px 8px; font-weight:600; border-radius:4px;">◀ 이전</button>' +
            '<button class="tool-btn" onclick="setAnimStep(3)" style="background:#0284c7; color:#fff; padding:3px 10px; font-weight:700; border-radius:4px;">다음 ➔</button>' +
          '</div>' +
        '</div>';

      // STEP 3: 3. 트리거 & 재생 시간 (Trigger & Timing)
      var step3Content =
        '<div style="display:flex; flex-direction:column; gap:6px;">' +
          '<div style="display:flex; align-items:center; gap:4px;">' +
            '<label style="font-size:0.72rem; color:#94a3b8;">트리거:</label>' +
            '<select id="animBegin" style="background:#0f172a; color:#f8fafc; border:1px solid #334155; border-radius:4px; padding:2px 4px; font-size:0.72rem;">' +
              '<option value="0s">⚡ 자동 시작 (0s)</option>' +
              '<option value="click">🖱️ 클릭 시 (click)</option>' +
              '<option value="mouseover">👆 호버 시 (mouseover)</option>' +
              '<option value="mouseleave">👈 아웃 시 (mouseleave)</option>' +
            '</select>' +
            '<label style="font-size:0.72rem; color:#94a3b8;">시간:</label>' +
            '<input type="text" id="animDur" value="2s" style="width:40px; background:#0f172a; color:#fff; border:1px solid #334155; border-radius:4px; padding:2px; font-size:0.72rem;" />' +
            '<label style="font-size:0.72rem; color:#94a3b8;">반복:</label>' +
            '<select id="animRepeat" style="background:#0f172a; color:#f8fafc; border:1px solid #334155; border-radius:4px; padding:2px; font-size:0.72rem;">' +
              '<option value="indefinite">♾️ 무한</option>' +
              '<option value="1">1회</option>' +
              '<option value="2">2회</option>' +
              '<option value="3">3회</option>' +
            '</select>' +
          '</div>' +
          '<div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">' +
            '<button class="tool-btn" onclick="setAnimStep(2)" style="background:#475569; color:#fff; padding:3px 8px; font-weight:600; border-radius:4px;">◀ 이전</button>' +
            '<button class="tool-btn" onclick="setAnimStep(4)" style="background:#0284c7; color:#fff; padding:3px 10px; font-weight:700; border-radius:4px;">다음 ➔</button>' +
          '</div>' +
        '</div>';

      // STEP 4: 4. 종료 & 제한 조건 (Limits & Restart Rule)
      var step4Content =
        '<div style="display:flex; flex-direction:column; gap:6px;">' +
          '<div style="display:flex; align-items:center; gap:4px;">' +
            '<label style="font-size:0.72rem; color:#94a3b8;">재시작:</label>' +
            '<select id="animRestart" style="background:#0f172a; color:#fff; border:1px solid #334155; border-radius:4px; padding:2px; font-size:0.72rem;">' +
              '<option value="always">always</option>' +
              '<option value="whenNotActive">whenNotActive</option>' +
              '<option value="never">never</option>' +
            '</select>' +
            '<label style="font-size:0.72rem; color:#94a3b8;">강제종료:</label>' +
            '<input type="text" id="animEnd" placeholder="mouseleave / 10s" style="width:90px; background:#0f172a; color:#fff; border:1px solid #334155; border-radius:4px; padding:2px; font-size:0.72rem;" />' +
          '</div>' +
          '<div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">' +
            '<button class="tool-btn" onclick="setAnimStep(3)" style="background:#475569; color:#fff; padding:3px 8px; font-weight:600; border-radius:4px;">◀ 이전</button>' +
            '<button class="tool-btn" onclick="setAnimStep(5)" style="background:#0284c7; color:#fff; padding:3px 10px; font-weight:700; border-radius:4px;">다음 ➔</button>' +
          '</div>' +
        '</div>';

      // STEP 5: 5. 효과 적용 & 제어 (Apply & Playback Controls)
      var mainActionBtn = hasAnim ?
        '<button class="tool-btn" onclick="removeAllAnimationsFromSelected()" style="background:#ef4444; color:#fff; width:100%; padding:5px; font-weight:700; border-radius:4px; margin-bottom:4px;">🗑️ 효과 삭제</button>' :
        '<button class="tool-btn" onclick="addCustomSmilAnimation()" style="background:#10b981; color:#fff; width:100%; padding:5px; font-weight:700; border-radius:4px; margin-bottom:4px;">➕ 효과 추가</button>';

      var playbackControlsHtml =
        '<div style="display:flex; align-items:center; gap:6px;">' +
          '<button class="tool-btn" onclick="playSelectedAnimation()" style="background:#0284c7; color:#fff; flex:1; padding:4px; font-weight:700; border-radius:4px;">▶️ 재생</button>' +
          '<button class="tool-btn" onclick="stopAllAnimations()" style="background:#64748b; color:#fff; flex:1; padding:4px; font-weight:700; border-radius:4px;">⏹️ 정지</button>' +
        '</div>';

      var step5Content =
        '<div style="display:flex; flex-direction:column; gap:4px;">' +
          mainActionBtn +
          playbackControlsHtml +
          '<div style="display:flex; align-items:center; justify-content:flex-start; margin-top:4px;">' +
            '<button class="tool-btn" onclick="setAnimStep(4)" style="background:#475569; color:#fff; padding:3px 8px; font-weight:600; border-radius:4px;">◀ 이전</button>' +
          '</div>' +
        '</div>';

      function buildWizardCategoryHtml(catKey, catTitle, contentHtml, isExpanded) {
        var isCollapsed = !isExpanded;
        var stepNum = (catKey === 'anim_step1' ? 1 : catKey === 'anim_step2' ? 2 : catKey === 'anim_step3' ? 3 : catKey === 'anim_step4' ? 4 : 5);
        return '<div class="ribbon-category ' + (isCollapsed ? 'collapsed' : '') + '">' +
                 '<div class="category-content">' + contentHtml + '</div>' +
                 '<div class="category-title" onclick="setAnimStep(' + stepNum + ')" title="클릭하여 단계 이동">' +
                   '<span class="title-text">' + catTitle + '</span>' +
                   '<span class="toggle-icon">' + (isExpanded ? '▼' : '▲') + '</span>' +
                 '</div>' +
               '</div>';
      }

      ribbonBar.innerHTML =
        buildWizardCategoryHtml('anim_step1', '1. 효과', step1Content, curStep === 1) +
        buildWizardCategoryHtml('anim_step2', '2. 목표 값', step2Content, curStep === 2) +
        buildWizardCategoryHtml('anim_step3', '3. 트리거 & 재생 시간', step3Content, curStep === 3) +
        buildWizardCategoryHtml('anim_step4', '4. 종료 & 제한 조건', step4Content, curStep === 4) +
        buildWizardCategoryHtml('anim_step5', '5. 효과 적용 & 제어', step5Content, curStep === 5);
    }
  }

  // Global Fixed Floating Tooltip Manager (Positioned fixed to body, bypassing parent overflow/z-index/clipping)
  (function initGlobalTooltipManager() {
    var globalTooltip = document.getElementById('webpointerGlobalTooltip');
    if (!globalTooltip) {
      globalTooltip = document.createElement('div');
      globalTooltip.id = 'webpointerGlobalTooltip';
      globalTooltip.style.cssText =
        'position:fixed; z-index:999999; display:none; padding:4px 8px; ' +
        'background:#0f172a; border:1px solid #0284c7; color:#ffffff; ' +
        'font-size:0.75rem; font-weight:500; white-space:nowrap; border-radius:4px; ' +
        'box-shadow:0 4px 14px rgba(0,0,0,0.35); pointer-events:none; font-family:sans-serif; transition:opacity 0.1s ease;';
      document.body.appendChild(globalTooltip);
    }

    document.addEventListener('mouseover', function(e) {
      var btn = e.target.closest('.tool-btn, [title], [data-original-title], .ribbon-control-item');
      if (!btn) return;

      var tooltipStr = '';
      var tooltipChild = btn.querySelector('.tooltip-text');
      if (tooltipChild) {
        tooltipStr = tooltipChild.textContent || tooltipChild.innerText;
      } else if (btn.getAttribute('title')) {
        tooltipStr = btn.getAttribute('title');
        btn.setAttribute('data-original-title', tooltipStr);
        btn.removeAttribute('title');
      } else if (btn.getAttribute('data-original-title')) {
        tooltipStr = btn.getAttribute('data-original-title');
      }

      if (!tooltipStr) return;

      globalTooltip.textContent = tooltipStr;
      globalTooltip.style.display = 'block';
      globalTooltip.style.opacity = '1';

      var rect = btn.getBoundingClientRect();
      var tipRect = globalTooltip.getBoundingClientRect();

      var left = rect.left + (rect.width / 2) - (tipRect.width / 2);
      left = Math.max(8, Math.min(window.innerWidth - tipRect.width - 8, left));

      var top = rect.bottom + 6;
      if (top + tipRect.height > window.innerHeight - 8) {
        top = rect.top - tipRect.height - 6;
      }

      globalTooltip.style.left = left + 'px';
      globalTooltip.style.top = top + 'px';
    }, true);

    document.addEventListener('mouseout', function(e) {
      var btn = e.target.closest('.tool-btn, [title], [data-original-title], .ribbon-control-item');
      if (btn) {
        globalTooltip.style.display = 'none';
        globalTooltip.style.opacity = '0';
      }
    }, true);
  })();

  window.WebpointerRenderRibbon = {
    getOutermostGroupEl: getOutermostGroupEl,
    build3RowGridHtml: build3RowGridHtml,
    buildCategoryHtml: buildCategoryHtml,
    buildEffectsCategoryHtml: buildEffectsCategoryHtml,
    renderEffectsListboxContent: renderEffectsListboxContent,
    renderRibbon: renderRibbon
  };
})(window);
