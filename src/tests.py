import unittest
import logging
import json

import httpretty

from app import make_app
from secret import GOOGLE_SITEVERIFY, GOOGLE_RECAPTCHA_RESPONSE

class APITestCase(unittest.TestCase):
    def setUp(self):
        self.debug = True
        self.app = make_app(
            RECAPTCHA_SECRET_KEY='testsecretkey',
            DEBUG = self.debug
        )
        self.app.logger.setLevel(logging.DEBUG if self.debug else logging.CRITICAL)

    def tearDown(self):
        "Cleanup"

class Secret(APITestCase):
    def test_method_unsupported(self):
        "No GET method"
        with self.app.app_context():
            with self.app.test_client() as c:
                rv = c.get('/secret/', follow_redirects=True)
                assert 405 == rv.status_code

    def test_empty_data(self):
        "Sent data should not be empty"
        with self.app.app_context():
            with self.app.test_client() as c:
                data = {}
                rv = c.post('/secret/', follow_redirects=True, data=data)
                if 400 != rv.status_code:
                    self.app.logger.debug(rv)
                    self.app.logger.debug(rv.data)
                assert 400 == rv.status_code

    def test_required_data(self):
        "Must have recaptcha response in data"
        with self.app.app_context():
            with self.app.test_client() as c:
                data = {
                    GOOGLE_RECAPTCHA_RESPONSE: ''
                }
                rv = c.post('/secret/', follow_redirects=True, data=data)
                assert 400 == rv.status_code

    @httpretty.activate
    def test_invalid_recaptcha(self):
        "Reject with invalid recaptcha"
        httpretty.register_uri(httpretty.POST, GOOGLE_SITEVERIFY,
                               body='{"success": false, "error-codes": ["invalid-input-secret"]}',
                               content_type="application/json")
        with self.app.app_context():
            with self.app.test_client() as c:
                data = {
                    GOOGLE_RECAPTCHA_RESPONSE: 'unicornzebramonster'
                }
                rv = c.post('/secret/', follow_redirects=True, data=data)
                assert 200 == rv.status_code
                responseData = json.loads(rv.data)
                assert responseData['siteverify']['success'] == False

    @httpretty.activate
    def test_valid_recaptcha(self):
        "Show secret with valid recaptcha"
        httpretty.register_uri(httpretty.POST, GOOGLE_SITEVERIFY,
                               body='{"success": true, "error-codes": []}',
                               content_type="application/json")
        with self.app.app_context():
            with self.app.test_client() as c:
                data = {
                    GOOGLE_RECAPTCHA_RESPONSE: 'unicornzebramonsterthatisawesome'
                }
                rv = c.post('/secret/', follow_redirects=False, data=data)
                assert 200 == rv.status_code
                responseData = json.loads(rv.data)

                # very valid test, really.
                assert 'not' in responseData['content']
                assert 'robot' in responseData['content']

if __name__ == '__main__':
    unittest.main()
