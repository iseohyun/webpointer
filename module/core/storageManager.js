/**
 * Webpointer IndexedDB Hybrid Storage Engine
 * LocalStorage 5MB 용량 한계(QuotaExceededError)를 완벽히 극복하는 무제한 대용량 저장소 모듈
 */
(function() {
  'use strict';

  var DB_NAME = 'WebpointerStorageDB';
  var DB_VERSION = 1;
  var STORE_NAME = 'file_slots';
  var dbPromise = null;

  function getDB(callback) {
    if (dbPromise) {
      callback(null, dbPromise);
      return;
    }
    try {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'slotKey' });
        }
      };
      req.onsuccess = function(e) {
        dbPromise = e.target.result;
        callback(null, dbPromise);
      };
      req.onerror = function(e) {
        callback(e.target.error || new Error('IndexedDB Open Error'));
      };
    } catch(err) {
      callback(err);
    }
  }

  function saveSlotToDB(slotKey, dataObj, callback) {
    getDB(function(err, db) {
      if (err || !db) {
        if (callback) callback(err);
        return;
      }
      try {
        var tx = db.transaction([STORE_NAME], 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        var record = {
          slotKey: String(slotKey),
          data: dataObj,
          timestamp: Date.now()
        };
        var req = store.put(record);
        req.onsuccess = function() {
          if (callback) callback(null, true);
        };
        req.onerror = function(e) {
          if (callback) callback(e.target.error);
        };
      } catch(ex) {
        if (callback) callback(ex);
      }
    });
  }

  function loadSlotFromDB(slotKey, callback) {
    getDB(function(err, db) {
      if (err || !db) {
        if (callback) callback(err, null);
        return;
      }
      try {
        var tx = db.transaction([STORE_NAME], 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.get(String(slotKey));
        req.onsuccess = function(e) {
          var record = e.target.result;
          callback(null, record ? record.data : null);
        };
        req.onerror = function(e) {
          callback(e.target.error, null);
        };
      } catch(ex) {
        callback(ex, null);
      }
    });
  }

  function deleteSlotFromDB(slotKey, callback) {
    getDB(function(err, db) {
      if (err || !db) {
        if (callback) callback(err);
        return;
      }
      try {
        var tx = db.transaction([STORE_NAME], 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        var req = store.delete(String(slotKey));
        req.onsuccess = function() {
          if (callback) callback(null);
        };
        req.onerror = function(e) {
          if (callback) callback(e.target.error);
        };
      } catch(ex) {
        if (callback) callback(ex);
      }
    });
  }

  window.WebpointerStorage = {
    saveSlotToDB: saveSlotToDB,
    loadSlotFromDB: loadSlotFromDB,
    deleteSlotFromDB: deleteSlotFromDB
  };
})();
