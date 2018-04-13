'use strict';

class AntiRobotSnippet {
  constructor (window, containerElement) {
    this.window = window;
    this.containerElement = containerElement;
    this.recaptchaWidget = {};
  }

  init () {
    return new Promise((resolve, reject) => {
      // Show the loading ...
      this.contentElement = this.window.document.createElement('div');
      this.contentElement.innerHTML = 'Loading ...';
      this.containerElement.appendChild(this.contentElement);

      const checksum = this.window.localStorage.getItem('secret-stuff-content') || false;
      if (checksum) {
        this.getDetailsWithChecksum(checksum)
          .then((responseData) => {
            if (responseData.content) {
              this.contentElement.innerHTML = responseData.content;
            } else {
              this.loadRecaptcha();
            }
            resolve();
          });
      } else {
        this.loadRecaptcha();
        resolve();
      }
    })
  }

  loadRecaptcha () {
    this.contentElement.innerHTML = '';

    // insert recaptcha button
    this.recaptchaButtonElement = this.window.document.createElement('button');
    this.recaptchaButtonElement.innerHTML = 'Show secret stuff';
    this.recaptchaButtonElement.addEventListener('click', this.resetRecaptcha.bind(this));
    this.containerElement.appendChild(this.recaptchaButtonElement);

    // insert recaptcha element
    this.recaptchaContainer = this.window.document.createElement('div');
    this.containerElement.appendChild(this.recaptchaContainer);

    // insert recaptcha script
    this.window.renderRecaptcha = this.renderRecaptcha.bind(this);
    const recaptchaScript = this.window.document.createElement('script');
    recaptchaScript.src = `https://www.google.com/recaptcha/api.js?onload=${this.renderRecaptcha.name}&render=explicit`;
    recaptchaScript.async = true;
    recaptchaScript.defer = true;
    this.window.document.body.append(recaptchaScript);
  }

  renderRecaptcha () {
    const grecaptcha = this.window.grecaptcha;
    // Do invisible recaptcha check on page load and insert secret stuff in
    // secret stuff element if successful.
    this.recaptchaWidget = grecaptcha.render(this.recaptchaContainer, {
      'sitekey': this.containerElement.getAttribute('data-sitekey'),
      'size': 'invisible',
      'badge': 'inline',
      'callback': verifyCallback.bind(this)
    });
    grecaptcha.execute(this.recaptchaWidget);
  }

  resetRecaptcha () {
    const grecaptcha = this.window.grecaptcha;
    grecaptcha.reset(this.recaptchaWidget);
    grecaptcha.execute(this.recaptchaWidget);
  }

  getDetailsWithChecksum (checksum) {
    const data = new this.window.FormData();
    data.append('checksum', checksum);
    const request = new this.window.Request('/secret/', {
      method: 'POST',
      body: data,
      mode: 'same-origin'
    });
    return this.window.fetch(request)
      .then((secretResponse) => {
        if (secretResponse.ok) {
          return secretResponse.json()
        }
      })
      .catch((errorResponse) => {
        console.warn(errorResponse);
        this.contentElement.innerHTML = 'An error happened with fetching secret content';
      })
  }
}

function verifyCallback (verifyResponse) {
  const data = new this.window.FormData();
  data.append('g-recaptcha-response', verifyResponse);
  const request = new this.window.Request('/secret/', {
    method: 'POST',
    body: data,
    mode: 'same-origin'
  });
  this.window.fetch(request)
    .then((secretResponse) => {
      if (secretResponse.ok) {
        return secretResponse.json()
      }
    })
    .then((secretResponse) => {
      this.contentElement.innerHTML = secretResponse['content'];
      this.window.localStorage.setItem('secret-stuff-content', secretResponse['checksum']);
      // Clean up
      this.recaptchaButtonElement.removeEventListener('click', this.resetRecaptcha);
      this.containerElement.removeChild(this.recaptchaButtonElement);
    })
    .catch((errorResponse) => {
      console.warn(errorResponse);
      this.contentElement.innerHTML = 'An error happened with getting secret content';
    });
}

module.exports = AntiRobotSnippet;
