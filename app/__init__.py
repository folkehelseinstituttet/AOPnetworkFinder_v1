import os

from flask import Flask
from flask_caching import Cache
from flask_wtf.csrf import CSRFProtect

app = Flask(__name__, template_folder='templates')

# Set the secret key for CSRF protection and session management
###app.config['SECRET_KEY'] = os.environ.get('ENV_VAR_NAME')
app.config['SECRET_KEY'] = 'dummy_key' #TODO: use os.environ.get('env_var_name') instead in production.
app.config['TESTING'] = False
app.config['CACHE_TYPE'] = 'SimpleCache'

#Initialize cache
cache = Cache(app)

# Initialize CSRF protection
csrf = CSRFProtect(app)

from app import route
