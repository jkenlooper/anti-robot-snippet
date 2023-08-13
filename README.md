# Anti-robot Snippet

Include content into a webpage for just the humans that are not robots.

Note that this is mostly a simple demo app and I didn't include some files to
avoid cluttering up the repo.  That being said, it should be easy enough to run
by `pip install -r requirements.txt` and adding your google recaptcha public
and private keys to your env.  See the example *site.cfg* and update as
necessary.

Test files for both the python and javascript code have been included.  The
javascript test code will need it's own compile step which I left out for now.

# Developing

When developing on a local machine it is best to use virtualenv. Get started by
running the below commands in this projects directory.

```bash
virtualenv .;
source bin/activate;
pip install -r api/requirements.txt;
```

Run the example app in the foreground and make sure the
virtual environment is activated.

```bash
source bin/activate;
python src/app.py site.cfg;
```
