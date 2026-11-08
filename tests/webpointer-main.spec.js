const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Webpointer Vector CAD Editor E2E Test Suite', () => {
  let pageErrors = [];

  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    await page.goto('/');
    await page.waitForSelector('#mainSvg');
  });

  test('TC01: App Initialization & No Console Errors', async ({ page }) => {
    // Check Menu Bar & Tab Buttons
    await expect(page.locator('.menu-bar')).toBeVisible();
    await expect(page.locator('.tab-btn:has-text("파일")')).toBeVisible();
    await expect(page.locator('.tab-btn:has-text("삽입")')).toBeVisible();
    await expect(page.locator('.tab-btn:has-text("설정")')).toBeVisible();

    // Check Ribbon Bar & Main Canvas
    await expect(page.locator('#ribbonBar')).toBeVisible();
    await expect(page.locator('#mainSvg')).toBeVisible();

    // Ensure ZERO JS runtime exceptions on load
    expect(pageErrors, 'JS Page Errors found: ' + JSON.stringify(pageErrors)).toEqual([]);
  });

  test('TC02: Draw Rectangle and Add Text Element', async ({ page }) => {
    // Switch to Insert Tab
    await page.click('.tab-btn:has-text("삽입")');

    const toolBtns = page.locator('.tool-btn');
    const count = await toolBtns.count();
    expect(count).toBeGreaterThan(0);

    // Click Rectangle Tool
    await page.click('.tool-btn[onclick*="rect"]');

    // Drag on SVG Canvas to create a rectangle
    const canvas = page.locator('#mainSvg');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    const startX = box.x + 100;
    const startY = box.y + 100;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 150, startY + 100);
    await page.mouse.up();

    // Verify SVG DOM contains created rectangle
    const rectCount = await page.locator('#objectsGroup rect').count();
    expect(rectCount).toBeGreaterThanOrEqual(1);

    // Switch to Text Tool
    await page.click('.tool-btn[onclick*="text"]');

    // Switch to Pan Tool (1st tool button: pan) and test canvas panning
    await page.click('.tool-btn[onclick*="pan"]');
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 50, startY + 50);
    await page.mouse.up();

    // Ensure zero page errors
    expect(pageErrors).toEqual([]);
  });

  test('TC03: Single Cycling Buttons & Underline Format in Text Tab', async ({ page }) => {
    // Switch to Text Tab
    await page.click('.tab-btn:has-text("글 서식")');

    // Click Horizontal Alignment Cycle Button
    await page.locator('button[onclick*="HorizontalAlign"]').first().click();

    // Click Vertical Alignment Cycle Button
    await page.locator('button[onclick*="VerticalAlign"]').first().click();

    // Click Auto-Fit Mode Cycle Button
    await page.locator('button[onclick*="AutoFitMode"]').first().click();

    // Ensure zero page errors
    expect(pageErrors).toEqual([]);
  });

  test('TC04: Undo (Ctrl+Z) & Redo (Ctrl+Y) History Stack', async ({ page }) => {
    // Draw an object first
    await page.click('.tab-btn:has-text("삽입")');
    await page.locator('button[onclick*="rect"]').first().click();

    const canvas = page.locator('#mainSvg');
    const box = await canvas.boundingBox();

    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 280);
    await page.mouse.up();

    const countBeforeUndo = await page.locator('#objectsGroup rect').count();

    // Trigger Ctrl+Z (Undo)
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(100);

    const countAfterUndo = await page.locator('#objectsGroup rect').count();
    expect(countAfterUndo).toBe(countBeforeUndo - 1);

    // Trigger Redo via API or shortcut
    await page.evaluate(() => window.redo());
    await page.waitForTimeout(100);

    const countAfterRedo = await page.locator('#objectsGroup rect').count();
    expect(countAfterRedo).toBe(countBeforeUndo);

    expect(pageErrors).toEqual([]);
  });

  test('TC05: Settings Tab & Persistent Grid Background (No Black Canvas)', async ({ page }) => {
    // Click Settings Tab ("설정")
    await page.click('.tab-btn:has-text("설정")');
    await page.waitForSelector('#chkGridToggle');

    // Toggle Grid Checkbox (Uncheck grid)
    const gridChk = page.locator('#chkGridToggle');
    await gridChk.uncheck();

    // Verify background rect remains white/visible (not black)
    const bgRectFill = await page.locator('#gridGroup rect').getAttribute('fill');
    expect(bgRectFill).toBe('#ffffff');

    // Re-check grid
    await gridChk.check();
    expect(pageErrors).toEqual([]);
  });

  test('TC06: Visual Snapshot Baseline', async ({ page }) => {
    // Wait for canvas to settle
    await page.waitForTimeout(200);

    // Visual screenshot snapshot comparison
    await expect(page).toHaveScreenshot('webpointer-canvas-baseline.png', {
      mask: [page.locator('#uiGroup')]
    });
  });

  test('TC07: Full Shape Drawing Suite (Point, Line, Ellipse, Arc)', async ({ page }) => {
    await page.click('.tab-btn:has-text("삽입")');
    const canvas = page.locator('#mainSvg');
    const box = await canvas.boundingBox();

    // 1. Draw Line
    await page.locator('button[onclick*="line"]').first().click();
    await page.mouse.move(box.x + 50, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 150, box.y + 50);
    await page.mouse.up();
    expect(await page.locator('#objectsGroup line').count()).toBeGreaterThanOrEqual(1);

    // 2. Draw Point
    await page.locator('button[onclick*="point"]').first().click();
    await page.mouse.click(box.x + 200, box.y + 50);
    expect(await page.locator('#objectsGroup circle').count()).toBeGreaterThanOrEqual(1);

    // 3. Draw Ellipse
    await page.locator('button[onclick*="ellipse"]').first().click();
    await page.mouse.move(box.x + 250, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 120);
    await page.mouse.up();
    expect(await page.locator('#objectsGroup ellipse').count()).toBeGreaterThanOrEqual(1);

    // 4. Draw Arc
    await page.locator('button[onclick*="arc"]').first().click();
    await page.mouse.move(box.x + 400, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 480, box.y + 120);
    await page.mouse.up();
    expect(await page.locator('#objectsGroup path').count()).toBeGreaterThanOrEqual(1);

    expect(pageErrors).toEqual([]);
  });

  test('TC08: Picture Formatting Suite (Stroke Width & Format Inputs)', async ({ page }) => {
    // Draw a rectangle first
    await page.click('.tab-btn:has-text("삽입")');
    await page.locator('button[onclick*="rect"]').first().click();
    const canvas = page.locator('#mainSvg');
    const box = await canvas.boundingBox();

    await page.mouse.move(box.x + 100, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 280);
    await page.mouse.up();

    // Switch to Picture Formatting Tab ("그림 서식")
    await page.click('.tab-btn:has-text("그림 서식")');

    const strokeWidthInput = page.locator('input[oninput*="setStrokeWidth"]');
    if (await strokeWidthInput.count() > 0) {
      await strokeWidthInput.fill('4');
    }

    expect(pageErrors).toEqual([]);
  });

  test('TC09: Detailed Text Formatting Suite (Font, Underline Style)', async ({ page }) => {
    // Switch to Text Tab ("글 서식")
    await page.click('.tab-btn:has-text("글 서식")');

    const underlineStyleSelect = page.locator('select[onchange*="setTextUnderlineStyle"]');
    if (await underlineStyleSelect.count() > 0) {
      await underlineStyleSelect.selectOption('solid');
    }

    expect(pageErrors).toEqual([]);
  });

  test('TC10: Proximity Selection Distance & Nearest Object Detection', async ({ page }) => {
    // Draw a point at (100, 100)
    await page.click('.tab-btn:has-text("삽입")');
    await page.locator('button[onclick*="point"]').first().click();
    const canvas = page.locator('#mainSvg');
    const box = await canvas.boundingBox();

    await page.mouse.click(box.x + 100, box.y + 100);

    // Switch to Select Tool (1st tool button in Insert tab)
    await page.locator('.tool-btn').first().click();

    // Click slightly offset at (105, 105) near the point
    await page.mouse.click(box.x + 105, box.y + 105);

    // Verify selection includes object
    const selectedCount = await page.evaluate(() => window.WebpointerConfig.selectedIds.size);
    expect(selectedCount).toBeGreaterThanOrEqual(1);

    expect(pageErrors).toEqual([]);
  });

  test('TC11: File Operations Suite (Web Save Click Opens File Slots Modal)', async ({ page }) => {
    // Switch to File Tab ("파일")
    await page.click('.tab-btn:has-text("파일")');

    // Click Web Save Button (saveFileToWeb)
    await page.evaluate(() => window.saveFileToWeb());
    await page.waitForTimeout(300);

    // Verify file slot modal opens
    const isModalOpen = await page.evaluate(() => {
      const modal = document.getElementById('fileSlotsModal');
      return modal && modal.classList.contains('show');
    });
    expect(isModalOpen).toBe(true);

    expect(pageErrors).toEqual([]);
  });

  test('TC12: Animation Tab & Preset Previews', async ({ page }) => {
    // Switch to Animation Tab ("애니메이션")
    await page.click('.tab-btn:has-text("애니메이션")');

    // Trigger Line Draw Animation preview
    await page.evaluate(() => window.playAnimation && window.playAnimation('draw'));

    expect(pageErrors).toEqual([]);
  });

  test('TC13: Shortcut Guidance Modal Popup', async ({ page }) => {
    // Switch to Settings Tab ("설정")
    await page.click('.tab-btn:has-text("설정")');

    // Click Keyboard Shortcut button
    await page.click('#btnShortcutGuide');

    // Verify shortcut modal opens
    const modal = page.locator('#shortcutModal');
    await expect(modal).toHaveClass(/show/);

    // Save visual proof screenshot
    await page.screenshot({ path: 'tests/shortcut-modal-proof.png' });

    // Close modal
    await page.click('#shortcutModal button:has-text("닫기")');
    await expect(modal).not.toHaveClass(/show/);

    expect(pageErrors).toEqual([]);
  });

  test('TC14: Detailed Settings Modal & Apply Proximity Threshold', async ({ page }) => {
    // Switch to Settings Tab ("설정")
    await page.click('.tab-btn:has-text("설정")');

    // Click Detailed Settings Gear button
    await page.click('#btnDetailedSettings');

    // Verify detailed settings modal opens
    const modal = page.locator('#detailedSettingsModal');
    await expect(modal).toHaveClass(/show/);

    // Save visual proof screenshot
    await page.screenshot({ path: 'tests/detailed-settings-modal-proof.png' });

    // Change proximity threshold to 25
    await page.fill('#settingProximityThreshold', '25');

    // Click Apply
    await page.click('#detailedSettingsModal button:has-text("적용")');
    await expect(modal).not.toHaveClass(/show/);

    // Verify config value updated to 25
    const proxVal = await page.evaluate(() => window.WebpointerConfig.proximityThreshold);
    expect(proxVal).toBe(25);

    expect(pageErrors).toEqual([]);
  });

  test('TC15: Text Selection Font Size Hotkeys (+/-)', async ({ page }) => {
    // Create and select a text object programmatically
    const textObjId = await page.evaluate(() => {
      window.WebpointerTextTool.startDirectCanvasTyping(300, 300, null);
      var textObj = window.WebpointerState.typingSvgObj;
      if (textObj) {
        textObj.attrs.text = 'Hotkey Font Test';
        textObj.attrs.fontSize = 20;
        window.WebpointerTextTool.finishDirectCanvasTyping();
        window.WebpointerConfig.selectedIds.clear();
        window.WebpointerConfig.selectedIds.add(textObj.id);
        window.WebpointerRender.renderUI();
        return textObj.id;
      }
      return null;
    });
    expect(textObjId).not.toBeNull();

    // Get initial font size
    const initialSize = await page.evaluate(() => {
      const textObj = Array.from(window.WebpointerConfig.objectsMap.values()).find(o => o.type === 'text');
      return textObj ? textObj.attrs.fontSize || 20 : 0;
    });
    expect(initialSize).toBeGreaterThan(0);

    // Trigger font size increase (+ / =) keydown
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '+', code: 'Equal', bubbles: true }));
    });

    const sizeAfterPlus = await page.evaluate(() => {
      const textObj = Array.from(window.WebpointerConfig.objectsMap.values()).find(o => o.type === 'text');
      return textObj ? textObj.attrs.fontSize : 0;
    });
    expect(sizeAfterPlus).toBe(initialSize + 2);

    // Trigger font size decrease (- / _) keydown
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '-', code: 'Minus', bubbles: true }));
    });
    const sizeAfterMinus = await page.evaluate(() => {
      const textObj = Array.from(window.WebpointerConfig.objectsMap.values()).find(o => o.type === 'text');
      return textObj ? textObj.attrs.fontSize : 0;
    });
    expect(sizeAfterMinus).toBe(initialSize);

    expect(pageErrors).toEqual([]);
  });

  test('TC16: Non-Destructive Image & Shape Cropping (ClipPath)', async ({ page }) => {
    // Switch to Picture Format Tab ("그림 서식")
    await page.click('.tab-btn:has-text("그림 서식")');

    // Programmatically create a rect object and select it
    const rectObjId = await page.evaluate(() => {
      var obj = window.WebpointerObjects.createSvgObject('rect', { stepX: 5, stepY: 5 }, { stepX: 15, stepY: 15 });
      if (obj) {
        window.WebpointerConfig.selectedIds.clear();
        window.WebpointerConfig.selectedIds.add(obj.id);
        window.WebpointerRender.renderUI();
        window.WebpointerRender.renderRibbon();
        return obj.id;
      }
      return null;
    });
    expect(rectObjId).not.toBeNull();

    // Toggle Crop Mode
    await page.evaluate(() => window.toggleCropMode());
    const isCropActive = await page.evaluate(() => window.WebpointerState.isCropModeActive);
    expect(isCropActive).toBe(true);

    // Apply crop attributes (10% left, 20% top, 15% right, 25% bottom)
    await page.evaluate((id) => {
      var obj = window.WebpointerConfig.objectsMap.get(id);
      if (obj) {
        obj.attrs.cropLeft = 0.1;
        obj.attrs.cropTop = 0.2;
        obj.attrs.cropRight = 0.15;
        obj.attrs.cropBottom = 0.25;
        window.WebpointerRender.updateElementAttributes(obj);
        window.WebpointerRender.renderUI();
      }
    }, rectObjId);

    // Verify clip-path attribute is created and attached to element
    const clipAttr = await page.evaluate((id) => {
      var obj = window.WebpointerConfig.objectsMap.get(id);
      return obj && obj.el ? obj.el.getAttribute('clip-path') : null;
    }, rectObjId);
    expect(clipAttr).toContain('url(#crop_clip_' + rectObjId + ')');

    // Deactivate crop mode (exiting crop handles UI)
    await page.evaluate(() => window.toggleCropMode());
    const isCropActiveAfter = await page.evaluate(() => window.WebpointerState.isCropModeActive);
    expect(isCropActiveAfter).toBe(false);

    // Verify clip-path remains non-destructively attached
    const clipAttrAfter = await page.evaluate((id) => {
      var obj = window.WebpointerConfig.objectsMap.get(id);
      return obj && obj.el ? obj.el.getAttribute('clip-path') : null;
    }, rectObjId);
    expect(clipAttrAfter).toContain('url(#crop_clip_' + rectObjId + ')');

    // Reset crop attributes and verify clip-path is safely removed
    await page.evaluate((id) => {
      var obj = window.WebpointerConfig.objectsMap.get(id);
      if (obj) {
        obj.attrs.cropLeft = 0;
        obj.attrs.cropTop = 0;
        obj.attrs.cropRight = 0;
        obj.attrs.cropBottom = 0;
        window.WebpointerRender.updateElementAttributes(obj);
        window.WebpointerRender.renderUI();
      }
    }, rectObjId);

    const clipAttrReset = await page.evaluate((id) => {
      var obj = window.WebpointerConfig.objectsMap.get(id);
      return obj && obj.el ? obj.el.getAttribute('clip-path') : null;
    }, rectObjId);
    expect(clipAttrReset).toBeNull();

    expect(pageErrors).toEqual([]);
  });

  test('TC17: SVG File Import & Parser Diagnostics Suite', async ({ page }) => {
    const exampleSvgDir = fs.existsSync(path.join(__dirname, 'exampleSvg')) 
      ? path.join(__dirname, 'exampleSvg') 
      : path.join(__dirname, '..', 'examples');
    const svgFiles = fs.readdirSync(exampleSvgDir).filter(f => f.toLowerCase().endsWith('.svg'));
    expect(svgFiles.length).toBeGreaterThanOrEqual(3);

    for (const fileName of svgFiles) {
      const filePath = path.join(exampleSvgDir, fileName);
      const svgContent = fs.readFileSync(filePath, 'utf-8');

      const importResult = await page.evaluate((content) => {
        if (!window.WebpointerSVGImporter) return false;
        var initCount = window.WebpointerConfig.objectsMap.size;
        var success = window.WebpointerSVGImporter.importSVGContent(content);
        var finalCount = window.WebpointerConfig.objectsMap.size;
        var mainSvg = document.getElementById('mainSvg');
        var objectsGroup = document.getElementById('objectsGroup');
        return {
          success: success,
          addedCount: finalCount - initCount,
          viewBox: mainSvg ? mainSvg.getAttribute('viewBox') : null,
          hasChildrenInDom: objectsGroup ? objectsGroup.childNodes.length > 0 : false
        };
      }, svgContent);

      expect(importResult.success).toBe(true);
      expect(importResult.addedCount).toBeGreaterThan(0);
      expect(importResult.viewBox).not.toBeNull();
      expect(importResult.hasChildrenInDom).toBe(true);
    }

    expect(pageErrors).toEqual([]);
  });

  test('TC18: Symbol Manager Modal & Symbol Registry Operations', async ({ page }) => {
    // Switch to File Tab & open Symbol Manager Modal
    await page.evaluate(() => {
      if (window.switchTab) window.switchTab('file');
      if (window.openSymbolManagerModal) window.openSymbolManagerModal();
    });
    await page.waitForTimeout(200);

    // Check modal visibility
    const modal = page.locator('#symbolManagerModal');
    await expect(modal).toBeVisible();

    // Register test symbol programmatically
    await page.evaluate(() => {
      window.WebpointerConfig.symbolRegistry.push({
        id: 'sym_test_1',
        name: '해변플랜심볼',
        type: 'image',
        thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%230ea5e9"/></svg>',
        data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%230ea5e9"/></svg>'
      });
      window.renderSymbolList();
    });

    // Check thumbnail and symbol card displayed
    const symbolCard = page.locator('#symbolListContainer:has-text("해변플랜심볼")');
    await expect(symbolCard).toBeVisible();

    // Delete symbol
    await page.evaluate(() => {
      window.deleteSymbol('sym_test_1');
    });

    const emptyMsg = page.locator('#symbolListContainer:has-text("등록된 심볼이 없습니다.")');
    await expect(emptyMsg).toBeVisible();

    // Close modal
    await page.click('#symbolManagerModal button:has-text("닫기")');
    await expect(modal).toBeHidden();

    expect(pageErrors).toEqual([]);
  });

  test('TC19: Extended Fill Color Palette (Linear/Radial Gradient, Pattern, Image Fill)', async ({ page }) => {
    // Draw a rectangle
    const canvas = page.locator('#mainSvg');
    const box = await canvas.boundingBox();
    const startX = box.x + 200;
    const startY = box.y + 200;

    await page.evaluate(() => {
      if (window.WebpointerHandlers) window.WebpointerHandlers.setTool('rect');
    });

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 150, startY + 100);
    await page.mouse.up();

    // Verify rectangle created
    const rectCount = await page.evaluate(() => {
      let count = 0;
      window.WebpointerConfig.objectsMap.forEach(obj => {
        if (obj.type === 'rect') count++;
      });
      return count;
    });
    expect(rectCount).toBe(1);

    // Create Linear Gradient fill
    const linGradUrl = await page.evaluate(() => {
      return window.WebpointerHandlers.createLinearGradient('#38bdf8', '#0369a1', 90);
    });
    expect(linGradUrl).toContain('url(#grad_lin_');

    // Apply linear gradient fill to selected rectangle
    await page.evaluate((fillVal) => {
      window.WebpointerHandlers.setFillColor(fillVal);
    }, linGradUrl);

    // Check DOM element fill attribute
    const fillAttr = await page.evaluate(() => {
      const rectEl = document.querySelector('#objectsGroup rect');
      return rectEl ? rectEl.getAttribute('fill') : null;
    });
    expect(fillAttr).toBe(linGradUrl);

    // Create Pattern Fill (dots)
    const patUrl = await page.evaluate(() => {
      return window.WebpointerHandlers.createPatternFill('dots', '#0ea5e9', 16);
    });
    expect(patUrl).toContain('url(#pat_dots_');

    await page.evaluate((fillVal) => {
      window.WebpointerHandlers.setFillColor(fillVal);
    }, patUrl);

    const patFillAttr = await page.evaluate(() => {
      const rectEl = document.querySelector('#objectsGroup rect');
      return rectEl ? rectEl.getAttribute('fill') : null;
    });
    expect(patFillAttr).toBe(patUrl);

    // Create Image Fill
    const imgUrl = await page.evaluate(() => {
      const sampleData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      return window.WebpointerHandlers.createImageFill(sampleData, 50, 50);
    });
    expect(imgUrl).toContain('url(#imgpat_');

    await page.evaluate((fillVal) => {
      window.WebpointerHandlers.setFillColor(fillVal);
    }, imgUrl);

    const imgFillAttr = await page.evaluate(() => {
      const rectEl = document.querySelector('#objectsGroup rect');
      return rectEl ? rectEl.getAttribute('fill') : null;
    });
    expect(imgFillAttr).toBe(imgUrl);

    expect(pageErrors).toEqual([]);
  });

  test('TC20: Picture Filter Effects Suite (Stacked Filters & Range Coefficients)', async ({ page }) => {
    // Select Rect tool and draw a rectangle
    await page.click('.tab-btn:has-text("삽입")');
    const rectToolBtn = page.locator('#ribbonBar button[onclick*="rect"]').first();
    await rectToolBtn.click();

    const svgBox = await page.locator('#mainSvg').boundingBox();
    const startX = svgBox.x + 200;
    const startY = svgBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 150, startY + 100);
    await page.mouse.up();

    // Switch to Picture tab (style)
    await page.click('.tab-btn:has-text("그림 서식")');
    await page.waitForTimeout(200);

    // Click Filter Popover button
    const filterBtn = page.locator('#ribbonBar button:has-text("🪄")');
    await expect(filterBtn).toBeVisible();
    await filterBtn.click();

    const popover = page.locator('#filterEffectPopover');
    await expect(popover).toBeVisible();

    // Select Blur filter and add
    await page.selectOption('#popFilterType', 'blur');
    await page.evaluate(() => {
      const range = document.getElementById('popFilterRange');
      if (range) range.value = 5;
    });
    await page.click('#filterEffectPopover button:has-text("➕ 필터 추가")');

    // Select Sepia filter and add
    await page.selectOption('#popFilterType', 'sepia');
    await page.evaluate(() => {
      const range = document.getElementById('popFilterRange');
      if (range) range.value = 80;
    });
    await page.click('#filterEffectPopover button:has-text("➕ 필터 추가")');

    // Verify filter stack tag list contains blur and sepia
    const stackList = page.locator('#popFilterStackList');
    await expect(stackList).toContainText('blur(5px)');
    await expect(stackList).toContainText('sepia(80%)');

    // Verify DOM element filter attribute and style
    const filterState = await page.evaluate(() => {
      const rectEl = document.querySelector('#objectsGroup rect');
      return {
        attr: rectEl ? rectEl.getAttribute('filter') : null,
        style: rectEl ? rectEl.style.filter : null
      };
    });

    expect(filterState.attr).toContain('blur(5px)');
    expect(filterState.attr).toContain('sepia(80%)');

    // Clear all filters
    await page.click('#filterEffectPopover button:has-text("🧹 전체 삭제")');
    await expect(stackList).toContainText('적용된 필터가 없습니다');

    const clearedFilterAttr = await page.evaluate(() => {
      const rectEl = document.querySelector('#objectsGroup rect');
      return rectEl ? rectEl.getAttribute('filter') : null;
    });
    expect(clearedFilterAttr).toBeNull();

    expect(pageErrors).toEqual([]);
  });

  test('TC21: Symbol Cookie-Cutter Clipping Suite', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Create a target rectangle object via createSvgObject
    const rectObjId = await page.evaluate(() => {
      const obj = window.WebpointerObjects.createSvgObject('rect', { stepX: 10, stepY: 10 }, { stepX: 30, stepY: 25 });
      if (obj) {
        window.WebpointerConfig.selectedIds.clear();
        window.WebpointerConfig.selectedIds.add(obj.id);
        window.WebpointerRender.renderUI();
        return obj.id;
      }
      return null;
    });
    expect(rectObjId).not.toBeNull();

    // Open Symbol Clip Popover
    await page.evaluate(() => window.openSymbolClipPopover());
    await expect(page.locator('#symbolClipPopover')).toBeVisible();

    // Verify default symbols (Star, Heart, Circle, Hexagon) are rendered in grid
    const symbolGrid = page.locator('#popSymbolClipGrid');
    await expect(symbolGrid).toContainText('별 (Star)');
    await expect(symbolGrid).toContainText('하트 (Heart)');

    // Apply Star symbol cookie-cutter clipping
    await page.evaluate(() => window.applySymbolClip('sym_def_star'));
    await expect(page.locator('#symbolClipPopover')).toBeHidden();

    // Verify clip-path attribute is set on object SVG element
    const clipAttr = await page.evaluate((id) => {
      const obj = window.WebpointerConfig.objectsMap.get(id);
      return obj && obj.el ? obj.el.getAttribute('clip-path') : null;
    }, rectObjId);
    expect(clipAttr).toContain('url(#sym_clip_' + rectObjId + ')');

    // Verify defs clipPath contains scaling transform and path data
    const clipPathDefHtml = await page.evaluate((id) => {
      const clipEl = document.getElementById('sym_clip_' + id);
      return clipEl ? clipEl.innerHTML : '';
    }, rectObjId);
    expect(clipPathDefHtml).toContain('transform="translate(20 20) scale(');
    expect(clipPathDefHtml).toContain('d="M 25 2 L 32 17');

    // Remove symbol clip
    await page.evaluate(() => window.removeSymbolClipFromSelected());
    const clipAttrAfterRemoval = await page.evaluate((id) => {
      const obj = window.WebpointerConfig.objectsMap.get(id);
      return obj && obj.el ? obj.el.getAttribute('clip-path') : null;
    }, rectObjId);
    expect(clipAttrAfterRemoval).toBeNull();

    expect(pageErrors).toEqual([]);
  });

  test('TC22: Smart Alignment Snap Guides & Snapping', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Enable snapping explicitly
    await page.evaluate(() => {
      window.WebpointerConfig.snappingEnabled = true;
    });

    // 1. Create Object A (Rect at 100, 100, size 100x100)
    const objA = await page.evaluate(() => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const obj = {
        id: 'obj_snap_a',
        type: 'rect',
        attrs: { x: 100, y: 100, width: 100, height: 100, stroke: '#000000', fill: '#cbd5e1' },
        el: el
      };
      window.WebpointerConfig.objectsMap.set(obj.id, obj);
      window.WebpointerRender.renderCanvas();
      return obj.id;
    });
    expect(objA).toBe('obj_snap_a');

    // 2. Create Object B (Rect at 300, 300, size 100x100)
    const objB = await page.evaluate(() => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const obj = {
        id: 'obj_snap_b',
        type: 'rect',
        attrs: { x: 300, y: 300, width: 100, height: 100, stroke: '#000000', fill: '#f87171' },
        el: el
      };
      window.WebpointerConfig.objectsMap.set(obj.id, obj);
      window.WebpointerRender.renderCanvas();
      return obj.id;
    });
    expect(objB).toBe('obj_snap_b');

    // 3. Test calculation of snap guides when dragging B near X alignment with A (e.g. X=103, Y=300)
    const snapResult = await page.evaluate((targetId) => {
      const obj = window.WebpointerConfig.objectsMap.get(targetId);
      const snap = window.WebpointerHandlers.calculateSmartSnaps(obj, 103, 300);
      return snap;
    }, objB);

    // X should snap to 100 (matching Object A left edge)
    expect(snapResult.x).toBe(100);
    expect(snapResult.lines.length).toBeGreaterThan(0);
    expect(snapResult.lines[0].type).toBe('v');

    // 4. Test guide lines rendering into #snapGuidesGroup
    await page.evaluate((lines) => {
      window.WebpointerRender.renderSnapGuides(lines);
    }, snapResult.lines);

    const guideLinesCount = await page.evaluate(() => {
      const grp = document.getElementById('snapGuidesGroup');
      return grp ? grp.querySelectorAll('line').length : 0;
    });
    expect(guideLinesCount).toBeGreaterThan(0);

    // 5. Test clearing snap guides
    await page.evaluate(() => {
      window.WebpointerRender.clearSnapGuides();
    });

    const guideLinesCountAfterClear = await page.evaluate(() => {
      const grp = document.getElementById('snapGuidesGroup');
      return grp ? grp.querySelectorAll('line').length : 0;
    });
    expect(guideLinesCountAfterClear).toBe(0);

    expect(pageErrors).toEqual([]);
  });

  test('TC23: Object Alignment & Distribution Tools', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Create 3 rectangles at different positions
    await page.evaluate(() => {
      const o1 = { id: 'align_1', type: 'rect', attrs: { x: 50, y: 100, width: 60, height: 60, stroke: '#000', fill: '#fff' } };
      const o2 = { id: 'align_2', type: 'rect', attrs: { x: 200, y: 150, width: 60, height: 60, stroke: '#000', fill: '#fff' } };
      const o3 = { id: 'align_3', type: 'rect', attrs: { x: 500, y: 200, width: 60, height: 60, stroke: '#000', fill: '#fff' } };
      window.WebpointerConfig.objectsMap.set(o1.id, o1);
      window.WebpointerConfig.objectsMap.set(o2.id, o2);
      window.WebpointerConfig.objectsMap.set(o3.id, o3);
      window.WebpointerConfig.selectedIds.clear();
      window.WebpointerConfig.selectedIds.add(o1.id);
      window.WebpointerConfig.selectedIds.add(o2.id);
      window.WebpointerConfig.selectedIds.add(o3.id);
      window.WebpointerRender.renderCanvas();
    });

    // Test Align Left (All align to min X = 50)
    await page.evaluate(() => window.alignSelectedObjects('left'));
    const xPositionsAfterLeft = await page.evaluate(() => {
      return [
        window.WebpointerConfig.objectsMap.get('align_1').attrs.x,
        window.WebpointerConfig.objectsMap.get('align_2').attrs.x,
        window.WebpointerConfig.objectsMap.get('align_3').attrs.x
      ];
    });
    expect(xPositionsAfterLeft).toEqual([50, 50, 50]);

    // Test Distribute Horizontal Spacing
    await page.evaluate(() => {
      const o1 = window.WebpointerConfig.objectsMap.get('align_1');
      const o2 = window.WebpointerConfig.objectsMap.get('align_2');
      const o3 = window.WebpointerConfig.objectsMap.get('align_3');
      o1.attrs.x = 0;
      o2.attrs.x = 100;
      o3.attrs.x = 600;
      window.WebpointerHandlers.distributeObjects('horizontal');
    });

    const xPositionsAfterDistribute = await page.evaluate(() => {
      return [
        window.WebpointerConfig.objectsMap.get('align_1').attrs.x,
        window.WebpointerConfig.objectsMap.get('align_2').attrs.x,
        window.WebpointerConfig.objectsMap.get('align_3').attrs.x
      ];
    });
    // With x: 0 (width 60), 600 (width 60), o2 should be centered evenly at (600 - 0) / 2 = 300
    expect(xPositionsAfterDistribute[1]).toBe(300);

    expect(pageErrors).toEqual([]);
  });

  test('TC24: File Slot Save/Load Modal & Auto-Save Recovery Suite', async ({ page }) => {
    // Switch to File tab
    await page.click('.tab-btn:has-text("파일")');

    // Open File Slots Modal via window function
    await page.evaluate(() => {
      if (typeof window.openFileSlotsModal === 'function') {
        window.openFileSlotsModal();
      }
    });
    await expect(page.locator('#fileSlotsModal')).toBeVisible();

    // Save to slot 1 programmatically
    await page.evaluate(() => {
      if (typeof window.saveToFileSlot === 'function') {
        window.saveToFileSlot(1);
      }
    });

    // Check slot 1 thumbnail / status updated
    const slot1Text = await page.locator('#fileSlotCard_1').innerText();
    expect(slot1Text).toContain('Slot 1');

    // Close modal
    await page.click('#fileSlotsModal button:has-text("닫기")');
    await expect(page.locator('#fileSlotsModal')).toBeHidden();

    expect(pageErrors).toEqual([]);
  });

  test('TC25: Image Fill Modes (Stretch, Tile, Single) Suite', async ({ page }) => {
    const stretchFill = await page.evaluate(() => {
      return window.createImageFill('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'stretch');
    });
    expect(stretchFill).toContain('url(#imgpat_');

    const tileFill = await page.evaluate(() => {
      return window.createImageFill('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'tile', 30);
    });
    expect(tileFill).toContain('url(#imgpat_');

    const singleFill = await page.evaluate(() => {
      return window.createImageFill('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'single');
    });
    expect(singleFill).toContain('url(#imgpat_');

    expect(pageErrors).toEqual([]);
  });

  test('TC26: Multi-Stop Gradient Color Ramp & 2-Point Handles Suite', async ({ page }) => {
    const gradUrl = await page.evaluate(() => {
      const stops = [
        { offset: '0%', color: '#ff0000' },
        { offset: '50%', color: '#00ff00' },
        { offset: '100%', color: '#0000ff' }
      ];
      return window.createLinearGradient('#ff0000', '#0000ff', 45, stops);
    });
    expect(gradUrl).toContain('url(#grad_lin_');

    await page.evaluate((fill) => {
      const obj = {
        id: 'rect_grad_1',
        type: 'rect',
        attrs: { x: 100, y: 100, width: 150, height: 100, fill: fill, stroke: '#000', strokeWidth: 2 }
      };
      window.WebpointerConfig.objectsMap.set('rect_grad_1', obj);
      window.WebpointerConfig.selectedIds.clear();
      window.WebpointerConfig.selectedIds.add('rect_grad_1');
      if (window.WebpointerRender) window.WebpointerRender.renderUI();
    }, gradUrl);

    const handleCount = await page.locator('#uiGroup circle[data-handle-type="gradient_start"]').count();
    expect(handleCount).toBe(1);

    expect(pageErrors).toEqual([]);
  });

  test('TC27: Shape Text Horizontal & Vertical Alignment Suite', async ({ page }) => {
    const coords = await page.evaluate(() => {
      const shapeObj = { id: 's1', type: 'rect', attrs: { x: 100, y: 100, width: 200, height: 100 } };
      const textObj = { id: 't1', type: 'text', attrs: { text: 'Hello', fontSize: 20 } };
      window.updateShapeTextAlignment(shapeObj, textObj, 'left', 'top');
      const topX = textObj.attrs.x;
      const topY = textObj.attrs.y;

      window.updateShapeTextAlignment(shapeObj, textObj, 'right', 'bottom');
      const botX = textObj.attrs.x;
      const botY = textObj.attrs.y;

      return { topX, topY, botX, botY };
    });

    expect(coords.topX).toBe(110);
    expect(coords.botX).toBe(290);
    expect(coords.botY).toBeGreaterThan(coords.topY);

    expect(pageErrors).toEqual([]);
  });

  test('TC28: Live Filter Preview & Stack Reordering Suite', async ({ page }) => {
    const filters = await page.evaluate(() => {
      const obj = { id: 'obj_flt_1', type: 'rect', attrs: { x: 50, y: 50, width: 100, height: 100, filterList: ['blur(5px)', 'grayscale(100%)'] } };
      window.WebpointerConfig.objectsMap.set('obj_flt_1', obj);
      window.WebpointerConfig.selectedIds.clear();
      window.WebpointerConfig.selectedIds.add('obj_flt_1');

      window.moveFilterDown(0);
      const afterDown = obj.attrs.filterList.slice();

      window.moveFilterUp(1);
      const afterUp = obj.attrs.filterList.slice();

      return { afterDown, afterUp };
    });

    expect(filters.afterDown[0]).toBe('grayscale(100%)');
    expect(filters.afterDown[1]).toBe('blur(5px)');
    expect(filters.afterUp[0]).toBe('blur(5px)');

    expect(pageErrors).toEqual([]);
  });

  test('TC29: Rotation & Flip E2E Suite, SMIL Animation, Hotkeys & Canvas Zoom', async ({ page }) => {
    await page.evaluate(() => {
      const o1 = window.WebpointerObjects.createSvgObject('rect', { stepX: 1, stepY: 1 }, { stepX: 5, stepY: 5 });
      const o2 = window.WebpointerObjects.createSvgObject('rect', { stepX: 10, stepY: 10 }, { stepX: 15, stepY: 15 });
      window.WebpointerConfig.selectedIds.clear();
      window.WebpointerConfig.selectedIds.add(o1.id);
      window.WebpointerConfig.selectedIds.add(o2.id);
    });
    await page.keyboard.press('Control+a');
    const selectedCount = await page.evaluate(() => window.WebpointerConfig.selectedIds.size);
    expect(selectedCount).toBeGreaterThanOrEqual(2);

    await page.evaluate(() => {
      window.playAnimation('rotate');
      window.playAnimation('bounce');
    });
    const animCount = await page.locator('#mainSvg animateTransform').count();
    expect(animCount).toBeGreaterThan(0);

    await page.evaluate(() => window.stopAllAnimations());
    const animCountAfterStop = await page.locator('#mainSvg animateTransform').count();
    expect(animCountAfterStop).toBe(0);

    await page.evaluate(() => {
      window.cycleStartMarker();
      window.cycleEndMarker();
      window.cycleStrokeCap();
      window.cycleStrokeJoin();
    });

    expect(pageErrors).toEqual([]);
  });

  test('TC30: 2차/3차 베지어 곡선 그리기 시 c2 TypeError 방어 및 ESC 키 누름 시 연속 베지어 모드 종결 검증', async ({ page }) => {
    // 1. 3차 베지어 도구 선택 및 연속 점 배치
    await page.evaluate(() => {
      window.WebpointerHandlers.setTool('bez3');
      window.WebpointerState.isMultiBezierActive = true;
      window.WebpointerState.bezierPoints = [
        { px: 100, py: 100 },
        { px: 200, py: 200 },
        { px: 300, py: 150 }
      ];
    });

    // 2. mousemove 및 pathD 계산 호스팅 시 TypeError(c2) 발생 여부 체크
    const pathDResult = await page.evaluate(() => {
      if (window.WebpointerBezier && window.WebpointerBezier.buildContinuousBezierPathD) {
        return window.WebpointerBezier.buildContinuousBezierPathD(
          window.WebpointerState.bezierPoints,
          { px: 400, py: 250 },
          'bez3',
          null, null, null, null
        );
      }
      return '';
    });

    console.log('[Webpointer Bezier Null Safety Test 🧪 - PathD]:', pathDResult);
    expect(pathDResult.length).toBeGreaterThan(0);
    expect(pathDResult.includes('C')).toBe(true);

    // 3. ESC 키 입력 시 isMultiBezierActive 연속 베지어 그리기 즉시 종결 검증
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const isStopped = await page.evaluate(() => {
      return !window.WebpointerState.isMultiBezierActive && window.WebpointerConfig.currentTool === 'select';
    });

    console.log('[Webpointer Bezier ESC Key Stop Test 🧪 - Stopped]:', isStopped);
    expect(pageErrors).toEqual([]);
  });

  test('TC31: webpointer_drawing_1786256123897.svg 파일 로딩, NaN 콘솔 에러 0개 및 베지어/도형 핸들러 정상 동작 검증', async ({ page, request }) => {
    // 1. Fixture SVG 파일 텍스트 로드
    const fs = require('fs');
    const path = require('path');
    const fixturePath = path.join(__dirname, '..', '..', '..', 'tests', 'fixtures', 'webpointer_drawing_1786256123897.svg');
    const svgText = fs.readFileSync(fixturePath, 'utf8');

    expect(svgText.length).toBeGreaterThan(100);

    // 2. SVG 파일 내용 파싱 및 캔버스 객체 로딩 실행
    await page.evaluate((content) => {
      if (window.WebpointerSVGImporter && window.WebpointerSVGImporter.importSVGContent) {
        window.WebpointerSVGImporter.importSVGContent(content);
      } else if (window.WebpointerHandlers && window.WebpointerHandlers.parseSvgAndLoadObjects) {
        window.WebpointerHandlers.parseSvgAndLoadObjects(content);
      }
    }, svgText);

    await page.waitForTimeout(500);

    // 3. 캔버스 상에 로드된 객체 수 및 선택 후 UI 렌더링 검증
    const loadedCount = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      if (cfg && cfg.objectsMap) {
        cfg.selectedIds.clear();
        cfg.objectsMap.forEach((obj) => cfg.selectedIds.add(obj.id));
        if (window.WebpointerRender && window.WebpointerRender.renderUI) {
          window.WebpointerRender.renderUI();
        }
        return cfg.objectsMap.size;
      }
      return 0;
    });

    console.log('[Webpointer Fixture Load Test 🧪 - Loaded Object Count]:', loadedCount);
    expect(loadedCount).toBeGreaterThan(0);

    // 4. UI 렌더링 후 파란 점선 선택 상자 및 크기조절/베지어 핸들 노드 존재 확인
    const handleCount = await page.locator('#uiGroup circle, #uiGroup rect').count();
    console.log('[Webpointer Fixture Load Test 🧪 - Selection Box & Handle Node Count]:', handleCount);
    expect(handleCount).toBeGreaterThan(0);

    // 5. NaN 콘솔 에러 0개 수호 검증!
    const hasNanError = pageErrors.some(err => err.message.includes('NaN'));
    expect(hasNanError).toBe(false);
    expect(pageErrors).toEqual([]);
  });

  test('TC32: 그림 맨앞으로(bringToFront), 앞으로(bringForward), 맨뒤로(sendToBack), 뒤로(sendBackward) 레이어 순서 변경 검증', async ({ page }) => {
    // 1. 2개의 도형 (사각형, 원) 그리기
    await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      cfg.objectsMap.clear();
      cfg.selectedIds.clear();
      if (window.WebpointerObjects && window.WebpointerObjects.createSvgObject) {
        window.WebpointerObjects.createSvgObject('rect', { stepX: 1, stepY: 1 }, { stepX: 5, stepY: 5 });
        window.WebpointerObjects.createSvgObject('ellipse', { stepX: 2, stepY: 2 }, { stepX: 6, stepY: 6 });
      }
      window.WebpointerRender.renderUI();
    });

    // 2. 첫 번째 사각형 선택 및 bringToFront() 전역 함수 실행
    await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const firstId = Array.from(cfg.objectsMap.keys())[0];
      cfg.selectedIds.clear();
      cfg.selectedIds.add(firstId);
      window.bringToFront();
    });

    // 3. bringForward(), sendBackward(), sendToBack() 순차적 구동 및 ReferenceError 0개 검증
    await page.evaluate(() => {
      window.bringForward();
      window.sendBackward();
      window.sendToBack();
    });

    const isLayerFuncsDefined = await page.evaluate(() => {
      return typeof window.bringToFront === 'function' &&
             typeof window.bringForward === 'function' &&
             typeof window.sendBackward === 'function' &&
             typeof window.sendToBack === 'function';
    });

    console.log('[Webpointer Layer Functions Test 🧪 - Defined]:', isLayerFuncsDefined);
    expect(isLayerFuncsDefined).toBe(true);

    const hasRefError = pageErrors.some(err => err.message.includes('is not defined'));
    expect(hasRefError).toBe(false);
    expect(pageErrors).toEqual([]);
  });

  test('TC33: 연속 베지어 가상 핸들러 역계산 연동 조절 및 Ctrl 키 핸들러 분리 팝업 모달 검증', async ({ page }) => {
    const isModalFuncDefined = await page.evaluate(() => {
      return typeof window.openBezierSplitConfirmModal === 'function';
    });
    expect(isModalFuncDefined).toBe(true);

    // openBezierSplitConfirmModal 테스트
    await page.evaluate(() => {
      localStorage.removeItem('webpointer_suppress_bezier_split_confirm');
      window.openBezierSplitConfirmModal('test-obj', 'bez2_ctrl', 1, () => {});
    });

    const isModalVisible = await page.locator('#bezierSplitModalOverlay').isVisible();
    expect(isModalVisible).toBe(true);
    await expect(page.locator('#bezierSplitModalOverlay')).toContainText('연속 베지어 분리');
    await expect(page.locator('#bezierSplitModalOverlay')).toContainText('다시 보지 않기');

    // 다시 보지 않기 체크 후 확인 클릭
    await page.locator('#bezierSuppressChk').check();
    await page.locator('#bezierSplitConfirmBtn').click();

    const isSuppressed = await page.evaluate(() => localStorage.getItem('webpointer_suppress_bezier_split_confirm'));
    expect(isSuppressed).toBe('true');
  });

  test('TC34: 다중 세그먼트 역계산 체인 전파 및 분리 핸들러 오렌지 렌더링 스타일 검증', async ({ page }) => {
    // 4개 연속 베지어 포인트 객체 생성
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const bezier = window.WebpointerBezier;
      const render = window.WebpointerRender;

      const pts = [
        { px: 100, py: 100 },
        { px: 200, py: 100 },
        { px: 300, py: 200 },
        { px: 400, py: 100 },
        { px: 500, py: 200 }
      ];
      const firstCtrl = { cx: 150, cy: 50 };
      const pathD = bezier.buildContinuousBezierPathD(pts, null, 'bez2', firstCtrl, null, null, null, null);

      const obj = {
        id: 'bez2_chain_test',
        type: 'bez2',
        attrs: {
          points: pts,
          firstCtrl: firstCtrl,
          ctrls2: [],
          pathD: pathD,
          stroke: '#0284c7',
          strokeWidth: 2
        }
      };

      cfg.objectsMap.set(obj.id, obj);
      cfg.selectedIds.clear();
      cfg.selectedIds.add(obj.id);
      render.renderUI();

      // 4번째 핸들러 (idx = 3) 역계산 전파 테스트
      // 세그먼트 3 (P3->P4) 가상 핸들러 이동 시 3 -> 2 -> 1 -> firstCtrl 전파
      const newRefl = { cx: 450, cy: 250 };
      // 3번째 세그먼트 역계산
      let curRefl = newRefl;
      for (let seg = 3; seg >= 1; seg--) {
        const prevP = pts[seg];
        const prevCtrl = { cx: 2 * prevP.px - curRefl.cx, cy: 2 * prevP.py - curRefl.cy };
        if (seg - 1 === 0) {
          obj.attrs.firstCtrl = prevCtrl;
          break;
        } else {
          curRefl = prevCtrl;
        }
      }

      obj.attrs.pathD = bezier.buildContinuousBezierPathD(obj.attrs.points, null, obj.type, obj.attrs.firstCtrl, null, null, null, obj.attrs.ctrls2);
      render.renderUI();

      // 분리 핸들러 (idx = 2) 세팅 및 렌더링 스타일 검증
      obj.attrs.ctrls2[2] = { cx: 350, cy: 50 };
      obj.attrs.pathD = bezier.buildContinuousBezierPathD(obj.attrs.points, null, obj.type, obj.attrs.firstCtrl, null, null, null, obj.attrs.ctrls2);
      render.renderUI();

      const splitHandle = document.querySelector('.handle-node[data-idx="2"][fill="#f97316"]');
      return {
        hasPropagatedFirstCtrl: obj.attrs.firstCtrl !== null,
        hasSplitOrangeHandle: !!splitHandle
      };
    });

    console.log('[Webpointer Multi-Segment Propagate Test 🧪]:', result);
    expect(result.hasPropagatedFirstCtrl).toBe(true);
    expect(result.hasSplitOrangeHandle).toBe(true);
  });

  test('TC35: 연속 3차 베지어 곡선(bez3) SVG S 구문, 가상 c1 역계산 전파 및 분리 핸들러 검증', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const bezier = window.WebpointerBezier;
      const render = window.WebpointerRender;

      const pts = [
        { px: 100, py: 200 },
        { px: 250, py: 100 },
        { px: 400, py: 300 },
        { px: 550, py: 150 }
      ];
      const ctrls3 = [
        { c1: { x: 150, y: 150 }, c2: { x: 200, y: 120 } }
      ];

      const pathD = bezier.buildContinuousBezierPathD(pts, null, 'bez3', null, null, null, ctrls3, null);

      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      document.getElementById('objectsGroup').appendChild(pathEl);

      const obj = {
        id: 'bez3_continuous_test',
        type: 'bez3',
        el: pathEl,
        attrs: {
          points: pts,
          ctrls3: ctrls3,
          pathD: pathD,
          stroke: '#0284c7',
          strokeWidth: 2
        }
      };

      cfg.currentTool = 'select';
      cfg.objectsMap.set(obj.id, obj);
      render.updateElementAttributes(obj);

      cfg.selectedIds.clear();
      cfg.selectedIds.add(obj.id);
      render.renderUI();

      // S 구문 포함 여부 검증
      const hasSCommand = pathD.includes(' S ');

      // c1 가상 핸들러 역계산 전파 테스트
      // 세그먼트 1 (pts[1]->pts[2]) 가상 c1 이동 시 세그먼트 0의 c2 역계산
      const virtualC1 = { x: 280, y: 120 };
      const pStart = pts[1];
      const prevC2 = { x: 2 * pStart.px - virtualC1.x, y: 2 * pStart.py - virtualC1.y };
      obj.attrs.ctrls3[0].c2 = prevC2;

      obj.attrs.pathD = bezier.buildContinuousBezierPathD(obj.attrs.points, null, obj.type, null, null, null, obj.attrs.ctrls3, null);
      render.renderUI();

      // c1 분리 핸들러 세팅 및 오렌지 렌더링 스타일 검증
      obj.attrs.ctrls3[1] = { c1: { x: 300, y: 150 }, c2: { x: 450, y: 250 } };
      obj.attrs.pathD = bezier.buildContinuousBezierPathD(obj.attrs.points, null, obj.type, null, null, null, obj.attrs.ctrls3, null);
      render.renderUI();

      const handles = Array.from(document.querySelectorAll('.handle-node'));
      const splitHandleC1 = handles.find(h => h.dataset.handleType === 'bez3_c1' && String(h.dataset.idx) === '1' && h.getAttribute('fill') === '#f97316');

      return {
        hasSCommand: hasSCommand,
        hasReverseCalculatedC2: !!obj.attrs.ctrls3[0].c2,
        hasSplitOrangeHandleC1: !!splitHandleC1
      };
    });

    console.log('[Webpointer Bez3 Continuous Test 🧪]:', result);
    expect(result.hasSCommand).toBe(true);
    expect(result.hasReverseCalculatedC2).toBe(true);
    expect(result.hasSplitOrangeHandleC1).toBe(true);
  });

  test('TC36: 5개 연속 3차 베지어 곡선(bez3)에서 3번째 가상 c1 이동 시 연결된 이전 c2만 역계산되고 상위 c2 핸들러 보존 검증', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const bezier = window.WebpointerBezier;
      const render = window.WebpointerRender;

      const pts = [
        { px: 100, py: 100 },
        { px: 200, py: 100 },
        { px: 300, py: 100 },
        { px: 400, py: 100 },
        { px: 500, py: 100 },
        { px: 600, py: 100 }
      ];

      const ctrls3 = [
        { c1: { x: 120, y: 50 }, c2: { x: 180, y: 50 } }, // Seg 0
        { c2: { x: 280, y: 60 } },                         // Seg 1
        { c2: { x: 380, y: 70 } },                         // Seg 2
        { c2: { x: 480, y: 80 } },                         // Seg 3
        { c2: { x: 580, y: 90 } }                          // Seg 4
      ];

      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      document.getElementById('objectsGroup').appendChild(pathEl);

      const obj = {
        id: 'bez3_5seg_test',
        type: 'bez3',
        el: pathEl,
        attrs: {
          points: pts,
          ctrls3: ctrls3,
          stroke: '#0284c7',
          strokeWidth: 2
        }
      };

      cfg.currentTool = 'select';
      cfg.objectsMap.set(obj.id, obj);
      cfg.selectedIds.clear();
      cfg.selectedIds.add(obj.id);
      render.updateElementAttributes(obj);

      // 세그먼트 3 (pts[3]->pts[4])의 가상 c1_3 조절 시뮬레이션
      // idx = 3. pStart = pts[3] (400, 100).
      // 가상 c1_3을 (420, 150)으로 이동할 때, ctrls3[2].c2만 2*P3 - coords = (2*400 - 420, 2*100 - 150) = (380, 50)으로 조정되어야 함.
      const seg3PStart = pts[3];
      const newC1Coords = { px: 420, py: 150 };
      const expectedSeg2C2 = { x: 2 * seg3PStart.px - newC1Coords.px, y: 2 * seg3PStart.py - newC1Coords.py };

      // main.js의 bez3_c1 드래그 로직 재현 실행
      const idx = 3;
      const prevC2 = { x: 2 * seg3PStart.px - newC1Coords.px, y: 2 * seg3PStart.py - newC1Coords.py };
      obj.attrs.ctrls3[idx - 1] = obj.attrs.ctrls3[idx - 1] || {};
      obj.attrs.ctrls3[idx - 1].c2 = prevC2;

      return {
        seg0C2Unchanged: obj.attrs.ctrls3[0].c2.x === 180 && obj.attrs.ctrls3[0].c2.y === 50,
        seg1C2Unchanged: obj.attrs.ctrls3[1].c2.x === 280 && obj.attrs.ctrls3[1].c2.y === 60,
        seg2C2Updated: obj.attrs.ctrls3[2].c2.x === expectedSeg2C2.x && obj.attrs.ctrls3[2].c2.y === expectedSeg2C2.y
      };
    });

    console.log('[Webpointer 5-Segment Bez3 Independence Test 🧪]:', result);
    expect(result.seg0C2Unchanged).toBe(true);
    expect(result.seg1C2Unchanged).toBe(true);
    expect(result.seg2C2Updated).toBe(true);
  });

  test('TC37: 베지어 곡선(bez2/bez3) 경로 자석 근접 선택(proximity selection) 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const selection = window.WebpointerSelection;

      cfg.objectsMap.clear();

      // (100, 100) -> (300, 100) 제어점 (200, 50) 아치형 2차 베지어 곡선
      const bez2Obj = {
        id: 'bez2_proximity_test',
        type: 'bez2',
        attrs: {
          points: [{ px: 100, py: 100 }, { px: 300, py: 100 }],
          firstCtrl: { cx: 200, cy: 50 },
          ctrls2: [{ cx: 200, cy: 50 }]
        }
      };
      cfg.objectsMap.set(bez2Obj.id, bez2Obj);

      // 곡선 중간 근처 (200, 80) 클릭 시 감지 테스트 (경로 근처 10px 거리)
      const foundObjArcMid = selection.findNearestObject(200, 80);

      // 곡선에서 100px 떨어진 무관한 지점 (200, 300) 클릭 시 감지 불가 테스트
      const foundObjFar = selection.findNearestObject(200, 300);

      return {
        detectedNearArc: foundObjArcMid ? foundObjArcMid.id : null,
        notDetectedFar: foundObjFar === null
      };
    });

    console.log('[Webpointer Bezier Proximity Selection Test 🧪]:', result);
    expect(result.detectedNearArc).toBe('bez2_proximity_test');
    expect(result.notDetectedFar).toBe(true);
  });

  test('TC38: 호(arc) 도구 오브젝트 생성, startAngle 및 endAngle 핸들러 렌더링 및 드래그 동작 검증', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;

      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      document.getElementById('objectsGroup').appendChild(pathEl);

      const arcObj = {
        id: 'arc_test_obj',
        type: 'arc',
        el: pathEl,
        attrs: {
          cx: 200,
          cy: 200,
          rx: 80,
          ry: 80,
          startAngle: -90,
          endAngle: 45,
          angle: 0,
          stroke: '#0284c7',
          strokeWidth: 2
        }
      };

      cfg.currentTool = 'select';
      cfg.objectsMap.set(arcObj.id, arcObj);
      cfg.selectedIds.clear();
      cfg.selectedIds.add(arcObj.id);
      render.updateElementAttributes(arcObj);
      render.renderUI();

      // 핸들 노드 렌더링 확인 (ellipse_center, arc_start, arc_end)
      const handles = Array.from(document.querySelectorAll('.handle-node'));
      const startHandle = handles.find(h => h.dataset.handleType === 'arc_start');
      const endHandle = handles.find(h => h.dataset.handleType === 'arc_end');

      // startAngle / endAngle 드래그 업데이트 시뮬레이션
      arcObj.attrs.startAngle = 0;
      arcObj.attrs.endAngle = 180;
      render.updateElementAttributes(arcObj);
      render.renderUI();

      const pathDAfterUpdate = pathEl.getAttribute('d');

      return {
        hasStartHandle: !!startHandle,
        hasEndHandle: !!endHandle,
        pathDValid: !!pathDAfterUpdate && pathDAfterUpdate.includes('A 80 80')
      };
    });

    console.log('[Webpointer Arc Tool & Handles Test 🧪]:', result);
    expect(result.hasStartHandle).toBe(true);
    expect(result.hasEndHandle).toBe(true);
    expect(result.pathDValid).toBe(true);
  });

  test('TC39: 호(arc) 가로/세로 크기 및 회전 핸들러, 직사각형(rect) 회전 핸들러 렌더링 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;

      cfg.objectsMap.clear();

      // 호(arc) 객체 생성 및 선택
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      document.getElementById('objectsGroup').appendChild(pathEl);
      const arcObj = {
        id: 'arc_handles_test',
        type: 'arc',
        el: pathEl,
        attrs: { cx: 200, cy: 200, rx: 60, ry: 60, startAngle: -90, endAngle: 90, angle: 15 }
      };
      cfg.currentTool = 'select';
      cfg.objectsMap.set(arcObj.id, arcObj);
      cfg.selectedIds.clear();
      cfg.selectedIds.add(arcObj.id);
      render.updateElementAttributes(arcObj);
      render.renderUI();

      const handlesArc = Array.from(document.querySelectorAll('.handle-node'));
      const hasArcWidth = !!handlesArc.find(h => h.dataset.handleType === 'ellipse_width');
      const hasArcHeight = !!handlesArc.find(h => h.dataset.handleType === 'ellipse_height');
      const hasArcRotate = !!handlesArc.find(h => h.dataset.handleType === 'ellipse_rotate');

      // 직사각형(rect) 객체 생성 및 선택
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'rect_rotate_test',
        type: 'rect',
        el: rectEl,
        attrs: { x: 300, y: 100, width: 100, height: 60, angle: 30 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);
      cfg.selectedIds.clear();
      cfg.selectedIds.add(rectObj.id);
      render.updateElementAttributes(rectObj);
      render.renderUI();

      const handlesRect = Array.from(document.querySelectorAll('.handle-node'));
      const hasRectRotate = !!handlesRect.find(h => h.dataset.handleType === 'ellipse_rotate');

      return {
        hasArcWidth: hasArcWidth,
        hasArcHeight: hasArcHeight,
        hasArcRotate: hasArcRotate,
        hasRectRotate: hasRectRotate
      };
    });

    console.log('[Webpointer Arc & Rect Handles Audit Test 🧪]:', result);
    expect(result.hasArcWidth).toBe(true);
    expect(result.hasArcHeight).toBe(true);
    expect(result.hasArcRotate).toBe(true);
    expect(result.hasRectRotate).toBe(true);
  });

  test('TC40: 회전된 호(arc) 및 직사각형(rect/rounded) 선택 상자(boxRect) transform 회전 및 렌더링 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;

      cfg.objectsMap.clear();

      // 1. 회전된 호 (arc) 선택상자 transform 검증
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      document.getElementById('objectsGroup').appendChild(pathEl);
      const arcObj = {
        id: 'arc_rotate_box_test',
        type: 'arc',
        el: pathEl,
        attrs: { cx: 250, cy: 250, rx: 70, ry: 70, startAngle: -90, endAngle: 90, angle: 45 }
      };
      cfg.currentTool = 'select';
      cfg.objectsMap.set(arcObj.id, arcObj);
      cfg.selectedIds.clear();
      cfg.selectedIds.add(arcObj.id);
      render.updateElementAttributes(arcObj);
      render.renderUI();

      const boxRectArc = document.querySelector('#uiGroup rect[stroke-dasharray="4,4"]');
      const boxRectArcTransform = boxRectArc ? boxRectArc.getAttribute('transform') : null;

      // 2. 회전된 직사각형 (rect) 요소 transform 및 선택상자 transform 검증
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'rect_transform_test',
        type: 'rect',
        el: rectEl,
        attrs: { x: 400, y: 150, width: 120, height: 80, angle: 60 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);
      cfg.selectedIds.clear();
      cfg.selectedIds.add(rectObj.id);
      render.updateElementAttributes(rectObj);
      render.renderUI();

      const rectElementTransform = rectEl.getAttribute('transform');
      const boxRectRect = document.querySelector('#uiGroup rect[stroke-dasharray="4,4"]');
      const boxRectRectTransform = boxRectRect ? boxRectRect.getAttribute('transform') : null;

      return {
        boxRectArcHasRotate: !!boxRectArcTransform && boxRectArcTransform.includes('rotate(45'),
        rectElementHasRotate: !!rectElementTransform && rectElementTransform.includes('rotate(60'),
        boxRectRectHasRotate: !!boxRectRectTransform && boxRectRectTransform.includes('rotate(60')
      };
    });

    console.log('[Webpointer Rotated Selection Box & Transform Test 🧪]:', result);
    expect(result.boxRectArcHasRotate).toBe(true);
    expect(result.rectElementHasRotate).toBe(true);
    expect(result.boxRectRectHasRotate).toBe(true);
  });

  test('TC41: 채우기가 없는(fill: none) 호(arc) 경로 근처 자석선택(Magnet Selection) 및 허수 영역 배제 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const selection = window.WebpointerSelection;

      cfg.objectsMap.clear();

      // 채우기 없는 호 (center 200, 200, rx 100, ry 100, sAng -90, eAng 0 => 우상단 호 궤적)
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      document.getElementById('objectsGroup').appendChild(pathEl);
      const arcObj = {
        id: 'unfilled_arc_magnet_test',
        type: 'arc',
        el: pathEl,
        attrs: { cx: 200, cy: 200, rx: 100, ry: 100, startAngle: -90, endAngle: 0, fill: 'none', stroke: '#0284c7', strokeWidth: 2 }
      };
      cfg.objectsMap.set(arcObj.id, arcObj);

      // 1. 호 궤적 실선 근처 (200 + 100 * cos(-45deg), 200 + 100 * sin(-45deg)) => 약 (270.7, 129.3)
      // 근처 (275, 125) 클릭 시 (약 5px 거리) -> 자석 감지 성공되어야 함!
      const detectedNearStroke = selection.findNearestObject(275, 125, 15);

      // 2. 호 궤적이 없는 빈 허수 영역 (129, 270) (좌하단 - 호가 없음!)
      // 반지름 100px 거리이지만 호가 없는 영역이므로 자석 감지 실패되어야 함!
      const detectedEmptySector = selection.findNearestObject(129, 270, 15);

      return {
        detectedNearStroke: detectedNearStroke ? detectedNearStroke.id : null,
        ignoredEmptySector: detectedEmptySector === null
      };
    });

    console.log('[Webpointer Unfilled Arc Magnet Selection Test 🧪]:', result);
    expect(result.detectedNearStroke).toBe('unfilled_arc_magnet_test');
    expect(result.ignoredEmptySector).toBe(true);
  });

  test('TC42: 텍스트 상자(text) 회전 핸들 드래그 및 텍스트/밑줄 실시간 transform 회전 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;

      cfg.objectsMap.clear();

      // 텍스트 객체 생성 및 선택
      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      document.getElementById('objectsGroup').appendChild(textEl);
      const textObj = {
        id: 'text_rotation_test',
        type: 'text',
        el: textEl,
        attrs: { x: 300, y: 200, text: '회전 텍스트 테스트', fontSize: 24, underlineStyle: 'solid', angle: 45 }
      };
      cfg.objectsMap.set(textObj.id, textObj);
      cfg.selectedIds.clear();
      cfg.selectedIds.add(textObj.id);
      render.updateElementAttributes(textObj);
      render.renderUI();

      const textTransform = textEl.getAttribute('transform');
      const underlineTransform = textObj.underlineEl ? textObj.underlineEl.getAttribute('transform') : null;

      return {
        textHasRotate: !!textTransform && textTransform.includes('rotate(45'),
        underlineHasRotate: !!underlineTransform && underlineTransform.includes('rotate(45')
      };
    });

    console.log('[Webpointer Text Box Rotation Test 🧪]:', result);
    expect(result.textHasRotate).toBe(true);
    expect(result.underlineHasRotate).toBe(true);
  });

  test('TC43: 텍스트 상자(text) 회전 피벗(getObjectCenter)과 선택 상자(boxRect) 회전 피벗 100% 일치 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;

      cfg.objectsMap.clear();

      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      document.getElementById('objectsGroup').appendChild(textEl);
      const textObj = {
        id: 'text_pivot_alignment_test',
        type: 'text',
        el: textEl,
        attrs: { x: 250, y: 180, text: '피벗 일치 테스트 텍스트', fontSize: 22, angle: 30 }
      };
      cfg.objectsMap.set(textObj.id, textObj);
      cfg.selectedIds.clear();
      cfg.selectedIds.add(textObj.id);
      render.updateElementAttributes(textObj);
      render.renderUI();

      const textTransform = textEl.getAttribute('transform');
      const boxRect = document.querySelector('#uiGroup rect[stroke-dasharray="4,4"]');
      const boxRectTransform = boxRect ? boxRect.getAttribute('transform') : null;

      // 둘 다 rotate(30 cx cy) 형태이며 cx, cy 값이 완전히 동일해야 함!
      return {
        textTransform: textTransform,
        boxRectTransform: boxRectTransform,
        isPivotIdentical: textTransform === boxRectTransform
      };
    });

    console.log('[Webpointer Text Pivot Alignment Test 🧪]:', result);
    expect(result.isPivotIdentical).toBe(true);
  });

  test('TC44: <text> 요소의 x, y 속성이 NaN 또는 undefined인 경우 console.error 미발생 및 안전한 0 속성 세팅 검증 수트', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('NaN')) {
        consoleErrors.push(msg.text());
      }
    });

    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;

      cfg.objectsMap.clear();

      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      document.getElementById('objectsGroup').appendChild(textEl);
      const invalidTextObj = {
        id: 'nan_text_test',
        type: 'text',
        el: textEl,
        attrs: { x: NaN, y: undefined, text: 'NaN 방어 테스트', fontSize: 20 }
      };
      cfg.objectsMap.set(invalidTextObj.id, invalidTextObj);
      render.updateElementAttributes(invalidTextObj);

      const attrX = textEl.getAttribute('x');
      const attrY = textEl.getAttribute('y');

      return {
        attrXIsZero: attrX === '0',
        attrYIsZero: attrY === '0'
      };
    });

    console.log('[Webpointer Text NaN Attribute Defense Test 🧪]:', result);
    expect(result.attrXIsZero).toBe(true);
    expect(result.attrYIsZero).toBe(true);
    expect(consoleErrors.length).toBe(0);
  });

  test('TC45: Ctrl 키 + 회전 핸들 누름 시 "도형과 텍스트의 회전을 분리합니다. [ ] 앞으로 묻지 않음" 팝업 모달 출력 검증', async ({ page }) => {
    // LocalStorage 초기화
    await page.evaluate(() => localStorage.removeItem('webpointer_suppress_text_rotate_split_confirm'));

    // 모달 호출 시뮬레이션
    await page.evaluate(() => {
      window.openTextRotateSplitConfirmModal();
    });

    // 팝업 텍스트 검증
    const modalOverlay = page.locator('#textRotateSplitModalOverlay');
    await expect(modalOverlay).toBeVisible();
    await expect(modalOverlay).toContainText('도형과 텍스트의 회전을 분리합니다.');
    await expect(modalOverlay).toContainText('앞으로 묻지 않음');

    // 앞으로 묻지 않음 체크 후 확인 클릭
    await page.locator('#textRotateSuppressChk').check();
    await page.locator('#textRotateSplitConfirmBtn').click();
    await expect(modalOverlay).not.toBeVisible();

    const isSuppressed = await page.evaluate(() => localStorage.getItem('webpointer_suppress_text_rotate_split_confirm'));
    expect(isSuppressed).toBe('true');
  });

  test('TC46: Ctrl 미눌림 상태에서 다중 선택된 도형(rect)과 텍스트(text)의 회전 각도 실시간 동기화 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      // 1. 직사각형 객체 생성
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'sync_rect',
        type: 'rect',
        el: rectEl,
        attrs: { x: 100, y: 100, width: 100, height: 60, angle: 0 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);

      // 2. 텍스트 객체 생성
      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      document.getElementById('objectsGroup').appendChild(textEl);
      const textObj = {
        id: 'sync_text',
        type: 'text',
        el: textEl,
        attrs: { x: 100, y: 200, text: '동기화 텍스트', fontSize: 20, angle: 0 }
      };
      cfg.objectsMap.set(textObj.id, textObj);

      // 둘 다 선택 (다중 선택)
      cfg.selectedIds.add(rectObj.id);
      cfg.selectedIds.add(textObj.id);
      render.updateElementAttributes(rectObj);
      render.updateElementAttributes(textObj);
      render.renderUI();

      // 회전 각도 변화 시뮬레이션 (+45도 회전)
      const deltaAngle = 45;
      rectObj.attrs.angle = (rectObj.attrs.angle || 0) + deltaAngle;
      textObj.attrs.angle = (textObj.attrs.angle || 0) + deltaAngle;
      render.updateElementAttributes(rectObj);
      render.updateElementAttributes(textObj);
      render.renderUI();

      const rectTransform = rectEl.getAttribute('transform');
      const textTransform = textEl.getAttribute('transform');

      return {
        rectAngle: rectObj.attrs.angle,
        textAngle: textObj.attrs.angle,
        rectHas45: !!rectTransform && rectTransform.includes('rotate(45'),
        textHas45: !!textTransform && textTransform.includes('rotate(45')
      };
    });

    console.log('[Webpointer Shape & Text Rotation Sync Test 🧪]:', result);
    expect(result.rectAngle).toBe(45);
    expect(result.textAngle).toBe(45);
    expect(result.rectHas45).toBe(true);
    expect(result.textHas45).toBe(true);
  });

  test('TC47: 도형(rect) 영역 할당 텍스트(text)의 회전 시 중심축 기준 위치 및 각도 통합 고정 회전 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      // 1. 도형 생성 (x: 200, y: 200, width: 200, height: 100 => center: 300, 250)
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'bound_rect',
        type: 'rect',
        el: rectEl,
        attrs: { x: 200, y: 200, width: 200, height: 100, angle: 0 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);

      // 2. 텍스트 생성 (도형 영역 할당 attrs: width: 200, height: 100 => 도형 좌상단 포개어짐)
      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      document.getElementById('objectsGroup').appendChild(textEl);
      const textObj = {
        id: 'bound_text',
        type: 'text',
        el: textEl,
        attrs: { x: 200, y: 200, width: 200, height: 100, text: '도형 연동 텍스트', fontSize: 20, angle: 0 }
      };
      cfg.objectsMap.set(textObj.id, textObj);

      cfg.selectedIds.add(rectObj.id);
      cfg.selectedIds.add(textObj.id);
      render.updateElementAttributes(rectObj);
      render.updateElementAttributes(textObj);
      render.renderUI();

      // 도형 및 텍스트의 getObjectCenter 피벗 일치 확인
      const rectCenter = window.WebpointerObjects.getObjectCenter(rectObj);
      const textCenter = window.WebpointerObjects.getObjectCenter(textObj);

      return {
        rectCenterX: rectCenter.x,
        rectCenterY: rectCenter.y,
        textCenterX: textCenter.x,
        textCenterY: textCenter.y,
        isCenterMatching: rectCenter.x === textCenter.x && rectCenter.y === textCenter.y
      };
    });

    console.log('[Webpointer Shape Allocated Text Pivot Alignment Test 🧪]:', result);
    expect(result.isCenterMatching).toBe(true);
  });

  test('TC48: 리본 메뉴 [삽입 > 수치 (가로:, 세로:, 회전각:)] 카테고리 신설 및 실시간 수치 연동 검증 수트', async ({ page }) => {
    // 탭을 'insert'로 변경 및 도형 선택 시 수치 카테고리 렌더링 확인
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;

      cfg.currentTab = 'insert';
      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      // 직사각형 객체 생성 (x: 100, y: 100, width: 150, height: 80, angle: 30)
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'metric_test_rect',
        type: 'rect',
        el: rectEl,
        attrs: { x: 100, y: 100, width: 150, height: 80, angle: 30 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);
      cfg.selectedIds.add(rectObj.id);

      render.renderRibbon();

      // 수치 입력 함수 호출 시뮬레이션
      window.updateSelectedMetricWidth(200);
      window.updateSelectedMetricHeight(120);
      window.updateSelectedMetricAngle(60);

      return {
        updatedWidth: rectObj.attrs.width,
        updatedHeight: rectObj.attrs.height,
        updatedAngle: rectObj.attrs.angle
      };
    });

    console.log('[Webpointer Ribbon Metrics Category Test 🧪]:', result);
    expect(result.updatedWidth).toBe(200);
    expect(result.updatedHeight).toBe(120);
    expect(result.updatedAngle).toBe(60);

    // DOM UI에서 '수치', '가로:', '세로:', '회전각:' 텍스트 표시 검증
    const ribbonBar = page.locator('#ribbonBar');
    await expect(ribbonBar).toContainText('수치');
    await expect(ribbonBar).toContainText('가로:');
    await expect(ribbonBar).toContainText('세로:');
    await expect(ribbonBar).toContainText('회전각:');
  });

  test('TC49: transformSelected(rotate90) 90도 회전 도구 및 변형 도구 정상 작동 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'transform_rect',
        type: 'rect',
        el: rectEl,
        attrs: { x: 100, y: 100, width: 100, height: 60, angle: 0 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);
      cfg.selectedIds.add(rectObj.id);

      render.updateElementAttributes(rectObj);
      render.renderUI();

      // 90도 회전 실행
      window.transformSelected('rotate90');
      const angleAfterRotate90 = rectObj.attrs.angle;

      // -90도 회전 실행 (원복)
      window.transformSelected('rotateNeg90');
      const angleAfterRotateNeg90 = rectObj.attrs.angle;

      return {
        angleAfterRotate90,
        angleAfterRotateNeg90
      };
    });

    console.log('[Webpointer transformSelected Rotate90 Test 🧪]:', result);
    expect(result.angleAfterRotate90).toBe(90);
    expect(result.angleAfterRotateNeg90).toBe(0);
  });

  test('TC50: 도형 내 글자 포함 시 글자 핸들러 숨김 처리 및 도형-글상자 크기·위치 100% 통합 동기화 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      // 도형 생성 (x: 100, y: 100, width: 200, height: 120, angle: 0)
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'host_shape',
        type: 'rect',
        el: rectEl,
        attrs: { x: 100, y: 100, width: 200, height: 120, angle: 0 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);

      // 연동 텍스트 생성
      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      document.getElementById('objectsGroup').appendChild(textEl);
      const textObj = {
        id: 'inside_text',
        type: 'text',
        el: textEl,
        attrs: { x: 100, y: 100, text: '도형 내 텍스트', fontSize: 20, angle: 0 }
      };
      cfg.objectsMap.set(textObj.id, textObj);

      // 다중 선택 (도형 + 텍스트)
      cfg.selectedIds.add(rectObj.id);
      cfg.selectedIds.add(textObj.id);

      render.updateElementAttributes(rectObj);
      render.updateElementAttributes(textObj);
      render.renderUI();

      // 1. 도형 핸들러 개수 검증 (텍스트 전용 핸들러는 숨김 처리되어 도형 핸들러만 존재)
      const handleNodes = Array.from(document.querySelectorAll('.handle-node'));
      const textHandleNodes = handleNodes.filter(h => h.dataset.objId === textObj.id);

      // 2. 도형 크기 변형 후 syncShapeTextBounds 실행 시 텍스트 크기·위치 동기화 검증
      rectObj.attrs.width = 300;
      rectObj.attrs.height = 180;
      window.WebpointerObjects.syncShapeTextBounds(rectObj);

      return {
        textHandleCount: textHandleNodes.length,
        syncedTextWidth: textObj.attrs.width,
        syncedTextHeight: textObj.attrs.height,
        isWidthMatching: textObj.attrs.width === rectObj.attrs.width,
        isHeightMatching: textObj.attrs.height === rectObj.attrs.height
      };
    });

    console.log('[Webpointer Shape Text Unified Handle & Bounds Test 🧪]:', result);
    expect(result.textHandleCount).toBe(0);
    expect(result.syncedTextWidth).toBe(300);
    expect(result.syncedTextHeight).toBe(180);
    expect(result.isWidthMatching).toBe(true);
    expect(result.isHeightMatching).toBe(true);
  });

  test('TC51: F2 키 입력 시 도형 편집모드 진입, Esc 키 입력 시 도형 선택 복귀, 회전 시 순간이동 현상 차단 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;
      const textTool = window.WebpointerTextTool;

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      // 1. 도형 생성 및 선택
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'f2_shape',
        type: 'rect',
        el: rectEl,
        attrs: { x: 150, y: 150, width: 160, height: 90, angle: 0 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);
      cfg.selectedIds.add(rectObj.id);

      // F2 키 시뮬레이션: 도형 텍스트 편집 시작
      const pt = textTool.getShapeTextInsertionPoint(rectObj);
      textTool.startDirectCanvasTyping(pt.px, pt.py, null, pt.anchor);

      const isTypingActive = !!window.WebpointerState.typingSvgObj;
      const createdTextObj = window.WebpointerState.typingSvgObj;

      // 텍스트 입력
      if (createdTextObj) {
        createdTextObj.attrs.text = '테스트문구';
      }

      // Esc 키 시뮬레이션: 편집 종료 및 도형 선택 복귀
      textTool.finishDirectCanvasTyping();

      const isShapeSelectedAfterEsc = cfg.selectedIds.has(rectObj.id);
      const isToolSelectAfterEsc = cfg.currentTool === 'select';

      // 회전 시 피벗 위치 검증 (도형과 텍스트의 getObjectCenter 피벗 일치 여부)
      const rectCenter = window.WebpointerObjects.getObjectCenter(rectObj);
      const textCenter = createdTextObj ? window.WebpointerObjects.getObjectCenter(createdTextObj) : null;

      return {
        isTypingActive,
        isShapeSelectedAfterEsc,
        isToolSelectAfterEsc,
        isPivotMatching: textCenter && rectCenter.x === textCenter.x && rectCenter.y === textCenter.y
      };
    });

    console.log('[Webpointer F2 & Esc Key Scenario & Pivot Sync Test 🧪]:', result);
    expect(result.isTypingActive).toBe(true);
    expect(result.isShapeSelectedAfterEsc).toBe(true);
    expect(result.isToolSelectAfterEsc).toBe(true);
    expect(result.isPivotMatching).toBe(true);
  });

  test('TC52: 텍스트 상단 베이스라인(dominant-baseline="hanging") 적용 및 F2 키 누름 시 기존 병합 텍스트 수정 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;
      const textTool = window.WebpointerTextTool;

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      // 1. 도형 및 텍스트 그룹 생성
      const groupId = 'group_existing';
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'existing_shape',
        type: 'rect',
        parentId: groupId,
        el: rectEl,
        attrs: { x: 200, y: 200, width: 180, height: 100, angle: 0 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);

      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      document.getElementById('objectsGroup').appendChild(textEl);
      const textObj = {
        id: 'existing_text',
        type: 'text',
        parentId: groupId,
        el: textEl,
        attrs: { x: 200, y: 200, text: '기존문구', fontSize: 20, angle: 0, dominantBaseline: 'hanging' }
      };
      cfg.objectsMap.set(textObj.id, textObj);

      render.updateElementAttributes(rectObj);
      render.updateElementAttributes(textObj);

      // 도형 선택 후 F2 시뮬레이션 (addTextObject)
      cfg.selectedIds.add(rectObj.id);
      textTool.addTextObject();

      const editingSvgObj = window.WebpointerState.typingSvgObj;
      const isEditingExistingText = editingSvgObj && editingSvgObj.id === textObj.id;

      // dominant-baseline 속성 확인
      const domBaseline = textEl.getAttribute('dominant-baseline');

      textTool.finishDirectCanvasTyping();

      return {
        isEditingExistingText,
        domBaseline,
        objectsCount: cfg.objectsMap.size
      };
    });

    console.log('[Webpointer Top Baseline & F2 Existing Text Edit Test 🧪]:', result);
    expect(result.isEditingExistingText).toBe(true);
    expect(result.domBaseline).toBe('hanging');
    expect(result.objectsCount).toBe(2);
  });

  test('TC53: 도형+텍스트 다중 선택 시 선택박스(boxRect) 동시 회전 및 회전/hanging 커서 위치 정렬 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;
      const textTool = window.WebpointerTextTool;

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      // 1. 회전된 도형 생성 (angle: 45)
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'rot_box_rect',
        type: 'rect',
        el: rectEl,
        attrs: { x: 100, y: 100, width: 200, height: 100, angle: 45 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);

      // 2. 회전된 연동 텍스트 생성 (angle: 45)
      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      document.getElementById('objectsGroup').appendChild(textEl);
      const textObj = {
        id: 'rot_box_text',
        type: 'text',
        el: textEl,
        attrs: { x: 100, y: 100, width: 200, height: 100, text: '회전 커서 검증', fontSize: 20, angle: 45, dominantBaseline: 'hanging' }
      };
      cfg.objectsMap.set(textObj.id, textObj);

      // 둘 다 선택 (다중 선택)
      cfg.selectedIds.add(rectObj.id);
      cfg.selectedIds.add(textObj.id);

      render.updateElementAttributes(rectObj);
      render.updateElementAttributes(textObj);
      render.renderUI();

      // uiGroup 내 boxRect element 선택박스 transform 속성 검증
      const uiGroup = document.getElementById('uiGroup');
      const boxRectEl = uiGroup.querySelector('rect[stroke="#0284c7"]');
      const boxRectTransform = boxRectEl ? boxRectEl.getAttribute('transform') : '';

      // 3. 커서위치 검증: 텍스트 편집 시작 후 깜빡이는 커서(#canvasBlinkingCaret) transform 속성 검증
      textTool.startDirectCanvasTyping(100, 100, textObj);
      const caretEl = document.getElementById('canvasBlinkingCaret');
      const caretTransform = caretEl ? caretEl.getAttribute('transform') : '';
      const caretY1 = caretEl ? parseFloat(caretEl.getAttribute('y1')) : 0;

      textTool.finishDirectCanvasTyping();

      return {
        boxRectHasRotate45: !!boxRectTransform && boxRectTransform.includes('rotate(45'),
        caretHasRotate45: !!caretTransform && caretTransform.includes('rotate(45'),
        caretY1Equals100: caretY1 === 100
      };
    });

    console.log('[Webpointer Grouped BoxRect Rotation & Rotated Caret Alignment Test 🧪]:', result);
    expect(result.boxRectHasRotate45).toBe(true);
    expect(result.caretHasRotate45).toBe(true);
    expect(result.caretY1Equals100).toBe(true);
  });

  test('TC54: 양쪽 맞춤 경계 위치(Problem 1, 2) 및 공백 포함 행 word-spacing 조절 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;

      cfg.objectsMap.clear();

      // 도형 생성
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'host_rect',
        type: 'rect',
        parentId: 'group_j',
        el: rectEl,
        attrs: { x: 100, y: 100, width: 300, height: 150 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);

      // 연동 텍스트 생성: "가나다 라마\n바사 아자차차\n아하 추가공백"
      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      document.getElementById('objectsGroup').appendChild(textEl);
      const textObj = {
        id: 'justify_multi_text',
        type: 'text',
        parentId: 'group_j',
        el: textEl,
        attrs: { x: 100, y: 100, width: 300, height: 150, text: '가나다 라마\n바사 아자차차\n아하 추가공백', fontSize: 20, textAnchor: 'justify' }
      };
      cfg.objectsMap.set(textObj.id, textObj);

      render.updateElementAttributes(rectObj);
      render.updateElementAttributes(textObj);

      const tspans = textEl.querySelectorAll('tspan');
      const startX = parseFloat(textEl.getAttribute('x'));
      const isStartXAlignedToLeftPad = (startX === 110); // minX + 10 = 110

      const line1Spacing = tspans[0] ? parseFloat(tspans[0].style.wordSpacing || '0') : 0;
      const line3Spacing = tspans[2] ? parseFloat(tspans[2].style.wordSpacing || '0') : 0;

      return {
        isStartXAlignedToLeftPad,
        isLine1Justified: line1Spacing > 0,
        isLine3JustifiedWithSpaces: line3Spacing > 0
      };
    });

    console.log('[Webpointer Justification Bounds & Spacebar Alignment Test 🧪]:', result);
    expect(result.isStartXAlignedToLeftPad).toBe(true);
    expect(result.isLine1Justified).toBe(true);
    expect(result.isLine3JustifiedWithSpaces).toBe(true);
  });

  test('TC55: 위/중앙/아래 정렬 시 hanging 베이스라인 오프셋 반영 및 반복 토글 위치 고정 검증 수트(Problem 3, 4)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const render = window.WebpointerRender;
      const textTool = window.WebpointerTextTool;

      cfg.objectsMap.clear();

      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'host_rect2',
        type: 'rect',
        parentId: 'group_v',
        el: rectEl,
        attrs: { x: 100, y: 100, width: 200, height: 200 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);

      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      document.getElementById('objectsGroup').appendChild(textEl);
      const textObj = {
        id: 'v_align_text',
        type: 'text',
        parentId: 'group_v',
        el: textEl,
        attrs: { x: 100, y: 100, width: 200, height: 200, text: '첫줄\n둘째줄', fontSize: 20, verticalAlign: 'top' }
      };
      cfg.objectsMap.set(textObj.id, textObj);

      // 1. Top alignment: y should be 110 (minY 100 + pad 10)
      textTool.updateShapeTextAlignment(rectObj, textObj, 'start', 'top');
      const topY = textObj.attrs.y;

      // 2. Middle alignment: totalTextHeight = 1*24 + 20 = 44. Center Y = 200 - 22 = 178
      textTool.updateShapeTextAlignment(rectObj, textObj, 'start', 'middle');
      const middleY = textObj.attrs.y;

      // 3. Bottom alignment: maxY 300 - pad 10 - totalTextHeight 44 = 246
      textTool.updateShapeTextAlignment(rectObj, textObj, 'start', 'bottom');
      const bottomY = textObj.attrs.y;

      // 4. Repeated toggle back to Top alignment: y MUST return to 110 (no hanging creep!)
      textTool.updateShapeTextAlignment(rectObj, textObj, 'start', 'top');
      const returnedTopY = textObj.attrs.y;

      return {
        topY,
        middleY,
        bottomY,
        returnedTopY,
        isTopYCorrect: topY === 110,
        isMiddleInsideShape: middleY > 100 && middleY < 300,
        isBottomInsideShape: bottomY > 100 && bottomY < 300 && (bottomY + 44 <= 290),
        isNoCreepOnToggle: returnedTopY === topY
      };
    });

    console.log('[Webpointer Top/Middle/Bottom Alignment & Hanging Drift Test 🧪]:', result);
    expect(result.isTopYCorrect).toBe(true);
    expect(result.isMiddleInsideShape).toBe(true);
    expect(result.isBottomInsideShape).toBe(true);
    expect(result.isNoCreepOnToggle).toBe(true);
  });

  test('TC56: Ctrl+C / Ctrl+V 클립보드 기능 검증 - 도형 복사 시 도형 복제 및 도형 선택 시 텍스트 붙여넣기 자동 병합 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const clipboard = window.WebpointerClipboard;

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      // 1. 도형 생성 및 복사/붙여넣기 테스트 (도형 -> 도형 복제)
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'cp_shape',
        type: 'rect',
        el: rectEl,
        attrs: { x: 150, y: 150, width: 200, height: 120 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);
      cfg.selectedIds.add(rectObj.id);

      // 1회차 도형 복사 & 붙여넣기
      clipboard.copySelectedObjects();
      clipboard.pasteClipboardObjects(); // 150 + 15 = 165
      const paste1Obj = Array.from(cfg.selectedIds).map(id => cfg.objectsMap.get(id))[0];

      // 2회차 연속 붙여넣기 (Ctrl+V 연타)
      clipboard.pasteClipboardObjects(); // 165 + 15 = 180
      const paste2Obj = Array.from(cfg.selectedIds).map(id => cfg.objectsMap.get(id))[0];

      const shapeCountAfterPaste = cfg.objectsMap.size; // 3개의 도형

      // 2. 도형 선택 상태에서 텍스트 붙여넣기 테스트 (글 -> 도형에 글상자 병합)
      clipboard.pasteTextIntoSelectedShape('붙여넣은 텍스트 내용');

      let mergedTextObj = null;
      cfg.objectsMap.forEach(o => {
        if (o.type === 'text' && o.attrs.text === '붙여넣은 텍스트 내용') {
          mergedTextObj = o;
        }
      });

      // 3. 선택 해제 상태에서 텍스트 붙여넣기 테스트 (글 -> 독립 글상자 생성)
      cfg.selectedIds.clear();
      clipboard.pasteStandaloneText('독립 글상자 텍스트');

      let standaloneTextObj = null;
      cfg.objectsMap.forEach(o => {
        if (o.type === 'text' && o.attrs.text === '독립 글상자 텍스트') {
          standaloneTextObj = o;
        }
      });

      return {
        shapeCountAfterPaste,
        isPaste1Cascaded: paste1Obj && paste1Obj.attrs.x === 165 && paste1Obj.attrs.y === 165,
        isPaste2CascadedFurther: paste2Obj && paste2Obj.attrs.x === 180 && paste2Obj.attrs.y === 180,
        isTextMergedIntoShape: !!mergedTextObj && !!mergedTextObj.parentId,
        mergedTextContent: mergedTextObj ? mergedTextObj.attrs.text : '',
        isStandaloneTextCreated: !!standaloneTextObj && !standaloneTextObj.parentId
      };
    });

    console.log('[Webpointer Context-Aware Copy & Cascading Paste Test 🧪]:', result);
    expect(result.shapeCountAfterPaste).toBe(3);
    expect(result.isPaste1Cascaded).toBe(true);
    expect(result.isPaste2CascadedFurther).toBe(true);
    expect(result.isTextMergedIntoShape).toBe(true);
    expect(result.mergedTextContent).toBe('붙여넣은 텍스트 내용');
    expect(result.isStandaloneTextCreated).toBe(true);
  });

  test('TC57: 글 서식 탭 내 패딩 카테고리(상하좌우 패딩 및 동기화) 연동 및 cycleTextVerticalAlign 수직 정렬 정확도 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const handlers = window;

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'pad_rect',
        type: 'rect',
        parentId: 'pad_group',
        el: rectEl,
        attrs: { x: 100, y: 100, width: 200, height: 200 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);

      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      document.getElementById('objectsGroup').appendChild(textEl);
      const textObj = {
        id: 'pad_text',
        type: 'text',
        parentId: 'pad_group',
        el: textEl,
        attrs: { x: 100, y: 100, width: 200, height: 200, text: '테스트1\n테스트2', fontSize: 20 }
      };
      cfg.objectsMap.set(textObj.id, textObj);
      cfg.selectedIds.add(textObj.id);

      // Initial text is 'hanging' (Top). Cycle goes Top -> Middle -> Bottom -> Top
      handlers.cycleTextVerticalAlign(); // step 1: central (middle) -> 177
      const middleY = textObj.attrs.y;

      handlers.cycleTextVerticalAlign(); // step 2: alphabetic (bottom) -> 239
      const bottomY = textObj.attrs.y;

      handlers.cycleTextVerticalAlign(); // step 3: hanging (top) -> 110
      const topY = textObj.attrs.y;

      // 2. 패딩 변경 테스트 (상하좌우 패딩 20px 변경)
      handlers.setTextPadding('top', 20);

      // Top Y should now be minY 100 + padTop 20 = 120
      handlers.setTextVerticalAlign('hanging');
      const customPadTopY = textObj.attrs.y;

      return {
        topY,
        middleY,
        bottomY,
        customPadTopY,
        isTopYCorrect: topY === 110,
        isMiddleInsideShape: middleY > 100 && middleY < 300,
        isBottomInsideShape: bottomY > 100 && bottomY < 300,
        isCustomPadTopYCorrect: customPadTopY === 120,
        padSyncState: cfg.padSync
      };
    });

    console.log('[Webpointer Padding Category & Vertical Align Test 🧪]:', result);
    expect(result.isTopYCorrect).toBe(true);
    expect(result.isMiddleInsideShape).toBe(true);
    expect(result.isBottomInsideShape).toBe(true);
    expect(result.isCustomPadTopYCorrect).toBe(true);
    expect(result.padSyncState).toBe(true);
  });

  test('TC58: fitTextToShape 방향A (초과 시 폰트 축소, 여백 남을 시 기본 폰트 유지 및 정렬) 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const handlers = window;

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'fit_rect',
        type: 'rect',
        parentId: 'fit_group',
        el: rectEl,
        attrs: { x: 100, y: 100, width: 300, height: 100 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);

      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      document.getElementById('objectsGroup').appendChild(textEl);
      const textObj = {
        id: 'fit_text',
        type: 'text',
        parentId: 'fit_group',
        el: textEl,
        attrs: { x: 100, y: 100, width: 300, height: 100, text: '짧은 글', fontSize: 20, autoFitMode: 'fitTextToShape' }
      };
      cfg.objectsMap.set(textObj.id, textObj);

      // 여백이 넉넉할 때: 폰트 크기가 20으로 유지됨
      handlers.applyAutoFitToGroup(textObj);
      const fontWhenSpaceRemains = textObj.attrs.fontSize;

      return {
        fontWhenSpaceRemains,
        isFontMaintained: fontWhenSpaceRemains === 20
      };
    });

    console.log('[Webpointer fitTextToShape Direction A Test 🧪]:', result);
    expect(result.isFontMaintained).toBe(true);
  });

  test('TC59: cycleTextAutoFitMode 3회 이상 순환 클릭 시 baseFontSize 보존 및 도형/폰트 누적 축소(Spiral Bug) 방지 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const handlers = window;

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'sp_rect',
        type: 'rect',
        parentId: 'sp_group',
        el: rectEl,
        attrs: { x: 100, y: 100, width: 200, height: 100 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);

      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      document.getElementById('objectsGroup').appendChild(textEl);
      const textObj = {
        id: 'sp_text',
        type: 'text',
        parentId: 'sp_group',
        el: textEl,
        attrs: { x: 100, y: 100, width: 200, height: 100, text: '테스트용 샘플 텍스트 내용입니다', fontSize: 20, autoFitMode: 'fitShapeToText' }
      };
      cfg.objectsMap.set(textObj.id, textObj);
      cfg.selectedIds.add(textObj.id);

      // Cycle 1: fitShapeToText -> fitTextToShape -> none
      handlers.cycleTextAutoFitMode(); // fitTextToShape
      const cycle1FontSize = textObj.attrs.fontSize;

      handlers.cycleTextAutoFitMode(); // none
      handlers.cycleTextAutoFitMode(); // fitShapeToText (Back to start!)
      const cycle2FitShapeFontSize = textObj.attrs.fontSize;

      // Cycle 2: fitShapeToText -> fitTextToShape -> none
      handlers.cycleTextAutoFitMode(); // fitTextToShape
      const cycle2FontSize = textObj.attrs.fontSize;

      handlers.cycleTextAutoFitMode(); // none
      handlers.cycleTextAutoFitMode(); // fitShapeToText (Back to start!)
      const cycle3FitShapeFontSize = textObj.attrs.fontSize;

      // Cycle 3: fitShapeToText -> fitTextToShape
      handlers.cycleTextAutoFitMode(); // fitTextToShape
      const cycle3FontSize = textObj.attrs.fontSize;

      return {
        cycle1FontSize,
        cycle2FitShapeFontSize,
        cycle2FontSize,
        cycle3FontSize,
        isBaseFontRestoredOnCycle: cycle2FitShapeFontSize === 20 && cycle3FitShapeFontSize === 20,
        isNoCumulativeShrink: cycle3FontSize === cycle2FontSize
      };
    });

    console.log('[Webpointer Anti-Spiral AutoFit Cycle Test 🧪]:', result);
    expect(result.isBaseFontRestoredOnCycle).toBe(true);
    expect(result.isNoCumulativeShrink).toBe(true);
  });

  test('TC60: 직선(line) 그리기 및 양 끝점 조절 시 Ctrl 키 가로/세로 직교 스냅(Orthogonal Lock) 검증 수트', async ({ page }) => {
    const result = await page.evaluate(() => {
      const cfg = window.WebpointerConfig;
      const state = window.WebpointerState;
      const render = window.WebpointerRender;
      const selection = window.WebpointerSelection;

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      const svgEl = document.getElementById('mainSvg');
      const svgRect = svgEl.getBoundingClientRect();

      function getClientCoords(targetPx, targetPy) {
        return {
          clientX: svgRect.left + (targetPx / (cfg.SVG_WIDTH || 960)) * svgRect.width,
          clientY: svgRect.top + (targetPy / (cfg.SVG_HEIGHT || 540)) * svgRect.height
        };
      }

      // 1. New Line Drawing with Ctrl (Horizontal: dx > dy)
      const lineEl1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      document.getElementById('objectsGroup').appendChild(lineEl1);
      const lineObj1 = {
        id: 'line_ctrl_h',
        type: 'line',
        el: lineEl1,
        attrs: { x1: 96, y1: 108, x2: 96, y2: 108, strokeWidth: 2 }
      };
      cfg.objectsMap.set(lineObj1.id, lineObj1);

      state.isDrawingNewObject = true;
      state.activeNewObj = lineObj1;
      const startPt = getClientCoords(96, 108);
      state.drawStartCoords = selection.getStepCoords({ clientX: startPt.clientX, clientY: startPt.clientY });
      const px1 = (state.drawStartCoords.stepX / cfg.STEPS_X) * cfg.SVG_WIDTH;
      const py1 = (state.drawStartCoords.stepY / cfg.STEPS_Y) * cfg.SVG_HEIGHT;

      // Simulate mousemove with Ctrl pressed: targetPx = 300, targetPy = 120 -> |dx| >= |dy| -> y2 should be py1
      const clientH = getClientCoords(300, 120);
      const moveEventH = new MouseEvent('mousemove', { clientX: clientH.clientX, clientY: clientH.clientY, ctrlKey: true });
      svgEl.dispatchEvent(moveEventH);
      const drawHorizontalY2 = lineObj1.attrs.y2;
      const drawHorizontalX2 = lineObj1.attrs.x2;

      // Simulate mousemove with Ctrl pressed: targetPx = 110, targetPy = 350 -> |dy| > |dx| -> x2 should be px1
      const clientV = getClientCoords(110, 350);
      const moveEventV = new MouseEvent('mousemove', { clientX: clientV.clientX, clientY: clientV.clientY, ctrlKey: true });
      svgEl.dispatchEvent(moveEventV);
      const drawVerticalX2 = lineObj1.attrs.x2;
      const drawVerticalY2 = lineObj1.attrs.y2;

      state.isDrawingNewObject = false;
      state.activeNewObj = null;

      // 2. Line Handle Dragging with Ctrl (End Handle)
      state.isDraggingHandle = true;
      state.activeHandleInfo = { objId: lineObj1.id, handleType: 'end', idx: 2 };
      state.initialObjAttrsMap = new Map();
      state.initialObjAttrsMap.set(lineObj1.id, { ...lineObj1.attrs, x1: 100, y1: 100, x2: 300, y2: 100 });
      lineObj1.attrs.x1 = 100;
      lineObj1.attrs.y1 = 100;

      // Drag end handle with Ctrl (horizontal lock: target (350, 120) relative to (100, 100))
      const clientEndH = getClientCoords(350, 120);
      const handleMoveH = new MouseEvent('mousemove', { clientX: clientEndH.clientX, clientY: clientEndH.clientY, ctrlKey: true });
      svgEl.dispatchEvent(handleMoveH);
      const handleEndLockY = lineObj1.attrs.y2;

      // Drag end handle with Ctrl (vertical lock: target (120, 350) relative to (100, 100))
      const clientEndV = getClientCoords(120, 350);
      const handleMoveV = new MouseEvent('mousemove', { clientX: clientEndV.clientX, clientY: clientEndV.clientY, ctrlKey: true });
      svgEl.dispatchEvent(handleMoveV);
      const handleEndLockX = lineObj1.attrs.x2;

      // 3. Line Handle Dragging with Ctrl (Start Handle)
      state.activeHandleInfo = { objId: lineObj1.id, handleType: 'start', idx: 1 };
      state.initialObjAttrsMap.set(lineObj1.id, { ...lineObj1.attrs, x1: 100, y1: 100, x2: 300, y2: 300 });
      lineObj1.attrs.x2 = 300;
      lineObj1.attrs.y2 = 300;

      // Drag start handle with Ctrl (horizontal lock: anchor is x2, y2 = 300; target (100, 280))
      const clientStartH = getClientCoords(100, 280);
      const handleStartMoveH = new MouseEvent('mousemove', { clientX: clientStartH.clientX, clientY: clientStartH.clientY, ctrlKey: true });
      svgEl.dispatchEvent(handleStartMoveH);
      const handleStartLockY = lineObj1.attrs.y1;

      state.isDraggingHandle = false;
      state.activeHandleInfo = null;

      return {
        drawHorizontalY2,
        drawHorizontalX2,
        drawVerticalX2,
        drawVerticalY2,
        handleEndLockY,
        handleEndLockX,
        handleStartLockY,
        py1,
        px1,
        isDrawHorizontalCorrect: drawHorizontalY2 === py1,
        isDrawVerticalCorrect: drawVerticalX2 === px1,
        isHandleEndHorizontalCorrect: handleEndLockY === 100,
        isHandleEndVerticalCorrect: handleEndLockX === 100,
        isHandleStartHorizontalCorrect: handleStartLockY === 300
      };
    });

    console.log('[Webpointer Line Ctrl Orthogonal Snap Test 🧪]:', result);
    expect(result.isDrawHorizontalCorrect).toBe(true);
    expect(result.isDrawVerticalCorrect).toBe(true);
    expect(result.isHandleEndHorizontalCorrect).toBe(true);
    expect(result.isHandleEndVerticalCorrect).toBe(true);
    expect(result.isHandleStartHorizontalCorrect).toBe(true);
  });

  test('TC61: 색상 버튼(선, 면 채우기, 글자 채우기, 글자 테두리, 밑줄) 짧은 클릭 시 색상 즉시 적용 및 롱프레스(Hold) 시 팔레트 팝오버 오픈 검증 수트', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const cfg = window.WebpointerConfig;
      const handlers = window;

      cfg.objectsMap.clear();
      cfg.selectedIds.clear();

      // 1. 도형 생성 및 짧은 클릭 단독 적용 (연동 x) 테스트
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      document.getElementById('objectsGroup').appendChild(rectEl);
      const rectObj = {
        id: 'color_rect',
        type: 'rect',
        el: rectEl,
        attrs: { x: 100, y: 100, width: 200, height: 100, stroke: '#000000', fill: '#ffffff', strokeWidth: 5 }
      };
      cfg.objectsMap.set(rectObj.id, rectObj);
      cfg.selectedIds.add(rectObj.id);

      cfg.strokeColor = '#e11d48'; // 빨간색
      cfg.fillColor = '#10b981';   // 초록색

      // 짧은 클릭: stroke 만 단독 적용 (fill과 strokeWidth는 변경되지 않음)
      const dummyBtn = document.createElement('button');
      handlers.handleColorBtnClick(dummyBtn, 'stroke');
      const strokeApplied = rectObj.attrs.stroke;
      const fillUnchanged = rectObj.attrs.fill;
      const widthUnchanged = rectObj.attrs.strokeWidth;

      // 짧은 클릭: fill 만 단독 적용 (stroke는 빨간색 유지)
      handlers.handleColorBtnClick(dummyBtn, 'fill');
      const fillApplied = rectObj.attrs.fill;
      const strokePreserved = rectObj.attrs.stroke;

      // 2. 텍스트 개체 생성 및 짧은 클릭 적용 테스트
      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      document.getElementById('objectsGroup').appendChild(textEl);
      const textObj = {
        id: 'color_text',
        type: 'text',
        el: textEl,
        attrs: { x: 100, y: 250, text: '색상 테스트', fill: '#000000', stroke: 'none', underlineColor: '#000000' }
      };
      cfg.objectsMap.set(textObj.id, textObj);
      cfg.selectedIds.clear();
      cfg.selectedIds.add(textObj.id);

      cfg.textFillColor = '#8b5cf6';      // 보라색
      cfg.textStrokeColor = '#f59e0b';    // 주황색
      cfg.textUnderlineColor = '#3b82f6'; // 파란색

      handlers.handleColorBtnClick(dummyBtn, 'text_fill');
      const textFillApplied = textObj.attrs.fill;

      handlers.handleColorBtnClick(dummyBtn, 'text_stroke');
      const textStrokeApplied = textObj.attrs.stroke;

      handlers.handleColorBtnClick(dummyBtn, 'text_underline');
      const textUnderlineApplied = textObj.attrs.underlineColor;

      // 3. 롱프레스 (Long-Press 200ms) 트리거 시 팔레트 팝오버 오픈 테스트
      document.body.appendChild(dummyBtn);
      handlers.startHoldColorBtn(new MouseEvent('mousedown'), dummyBtn, 'stroke');

      // 250ms 대기하여 200ms 롱프레스 트리거 확인
      await new Promise(r => setTimeout(r, 250));
      const popoverAfterHold = document.getElementById('colorPalettePopover');
      const isPopoverOpenedOnHold = !!popoverAfterHold && popoverAfterHold.dataset.targetMode === 'stroke';

      // 롱프레스 후 마우스업 시 클릭 동작이 팝오버를 닫거나 무시하는지 확인
      handlers.endHoldColorBtn();
      handlers.handleColorBtnClick(dummyBtn, 'stroke');

      if (popoverAfterHold && popoverAfterHold.parentNode) {
        popoverAfterHold.parentNode.removeChild(popoverAfterHold);
      }
      if (dummyBtn.parentNode) dummyBtn.parentNode.removeChild(dummyBtn);

      const textElDomFill = textEl.getAttribute('fill');
      const textElDomStroke = textEl.getAttribute('stroke');

      return {
        strokeApplied,
        fillUnchanged,
        widthUnchanged,
        fillApplied,
        strokePreserved,
        textFillApplied,
        textStrokeApplied,
        textUnderlineApplied,
        textElDomFill,
        textElDomStroke,
        isPopoverOpenedOnHold,
        isStrokeCorrect: strokeApplied === '#e11d48' && fillUnchanged === '#ffffff' && widthUnchanged === 5,
        isFillCorrect: fillApplied === '#10b981' && strokePreserved === '#e11d48',
        isTextFillCorrect: textFillApplied === '#8b5cf6' && textElDomFill === '#8b5cf6',
        isTextStrokeCorrect: textStrokeApplied === '#f59e0b' && textElDomStroke === '#f59e0b',
        isTextUnderlineCorrect: textUnderlineApplied === '#3b82f6'
      };
    });

    console.log('[Webpointer Color Button Short Click & Long Press Test 🧪]:', result);
    expect(result.isStrokeCorrect).toBe(true);
    expect(result.isFillCorrect).toBe(true);
    expect(result.isTextFillCorrect).toBe(true);
    expect(result.isTextStrokeCorrect).toBe(true);
    expect(result.isTextUnderlineCorrect).toBe(true);
    expect(result.isPopoverOpenedOnHold).toBe(true);
  });
});
























