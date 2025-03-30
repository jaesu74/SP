#!/usr/bin/env python3
"""
split_data.py - 대용량 제재 데이터 파일 분할 유틸리티

UN, EU, US 제재 데이터 파일을 3MB 이하의 청크로 분할하고
분할된 파일에 대한 색인 정보를 생성합니다.
"""

import os
import json
import math
import datetime
import argparse
from pathlib import Path

# 설정
CHUNK_SIZE = 3 * 1024 * 1024  # 3MB
DATA_SOURCES = ['un', 'eu', 'us']
BASE_DIR = Path(__file__).parent.parent.parent.parent  # 프로젝트 루트 디렉토리
DATA_DIR = BASE_DIR / 'data'
SPLIT_DIR = DATA_DIR / 'split'


def ensure_directory(dir_path):
    """디렉토리가 존재하는지 확인하고, 없으면 생성합니다."""
    os.makedirs(dir_path, exist_ok=True)
    print(f"디렉토리 확인: {dir_path}")


def load_json_file(file_path):
    """JSON 파일을 로드합니다."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"파일을 찾을 수 없습니다: {file_path}")
        return None
    except json.JSONDecodeError:
        print(f"JSON 형식이 아닙니다: {file_path}")
        return None
    except Exception as e:
        print(f"파일 로드 오류 ({file_path}): {e}")
        return None


def save_json_file(file_path, data):
    """JSON 파일을 저장합니다."""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"파일 저장: {file_path}")
        return True
    except Exception as e:
        print(f"파일 저장 오류 ({file_path}): {e}")
        return False


def get_json_size(data):
    """JSON 데이터의 바이트 크기를 반환합니다."""
    return len(json.dumps(data, ensure_ascii=False).encode('utf-8'))


def split_sanctions_data(sources=None):
    """데이터 파일을 분할합니다."""
    print('대용량 데이터 파일 분할 시작...')
    
    # 분할 디렉토리 확인 또는 생성
    ensure_directory(SPLIT_DIR)
    
    # 처리할 데이터 소스 결정
    if sources is None:
        sources = DATA_SOURCES
    elif isinstance(sources, str):
        sources = [sources]
    
    # 각 데이터 소스별 분할 처리
    for source in sources:
        try:
            print(f"{source} 제재 데이터 분할 처리 중...")
            
            # 원본 데이터 로드
            source_file = DATA_DIR / f"{source}_sanctions.json"
            data = load_json_file(source_file)
            
            if not data:
                print(f"{source_file} 파일을 찾을 수 없습니다.")
                continue
            
            # 데이터 구조 확인
            sanctions_data = []
            
            # 데이터 구조에 따라 처리
            if isinstance(data, dict) and 'data' in data and isinstance(data['data'], list):
                # UN 형식
                sanctions_data = data['data']
                metadata = data.get('meta', {})
            elif isinstance(data, list):
                # EU, US 형식
                sanctions_data = data
                metadata = {
                    "lastUpdated": datetime.datetime.now().isoformat(),
                    "source": source.upper(),
                    "totalEntries": len(sanctions_data),
                    "version": "1.0"
                }
            else:
                print(f"{source_file} 파일의 구조를 인식할 수 없습니다.")
                continue
            
            # 데이터 정규화 - 불필요한 중첩 구조 제거
            normalized_data = normalize_data(sanctions_data, source)
            
            # 생성할 분할 파일의 수 계산
            total_items = len(normalized_data)
            
            # 각 항목의 평균 크기 계산
            if total_items > 0:
                sample_size = min(100, total_items)  # 100개 항목 샘플링
                sample_data = normalized_data[:sample_size]
                avg_item_size = get_json_size(sample_data) / sample_size
                
                # 청크당 항목 수 추정
                items_per_chunk = max(1, math.floor((CHUNK_SIZE * 0.9) / avg_item_size))  # 10% 마진
                total_chunks = math.ceil(total_items / items_per_chunk)
            else:
                items_per_chunk = 1
                total_chunks = 0
            
            print(f"{source} 데이터: {total_items}개 항목, {total_chunks}개 파일로 분할")
            
            # 색인 정보
            index = {
                "source": source.upper(),
                "totalItems": total_items,
                "totalChunks": total_chunks,
                "lastUpdated": metadata.get("lastUpdated", datetime.datetime.now().isoformat()),
                "chunks": []
            }
            
            # 데이터 분할 처리
            for i in range(total_chunks):
                start = i * items_per_chunk
                end = min(start + items_per_chunk, total_items)
                chunk_data = normalized_data[start:end]
                
                # 청크 메타데이터
                chunk_metadata = {
                    "chunkIndex": i,
                    "totalChunks": total_chunks,
                    "itemCount": len(chunk_data),
                    "startIndex": start,
                    "endIndex": end - 1,
                    "source": source.upper(),
                    "lastUpdated": metadata.get("lastUpdated", datetime.datetime.now().isoformat()),
                    "version": metadata.get("version", "1.0")
                }
                
                # 분할 파일 생성
                chunk_filename = f"{source}_sanctions_{i + 1}.json"
                chunk_content = {
                    "meta": chunk_metadata,
                    "data": chunk_data
                }
                
                # 파일 저장
                chunk_file_path = SPLIT_DIR / chunk_filename
                save_json_file(chunk_file_path, chunk_content)
                
                # 색인 정보 업데이트
                index["chunks"].append({
                    "filename": chunk_filename,
                    "itemCount": len(chunk_data),
                    "startIndex": start,
                    "endIndex": end - 1
                })
                
                print(f"{chunk_filename} 파일 생성 완료 ({start+1}~{end}번 항목)")
            
            # 색인 파일 저장
            index_file_path = SPLIT_DIR / f"{source}_index.json"
            save_json_file(index_file_path, index)
            print(f"{source} 제재 데이터 색인 파일 생성 완료")
            
        except Exception as e:
            print(f"{source} 데이터 분할 처리 중 오류 발생: {e}")
    
    print('모든 데이터 파일 분할 완료')


def normalize_data(data, source):
    """데이터를 정규화하고 불필요한 중첩 구조를 제거합니다."""
    normalized = []
    
    for item in data:
        # 공통 필드
        normalized_item = {
            "id": item.get('id', f"{source.upper()}_UNKNOWN"),
            "name": get_name(item),
            "type": get_entity_type(item, source),
            "country": get_country(item, source),
            "program": ", ".join(item.get('programs', [])),
            "reason": get_description(item, source),
            "source": source.upper(),
            "date_listed": get_sanction_date(item, source),
            "aliases": get_aliases(item, source),
            "addresses": get_addresses(item, source),
            "birth_date": get_birth_date(item, source),
            "identifications": get_identifications(item, source)
        }
        
        normalized.append(normalized_item)
    
    return normalized


def get_name(item):
    """제재 대상의 이름을 반환합니다."""
    if not item:
        return ""
    
    name = item.get('name', "")
    
    # 이름이 없는 경우 'details' 내의 'name' 찾기 시도
    if not name and 'details' in item:
        name = item['details'].get('name', "")
    
    return name


def get_entity_type(item, source):
    """제재 대상의 유형을 반환합니다."""
    if not item:
        return "UNKNOWN"
    
    entity_type = item.get('type', "UNKNOWN")
    
    # 유형을 표준화
    if entity_type.upper() in ["INDIVIDUAL", "PERSON", "P"]:
        return "Individual"
    elif entity_type.upper() in ["ENTITY", "ORGANIZATION", "COMPANY", "E"]:
        return "Entity"
    else:
        return "Unknown"


def get_country(item, source):
    """제재 대상의 국가를 반환합니다."""
    if not item:
        return ""
    
    country = item.get('country', "")
    
    # 국가가 없는 경우 'details' 내의 'nationalities' 찾기 시도
    if not country and 'details' in item:
        nationalities = item['details'].get('nationalities', [])
        if nationalities and len(nationalities) > 0:
            country = nationalities[0]
    
    return country


def get_aliases(item, source):
    """제재 대상의 별칭 목록을 반환합니다."""
    if not item or 'details' not in item:
        return []
    
    return item['details'].get('aliases', [])


def get_addresses(item, source):
    """제재 대상의 주소 목록을 반환합니다."""
    if not item or 'details' not in item:
        return []
    
    return item['details'].get('addresses', [])


def get_identifications(item, source):
    """제재 대상의 신분증 정보를 반환합니다."""
    if not item or 'details' not in item:
        return []
    
    ids = item['details'].get('identifications', [])
    
    # 포맷 표준화
    normalized_ids = []
    for id_info in ids:
        if isinstance(id_info, dict):
            id_type = id_info.get('type', "")
            id_number = id_info.get('number', "")
            if id_type and id_number:
                normalized_ids.append(f"{id_type}: {id_number}")
    
    return normalized_ids


def get_birth_date(item, source):
    """제재 대상의 생년월일을 반환합니다."""
    if not item:
        return ""
    
    birth_date = ""
    
    # 'details' 내의 'birthDate' 찾기 시도
    if 'details' in item:
        birth_date = item['details'].get('birthDate', "")
    
    # 없으면 다른 필드 찾기 시도
    if not birth_date:
        birth_date = item.get('birthDate', item.get('birth_date', ""))
    
    return birth_date


def get_description(item, source):
    """제재 대상의 설명 또는 제재 사유를 반환합니다."""
    if not item:
        return ""
    
    description = item.get('reason', item.get('description', ""))
    
    # 없으면 'details' 내의 'sanctions' 정보 사용
    if not description and 'details' in item and 'sanctions' in item['details']:
        sanctions = item['details']['sanctions']
        if sanctions and len(sanctions) > 0:
            reasons = [s.get('reason', "") for s in sanctions if s.get('reason')]
            description = "; ".join(filter(None, reasons))
    
    return description


def get_sanction_date(item, source):
    """제재 등록 날짜를 반환합니다."""
    if not item:
        return ""
    
    date_listed = ""
    
    # 'details' 내의 'sanctions' 날짜 정보 찾기 시도
    if 'details' in item and 'sanctions' in item['details']:
        sanctions = item['details']['sanctions']
        if sanctions and len(sanctions) > 0:
            dates = [s.get('startDate', "") for s in sanctions if s.get('startDate')]
            if dates:
                date_listed = min(dates)
    
    # 없으면 기타 필드 찾기 시도
    if not date_listed:
        date_listed = item.get('date_listed', item.get('dateListed', ""))
    
    return date_listed


def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description='대용량 제재 데이터 파일 분할 유틸리티')
    parser.add_argument('--sources', type=str, nargs='+', help='처리할 데이터 소스 (un, eu, us)')
    args = parser.parse_args()
    
    sources = args.sources if args.sources else None
    split_sanctions_data(sources)


if __name__ == "__main__":
    main() 