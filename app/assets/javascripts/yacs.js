Yacs = new function () {
  var self = this;

/* ======================================================================== *
    Network
 * ======================================================================== */

  self.get = function (uri, callback) {
    req = new XMLHttpRequest();
    req.open('GET', uri);
    req.onreadystatechange = function () {
      if (req.readyState == 4 && callback) {
        callback(req.responseText, req.status == 200)
      }
    }
    req.send();
  };

  self.api = function (model, params, callback) {
    var query = "?";
    for (var param in params) {
      if (params.hasOwnProperty(param)) {
        var val = params[param];
        if (Array.isArray()) val = val.join(',')
        query += param + '=' + val + '&';
      }
    }
    var uri = '/api/v5/' + model + '.json' + query;
    self.get(uri, function (response, success) {
      callback(!success || JSON.parse(response), success);
    });
  };

/* ======================================================================== *
    ORM
 * ======================================================================== */

  self.models = { };

  var Model = function (name, options={}) {
    var self = this;
    var childParam = 'show_' + options.has_many;

    self.store = { all: [], id: {} };
    self.preloaded = false;

    self.query = function (params, callback) {
      Yacs.api(name, params, callback);
    };

    self.preload = function (callback) {
      var params = {};
      if (options.has_many)
        params[childParam] = true;
      self.query(params, function (data, success) {
        if (success) {
          var models = data[name];
          for (var m in models) {
            self.store.all = models;
            self.store.id[models[m].id] = models[m];
            if (options.has_many) {
              var children = [];
              for (var n in models[m][options.has_many]) {
                var child = models[m][options.has_many][n];
                Yacs.models[options.has_many].store.id[child.id] = child;
                children.push(child);
              }
              Yacs.models[options.has_many].store.all = children;
            }
          }
          preloaded = true;
        }
        if (callback)
          callback(data, success);
      });
    }
  };

  var addModel = function (name, options={}) {
    return self.models[name] = new Model(name, options);
  }

  addModel('schools',     { has_many: 'departments' });
  addModel('departments', { has_many: 'courses'     });
  addModel('courses',     { has_many: 'sections'    });
  addModel('sections' );
  addModel('schedules');

/* ======================================================================== *
    DOM
 * ======================================================================== */

  self.views = {};

 // https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
  var matches = function (elm, selector) {
    var matches = (elm.document || elm.ownerDocument).querySelectorAll(selector);
    var i = matches.length;
    while (--i >= 0 && matches.item(i) !== elm);
    return i > -1;
  }

  var loaded = false;
  self.onload = function (func) {
    document.addEventListener("DOMContentLoaded", func, false);
  }
  self.onload(function () { loaded = true; })

  self.setContents = function(html) {
    document.getElementById('content').innerHTML = html;
  }
    
  self.clearContents = function() {
    Yacs.setContents('');
  }
  
  self.addEventListener = function(eventType, elem, callback) {
    elem.addEventListener(eventType, function() {
      callback(elem);
    });
  };

}();

/* ======================================================================== *
    Initializers
 * ======================================================================== */

Yacs.onload(function () {
  Yacs.models.schools.preload(function (data) {
    Yacs.views.departments(data);
  });
});