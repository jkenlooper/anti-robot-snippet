from flask.views import MethodView
from flask import render_template, current_app

class PageView(MethodView):
    """
    Simple example
    """

    def get(self):
        public_key = current_app.config.get('RECAPTCHA_PUBLIC_KEY')
        return render_template('index.html', RECAPTCHA_PUBLIC_KEY=public_key)
