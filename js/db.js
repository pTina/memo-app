// IndexedDB data layer — notes + fonts stores.
var DB = (function () {
  var DB_NAME = "memoAppDB";
  var DB_VERSION = 1;
  var db = null;

  function init() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var _db = e.target.result;
        if (!_db.objectStoreNames.contains("notes")) {
          _db.createObjectStore("notes", { keyPath: "id" });
        }
        if (!_db.objectStoreNames.contains("fonts")) {
          _db.createObjectStore("fonts", { keyPath: "id" });
        }
      };
      req.onsuccess = function (e) {
        db = e.target.result;
        resolve(db);
      };
      req.onerror = function (e) {
        reject(e.target.error);
      };
    });
  }

  function tx(storeName, mode) {
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  function getAll(storeName) {
    return new Promise(function (resolve, reject) {
      var req = tx(storeName, "readonly").getAll();
      req.onsuccess = function () { resolve(req.result || []); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function put(storeName, record) {
    return new Promise(function (resolve, reject) {
      var req = tx(storeName, "readwrite").put(record);
      req.onsuccess = function () { resolve(record); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function del(storeName, id) {
    return new Promise(function (resolve, reject) {
      var req = tx(storeName, "readwrite").delete(id);
      req.onsuccess = function () { resolve(id); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  return {
    init: init,
    uid: uid,
    notes: {
      getAll: function () { return getAll("notes"); },
      put: function (note) { return put("notes", note); },
      delete: function (id) { return del("notes", id); }
    },
    fonts: {
      getAll: function () { return getAll("fonts"); },
      put: function (font) { return put("fonts", font); },
      delete: function (id) { return del("fonts", id); }
    }
  };
})();
