from flask import Flask, send_from_directory, redirect, url_for
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='public')
CORS(app)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/<path:path>')
def api_proxy(path):
    # API 요청을 백엔드로 프록시합니다 (실제로는 리디렉션)
    return redirect(f'http://localhost:8000/api/{path}')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 