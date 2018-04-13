from hashlib import md5
import base64

import requests
from flask import json, request, redirect, current_app, abort, url_for
from flask.views import MethodView

encoder = json.JSONEncoder(indent=2, sort_keys=True)

GOOGLE_SITEVERIFY = 'https://www.google.com/recaptcha/api/siteverify'
GOOGLE_RECAPTCHA_RESPONSE = 'g-recaptcha-response'

class SecretView(MethodView):
    """
    Handle secret content requests
    """
    def post(self):
        secret_key = current_app.config.get('RECAPTCHA_SECRET_KEY')
        args = {}
        xhr_data = request.get_json()
        if xhr_data:
            args.update(xhr_data)
        args.update(request.form.to_dict(flat=True))
        args.update(request.args.to_dict(flat=True))

        if len(args.keys()) == 0:
            abort(400)

        if not (args.get(GOOGLE_RECAPTCHA_RESPONSE) or args.get('checksum')):
            # User may have javascript fail or be disabled.
            abort(400)

        processed = {}
        if args.get(GOOGLE_RECAPTCHA_RESPONSE):
            params = {
                'secret': secret_key,
                'response': args.get(GOOGLE_RECAPTCHA_RESPONSE)
            }
            r = requests.post(GOOGLE_SITEVERIFY, params=params)
            if r.json().get('success'):
                processed = {
                    "siteverify": r.json(),
                    "args": args
                }
                processed.update(self.getSecretContent())
            else:
                processed = {
                    "siteverify": r.json(),
                    "args": args
                }

        elif args.get('checksum'):
            processed.update(self.getSecretContent(args.get('checksum')))

        return encoder.encode(processed)

    def getSecretContent(self, checksum=None):

        # For the example just inline it, but the content could come from a request or something.
        text = base64.b64decode("""
PGgyPkNvbmdyYXR1bGF0aW9ucyE8L2gyPjxwPjxlbT48c3Ryb25nPllvdTwvc3Ryb25nPiBkb24ndCBzZWVtIHRvIGJlIGEgcm9ib3QuPC9lbT4gQnV0LCB0aGVuIGFnYWluLCB0aGlzIGhhcyBiZWVuIGRldGVybWluZWQgYnkgYW5vdGhlciByb2JvdC4gSWYgeW91IGFyZSBzdGlsbCB1bmNsZWFyIGlmIHlvdSBhcmUgYSByb2JvdCBvciBub3Q7IHlvdSBzaG91bGQgZ28gYXNrIHlvdXIgbW90aGVyLjwvcD4=
        """.replace(' ', ''))
        result = {
            'ok': True
        }
        result['checksum'] = md5(text.encode('utf-8')).hexdigest()
        if not checksum or checksum == result['checksum']:
            result['content'] = text


        return result
