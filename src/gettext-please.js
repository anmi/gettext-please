var rrtt = require('react-rich-text-template');

// TODO: escape template tags
function applyCtx(str, ctx) {
  return str.replace(/{[^{}]+}/g, function(key) {
    var value = ctx[key.replace(/[{}]+/g, "")];

    return value;
  });
}

function GettextPlease(opts) {
  this.language = opts.language;
  this.data = opts.data;
  this.pluralizeKey = opts.pluralizeKey;
  this.defaultRichParams = opts.defaultRichParams || {};

  this.cachedRrtt = {};

  this.bindMethods();
}

GettextPlease.prototype = {
  bindMethods: function() {
    var self = this,
      methodsToBind = [
        'gettext', 'gettextp',
        'gettextn', 'gettextr',
        'gettextrn', 'pluralizeKey'
      ];

    methodsToBind.forEach(function(key) {
      self[key] = self[key].bind(self);
    });
  },

  gettext: function(key) {
    return this.data[key];
  },

  gettextp: function(key, ctx) {
    return applyCtx(this.gettext(key), ctx);
  },

  gettextn: function(key, num, ctx) {
    return this.gettextp(this.pluralizeKey(key, num), ctx);
  },

  gettextr: function(key, ctx) {
    if (!this.cachedRrtt[key]) {
      this.cachedRrtt[key] = rrtt.compile(this.gettext(key));
    }

    return this.cachedRrtt[key](ctx);
  },

  gettextrn: function(key, num, ctx) {
    return this.gettextr(this.pluralizeKey(key, num), ctx);
  }
};

module.exports = GettextPlease;
