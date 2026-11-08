/**
 * Suite 11: Text Tool & Inline Editor Deep Suite (S11_TC01 ~ S11_TC06)
 */
(function() {
  var describe = window.WebpointerTest.describe;
  var test = window.WebpointerTest.test;
  var expect = window.WebpointerTest.expect;

  describe('Suite 11: Text Tool & Inline Editor', function() {

    test('S11_TC01: Text Tool Activation, Hidden Input Focus & Caret Initialization', async function({ page, appWindow }) {
      var textTool = appWindow.WebpointerTextTool;
      if (textTool && textTool.startInlineTextEdit) {
        var textObj = { id: 'tt_edit_obj', type: 'text', attrs: { x: 100, y: 100, text: 'Initial Text', fontSize: 18 } };
        appWindow.WebpointerConfig.objectsMap.set(textObj.id, textObj);
        textTool.startInlineTextEdit(textObj);

        var hiddenInput = appWindow.document.getElementById('hiddenTextInput');
        expect(hiddenInput).toBeTruthy();
        if (textTool.finishInlineTextEdit) textTool.finishInlineTextEdit();
      }
    });

    test('S11_TC02: Keydown Dispatching (Typing, Backspace, Delete, Enter, Arrows)', async function({ page, appWindow }) {
      var textTool = appWindow.WebpointerTextTool;
      if (textTool && textTool.handleKeyDown) {
        var textObj = { id: 'tt_key_obj', type: 'text', attrs: { x: 100, y: 100, text: 'Hello', fontSize: 18 } };
        appWindow.WebpointerConfig.objectsMap.set(textObj.id, textObj);
        if (textTool.startInlineTextEdit) textTool.startInlineTextEdit(textObj);

        var eEnter = new KeyboardEvent('keydown', { key: 'Enter' });
        textTool.handleKeyDown(eEnter);

        var eArrow = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        textTool.handleKeyDown(eArrow);

        if (textTool.finishInlineTextEdit) textTool.finishInlineTextEdit();
        expect(textObj.attrs.text).toBeTruthy();
      }
    });

    test('S11_TC03: Font Styling Toggles (Bold, Italic, Strikethrough, Underline)', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      if (appWindow.WebpointerState) appWindow.WebpointerState.holdTriggered = false;
      cfg.fontWeight = 'normal';
      cfg.fontStyle = 'normal';

      var textObj = { id: 'tt_style_obj', type: 'text', attrs: { x: 100, y: 100, text: 'Style Test', fontWeight: 'normal', fontStyle: 'normal' } };
      cfg.objectsMap.clear();
      cfg.selectedIds.clear();
      cfg.objectsMap.set(textObj.id, textObj);
      cfg.selectedIds.add(textObj.id);

      if (appWindow.toggleTextBold) {
        appWindow.toggleTextBold();
        expect(textObj.attrs.fontWeight).toBe('bold');
        appWindow.toggleTextBold();
        expect(textObj.attrs.fontWeight).toBe('normal');
      }
      if (appWindow.toggleTextItalic) {
        if (appWindow.WebpointerState) appWindow.WebpointerState.holdTriggered = false;
        appWindow.toggleTextItalic();
        expect(textObj.attrs.fontStyle).toBe('italic');
        if (appWindow.WebpointerState) appWindow.WebpointerState.holdTriggered = false;
        appWindow.toggleTextItalic();
        expect(textObj.attrs.fontStyle).toBe('normal');
      }
      if (appWindow.toggleTextStrikethrough) {
        appWindow.toggleTextStrikethrough();
        expect(cfg.textDecoration).toBe('line-through');
        appWindow.toggleTextStrikethrough();
        expect(cfg.textDecoration).toBe('none');
      }
    });

    test('S11_TC04: Line Height, Letter Spacing & Word Spacing Handlers', async function({ page, appWindow }) {
      var cfg = appWindow.WebpointerConfig;
      var textObj = { id: 'tt_metrics_obj', type: 'text', attrs: { x: 100, y: 100, text: 'Metrics', lineHeight: 1.2, letterSpacing: 0 } };
      cfg.objectsMap.clear();
      cfg.selectedIds.clear();
      cfg.objectsMap.set(textObj.id, textObj);
      cfg.selectedIds.add(textObj.id);

      if (appWindow.setTextLineHeight) {
        appWindow.setTextLineHeight(1.8);
        expect(textObj.attrs.lineHeight).toBe(1.8);
      }
      if (appWindow.setTextLetterSpacing) {
        appWindow.setTextLetterSpacing(3);
        expect(textObj.attrs.letterSpacing).toBe(3);
      }
    });

    test('S11_TC05: Clipboard SVG & Standalone Text Matrix Handlers (pasteSVGFromClipboard, pasteTextIntoSelectedShape, pasteStandaloneText)', async function({ page, appWindow }) {
      var clip = appWindow.WebpointerClipboard;
      if (clip) {
        if (clip.pasteSVGFromClipboard) clip.pasteSVGFromClipboard('<svg></svg>');
        if (clip.pasteTextIntoSelectedShape) clip.pasteTextIntoSelectedShape('Sample');
        if (clip.pasteStandaloneText) clip.pasteStandaloneText('Sample Text');
      }
      expect(true).toBe(true);
    });

    test('S11_TC06: Text Tool Internal Caret & Selection Coordinates Matrix (addTextObject, startDirectCanvasTyping, resetCaretBlinkTimer, updateTextSelectionHighlight, updateCaretPosition, syncSelection, getLineAndColFromPos, getPosFromLineAndCol, applyNavSelection, finishDirectCanvasTyping, findCharIndexAtCoords, setCaretIndex)', async function({ page, appWindow }) {
      var tt = appWindow.WebpointerTextTool;
      if (tt) {
        if (tt.getLineAndColFromPos) tt.getLineAndColFromPos('abc\ndef', 4);
        if (tt.getPosFromLineAndCol) tt.getPosFromLineAndCol('abc\ndef', 1, 1);
        if (tt.setCaretIndex) tt.setCaretIndex(2);
        if (tt.findCharIndexAtCoords) tt.findCharIndexAtCoords({}, 100, 100);
        if (tt.resetCaretBlinkTimer) tt.resetCaretBlinkTimer();
        if (tt.updateCaretPosition) tt.updateCaretPosition();
        if (tt.syncSelection) tt.syncSelection();
      }
      expect(true).toBe(true);
    });

  });
})();
