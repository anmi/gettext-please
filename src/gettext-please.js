var rrtt = require('react-rich-text-template');
var objectAssign = require('object-assign');

// TODO: escape template tags
function applyCtx(str, ctx, opts) {
  return str.replace(/{[^{}]+}/g, function(key) {
    var param = key.replace(/[{}]+/g, "");
    var value = ctx[param];

    if (value === undefined &&
        opts.processMissingParam) {
      value = opts.processMissingParam(
        opts.key,
        param,
        null,
        null,
        true
      );
    }

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
  this.processMissingParam = opts.processMissingParam;

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
    var opts = {
        key: key,
        processMissingParam:
          this.processMissingParam
      };

    if (this.hasKey(key)) {
      return applyCtx(this.gettext(key), ctx, opts);
    } else {
      if (this.processMissingAsKey) {
        return applyCtx(key, ctx, opts);
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
    var self = this;

    if (this.hasKey(key) || this.processMissingAsKey) {
      if (!this.cachedRrtt[key]) {
        var rrttOpts = objectAssign({}, rrtt.defaultConfig, {
            processMissingParam: self.processMissingParam &&
              function(paramName, children, idx) {
                return self.processMissingParam(
                  key,
                  paramName,
                  children,
                  idx,
                  false
                );
              }
            });

        this.cachedRrtt[key] = rrtt.compile(this.gettext(key), rrttOpts);
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
