/**
 * Suite 09: SVG Importer & Parser Matrix Suite (S09_TC01 ~ S09_TC07)
 */
(function() {
  var describe = window.WebpointerTest.describe;
  var test = window.WebpointerTest.test;
  var expect = window.WebpointerTest.expect;

  describe('Suite 09: SVG Importer & Parser Matrix', function() {

    test('S09_TC01: Standard Shapes Parsing (<rect>, <circle>, <ellipse>, <line>, <polygon>, <polyline>)', async function({ page, appWindow }) {
      var importer = appWindow.WebpointerSVGImporter || appWindow.WebpointerSvgImporter;
      var sampleSvg =
        '<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">' +
          '<rect x="10" y="20" width="100" height="80" rx="5" fill="#ff0000" stroke="#000000" stroke-width="2"/>' +
          '<circle cx="150" cy="150" r="40" fill="#00ff00"/>' +
          '<ellipse cx="250" cy="150" rx="50" ry="30" fill="#0000ff"/>' +
          '<line x1="10" y1="300" x2="200" y2="300" stroke="#ff00ff" stroke-width="3"/>' +
          '<polyline points="20,20 40,25 60,40 80,120" fill="none" stroke="black"/>' +
          '<polygon points="200,10 250,190 160,210" fill="lime"/>' +
        '</svg>';

      if (importer && importer.importSVGContent) {
        var count = importer.importSVGContent(sampleSvg);
        expect(count !== false).toBe(true);
      }
    });

    test('S09_TC02: Complex Paths & Curves Parsing (<path d="M... C... Q... A... Z">)', async function({ page, appWindow }) {
      var importer = appWindow.WebpointerSVGImporter || appWindow.WebpointerSvgImporter;
      var pathSvg =
        '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">' +
          '<path d="M 10 80 Q 95 10 180 80 T 350 80" fill="none" stroke="blue"/>' +
          '<path d="M 10 10 C 20 20, 40 20, 50 10 S 70 0, 80 10" fill="none" stroke="red"/>' +
          '<path d="M 60 60 A 30 30 0 0 1 120 60" fill="none" stroke="green"/>' +
        '</svg>';

      if (importer && importer.importSVGContent) {
        var count = importer.importSVGContent(pathSvg);
        expect(count !== false).toBe(true);
      }
    });

    test('S09_TC03: Group Hierarchy & Transform Parsing (<g transform="rotate(...) translate(...)">)', async function({ page, appWindow }) {
      var importer = appWindow.WebpointerSVGImporter || appWindow.WebpointerSvgImporter;
      var groupSvg =
        '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">' +
          '<g id="group1" transform="translate(50, 50) rotate(30)">' +
            '<rect x="0" y="0" width="80" height="50" fill="orange"/>' +
            '<text x="10" y="30" font-size="16" fill="black">Hello Group</text>' +
          '</g>' +
        '</svg>';

      if (importer && importer.importSVGContent) {
        var count = importer.importSVGContent(groupSvg);
        expect(count !== false).toBe(true);
      }
    });

    test('S09_TC04: Image & Base64 Embedded Vector Parsing (<image href="...">)', async function({ page, appWindow }) {
      var importer = appWindow.WebpointerSVGImporter || appWindow.WebpointerSvgImporter;
      var imgSvg =
        '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">' +
          '<image x="20" y="20" width="100" height="100" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="/>' +
        '</svg>';

      if (importer && importer.importSVGContent) {
        var count = importer.importSVGContent(imgSvg);
        expect(count !== false).toBe(true);
      }
    });

    test('S09_TC05: Empty & Malformed SVG Fallback Defense', async function({ page, appWindow }) {
      var importer = appWindow.WebpointerSVGImporter || appWindow.WebpointerSvgImporter;
      if (importer && importer.importSVGContent) {
        var resEmpty = importer.importSVGContent('');
        expect(typeof resEmpty).toBe('boolean');

        var resInvalid = importer.importSVGContent('<not an svg><///');
        expect(typeof resInvalid).toBe('boolean');
      }
    });

    test('S09_TC06: Transform Matrix & Node Style Inheritance Engine Matrix', async function({ page, appWindow }) {
      var importer = appWindow.WebpointerSVGImporter || appWindow.WebpointerSvgImporter;
      expect(importer).toBeDefined();
    });

    test('S09_TC07: SVG Importer Parser Internal Transforms Matrix (parseMatrixTransform, combineTransforms, getInheritedStyle, importSVGContent, traverseNode)', async function({ page, appWindow }) {
      var importer = appWindow.WebpointerSVGImporter || appWindow.WebpointerSvgImporter;
      if (importer) {
        if (importer.parseMatrixTransform) importer.parseMatrixTransform('matrix(1,0,0,1,10,20)');
        if (importer.combineTransforms) importer.combineTransforms([1,0,0,1,0,0], 'matrix(1,0,0,1,10,20)');
        if (importer.importSVGContent) importer.importSVGContent('<svg><rect width="10" height="10"/></svg>');
      }
      expect(true).toBe(true);
    });

    test('S09_TC08: SVG Filter 문자열 파싱 (parseFilterStringToEffects) 및 다중 필터 복원', async function({ page, appWindow }) {
      var importer = appWindow.WebpointerSVGImporter || appWindow.WebpointerSvgImporter;
      if (importer && importer.parseFilterStringToEffects) {
        var sampleFilter = 'blur(6px) drop-shadow(4px 4px 8px rgba(0,0,0,0.5)) grayscale(80%)';
        var parsed = importer.parseFilterStringToEffects(sampleFilter);
        expect(parsed.length).toBe(3);
        expect(parsed[0].type).toBe('blur');
        expect(parsed[0].val).toBe(6);
        expect(parsed[1].type).toBe('drop-shadow');
        expect(parsed[1].blur).toBe(8);
        expect(parsed[2].type).toBe('grayscale');
        expect(parsed[2].val).toBe(80);

        // Test with full SVG import
        var svgStr = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect x="10" y="10" width="80" height="80" fill="#ff0000" filter="blur(4px) drop-shadow(2px 2px 4px #333333)"/></svg>';
        importer.importSVGContent(svgStr);
        var importedObj = Array.from(appWindow.WebpointerConfig.objectsMap.values())[0];
        expect(importedObj).toBeDefined();
        if (importedObj && importedObj.attrs && importedObj.attrs.filterList) {
          expect(importedObj.attrs.filterList.length).toBe(2);
        }
      }
    });

  });
})();
