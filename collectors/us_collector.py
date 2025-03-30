#!/usr/bin/env python3
"""
US OFAC 제재 데이터 수집기
미국 재무부의 해외자산통제국(OFAC) 제재 데이터를 수집하고 파싱합니다.
"""

import xml.etree.ElementTree as ET
from typing import Dict, List, Optional

from collectors.base import SanctionsCollector, logger

# US OFAC 제재 데이터 URL
US_SANCTIONS_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml"


class USSanctionsCollector(SanctionsCollector):
    """US OFAC 제재 데이터 수집기 클래스"""
    
    def __init__(self):
        super().__init__("US")
        self._url = US_SANCTIONS_URL
    
    def download_data(self, output_file=None) -> Optional[bytes]:
        """데이터를 다운로드합니다."""
        if output_file is None:
            output_file = "us_sanctions.xml"
        return super().download_data(self._url)
    
    @property
    def source_url(self) -> str:
        """소스 URL을 반환합니다."""
        return self._url
    
    def collect(self) -> bool:
        """US OFAC 제재 데이터를 수집합니다."""
        logger.info("US OFAC 제재 데이터 수집 시작")
        
        # 데이터 다운로드
        xml_data = self.download_data("us_sanctions.xml")
        if xml_data is None:
            logger.error("US OFAC 제재 데이터 다운로드 실패")
            return False
        
        try:
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
                    
                except Exception as e:
                    logger.warning(f"유효하지 않은 US OFAC 제재 데이터: {str(e)}")
                    continue
            
            # JSON으로 저장
            if sanctions:
                return self.save_data(sanctions)
            else:
                logger.error("US OFAC 제재 데이터 없음")
                return False
                
        except Exception as e:
            logger.error(f"US OFAC 제재 데이터 파싱 실패: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return False 