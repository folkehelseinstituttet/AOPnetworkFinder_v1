import os

from app import app

if __name__ == '__main__':
    app.run(debug=os.environ.get('FLASK_DEBUG', False))
