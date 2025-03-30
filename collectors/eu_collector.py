#!/usr/bin/env python3
"""
EU 제재 데이터 수집기
European Union 제재 데이터를 수집하고 파싱합니다.
"""

import xml.etree.ElementTree as ET
from typing import Dict, List, Optional

from collectors.base import SanctionsCollector, logger

# EU 제재 데이터 URL
EU_SANCTIONS_URL = "https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw"
EU_SANCTIONS_ALT_URL = "https://data.opensanctions.org/datasets/20250313/eu_fsf/source.xml"


class EUSanctionsCollector(SanctionsCollector):
    """EU 제재 데이터 수집기 클래스"""
    
    def __init__(self):
        super().__init__("EU")
        self._url = EU_SANCTIONS_URL
        self._alt_url = EU_SANCTIONS_ALT_URL
    
    def download_data(self, output_file=None) -> Optional[bytes]:
        """데이터를 다운로드합니다."""
        if output_file is None:
            output_file = "eu_sanctions.xml"
        return super().download_data(self._url)
        
    @property
    def source_url(self) -> str:
        """소스 URL을 반환합니다."""
        return self._url
    
    @property
    def alternate_url(self) -> str:
        """대체 소스 URL을 반환합니다."""
        return self._alt_url
    
    def collect(self) -> bool:
        """EU 제재 데이터를 수집합니다."""
        logger.info("EU 제재 데이터 수집 시작")
        
        # 데이터 다운로드 (기본 URL 시도)
        xml_data = self.download_data("eu_sanctions.xml")
        
        # 기본 URL 실패 시 대체 URL 시도
        if xml_data is None:
            logger.warning("기본 EU 제재 데이터 다운로드 실패, 대체 URL 시도")
            self._url = self.alternate_url
            xml_data = self.download_data("eu_sanctions.xml")
            
        if xml_data is None:
            logger.error("EU 제재 데이터 다운로드 실패")
            return False
        
        try:
            # XML 파싱
            root = ET.fromstring(xml_data)
            
            # 네임스페이스 확인 및 처리
            namespace = None
            if root.tag.startswith('{'):
                namespace = root.tag.split('}')[0][1:]
                ns = {'ns': namespace}
                logger.info(f"네임스페이스 발견: {namespace}")
            else:
                ns = {}
                logger.info("네임스페이스 없음")
            
            # 제재 데이터 추출
            sanctions = []
            
            # sanctionEntity 요소 찾기
            if namespace:
                entities = root.findall('.//ns:sanctionEntity', ns)
            else:
                entities = root.findall('.//sanctionEntity')
                
            logger.info(f"총 {len(entities)}개의 제재 항목 발견")
            
            # 각 제재 항목 처리
            for entity in entities:
                try:
                    # 기본 정보
                    entity_id = entity.get('logicalId')
                    if not entity_id:
                        logger.warning("ID 정보 없음, 건너뜀")
                        continue
                    
                    # 제재 대상 유형 확인
                    if namespace:
                        subject_type_element = entity.find('./ns:subjectType', ns)
                    else:
                        subject_type_element = entity.find('./subjectType')
                        
                    entity_type = "UNKNOWN"
                    is_person = False
                    
                    if subject_type_element is not None:
                        classification_code = subject_type_element.get('classificationCode')
                        if classification_code:
                            is_person = classification_code == "P"  # P는 개인, E는 단체
                            entity_type = "INDIVIDUAL" if is_person else "ENTITY"
                    
                    # 이름 정보 추출
                    name_aliases = []
                    if namespace:
                        name_aliases = entity.findall('./ns:nameAlias', ns)
                    else:
                        name_aliases = entity.findall('./nameAlias')
                    
                    if not name_aliases:
                        logger.warning(f"ID {entity_id}의 이름 정보 없음, 건너뜀")
                        continue
                    
                    # 전체 이름 추출
                    full_name = ""
                    aliases = []
                    
                    for name_alias in name_aliases:
                        # wholeName 속성 확인
                        whole_name = name_alias.get('wholeName')
                        if whole_name and whole_name.strip():
                            if not full_name:  # 첫 번째 발견된 wholeName을 주 이름으로 설정
                                full_name = whole_name.strip()
                            elif whole_name.strip() not in aliases:  # 나머지는 별칭으로 추가
                                aliases.append(whole_name.strip())
                            continue
                        
                        # 개별 이름 요소 조합
                        name_parts = []
                        first_name = name_alias.get('firstName')
                        middle_name = name_alias.get('middleName')
                        last_name = name_alias.get('lastName')
                        
                        if first_name and first_name.strip():
                            name_parts.append(first_name.strip())
                        if middle_name and middle_name.strip():
                            name_parts.append(middle_name.strip())
                        if last_name and last_name.strip():
                            name_parts.append(last_name.strip())
                        
                        combined_name = ' '.join(name_parts).strip()
                        if combined_name:
                            if not full_name:  # 첫 번째 발견된 이름을 주 이름으로 설정
                                full_name = combined_name
                            elif combined_name not in aliases:  # 나머지는 별칭으로 추가
                                aliases.append(combined_name)
                    
                    if not full_name:
                        logger.warning(f"ID {entity_id}의 이름 정보 없음, 건너뜀")
                        continue
                    
                    # 국적 정보
                    nationalities = []
                    if namespace:
                        citizenship_elements = entity.findall('./ns:citizenship', ns)
                    else:
                        citizenship_elements = entity.findall('./citizenship')
                    
                    for citizenship in citizenship_elements:
                        country_code = ""
                        if namespace:
                            country_element = citizenship.find('./ns:countryIso2Code', ns) or citizenship.find('./ns:country/ns:code', ns)
                        else:
                            country_element = citizenship.get('countryIso2Code') or citizenship.find('./country/code')
                        
                        if country_element is not None:
                            if hasattr(country_element, 'text') and country_element.text:
                                country_code = country_element.text.strip()
                            elif hasattr(country_element, 'strip'):
                                country_code = country_element.strip()
                        
                        if country_code and country_code != "00" and country_code not in nationalities:
                            nationalities.append(country_code)
                    
                    # 생년월일 정보
                    birth_date = ""
                    if namespace:
                        birthdate_elements = entity.findall('./ns:birthdate', ns)
                    else:
                        birthdate_elements = entity.findall('./birthdate')
                    
                    for birthdate in birthdate_elements:
                        date_str = ""
                        
                        # 전체 날짜
                        date_attr = birthdate.get('birthdate')
                        if date_attr and date_attr.strip() and date_attr != "0000-00-00":
                            date_str = date_attr.strip()
                        else:
                            # 개별 요소
                            year = birthdate.get('year')
                            month = birthdate.get('monthOfYear')
                            day = birthdate.get('dayOfMonth')
                            
                            if year and int(year) > 0:
                                date_parts = [year]
                                if month and int(month) > 0:
                                    date_parts.append(month.zfill(2))
                                    if day and int(day) > 0:
                                        date_parts.append(day.zfill(2))
                                
                                date_str = '-'.join(date_parts)
                        
                        if date_str and not birth_date:
                            birth_date = date_str
                            break
                    
                    # 주소 정보
                    addresses = []
                    if namespace:
                        address_elements = entity.findall('./ns:address', ns)
                    else:
                        address_elements = entity.findall('./address')
                    
                    for address in address_elements:
                        addr_parts = []
                        
                        # 주요 주소 요소 확인
                        addr_elements = ['street', 'poBox', 'city', 'zipCode', 'region']
                        for elem_name in addr_elements:
                            if namespace:
                                elem = address.find(f'./ns:{elem_name}', ns)
                            else:
                                elem = address.find(f'./{elem_name}')
                            
                            if elem is not None and elem.text and elem.text.strip():
                                addr_parts.append(elem.text.strip())
                        
                        # 국가 정보
                        country_code = ""
                        if namespace:
                            country_elem = address.find('./ns:countryIso2Code', ns) or address.find('./ns:country/ns:code', ns)
                        else:
                            country_elem = address.get('countryIso2Code') or address.find('./country/code')
                        
                        if country_elem is not None:
                            if hasattr(country_elem, 'text') and country_elem.text:
                                country_code = country_elem.text.strip()
                            elif hasattr(country_elem, 'strip'):
                                country_code = country_elem.strip()
                        
                        if country_code and country_code != "00":
                            addr_parts.append(country_code)
                        
                        if addr_parts:
                            addresses.append(', '.join(addr_parts))
                    
                    # 제재 프로그램 정보
                    programs = []
                    if namespace:
                        regulation_elements = entity.findall('./ns:regulation', ns)
                    else:
                        regulation_elements = entity.findall('./regulation')
                    
                    for regulation in regulation_elements:
                        if regulation is not None:
                            reg_name = ""
                            if namespace:
                                name_elem = regulation.find('./ns:regulationSummary', ns)
                            else:
                                name_elem = regulation.find('./regulationSummary')
                            
                            if name_elem is not None and name_elem.text:
                                reg_name = name_elem.text.strip()
                                if reg_name and reg_name not in programs:
                                    programs.append(reg_name)
                    
                    # 통합 형식으로 변환
                    sanction = {
                        "id": f"EU-{entity_id}",
                        "name": full_name,
                        "type": entity_type,
                        "country": nationalities[0] if nationalities else "",
                        "programs": programs,
                        "source": "EU",
                        "matchScore": 100,
                        "details": {
                            "aliases": aliases,
                            "birthDate": birth_date,
                            "sanctions": [{"program": prog, "startDate": "", "reason": ""} for prog in programs],
                            "addresses": addresses,
                            "nationalities": nationalities,
                            "identifications": []
                        }
                    }
                    
                    sanctions.append(sanction)
                    
                except Exception as e:
                    logger.warning(f"유효하지 않은 EU 제재 데이터: {str(e)}")
                    continue
            
            # JSON으로 저장
            if sanctions:
                return self.save_data(sanctions)
            else:
                logger.error("EU 제재 데이터 없음")
                return False
                
        except Exception as e:
            logger.error(f"EU 제재 데이터 파싱 실패: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return False 