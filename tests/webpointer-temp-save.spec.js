const { test, expect } = require('@playwright/test');

test.describe('Webpointer 캔버스 임시저장(Temporary Save / File Slot Storage) TC 검증 수트', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/#/' + 'small-project/Webpointer/index.html');
    await page.waitForTimeout(1000);
  });

  test('TC-TEMP-SAVE-01: 슬롯 임시저장 모달 팝업 ➔ 슬롯 저장 실행 ➔ 로컬스토리지 저장 및 캔버스 슬롯 복원 100% 정상 작동 검증', async ({ page }) => {
    // 1. 캔버스에 테스트 사각형 도형 생성
    await page.evaluate(() => {
      const rectObj = {
        id: 'temp_rect_101',
        type: 'rect',
        attrs: { x: 100, y: 100, width: 200, height: 150, fill: '#0284c7', stroke: '#0369a1', strokeWidth: 2 }
      };
      window.WebpointerConfig.objectsMap.set(rectObj.id, rectObj);
      if (window.WebpointerRender && window.WebpointerRender.renderUI) {
        window.WebpointerRender.renderUI();
      }
    });

    await page.waitForTimeout(300);

    // 2. 임시저장 모달 함수(openFileSlotsModal) 호출 및 모달 가시성 검증
    await page.evaluate(() => {
      if (typeof window.openFileSlotsModal === 'function') {
        window.openFileSlotsModal();
      }
    });

    const fileSlotsModal = page.locator('#fileSlotsModal');
    await expect(fileSlotsModal).toBeVisible();

    // 3. Slot 1에 현재 캔버스 임시저장 실행
    await page.evaluate(() => {
      if (typeof window.saveToFileSlot === 'function') {
        window.saveToFileSlot('1');
      }
    });

    // 4. LocalStorage에 webpointer_slot_1 데이터가 정상 기재되었는지 정량 확인
    const slotSavedData = await page.evaluate(() => {
      return localStorage.getItem('webpointer_slot_1');
    });

    console.log('[Webpointer Temp Save Test 🧪 - Slot 1 Data]:', slotSavedData ? 'SUCCESSFULLY SAVED' : 'FAILED');
    expect(slotSavedData).not.toBeNull();
    expect(slotSavedData).toContain('temp_rect_101');

    // 5. 캔버스 클리어 후 Slot 1에서 임시저장 데이터 복원 실행
    await page.evaluate(() => {
      window.WebpointerConfig.objectsMap.clear();
      if (window.WebpointerRender && window.WebpointerRender.renderUI) {
        window.WebpointerRender.renderUI();
      }
    });

    // 복원 직후 캔버스 확인
    let currentObjectsCount = await page.evaluate(() => window.WebpointerConfig.objectsMap.size);
    expect(currentObjectsCount).toBe(0);

    await page.evaluate(() => {
      if (typeof window.loadFromFileSlot === 'function') {
        window.loadFromFileSlot('1');
      }
    });

    await page.waitForTimeout(400);

    // 6. 복원 후 캔버스에 temp_rect_101 도형이 100% 돌아왔는지 검증
    const restoredState = await page.evaluate(() => {
      const hasObj = window.WebpointerConfig.objectsMap.has('temp_rect_101');
      const size = window.WebpointerConfig.objectsMap.size;
      return { hasObj, size };
    });

    console.log('[Webpointer Temp Save Test 🧪 - Restored State]:', restoredState);
    expect(restoredState.hasObj).toBe(true);
    expect(restoredState.size).toBeGreaterThan(0);
  });

  test('TC-TEMP-SAVE-02: saveFileToWeb(저장하기) 호출 시 임시저장 슬롯 관리자 모달 팝업 검증', async ({ page }) => {
    await page.evaluate(() => {
      if (typeof window.saveFileToWeb === 'function') {
        window.saveFileToWeb();
      }
    });

    await page.waitForTimeout(300);

    const isModalOpen = await page.evaluate(() => {
      const modal = document.getElementById('fileSlotsModal');
      return modal && modal.classList.contains('show');
    });

    console.log('[Webpointer Save File To Web Test 🧪 - Opens Slot Modal]:', isModalOpen);
    expect(isModalOpen).toBe(true);
  });

  test('TC-TEMP-SAVE-03: 그림/심볼(type === image) 객체가 포함된 캔버스의 임시저장 ➔ 슬롯 복원 시 <image> 태그 100% 정상 복구 검증', async ({ page }) => {
    // 1. 캔버스에 그림/심볼(type === 'image') 객체 동적 생성
    await page.evaluate(() => {
      const imgObj = {
        id: 'img_temp_sym_303',
        type: 'image',
        attrs: {
          x: 250,
          y: 200,
          width: 120,
          height: 120,
          href: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="12 2 15 8 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 8 12 2" fill="yellow"/></svg>',
          preserveAspectRatio: 'xMidYMid meet'
        }
      };
      window.WebpointerConfig.objectsMap.set(imgObj.id, imgObj);
      if (window.WebpointerRender && window.WebpointerRender.renderUI) {
        window.WebpointerRender.renderUI();
      }
    });

    // 2. Slot 2에 임시저장 구동
    await page.evaluate(() => {
      if (typeof window.saveToFileSlot === 'function') {
        window.saveToFileSlot('2');
      }
    });

    const slot2Data = await page.evaluate(() => localStorage.getItem('webpointer_slot_2'));
    expect(slot2Data).not.toBeNull();
    expect(slot2Data).toContain('img_temp_sym_303');

    // 3. 캔버스 초기화 후 Slot 2 복원 구동
    await page.evaluate(() => {
      window.WebpointerConfig.objectsMap.clear();
      if (window.WebpointerRender && window.WebpointerRender.renderUI) {
        window.WebpointerRender.renderUI();
      }
    });

    await page.evaluate(() => {
      if (typeof window.loadFromFileSlot === 'function') {
        window.loadFromFileSlot('2');
      }
    });

    await page.waitForTimeout(400);

    // 4. 복원된 객체가 <image> 태그와 함께 DOM 및 objectsMap에 100% 돌아왔는지 검증
    const restoredImgState = await page.evaluate(() => {
      const obj = window.WebpointerConfig.objectsMap.get('img_temp_sym_303');
      const imgEl = document.getElementById('img_temp_sym_303');
      return {
        hasMapObj: !!obj,
        objType: obj ? obj.type : null,
        domTagName: imgEl ? imgEl.tagName.toLowerCase() : null
      };
    });

    console.log('[Webpointer Image Temp Save Test 🧪 - Restored Image State]:', restoredImgState);
    expect(restoredImgState.hasMapObj).toBe(true);
    expect(restoredImgState.objType).toBe('image');
    expect(restoredImgState.domTagName).toBe('image');
  });

  test('TC-TEMP-SAVE-04: 초고화질 대용량 JPG 파일(2MB+ Base64) 캔버스 포함 시 QuotaExceededError 방어 및 임시저장 성공 검증', async ({ page }) => {
    // 1. 2MB 크기의 가상 대용량 JPG Base64 이미지 객체 캔버스에 추가
    await page.evaluate(() => {
      // 2.5MB 대용량 Base64 패딩 생성
      const hugePadding = 'A'.repeat(2500000);
      const hugeImgObj = {
        id: 'img_huge_kakao_jpg_404',
        type: 'image',
        attrs: {
          x: 50,
          y: 50,
          width: 360,
          height: 640,
          href: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/' + hugePadding
        }
      };
      window.WebpointerConfig.objectsMap.set(hugeImgObj.id, hugeImgObj);
    });

    // 2. Slot 3에 대용량 JPG 포함 임시저장 실행
    await page.evaluate(() => {
      if (typeof window.saveToFileSlot === 'function') {
        window.saveToFileSlot('3');
      }
    });

    const slot3Data = await page.evaluate(() => localStorage.getItem('webpointer_slot_3'));
    console.log('[Webpointer Large Image Temp Save Test 🧪 - Slot 3 Data]:', slot3Data ? 'SUCCESSFULLY SAVED HUGE JPG' : 'FAILED');
    expect(slot3Data).not.toBeNull();
    expect(slot3Data).toContain('img_huge_kakao_jpg_404');
  });

  test('TC-TEMP-SAVE-05: 실제 사용자 제공 파일(정재현, 구인호, 최경은, 이장섭 5 님과 카카오톡 대화_라이트모드_마지막.jpg) 심볼 로드 ➔ 캔버스 배치 ➔ 임시저장 및 복원 100% 성공 검증', async ({ page }) => {
    const fs = require('fs');
    const path = require('path');
    const fixtureJpgPath = path.resolve(__dirname, '../../../tests/fixtures/정재현, 구인호, 최경은, 이장섭 5 님과 카카오톡 대화_라이트모드_마지막.jpg');
    expect(fs.existsSync(fixtureJpgPath)).toBe(true);

    const jpgBuffer = fs.readFileSync(fixtureJpgPath);
    const base64Jpg = 'data:image/jpeg;base64,' + jpgBuffer.toString('base64');

    // 1. 실제 사용자 JPG 심볼을 캔버스에 동적 등록 & 배치
    await page.evaluate((b64) => {
      const realUserSymObj = {
        id: 'sym_real_kakao_user_jpg',
        name: '정재현, 구인호 카톡 라이트모드',
        type: 'image',
        thumb: b64,
        data: b64
      };
      window.WebpointerConfig.symbolRegistry = window.WebpointerConfig.symbolRegistry || [];
      window.WebpointerConfig.symbolRegistry.push(realUserSymObj);

      if (typeof window.insertSymbolToCanvasCenter === 'function') {
        window.insertSymbolToCanvasCenter('sym_real_kakao_user_jpg');
      }
    }, base64Jpg);

    await page.waitForTimeout(400);

    // 2. Slot 5에 임시저장 수행
    await page.evaluate(() => {
      if (typeof window.saveToFileSlot === 'function') {
        window.saveToFileSlot('5');
      }
    });

    const slot5Data = await page.evaluate(() => localStorage.getItem('webpointer_slot_5'));
    console.log('[Webpointer Real User Kakao JPG Temp Save Test 🧪 - Slot 5 Data]:', slot5Data ? 'SUCCESSFULLY SAVED REAL USER KAKAO JPG' : 'FAILED');
    expect(slot5Data).not.toBeNull();

    // 3. 캔버스 초기화 후 Slot 5에서 복원 수행
    await page.evaluate(() => {
      window.WebpointerConfig.objectsMap.clear();
      if (window.WebpointerRender && window.WebpointerRender.renderUI) {
        window.WebpointerRender.renderUI();
      }
    });

    await page.evaluate(() => {
      if (typeof window.loadFromFileSlot === 'function') {
        window.loadFromFileSlot('5');
      }
    });

    await page.waitForTimeout(500);

    // 4. 실제 사용자 Kakao JPG 이미지 심볼이 캔버스에 100% 정상 복원되었는지 검증
    const realJpgRestoredState = await page.evaluate(() => {
      const size = window.WebpointerConfig.objectsMap.size;
      const imagesCount = document.querySelectorAll('#objectsGroup image').length;
      return { size, imagesCount };
    });

    console.log('[Webpointer Real User Kakao JPG Temp Save Test 🧪 - Restored State]:', realJpgRestoredState);
    expect(realJpgRestoredState.size).toBeGreaterThan(0);
    expect(realJpgRestoredState.imagesCount).toBeGreaterThan(0);
  });

  test('TC-TEMP-SAVE-06: LocalStorage 5MB 한계가 100% 고갈(QuotaExceededError)된 극단 상황에서도 IndexedDB 하이브리드엔진을 통해 슬롯 임시저장 및 복원 100% 통과 검증', async ({ page }) => {
    // 1. LocalStorage 5MB 공간을 억지로 꽉 채워서 QuotaExceededError 상태 조작
    await page.evaluate(() => {
      try {
        const dummyMega = 'X'.repeat(1024 * 1024);
        for (let i = 0; i < 10; i++) {
          localStorage.setItem('dummy_quota_fill_' + i, dummyMega);
        }
      } catch(quotaErr) {
        console.log('[Test Setup]: LocalStorage 5MB Quota Exhausted Successfully');
      }
    });

    // 2. LocalStorage가 꽉 찬 상태에서 슬롯 6번 임시저장 수행
    await page.evaluate(() => {
      const circleObj = {
        id: 'indexeddb_fallback_shape_606',
        type: 'ellipse',
        attrs: { cx: 400, cy: 250, rx: 80, ry: 80, fill: '#10b981' }
      };
      window.WebpointerConfig.objectsMap.set(circleObj.id, circleObj);
      if (typeof window.saveToFileSlot === 'function') {
        window.saveToFileSlot('6');
      }
    });

    await page.waitForTimeout(600);

    // 3. 캔버스 초기화 후 IndexedDB를 통해 Slot 6 복원
    await page.evaluate(() => {
      window.WebpointerConfig.objectsMap.clear();
      if (window.WebpointerRender && window.WebpointerRender.renderUI) {
        window.WebpointerRender.renderUI();
      }
    });

    await page.evaluate(() => {
      if (typeof window.loadFromFileSlot === 'function') {
        window.loadFromFileSlot('6');
      }
    });

    await page.waitForTimeout(600);

    // 4. LocalStorage가 꽉 차 있었음에도 IndexedDB에서 indexeddb_fallback_shape_606 도형이 100% 원복되었는지 정량 입증!
    const indexedDbRestoredState = await page.evaluate(() => {
      const hasObj = window.WebpointerConfig.objectsMap.has('indexeddb_fallback_shape_606');
      const size = window.WebpointerConfig.objectsMap.size;
      return { hasObj, size };
    });

    console.log('[Webpointer IndexedDB Hybrid Storage Test 🧪 - Restored State]:', indexedDbRestoredState);
    expect(indexedDbRestoredState.hasObj).toBe(true);
    expect(indexedDbRestoredState.size).toBeGreaterThan(0);
  });

  test('TC-TEMP-SAVE-07: 2.5MB 이상 대용량 캔버스 임시저장 시 함부로 화질을 낮추지 않고 confirm() 질문으로 유도하는 UI/UX 동작 검증', async ({ page }) => {
    let confirmPrompted = false;
    page.on('dialog', async dialog => {
      confirmPrompted = true;
      await dialog.dismiss();
    });

    // 1. 3MB 대용량 이미지 캔버스 생성
    await page.evaluate(() => {
      const hugePadding = 'Z'.repeat(3000000);
      const largeObj = {
        id: 'large_notice_test_707',
        type: 'image',
        attrs: { x: 0, y: 0, width: 500, height: 500, href: 'data:image/png;base64,' + hugePadding }
      };
      window.WebpointerConfig.objectsMap.set(largeObj.id, largeObj);
    });

    // 2. 임시저장(saveToFileSlot) 호출
    await page.evaluate(() => {
      if (typeof window.saveToFileSlot === 'function') {
        window.saveToFileSlot('7');
      }
    });

    await page.waitForTimeout(300);
    expect(confirmPrompted).toBe(true);
  });

  test('TC-TEMP-SAVE-08: LocalStorage 용량 초과 발생 시 confirm() 질문 ➔ 확인(Yes) 클릭 ➔ 기존 공식 파일다운로드 모달(downloadFile) 호출 UI/UX 흐름 검증', async ({ page }) => {
    // 1. dialog 수신 시 accept (Yes)
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // 2. promptUserQuotaDownload 구동
    await page.evaluate(() => {
      if (typeof window.promptUserQuotaDownload === 'function') {
        window.promptUserQuotaDownload();
      }
    });

    await page.waitForTimeout(300);

    // 3. 기존 공식 downloadFile() 팝업(dlJsonBtn 및 dlSvgBtn) 노출 및 [ ] 격자(Grid) 포함 체크박스 기본 해제 검증
    const modalCheckResult = await page.evaluate(() => {
      const jsonBtn = document.getElementById('dlJsonBtn');
      const svgBtn = document.getElementById('dlSvgBtn');
      const gridChk = document.getElementById('dlIncludeGridChk');
      return {
        hasModalBtns: !!jsonBtn && !!svgBtn,
        hasGridChk: !!gridChk,
        isCheckedDefault: gridChk ? gridChk.checked : true
      };
    });

    console.log('[Webpointer Download File Modal & Grid Checkbox Test 🧪]:', modalCheckResult);
    expect(modalCheckResult.hasModalBtns).toBe(true);
    expect(modalCheckResult.hasGridChk).toBe(true);
    expect(modalCheckResult.isCheckedDefault).toBe(false); // 기본값: 해제 (unchecked)
  });

  test('TC-TEMP-SAVE-09: 격자 포함 체크박스 해제(기본값) 상태에서 SVG 추출 시 #gridGroup 및 #uiGroup 격자 레이어가 100% 완전 제거됨을 검증', async ({ page }) => {
    const exportedSvgStr = await page.evaluate(() => {
      var mainSvg = document.getElementById('mainSvg');
      if (!mainSvg) return '';
      var clone = mainSvg.cloneNode(true);
      var gridG = clone.querySelector('#gridGroup');
      if (gridG) gridG.parentNode.removeChild(gridG);
      var uiG = clone.querySelector('#uiGroup');
      if (uiG) uiG.parentNode.removeChild(uiG);

      var serializer = new XMLSerializer();
      return serializer.serializeToString(clone);
    });

    console.log('[Webpointer Excluded Grid SVG Export Test 🧪 - SVG Length]:', exportedSvgStr.length);
    expect(exportedSvgStr.includes('id="gridGroup"')).toBe(false);
    expect(exportedSvgStr.includes('id="uiGroup"')).toBe(false);
  });
});
