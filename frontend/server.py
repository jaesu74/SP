from flask import Flask, send_from_directory, jsonify, request, redirect
from flask_cors import CORS
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# 환경 설정
ENV = os.getenv("REACT_APP_ENV", "production")
API_URL = os.getenv("REACT_APP_API_URL", "http://localhost:8000/api")
BACKEND_URL = os.getenv("REACT_APP_BACKEND_URL", "http://localhost:8000")

# 경로 설정
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_DIR = os.path.join(ROOT_DIR, 'docs')
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')

app = Flask(__name__, static_url_path='/static', static_folder=STATIC_DIR)
CORS(app)

# 로깅 설정
if ENV == "production":
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        handlers=[
            logging.FileHandler(os.path.join(ROOT_DIR, "logs", "frontend.log")),
            logging.StreamHandler()
        ]
    )
    app.logger.info("프론트엔드 서버 시작 (프로덕션 모드)")
else:
    app.logger.info("프론트엔드 서버 시작 (개발 모드)")

# 경로 설정 섹션
# 상위 requirements.txt 참조로 수정
requirements_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'requirements.txt')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    """정적 파일을 제공합니다."""
    if path == "":
        # 기본 인덱스 페이지
        return send_from_directory(DOCS_DIR, 'index.html')
    
    # docs 디렉토리에서 정적 파일 검색
    docs_path = os.path.join(DOCS_DIR, path)
    if os.path.exists(docs_path) and os.path.isfile(docs_path):
        return send_from_directory(DOCS_DIR, path)
    
    # static 디렉토리에서 정적 파일 검색
    static_path = os.path.join(STATIC_DIR, path)
    if os.path.exists(static_path) and os.path.isfile(static_path):
        return send_from_directory(STATIC_DIR, path)
    
    # 파일을 찾을 수 없음
    return "File not found", 404

# API 라우트를 백엔드로 프록시
@app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def api_proxy(path):
    # API 요청을 백엔드 서버로 프록시
    # 개발 환경에서는 테스트 데이터를 반환하고, 프로덕션에서는 실제 백엔드로 리디렉션
    if ENV == "development" and path.startswith("sanctions"):
        return handle_sanctions_api(path, request.method, request.args)
    else:
        return redirect(f'{BACKEND_URL}/api/{path}')

# 개발 환경용 테스트 API 핸들러
def handle_sanctions_api(path, method, args):
    # 제재 검색 API
    if path == "sanctions/search" and method == "GET":
        query = args.get('query', '')
        
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
        sanction_type = args.get('type')
        if sanction_type and sanction_type != 'all':
            data['results'] = [item for item in data['results'] if item['type'] == sanction_type]
            data['count'] = len(data['results'])
        
        # 국가 필터링
        country = args.get('country')
        if country and country != 'all':
            data['results'] = [item for item in data['results'] if item['country'] == country]
            data['count'] = len(data['results'])
        
        # 프로그램 필터링
        program = args.get('program')
        if program and program != 'all':
            data['results'] = [item for item in data['results'] if item['program'] == program]
            data['count'] = len(data['results'])
        
        return jsonify(data)
    
    # 제재 상세 정보 API
    elif path.startswith("sanctions/") and method == "GET":
        # 제재 ID 추출
        sanction_id = path.split("/")[1]
        
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
    
    else:
        # 지원되지 않는 API 경로
        return jsonify({"error": "API endpoint not found"}), 404

if __name__ == '__main__':
    # 개발 환경에서는 디버그 모드로 실행
    port = int(os.getenv("PORT", 5000))
    debug = ENV == "development"
    app.run(host='0.0.0.0', port=port, debug=debug) 