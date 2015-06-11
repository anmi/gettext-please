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
  this.processMissingAsKey = opts.processMissingAsKey;
  this.processMissingKey = opts.processMissingKey;
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

  hasKey: function(key) {
    return key in this.data;
  },

  gettext: function(key) {
    if (this.hasKey(key)) {
      return this.data[key];
    } else {
      if (this.processMissingKey != null) {
        return this.processMissingKey(key);
      } else {
        return key;
      }
    }
  },

  gettextp: function(key, ctx) {
    if (this.hasKey(key)) {
      return applyCtx(this.gettext(key), ctx);
    } else {
      if (this.processMissingAsKey) {
        return applyCtx(key, ctx);
      } else {
        if (this.processMissingKey != null) {
          return this.processMissingKey(key, ctx);
        } else {
          return key;
        }
      }
    }
  },

  gettextn: function(key, num, ctx) {
    return this.gettextp(this.pluralizeKey(key, num), ctx);
  },

  gettextr: function(key, ctx) {
    if (this.hasKey(key) || this.processMissingAsKey) {
      if (!this.cachedRrtt[key]) {
        this.cachedRrtt[key] = rrtt.compile(this.gettext(key));
      }

      return this.cachedRrtt[key](ctx);
    } else {
      if (this.processMissingKey != null) {
        return this.processMissingKey(key, ctx);
      } else {
        return [key];
      }
    }
  },

  gettextrn: function(key, num, ctx) {
    return this.gettextr(this.pluralizeKey(key, num), ctx);
  }
};

module.exports = GettextPlease;
