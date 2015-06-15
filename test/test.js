'use strict';

var chai = require('chai');
var assert = chai.assert;

var GettextPlease = require('../src/gettext-please');

function plural(lang, n) {
  switch (lang) {
    case 'ru': // Russian
    case 'uk': // Ukraine
      return n % 10 == 1 && n % 100 != 11 ?
        0 :
        n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ?
          1 : 2;

    case 'en': // English
    case 'de': // German
    case 'it': // Italian
    case 'es': // Spanish
    case 'pt': // Portuguese
      return n !== 1 ? 1 : 0;

    case 'fr': // French
      return n > 1 ? 1 : 0;

    default:
      return 0;
  }
}

var ruOpts = {
  language: 'ru',
  data: {
    'hello': 'Привет мир',
    'applesCount.plural0': '{count} яблоко',
    'applesCount.plural1': '{count} яблока',
    'applesCount.plural2': '{count} яблок',
    'youGotMessages':
      'Привет, {username}, у тебя есть новые <messagesLink>сообщения</messagesLink>!'
  },
  pluralizeKey: function(key, num) {
    return key + ".plural" + plural(this.language, num);
  }
};

var enOpts = {
  language: 'en',
  data: {
    'hello': 'Hello world',
    'applesCount.plural0': '{count} apple',
    'applesCount.plural1': '{count} apples',
    'userGreetings': 'Hello, {username}',
    'youGotMessages':
      'Hi, {username}, you got new <messagesLink>messages</messagesLink>!',
    'nestedTags': 'Test <foo>nested<bar>tags</bar></foo>'
  },
  pluralizeKey: function(key, num) {
    return key + '.plural' + plural(this.language, num);
  }
};

describe('gettext', function() {
  it('should return message', function() {
    var gettextPlease = new GettextPlease(enOpts);

    assert.equal(gettextPlease.gettext('hello'), 'Hello world');
  });
});

describe('pgettext', function() {
  it('should parametrize gettext out with params', function() {
    var gettextPlease = new GettextPlease(enOpts);

    assert.equal(
      gettextPlease.pgettext('userGreetings', {username: 'anmi'}),
      'Hello, anmi'
    );
  });

  it('should be able to fallback and return key', function() {
    assert.deepEqual(
      (new GettextPlease(enOpts))
        .pgettext('missing {key}', {
          key: 'shouldn\t pass'
        }),
      'missing {key}'
    );
  });

  it('should be able to process missing key as value', function() {
    var opts = Object.create(enOpts);

    opts.processMissingAsKey = true;

    assert.deepEqual(
      (new GettextPlease(opts))
        .pgettext('you shall {key}', {
          key: 'pass'
        }),
      'you shall pass'
    );
  });
});

describe('ngettext', function() {
  it('should pluralize key', function() {
    var gettextPlease = new GettextPlease(enOpts);

    assert.equal(
      gettextPlease.ngettext('applesCount', 1, {count: 1}), 
      '1 apple'
    );
    assert.equal(
      gettextPlease.ngettext('applesCount', 0, {count: 0}), 
      '0 apples'
    );
    assert.equal(
      gettextPlease.ngettext('applesCount', 2, {count: 2}), 
      '2 apples'
    );
  });
});

describe('rgettext', function() {
  it('return array with a single string if there is no functions in params', function() {
    var gettextPlease = new GettextPlease(enOpts);

    assert.deepEqual(
      gettextPlease.rgettext('userGreetings', {username: 'anmi'}),
      ['Hello, anmi']
    );
  });

  it('should insert components into text', function() {
    var gettextPlease = new GettextPlease(enOpts);

    assert.deepEqual(
      gettextPlease.rgettext('youGotMessages', {
        username: 'anmi',
        messagesLink: function(children) {
          return {linkObj: children};
        }
      }),
      ['Hi, anmi, you got new ', {linkObj: ['messages']}, '!']
    );
  });

  it('should process nested tags', function() {
    var gettextPlease = new GettextPlease(enOpts);

    assert.deepEqual(
      gettextPlease.rgettext('nestedTags', {
        foo: function(children) {
          return {
            tagName: 'foo',
            children: children
          };
        },
        bar: function(children) {
          return {
            tagName: 'bar',
            children: children
          };
        }
      }),
      [
        'Test ',
        {
          tagName: 'foo',
          children: [
            'nested',
            {
              tagName: 'bar',
              children: ['tags']
            }
          ]
        }
      ]
    )
  });

  it('should be able to fallback and return key', function() {
    assert.deepEqual(
      (new GettextPlease(enOpts))
        .rgettext('missing {key}', {
          key: 'shouldn\t pass'
        }),
      ['missing {key}']
    );
  });

  it('should be able to process missing key as value', function() {
    var opts = Object.create(enOpts);

    opts.processMissingAsKey = true;

    assert.deepEqual(
      (new GettextPlease(opts))
        .rgettext('you shall {key}', {
          key: 'pass'
        }),
      ['you shall pass']
    );
  });
});

describe('rgettextn', function() {
  it('should act exactly like ngettext without wrappers', function() {
    var gettextPlease = new GettextPlease(enOpts);

    var numbers = [1, 2, 3, 4, 5, 6];
    var optsList = [enOpts, ruOpts];

    optsList.forEach(function(opts) {
      var gettextPlease = new GettextPlease(opts);
      numbers.forEach(function(num) {
        assert.deepEqual(
          gettextPlease.rngettext('applesCount', num, {count: num}),
          [gettextPlease.ngettext('applesCount', num, {count: num})]
        );
      });
    });
  });
});

describe('processMissingKey option', function() {
  it('should return callback value', function() {
    var opts = Object.create(enOpts);

    opts.processMissingKey = function(key, ctx) {
      return 'KEY MISSING ' + key;
    };

    assert.deepEqual(
      (new GettextPlease(opts))
        .rgettext('someMissing.key', {
          foo: 'bar'
        }),
      'KEY MISSING someMissing.key'
    );

    assert.deepEqual(
      (new GettextPlease(opts))
        .pgettext('someMissing.key', {
          foo: 'bar'
        }),
      'KEY MISSING someMissing.key'
    );
  });

  it('should process existing key as regular', function() {
    var opts = Object.create(enOpts);

    opts.processMissingKey = function(key, ctx) {
      return 'KEY MISSING ' + key;
    };

    assert.equal(
      (new GettextPlease(opts))
        .pgettext('userGreetings', {
          username: 'anmi'
        }),
      'Hello, anmi'
    );
  });
});

describe('defaultPluralKey', function() {
  it('should generate ctx from defaultPluralKey option', function() {
    var opts = Object.create(enOpts);

    opts.defaultPluralKey = 'count';

    assert.equal(
      (new GettextPlease(opts))
        .ngettext('applesCount', 1),
      '1 apple'
    );

    assert.equal(
      (new GettextPlease(opts))
        .ngettext('applesCount', 2),
      '2 apples'
    );

    assert.deepEqual(
      (new GettextPlease(opts))
        .rngettext('applesCount', 2),
      ['2 apples']
    );
  });
});
