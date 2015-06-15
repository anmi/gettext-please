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
  this.defaultPluralKey = opts.defaultPluralKey;
  this.defaultRichParams = opts.defaultRichParams || {};

  this.cachedRrtt = {};

  this.bindMethods();
}

GettextPlease.prototype = {
  bindMethods: function() {
    var self = this,
      methodsToBind = [
        'gettext', 'pgettext',
        'ngettext', 'rgettext',
        'rngettext', 'pluralizeKey'
      ];

    methodsToBind.forEach(function(key) {
      self[key] = self[key].bind(self);
    });
  },

  genPluralCtx: function(num) {
    var ctx = {};

    ctx[this.defaultPluralKey] = num;

    return ctx;
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

  pgettext: function(key, ctx) {
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

  ngettext: function(key, num, ctx) {
    if (ctx == null && this.defaultPluralKey != null) {
      ctx = this.genPluralCtx(num);
    }

    return this.pgettext(this.pluralizeKey(key, num), ctx);
  },

  rgettext: function(key, ctx) {
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

  rngettext: function(key, num, ctx) {
    if (ctx == null && this.defaultPluralKey != null) {
      ctx = this.genPluralCtx(num);
    }

    return this.rgettext(this.pluralizeKey(key, num), ctx);
  }
};

module.exports = GettextPlease;
