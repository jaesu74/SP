from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# 환경 설정
ENV = os.getenv("REACT_APP_ENV", "production")
API_URL = os.getenv("REACT_APP_API_URL", "http://localhost:3001/api")

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)

# 로깅 설정
if ENV == "production":
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        handlers=[
            logging.FileHandler("frontend.log"),
            logging.StreamHandler()
        ]
    )
    app.logger.info("프론트엔드 서버 시작 (프로덕션 모드)")
else:
    app.logger.info("프론트엔드 서버 시작 (개발 모드)")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(path):
        return send_from_directory('.', path)
    else:
        return send_from_directory('.', 'index.html')

# API 라우트
@app.route('/api/users/register', methods=['POST'])
def register():
    # 클라이언트 측 처리로 인해 실제로 사용되지 않음
    return jsonify({"message": "Registration successful"})

@app.route('/api/users/login', methods=['POST'])
def login():
    # 클라이언트 측 처리로 인해 실제로 사용되지 않음
    return jsonify({
        "access_token": "mock_token_123",
        "token_type": "bearer"
    })

@app.route('/api/sanctions/search', methods=['GET'])
def search_sanctions():
    # 테스트 데이터 반환 (app.js에서도 동일한 데이터 사용)
    query = request.args.get('query', '')
    
    # 테스트 데이터
    data = {
        "count": 5,
        "results": [
            {
                "id": "UN-DPRK-1",
                "name": "Kim Jong Un",
                "type": "Individual",
                "country": "North Korea",
                "reason": "UN 안전보장이사회 결의안 위반",
                "source": "UN",
                "program": "DPRK",
                "date_listed": "2023-01-15"
            },
            {
                "id": "OFAC-RUS-1",
                "name": "Acme Corporation",
                "type": "Entity",
                "country": "Russia",
                "reason": "국제 무역 규제 위반",
                "source": "OFAC",
                "program": "RUSSIA",
                "date_listed": "2022-03-08"
            },
            {
                "id": "EU-SYR-1",
                "name": "Mohammad Al-Assad",
                "type": "Individual",
                "country": "Syria",
                "reason": "인권 침해",
                "source": "EU",
                "program": "SYRIA",
                "date_listed": "2022-07-22"
            },
            {
                "id": "UN-IRAN-1",
                "name": "Tehran Trading Ltd",
                "type": "Entity",
                "country": "Iran",
                "reason": "핵 개발 프로그램 자금 지원",
                "source": "UN",
                "program": "IRAN",
                "date_listed": "2021-11-30"
            },
            {
                "id": "UK-BLR-1",
                "name": "Alexander Lukashenko",
                "type": "Individual",
                "country": "Belarus",
                "reason": "인권 침해 및 선거 조작",
                "source": "UK",
                "program": "BELARUS",
                "date_listed": "2022-12-05"
            }
        ]
    }
    
    # 쿼리 필터링
    if query:
        query = query.lower()
        data['results'] = [item for item in data['results'] if query in item['name'].lower()]
        data['count'] = len(data['results'])
    
    # 검색 타입 필터링
    sanction_type = request.args.get('type')
    if sanction_type and sanction_type != 'all':
        data['results'] = [item for item in data['results'] if item['type'] == sanction_type]
        data['count'] = len(data['results'])
    
    # 국가 필터링
    country = request.args.get('country')
    if country and country != 'all':
        data['results'] = [item for item in data['results'] if item['country'] == country]
        data['count'] = len(data['results'])
    
    # 프로그램 필터링
    program = request.args.get('program')
    if program and program != 'all':
        data['results'] = [item for item in data['results'] if item['program'] == program]
        data['count'] = len(data['results'])
    
    return jsonify(data)

@app.route('/api/sanctions/<sanction_id>', methods=['GET'])
def get_sanction(sanction_id):
    # 테스트 데이터
    test_data = {
        "UN-DPRK-1": {
            "id": "UN-DPRK-1",
            "name": "Kim Jong Un",
            "type": "Individual",
            "country": "North Korea",
            "reason": "UN 안전보장이사회 결의안 위반",
            "source": "UN",
            "program": "DPRK",
            "date_listed": "2023-01-15"
        },
        "OFAC-RUS-1": {
            "id": "OFAC-RUS-1",
            "name": "Acme Corporation",
            "type": "Entity",
            "country": "Russia",
            "reason": "국제 무역 규제 위반",
            "source": "OFAC",
            "program": "RUSSIA",
            "date_listed": "2022-03-08"
        },
        "EU-SYR-1": {
            "id": "EU-SYR-1",
            "name": "Mohammad Al-Assad",
            "type": "Individual",
            "country": "Syria",
            "reason": "인권 침해",
            "source": "EU",
            "program": "SYRIA",
            "date_listed": "2022-07-22"
        },
        "UN-IRAN-1": {
            "id": "UN-IRAN-1",
            "name": "Tehran Trading Ltd",
            "type": "Entity",
            "country": "Iran",
            "reason": "핵 개발 프로그램 자금 지원",
            "source": "UN",
            "program": "IRAN",
            "date_listed": "2021-11-30"
        },
        "UK-BLR-1": {
            "id": "UK-BLR-1",
            "name": "Alexander Lukashenko",
            "type": "Individual",
            "country": "Belarus",
            "reason": "인권 침해 및 선거 조작",
            "source": "UK",
            "program": "BELARUS",
            "date_listed": "2022-12-05"
        }
    }
    
    if sanction_id in test_data:
        return jsonify(test_data[sanction_id])
    else:
        return jsonify({"error": "Sanction not found"}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 