const tap = require('tap')
const jsdom = require('jsdom')
// const sinon = require('sinon')
const { JSDOM } = jsdom

const AntiRobotSnippet = require('./anti-robot-snippet-example.tmp.js') // TODO: Update with your own compiled js
console.warn('Testing ./anti-robot-snippet-example.tmp.js and not the source')

// const fetchPolyfill = require('whatwg-fetch')

class SimpleStorage {
  constructor () {
    this.store = {}
  }
  getItem (key) {
    return this.store[key]
  }
  setItem (key, value) {
    this.store[key] = value
  }
}

tap.test('init for first time will show recaptcha', (t) => {
  const dom = new JSDOM(`<!DOCTYPE html>
      <div id="secret-stuff-container" data-sitekey="pinkfluffyunicornsdancingonrainbows"></div>
    `)
  dom.window.localStorage = new SimpleStorage()
  const secretStuffContainerElement = dom.window.document.getElementById('secret-stuff-container')
  const antiRobotSnippet = new AntiRobotSnippet(dom.window, secretStuffContainerElement)
  t.same(antiRobotSnippet.recaptchaWidget, {})

  antiRobotSnippet.init()
  t.equal(secretStuffContainerElement.innerHTML, '<div></div><button>Show secret stuff</button><div></div>')

  const script = dom.window.document.querySelectorAll(`script[src*=recaptcha]`)
  t.ok(script.length, 'Has the google recaptcha script')
  t.equal(script[0].src, `https://www.google.com/recaptcha/api.js?onload=${antiRobotSnippet.renderRecaptcha.name}&render=explicit`, 'google recaptcha script has correct src')

  t.end()
})

tap.test('init with localStorage that has same checksum will show content and no recaptcha', (t) => {
  const dom = new JSDOM(`<!DOCTYPE html>
      <div id="secret-stuff-container" data-sitekey="pinkfluffyunicornsdancingonrainbows"></div>
    `)
  dom.window.localStorage = new SimpleStorage()
  dom.window.Request = Object
  dom.window.fetch = function (request) {
    return new Promise((resolve, reject) => {
      return resolve({
        ok: true,
        json: () => {
          return {
            content: 'protected content details',
            checksum: 'smilemd5'
          }
        }
      })
    })
  }
  dom.window.localStorage.setItem('secret-stuff-content', 'smilemd5')
  const secretStuffContainerElement = dom.window.document.getElementById('secret-stuff-container')
  const antiRobotSnippet = new AntiRobotSnippet(dom.window, secretStuffContainerElement)
  antiRobotSnippet.init()
    .then(() => {
      t.equal(secretStuffContainerElement.innerHTML, '<div>protected content details</div>')
      t.plan(3)
    })

  t.equal(secretStuffContainerElement.innerHTML, '<div>Loading ...</div>')
  const script = dom.window.document.querySelectorAll(`script[src*=recaptcha]`)
  t.equal(script.length, 0, 'Does not have google recaptcha script')
})

tap.test('init with localStorage that has different checksum will show recaptcha', (t) => {
  const dom = new JSDOM(`<!DOCTYPE html>
      <div id="secret-stuff-container" data-sitekey="pinkfluffyunicornsdancingonrainbows"></div>
    `)
  dom.window.localStorage = new SimpleStorage()
  dom.window.Request = class {
    constructor (path, opts) {
      this.path = path
      this.opts = opts
    }
  }
  dom.window.fetch = function (request) {
    return new Promise((resolve, reject) => {
      return resolve({
        ok: true,
        json: () => {
          const responseData = {
            checksum: 'pinkmd5'
          }
          if (request.opts.body.get('checksum') === responseData.checksum) {
            responseData.content = 'protected content details that are different'
          }
          return responseData
        }
      })
    })
  }
  // user has outdated checksum of content
  dom.window.localStorage.setItem('secret-stuff-content', 'smilemd5')
  const secretStuffContainerElement = dom.window.document.getElementById('secret-stuff-container')
  const antiRobotSnippet = new AntiRobotSnippet(dom.window, secretStuffContainerElement)
  antiRobotSnippet.init()
    .then(() => {
      t.equal(secretStuffContainerElement.innerHTML, '<div></div><button>Show secret stuff</button><div></div>')
      const script = dom.window.document.querySelectorAll(`script[src*=recaptcha]`)
      t.ok(script.length, 'Has the google recaptcha script')
      t.equal(script[0].src, `https://www.google.com/recaptcha/api.js?onload=${antiRobotSnippet.renderRecaptcha.name}&render=explicit`, 'google recaptcha script has correct src')
      t.plan(5)
    })

  t.equal(secretStuffContainerElement.innerHTML, '<div>Loading ...</div>')
  const script = dom.window.document.querySelectorAll(`script[src*=recaptcha]`)
  t.equal(script.length, 0, 'Does not have google recaptcha script')
})

tap.test('Invisible execute recaptcha', (t) => {
  const dom = new JSDOM(`<!DOCTYPE html>
      <div id="secret-stuff-container" data-sitekey="pinkfluffyunicornsdancingonrainbows"></div>
    `)
  dom.window.localStorage = new SimpleStorage()
  dom.window.Request = class {
    constructor (path, opts) {
      this.path = path
      this.opts = opts
    }
  }
  dom.window.fetch = function (request) {
    return new Promise((resolve, reject) => {
      return resolve({
        ok: true,
        json: () => {
          const responseData = {
            checksum: 'smilemd5',
            content: 'protected content details'
          }
          return responseData
        }
      })
    })
  }
  const secretStuffContainerElement = dom.window.document.getElementById('secret-stuff-container')
  const antiRobotSnippet = new AntiRobotSnippet(dom.window, secretStuffContainerElement)
  antiRobotSnippet.init()
    .then(() => {
      t.equal(secretStuffContainerElement.innerHTML, '<div></div><button>Show secret stuff</button><div></div>')
      t.plan(1)
    })
  dom.window.grecaptcha = {
    render: (recaptchaContainer, opts) => {
      return opts
    },
    execute: (widget) => {
      widget.callback('fakeresponse')
    }
  }
  antiRobotSnippet.renderRecaptcha()
})
