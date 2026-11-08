/**
 * Webpointer In-Browser Zero-Dependency Test Engine
 * Provides a lightweight Jest/Playwright-like testing environment in pure Vanilla JS.
 */
(function() {
  var suites = [];
  var currentSuite = null;
  var isRunning = false;
  var listeners = [];

  function describe(name, fn) {
    var suite = {
      name: name,
      tests: [],
      beforeEachFns: [],
      afterEachFns: []
    };
    suites.push(suite);
    var prevSuite = currentSuite;
    currentSuite = suite;
    try {
      fn();
    } finally {
      currentSuite = prevSuite;
    }
  }

  function test(name, fn) {
    if (!currentSuite) {
      describe('General Suite', function() {
        test(name, fn);
      });
      return;
    }
    var idMatch = name.match(/^([A-Za-z0-9_-]+):/);
    var tcId = idMatch ? idMatch[1].trim() : (name.match(/^([A-Za-z0-9_-]+)/) ? name.match(/^([A-Za-z0-9_-]+)/)[1] : ('TC_' + (currentSuite.tests.length + 1)));
    currentSuite.tests.push({
      id: tcId,
      name: name,
      fn: fn,
      suite: currentSuite,
      suiteName: currentSuite.name,
      status: 'pending',
      duration: 0,
      error: null,
      logs: []
    });
  }

  function beforeEach(fn) {
    if (currentSuite) currentSuite.beforeEachFns.push(fn);
  }

  function afterEach(fn) {
    if (currentSuite) currentSuite.afterEachFns.push(fn);
  }

  function expect(received) {
    var isNot = false;
    var matcherObj = {
      get not() {
        isNot = true;
        return matcherObj;
      },
      toBe: function(expected) {
        var pass = Object.is(received, expected);
        if (isNot ? pass : !pass) {
          throw new Error('Expected ' + (isNot ? 'NOT ' : '') + JSON.stringify(expected) + ' but received ' + JSON.stringify(received));
        }
      },
      toEqual: function(expected) {
        var pass = deepEqual(received, expected);
        if (isNot ? pass : !pass) {
          throw new Error('Expected ' + (isNot ? 'NOT ' : '') + JSON.stringify(expected) + ' but received ' + JSON.stringify(received));
        }
      },
      toBeTruthy: function() {
        var pass = !!received;
        if (isNot ? pass : !pass) {
          throw new Error('Expected ' + (isNot ? 'NOT ' : '') + 'truthy but received ' + JSON.stringify(received));
        }
      },
      toBeFalsy: function() {
        var pass = !received;
        if (isNot ? pass : !pass) {
          throw new Error('Expected ' + (isNot ? 'NOT ' : '') + 'falsy but received ' + JSON.stringify(received));
        }
      },
      toBeGreaterThan: function(num) {
        var pass = received > num;
        if (isNot ? pass : !pass) {
          throw new Error('Expected ' + received + (isNot ? ' NOT' : '') + ' to be greater than ' + num);
        }
      },
      toBeGreaterThanOrEqual: function(num) {
        var pass = received >= num;
        if (isNot ? pass : !pass) {
          throw new Error('Expected ' + received + (isNot ? ' NOT' : '') + ' to be >= ' + num);
        }
      },
      toBeLessThan: function(num) {
        var pass = received < num;
        if (isNot ? pass : !pass) {
          throw new Error('Expected ' + received + (isNot ? ' NOT' : '') + ' to be less than ' + num);
        }
      },
      toBeLessThanOrEqual: function(num) {
        var pass = received <= num;
        if (isNot ? pass : !pass) {
          throw new Error('Expected ' + received + (isNot ? ' NOT' : '') + ' to be <= ' + num);
        }
      },
      toBeCloseTo: function(num, delta) {
        var d = delta !== undefined ? delta : 0.001;
        var pass = Math.abs(received - num) <= d;
        if (isNot ? pass : !pass) {
          throw new Error('Expected ' + received + ' to be close to ' + num + ' (delta: ' + d + ')');
        }
      },
      toContain: function(item) {
        var pass = false;
        if (typeof received === 'string') pass = received.indexOf(item) !== -1;
        else if (Array.isArray(received)) pass = received.indexOf(item) !== -1;
        else if (received && typeof received.has === 'function') pass = received.has(item);
        if (isNot ? pass : !pass) {
          throw new Error('Expected container ' + (isNot ? 'NOT ' : '') + 'to contain ' + JSON.stringify(item));
        }
      },
      toBeNull: function() {
        var pass = (received === null);
        if (isNot ? pass : !pass) {
          throw new Error('Expected ' + (isNot ? 'NOT ' : '') + 'null but received ' + JSON.stringify(received));
        }
      },
      toBeDefined: function() {
        var pass = (received !== undefined);
        if (isNot ? pass : !pass) {
          throw new Error('Expected ' + (isNot ? 'NOT ' : '') + 'defined but received undefined');
        }
      },
      toBeUndefined: function() {
        var pass = (received === undefined);
        if (isNot ? pass : !pass) {
          throw new Error('Expected undefined but received ' + JSON.stringify(received));
        }
      }
    };
    return matcherObj;
  }

  function deepEqual(a, b) {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    var keysA = Object.keys(a);
    var keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (var i = 0; i < keysA.length; i++) {
      var k = keysA[i];
      if (!Object.prototype.hasOwnProperty.call(b, k) || !deepEqual(a[k], b[k])) return false;
    }
    return true;
  }

  function getAllTests() {
    var all = [];
    suites.forEach(function(s) {
      s.tests.forEach(function(t) {
        all.push(t);
      });
    });
    return all;
  }

  function onEvent(listener) {
    listeners.push(listener);
  }

  function emit(eventName, data) {
    listeners.forEach(function(l) {
      try { l(eventName, data); } catch(e) { console.error(e); }
    });
  }

  async function runTest(testItem, appWindow) {
    testItem.status = 'running';
    testItem.error = null;
    testItem.logs = [];
    emit('test_start', testItem);

    var start = performance.now();
    try {
      var mockPage = {
        evaluate: async function(fn, ...args) {
          if (typeof fn === 'function') {
            return await fn.apply(appWindow, args);
          }
          return null;
        },
        click: async function(selector) {
          var el = appWindow.document.querySelector(selector);
          if (!el) throw new Error('Element not found: ' + selector);
          el.click();
        },
        locator: function(selector) {
          return {
            boundingBox: async function() {
              var el = appWindow.document.querySelector(selector);
              if (!el) return null;
              var r = el.getBoundingClientRect();
              return { x: r.x, y: r.y, width: r.width, height: r.height };
            },
            click: async function() {
              var el = appWindow.document.querySelector(selector);
              if (el) el.click();
            }
          };
        },
        waitForTimeout: function(ms) {
          return new Promise(function(resolve) { setTimeout(resolve, ms); });
        },
        window: appWindow,
        document: appWindow.document
      };

      if (testItem.suite && testItem.suite.beforeEachFns) {
        for (var b = 0; b < testItem.suite.beforeEachFns.length; b++) {
          await testItem.suite.beforeEachFns[b]({ page: mockPage, appWindow: appWindow });
        }
      }

      await testItem.fn({ page: mockPage, appWindow: appWindow });

      if (testItem.suite && testItem.suite.afterEachFns) {
        for (var a = 0; a < testItem.suite.afterEachFns.length; a++) {
          await testItem.suite.afterEachFns[a]({ page: mockPage, appWindow: appWindow });
        }
      }

      testItem.status = 'passed';
    } catch(err) {
      testItem.status = 'failed';
      testItem.error = err ? (err.stack || err.message || String(err)) : 'Unknown Error';
    } finally {
      testItem.duration = Math.round(performance.now() - start);
      emit('test_end', testItem);
    }
  }

  async function runAll(filterText, appWindow) {
    if (isRunning) return;
    isRunning = true;
    emit('run_start', { suites: suites });

    var tests = getAllTests();
    if (filterText) {
      var q = filterText.toLowerCase();
      tests = tests.filter(function(t) {
        return t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.suiteName.toLowerCase().includes(q);
      });
    }

    for (var i = 0; i < tests.length; i++) {
      await runTest(tests[i], appWindow);
    }

    isRunning = false;
    emit('run_complete', { suites: suites });
  }

  // Global Export
  window.WebpointerTest = {
    describe: describe,
    test: test,
    it: test,
    expect: expect,
    beforeEach: beforeEach,
    afterEach: afterEach,
    getAllTests: getAllTests,
    runTest: runTest,
    runAll: runAll,
    onEvent: onEvent,
    suites: suites
  };
})();
