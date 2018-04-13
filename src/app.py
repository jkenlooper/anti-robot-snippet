import os
import sys

from flask import Flask

class API(Flask):
    "API App"

def make_app(config=None, **kw):
    app = API('api')

    if config:
        config_file = config if config[0] == os.sep else os.path.join(os.getcwd(), config)
        app.config.from_pyfile(config_file)

    app.config.update(kw)

    # Import the views
    from page import PageView
    from secret import SecretView

    # Register the views
    app.add_url_rule('/', view_func=PageView.as_view('index'))
    app.add_url_rule('/secret/', view_func=SecretView.as_view('secret'))

    return app

def main():
    from gevent import pywsgi
    config_file = sys.argv[1]
    app = make_app(config=config_file)
    app.debug = app.config.get('DEBUG')
    host = app.config.get('HOST') or '127.0.0.1'
    port = app.config.get('PORT') or 5000

    if app.debug:
        app.run(
            host=host,
            port=port,
            use_reloader=True,
            )
    else:
        server = pywsgi.WSGIServer((host, port), app)
        server.serve_forever(stop_timeout=10)

if __name__ == "__main__":
    main()
