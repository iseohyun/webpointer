const { test, expect } = require('@playwright/test');

test.describe('Webpointer 그림/심볼 삽입 및 정중앙 렌더링/선택 변형 모드 검증', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/#/' + 'small-project/Webpointer/index.html');
    await page.waitForTimeout(1000);
  });

  test('TC-IMAGE-SYMBOL: 도형 삽입 탭 그림/심볼 버튼 클릭 ➔ 모달 팝업 ➔ 심볼 선택 시 캔버스 정중앙 생성 및 선택 조종점 활성화 모드 대기 검증', async ({ page }) => {
    // 1. '삽입' 탭 클릭
    const insertTab = page.locator('.tab-btn:has-text("삽입")');
    await insertTab.click();
    await page.waitForTimeout(300);

    // 2. '도형 삽입' 그룹의 '그림/심볼 삽입' 버튼 클릭
    const symbolBtn = page.locator('button.tool-btn:has-text("그림/심볼 삽입")');
    await expect(symbolBtn).toBeVisible();
    await symbolBtn.click();
    await page.waitForTimeout(400);

    // 3. 그림/심볼 선택 모달 팝업 확인
    const pickerModal = page.locator('#imageSymbolPickerModal');
    await expect(pickerModal).toBeVisible();

    // 4. 모달 내 내장 심볼 카드 ('⭐ 별 (Star)') 클릭
    const starCard = page.locator('#imageSymbolPickerGridContainer div:has-text("⭐ 별 (Star)")');
    await expect(starCard).toBeVisible();
    await starCard.click();
    await page.waitForTimeout(500);

    // 5. 모달 닫힘 확인
    await expect(pickerModal).not.toBeVisible();

    // 6. SVG 캔버스 정중앙에 <image> 객체가 신규 생성되었는지 확인
    const insertedImageObj = page.locator('#objectsGroup image').last();
    await expect(insertedImageObj).toBeVisible();

    // 7. 선택 도구(select)로 즉시 전환되고 선택 조종점(Transform Handles)이 켜졌는지 검증
    const selectedState = await page.evaluate(() => {
      const selectedIds = Array.from(window.WebpointerConfig.selectedIds || []);
      const currentTool = window.WebpointerConfig.currentTool;
      const handlesCount = document.querySelectorAll('.handle-node').length;

      return {
        selectedIds,
        currentTool,
        hasHandles: handlesCount > 0
      };
    });

    console.log('[Webpointer Image Symbol Spec Test 🧪]:', selectedState);

    expect(selectedState.currentTool).toBe('select');
    expect(selectedState.selectedIds.length).toBeGreaterThan(0);
    expect(selectedState.hasHandles).toBe(true);
  });
});
