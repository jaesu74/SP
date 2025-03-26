#!/usr/bin/env python3
"""
미국 OFAC 제재 데이터 수집기
"""

import os
import json
import logging
import requests
import time
from typing import Dict, List, Optional
from datetime import datetime

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("us_sanctions_collector.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("us_sanctions_collector")

# OFAC 제재 데이터 URL
OFAC_SDN_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml"
OFAC_CONSOLIDATED_URL = "https://www.treasury.gov/ofac/downloads/consolidated/consolidated.xml"
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds
OUTPUT_DIR = 'data'
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'us_sanctions.json')

def download_ofac_sanctions(url: str) -> Optional[bytes]:
    """OFAC 제재 데이터를 다운로드합니다."""
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(
                url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/xml,text/xml,*/*',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout=30
            )
            response.raise_for_status()
            
            # 응답이 XML인지 확인
            content_type = response.headers.get('Content-Type', '').lower()
            if 'xml' not in content_type:
                logger.warning(f"예상치 못한 Content-Type: {content_type}")
            
            # XML 파일 저장 (디버깅용)
            filename = 'ofac_sdn.xml' if 'sdn.xml' in url else 'ofac_consolidated.xml'
            with open(filename, 'wb') as f:
                f.write(response.content)
            logger.info(f"OFAC 제재 데이터 XML 파일 저장 완료: {filename}")
            
            return response.content
        except requests.exceptions.RequestException as e:
            logger.error(f"다운로드 시도 {attempt + 1}/{MAX_RETRIES} 실패: {str(e)}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
            continue
    return None

def parse_ofac_sanctions(xml_data: bytes) -> List[Dict]:
    """OFAC 제재 데이터를 파싱합니다."""
    try:
        import xml.etree.ElementTree as ET
        
        # XML 파싱
        # 네임스페이스 처리
        ns = {'ofac': 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/XML'}
        
        # XML 파싱
        tree = ET.fromstring(xml_data)
        
        # 총 엔트리 수 확인
        publish_info = tree.find('.//ofac:publshInformation', ns)
        if publish_info is not None:
            record_count = publish_info.find('.//ofac:Record_Count', ns)
            if record_count is not None and record_count.text:
                logger.info(f"총 레코드 수: {record_count.text}")
        
        # 제재 데이터 추출
        sanctions = []
        
        # SDN 항목 처리
        for sdn_entry in tree.findall('.//ofac:sdnEntry', ns):
            try:
                # 기본 정보
                uid = sdn_entry.find('ofac:uid', ns)
                uid_value = uid.text if uid is not None else "UNKNOWN"
                
                # 단체명/성
                last_name = sdn_entry.find('ofac:lastName', ns)
                last_name_value = last_name.text.strip() if last_name is not None and last_name.text else ""
                
                # 개인명/이름
                first_name = sdn_entry.find('ofac:firstName', ns)
                first_name_value = first_name.text.strip() if first_name is not None and first_name.text else ""
                
                # 유형 결정
                sdn_type = sdn_entry.find('ofac:sdnType', ns)
                sdn_type_value = sdn_type.text.strip() if sdn_type is not None and sdn_type.text else "UNKNOWN"
                
                # 최종 이름 설정
                if sdn_type_value == "Individual":
                    full_name = f"{first_name_value} {last_name_value}".strip()
                else:
                    full_name = last_name_value
                
                if not full_name:
                    logger.warning(f"ID {uid_value}의 이름 정보 없음, 건너뜀")
                    continue
                
                # 프로그램 정보
                programs = []
                program_list = sdn_entry.find('ofac:programList', ns)
                if program_list is not None:
                    for program in program_list.findall('ofac:program', ns):
                        if program is not None and program.text:
                            programs.append(program.text.strip())
                
                # 별칭 정보
                aliases = []
                aka_list = sdn_entry.find('ofac:akaList', ns)
                if aka_list is not None:
                    for aka in aka_list.findall('ofac:aka', ns):
                        aka_name = aka.find('ofac:lastName', ns)
                        if aka_name is not None and aka_name.text:
                            aliases.append(aka_name.text.strip())
                
                # 주소 정보
                addresses = []
                address_list = sdn_entry.find('ofac:addressList', ns)
                if address_list is not None:
                    for address in address_list.findall('ofac:address', ns):
                        addr_parts = []
                        
                        for field in ['address1', 'address2', 'address3', 'city', 'stateOrProvince', 'postalCode', 'country']:
                            value = address.find(f'ofac:{field}', ns)
                            if value is not None and value.text:
                                addr_parts.append(value.text.strip())
                        
                        if addr_parts:
                            addresses.append(', '.join(addr_parts))
                
                # 국적 정보
                nationalities = []
                nationality_list = sdn_entry.find('ofac:nationalityList', ns)
                if nationality_list is not None:
                    for nationality in nationality_list.findall('ofac:nationality', ns):
                        country = nationality.find('ofac:country', ns)
                        if country is not None and country.text:
                            nationalities.append(country.text.strip())
                
                # ID 문서 정보
                identifications = []
                id_list = sdn_entry.find('ofac:idList', ns)
                if id_list is not None:
                    for id_doc in id_list.findall('ofac:id', ns):
                        id_type = id_doc.find('ofac:idType', ns)
                        id_number = id_doc.find('ofac:idNumber', ns)
                        id_country = id_doc.find('ofac:idCountry', ns)
                        
                        if id_type is not None and id_type.text and id_number is not None and id_number.text:
                            identification = {
                                "type": id_type.text.strip(),
                                "number": id_number.text.strip(),
                                "country": id_country.text.strip() if id_country is not None and id_country.text else ""
                            }
                            identifications.append(identification)
                
                # 생년월일 정보
                birth_date = ""
                dob_list = sdn_entry.find('ofac:dateOfBirthList', ns)
                if dob_list is not None:
                    for dob_item in dob_list.findall('ofac:dateOfBirthItem', ns):
                        dob = dob_item.find('ofac:dateOfBirth', ns)
                        if dob is not None and dob.text:
                            birth_date = dob.text.strip()
                            break
                
                # 통합 형식으로 변환
                sanction = {
                    "id": f"OFAC-{uid_value}",
                    "name": full_name,
                    "type": sdn_type_value,
                    "country": nationalities[0] if nationalities else "",
                    "programs": programs,
                    "source": "US-OFAC",
                    "matchScore": 100,
                    "details": {
                        "aliases": aliases,
                        "birthDate": birth_date,
                        "sanctions": [{"program": prog, "startDate": "", "reason": ""} for prog in programs],
                        "addresses": addresses,
                        "nationalities": nationalities,
                        "identifications": identifications
                    }
                }
                
                sanctions.append(sanction)
                logger.debug(f"제재 데이터 파싱 성공: {sanction['name']}")
                
            except Exception as e:
                logger.warning(f"유효하지 않은 제재 데이터: {str(e)}")
                continue
        
        logger.info(f"총 {len(sanctions)}개의 제재 데이터 파싱 완료")
        return sanctions
        
    except Exception as e:
        logger.error(f"OFAC 제재 데이터 파싱 실패: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return []

def save_to_json(sanctions: List[Dict]) -> bool:
    """제재 데이터를 JSON 파일로 저장합니다."""
    try:
        # 데이터 디렉토리 생성
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        # JSON 파일 저장
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(sanctions, f, ensure_ascii=False, indent=2)
        
        logger.info(f"OFAC 제재 데이터 저장 완료: {len(sanctions)}개 항목")
        return True
    except Exception as e:
        logger.error(f"OFAC 제재 데이터 저장 실패: {str(e)}")
        return False

def main():
    """메인 함수"""
    logger.info("OFAC 제재 데이터 수집 시작")
    
    # SDN 데이터 다운로드
    xml_data = download_ofac_sanctions(OFAC_SDN_URL)
    if xml_data is None:
        logger.error("OFAC SDN 제재 데이터 다운로드 실패")
        return
    
    # 데이터 파싱
    sanctions = parse_ofac_sanctions(xml_data)
    if not sanctions:
        logger.error("OFAC 제재 데이터 파싱 실패")
        return
    
    # 데이터 저장
    if save_to_json(sanctions):
        logger.info("OFAC 제재 데이터 수집 완료")
    else:
        logger.error("OFAC 제재 데이터 저장 실패")

if __name__ == "__main__":
    main() 