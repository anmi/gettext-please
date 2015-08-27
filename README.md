# gettext-please
[![Travic CI](https://travis-ci.org/anmi/gettext-please.svg?branch=master)](https://travis-ci.org/anmi/gettext-please)

Javascript gettext implementation for react components.

## Usage

Your i18n module
```js
var GettextPlease = require('gettext-please');

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

module.exports = new GettextPlease({
  language: 'ru',
  data: {
    'applesCount.plural0': '{count} яблоко',
    'applesCount.plural1': '{count} яблока',
    'applesCount.plural2': '{count} яблок',
    'youGotMessages':
      'Привет, {username}, у тебя есть новые <messagesLink>сообщения</messagesLink>!'
  },
  pluralizeKey: function(key, num) {
    return key + '.plural' + plural(this.language, num)
  }
});
```
...or english version
```js
module.exports = new GettextPlease({
  language: 'en',
  data: {
    'applesCount.plural0': '{count} apple',
    'applesCount.plural1': '{count} apples',
    'youGotMessages':
      'Hi, {username}, you got new <messagesLink>messages</messagesLink>!'
  }
});
```

Using in components
```jsx
var {rgettext, ngettext} = require('your_i18_module');

rgettext('youGotMessages', {
  username: 'anmi',
  messagesLink: (children) => <messagesLink>{children}</messagesLink>
});
/* =>
['Hi, anmi, you got new ', <messagesLink>messages</messagesLink>, '!']
*/

ngettext('applesCount', 5, {count: 5});
/* =>
'5 apples'
*/
```
You can use methods rgettext and rngettext if you need to wrap part of message
into component.

In case of missing key, you can process key as value, or keep key as is
```js
var gettextPlease = new GettextPlease({
  language: 'en',
  data: {}
});

gettextPlease.pgettext('Hello, {username}', {username: 'anmi'});
/* =>
'Hello, {username}'
*/
```
```js
var gettextPlease = new GettextPlease({
  processMissingAsKey: true,
  language: 'en',
  data: {}
});

gettextPlease.pgettext('Hello, {username}', {username: 'anmi'});
/* =>
'Hello, anmi'
*/
```

If you want manually handle missing key, specify processMissingKey option
```js
var gettextPlease = new GettextPlease({
  processMissingKey: function(key, params) {
    return 'Missing key: ' + key;
  },
  language: 'en',
  data: {}
});

gettextPlease.pgettext('userGreetings', {username: 'anmi'});
/* =>
'Missing key: userGreetings'
*/
```

Most of ngettext calls have single number parameter, so you can specify default key for it
```js
var gettextPlease = new GettextPlease({
  language: 'en',
  defaultPluralKey: 'count',
  pluralizeKey: function(key, num) {
    return key + '.plural' + plural(this.language, num)
  }
  data: {
    'applesCount.plural0': '{count} apple',
    'applesCount.plural1': '{count} apples',
  }
});

gettextPlease.ngettext('applesCount', 5);
/* =>
'5 apples'
*/
```

Define method processMissingParam to handle undeclared parameter.
```jsx
var gettextPlease = new GettextPlease({
  language: 'en',
  processMissingParam: function (key, paramName, content,
                                 index, shouldBeString) {
    if (shouldBeString) {
      return 'MISSING PARAM (' + paramName + ')';
    } else {
      return <MissingParam key={index}>paramName</MissingParam>
    }
  },
  data: {
    'greetings': 'Hello {world}!',
    'greetings2': 'Hello <wrap>world</wrap>'
  }
});

gettextPlease.pgettext('greetings', {});
/* =>
'Hello MISSING PARAM (world)'
*/

gettextPlease.rgettext('greetings', {});
/* =>
[
  'Hello ',
  <MissingParam key=1>wrap</MissingParam>
]
*/
```

debug option
```js
var gettextPlease = new GettextPlease({
  language: 'en',
  debug: true,
  data: {
    'brokenKey': 'Contains extra </close> tag'
  }
});

gettextPlease('brokenKey', {}); // throws error

var gettextPlease = new GettextPlease({
  language: 'en',
  debug: false,
  processMissingAsKey
  data: {
    'brokenKey': 'Contains extra </close> tag'
  }
});

gettextPlease('brokenKey', {}); // ['brokenKey']
```

All methods
```js
Returns string
.gettext(key); // gettext without context
.pgettext(key, context); // parametrized gettext
.ngettext(key, num, context); // .pgettext with pluralization by num
Returns array
.rgettext(key, context); // parametrized gettext with wrapping functions as arguments
.rngettext(key, num, context); // .rgettext with pluralization by num
```
