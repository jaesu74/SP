#!/usr/bin/env python3
"""
UN 제재 데이터 수집기
"""

import xml.etree.ElementTree as ET
from typing import Dict, List, Optional

from collectors.base import SanctionsCollector, logger

# UN 제재 데이터 URL
UN_SANCTIONS_URL = "https://scsanctions.un.org/resources/xml/en/consolidated.xml"

class UNSanctionsCollector(SanctionsCollector):
    """UN 제재 데이터 수집기 클래스"""
    
    def __init__(self):
        super().__init__("UN")
    
    def collect(self) -> bool:
        """UN 제재 데이터를 수집합니다."""
        logger.info("UN 제재 데이터 수집 시작")
        
        # 데이터 다운로드
        xml_data = self.download_data(UN_SANCTIONS_URL)
        if xml_data is None:
            logger.error("UN 제재 데이터 다운로드 실패")
            return False
        
        try:
            # XML 파싱
            tree = ET.fromstring(xml_data)
            
            # 네임스페이스 처리
            namespaces = {'': tree.tag.split('}')[0][1:]} if '}' in tree.tag else {}
            logger.info("네임스페이스 처리 완료")
            
            # 제재 데이터 추출
            sanctions = []
            
            # 개인 제재 데이터 파싱
            sanctions.extend(self._parse_individuals(tree, namespaces))
            
            # 기업 제재 데이터 파싱
            sanctions.extend(self._parse_entities(tree, namespaces))
            
            # JSON으로 저장
            if sanctions:
                return self.save_data(sanctions)
            else:
                logger.error("UN 제재 데이터 없음")
                return False
                
        except Exception as e:
            logger.error(f"UN 제재 데이터 파싱 실패: {str(e)}")
            return False
    
    def _parse_individuals(self, tree, namespaces) -> List[Dict]:
        """개인 제재 데이터를 파싱합니다."""
        individuals = []
        
        for individual in tree.findall('.//INDIVIDUAL', namespaces):
            try:
                # 기본 정보
                dataid = individual.find('DATAID', namespaces)
                dataid_value = dataid.text if dataid is not None else "UNKNOWN"
                
                # 이름 정보
                first_name = individual.find('.//FIRST_NAME', namespaces)
                second_name = individual.find('.//SECOND_NAME', namespaces)
                third_name = individual.find('.//THIRD_NAME', namespaces)
                
                # 이름 조합
                name_parts = []
                if first_name is not None and first_name.text:
                    name_parts.append(first_name.text)
                if second_name is not None and second_name.text:
                    name_parts.append(second_name.text)
                if third_name is not None and third_name.text:
                    name_parts.append(third_name.text)
                
                full_name = ' '.join(name_parts).strip()
                if not full_name:
                    logger.warning(f"ID {dataid_value}의 이름 정보 없음, 건너뜀")
                    continue
                
                # UN 리스트 타입
                un_list_type = individual.find('.//UN_LIST_TYPE', namespaces)
                un_list_type_value = un_list_type.text if un_list_type is not None else ""
                
                # 등재일
                listed_on = individual.find('.//LISTED_ON', namespaces)
                listed_on_value = listed_on.text if listed_on is not None else ""
                
                # 별칭 정보
                aliases = []
                for alias in individual.findall('.//ALIAS_NAME', namespaces):
                    if alias is not None and alias.text:
                        aliases.append(alias.text.strip())
                
                # 주소 정보
                addresses = []
                for address in individual.findall('.//ADDRESS', namespaces):
                    if address is not None:
                        addr_parts = []
                        for field in ['STREET', 'CITY', 'STATE_PROVINCE', 'COUNTRY']:
                            value = address.find(field, namespaces)
                            if value is not None and value.text:
                                addr_parts.append(value.text.strip())
                        if addr_parts:
                            addresses.append(', '.join(addr_parts))
                
                # 국적 정보
                nationality = individual.find('.//NATIONALITY/VALUE', namespaces)
                nationality_value = nationality.text if nationality is not None and nationality.text else ""
                
                # 여권 정보
                documents = []
                for document in individual.findall('.//INDIVIDUAL_DOCUMENT', namespaces):
                    if document is not None:
                        doc_type = document.find('TYPE_OF_DOCUMENT', namespaces)
                        doc_number = document.find('NUMBER', namespaces)
                        if doc_type is not None and doc_type.text and doc_number is not None and doc_number.text:
                            documents.append({
                                "type": doc_type.text.strip(),
                                "number": doc_number.text.strip()
                            })
                
                # 생년월일 정보
                birth_date = ""
                dob = individual.find('.//DATE_OF_BIRTH', namespaces)
                if dob is not None and dob.text:
                    birth_date = dob.text.strip()
                
                # 통합 형식으로 변환
                sanction = {
                    "id": f"UN-{dataid_value}",
                    "name": full_name,
                    "type": "INDIVIDUAL",
                    "country": nationality_value,
                    "programs": [un_list_type_value] if un_list_type_value else [],
                    "source": "UN",
                    "matchScore": 100,
                    "details": {
                        "aliases": aliases,
                        "birthDate": birth_date,
                        "sanctions": [{"program": un_list_type_value, "startDate": listed_on_value, "reason": ""}],
                        "addresses": addresses,
                        "nationalities": [nationality_value] if nationality_value else [],
                        "identifications": [{"type": doc["type"], "number": doc["number"], "country": ""} for doc in documents]
                    }
                }
                
                individuals.append(sanction)
                
            except Exception as e:
                logger.warning(f"유효하지 않은 UN 개인 제재 데이터: {str(e)}")
                continue
        
        return individuals
    
    def _parse_entities(self, tree, namespaces) -> List[Dict]:
        """기업 제재 데이터를 파싱합니다."""
        entities = []
        
        for entity in tree.findall('.//ENTITY', namespaces):
            try:
                # 기본 정보
                dataid = entity.find('DATAID', namespaces)
                dataid_value = dataid.text if dataid is not None else "UNKNOWN"
                
                # 이름 정보
                first_name = entity.find('.//FIRST_NAME', namespaces)
                name_value = first_name.text if first_name is not None and first_name.text else ""
                
                if not name_value:
                    logger.warning(f"ID {dataid_value}의 이름 정보 없음, 건너뜀")
                    continue
                
                # UN 리스트 타입
                un_list_type = entity.find('.//UN_LIST_TYPE', namespaces)
                un_list_type_value = un_list_type.text if un_list_type is not None else ""
                
                # 등재일
                listed_on = entity.find('.//LISTED_ON', namespaces)
                listed_on_value = listed_on.text if listed_on is not None else ""
                
                # 별칭 정보
                aliases = []
                for alias in entity.findall('.//ALIAS_NAME', namespaces):
                    if alias is not None and alias.text:
                        aliases.append(alias.text.strip())
                
                # 주소 정보
                addresses = []
                for address in entity.findall('.//ADDRESS', namespaces):
                    if address is not None:
                        addr_parts = []
                        for field in ['STREET', 'CITY', 'STATE_PROVINCE', 'COUNTRY']:
                            value = address.find(field, namespaces)
                            if value is not None and value.text:
                                addr_parts.append(value.text.strip())
                        if addr_parts:
                            addresses.append(', '.join(addr_parts))
                
                # 국적 정보
                country = entity.find('.//COUNTRY', namespaces)
                country_value = country.text if country is not None and country.text else ""
                
                # 통합 형식으로 변환
                sanction = {
                    "id": f"UN-{dataid_value}",
                    "name": name_value,
                    "type": "ENTITY",
                    "country": country_value,
                    "programs": [un_list_type_value] if un_list_type_value else [],
                    "source": "UN",
                    "matchScore": 100,
                    "details": {
                        "aliases": aliases,
                        "birthDate": "",
                        "sanctions": [{"program": un_list_type_value, "startDate": listed_on_value, "reason": ""}],
                        "addresses": addresses,
                        "nationalities": [country_value] if country_value else [],
                        "identifications": []
                    }
                }
                
                entities.append(sanction)
                
            except Exception as e:
                logger.warning(f"유효하지 않은 UN 단체 제재 데이터: {str(e)}")
                continue
        
        return entities 