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
    
    def _get_text(self, element, path, namespaces) -> str:
        """XML 요소에서 텍스트 값을 추출합니다."""
        elem = element.find(path, namespaces)
        return elem.text.strip() if elem is not None and elem.text else ""
    
    def _parse_individuals(self, tree, namespaces) -> List[Dict]:
        """개인 제재 데이터를 파싱합니다."""
        individuals = []
        
        for individual in tree.findall('.//INDIVIDUAL', namespaces):
            try:
                # 기본 정보
                dataid = self._get_text(individual, 'DATAID', namespaces) or "UNKNOWN"
                
                # 이름 정보
                name_parts = []
                for name_part in ['FIRST_NAME', 'SECOND_NAME', 'THIRD_NAME']:
                    text = self._get_text(individual, f'.//{name_part}', namespaces)
                    if text:
                        name_parts.append(text)
                
                full_name = ' '.join(name_parts).strip()
                if not full_name:
                    logger.warning(f"ID {dataid}의 이름 정보 없음, 건너뜀")
                    continue
                
                # UN 리스트 타입 및 등재일
                un_list_type = self._get_text(individual, './/UN_LIST_TYPE', namespaces)
                listed_on = self._get_text(individual, './/LISTED_ON', namespaces)
                
                # 별칭 정보
                aliases = []
                for alias in individual.findall('.//ALIAS_NAME', namespaces):
                    if alias is not None and alias.text:
                        aliases.append(alias.text.strip())
                
                # 주소 정보 
                addresses = self._extract_addresses(individual, namespaces)
                
                # 국적 정보
                nationality = self._get_text(individual, './/NATIONALITY/VALUE', namespaces)
                
                # 여권 정보
                documents = []
                for document in individual.findall('.//INDIVIDUAL_DOCUMENT', namespaces):
                    doc_type = self._get_text(document, 'TYPE_OF_DOCUMENT', namespaces)
                    doc_number = self._get_text(document, 'NUMBER', namespaces)
                    if doc_type and doc_number:
                        documents.append({
                            "type": doc_type,
                            "number": doc_number
                        })
                
                # 생년월일 정보
                birth_date = self._get_text(individual, './/DATE_OF_BIRTH', namespaces)
                
                # 통합 형식으로 변환
                sanction = {
                    "id": f"UN-{dataid}",
                    "name": full_name,
                    "type": "INDIVIDUAL",
                    "country": nationality,
                    "programs": [un_list_type] if un_list_type else [],
                    "source": "UN",
                    "matchScore": 100,
                    "details": {
                        "aliases": aliases,
                        "birthDate": birth_date,
                        "sanctions": [{"program": un_list_type, "startDate": listed_on, "reason": ""}],
                        "addresses": addresses,
                        "nationalities": [nationality] if nationality else [],
                        "identifications": [{"type": doc["type"], "number": doc["number"], "country": ""} for doc in documents]
                    }
                }
                
                individuals.append(sanction)
                
            except Exception as e:
                logger.warning(f"유효하지 않은 UN 개인 제재 데이터: {str(e)}")
                continue
        
        return individuals
    
    def _extract_addresses(self, element, namespaces) -> List[str]:
        """주소 정보를 추출합니다."""
        addresses = []
        for address in element.findall('.//ADDRESS', namespaces):
            if address is not None:
                addr_parts = []
                for field in ['STREET', 'CITY', 'STATE_PROVINCE', 'COUNTRY']:
                    value = self._get_text(address, field, namespaces)
                    if value:
                        addr_parts.append(value)
                if addr_parts:
                    addresses.append(', '.join(addr_parts))
        return addresses
    
    def _parse_entities(self, tree, namespaces) -> List[Dict]:
        """기업 제재 데이터를 파싱합니다."""
        entities = []
        
        for entity in tree.findall('.//ENTITY', namespaces):
            try:
                # 기본 정보
                dataid = self._get_text(entity, 'DATAID', namespaces) or "UNKNOWN"
                
                # 이름 정보
                name_value = self._get_text(entity, './/FIRST_NAME', namespaces)
                
                if not name_value:
                    logger.warning(f"ID {dataid}의 이름 정보 없음, 건너뜀")
                    continue
                
                # UN 리스트 타입
                un_list_type = self._get_text(entity, './/UN_LIST_TYPE', namespaces)
                listed_on = self._get_text(entity, './/LISTED_ON', namespaces)
                
                # 별칭 정보
                aliases = []
                for alias in entity.findall('.//ALIAS_NAME', namespaces):
                    if alias is not None and alias.text:
                        aliases.append(alias.text.strip())
                
                # 주소 정보
                addresses = self._extract_addresses(entity, namespaces)
                
                # 국적 정보
                country = self._get_text(entity, './/COUNTRY', namespaces)
                
                # 통합 형식으로 변환
                sanction = {
                    "id": f"UN-{dataid}",
                    "name": name_value,
                    "type": "ENTITY",
                    "country": country,
                    "programs": [un_list_type] if un_list_type else [],
                    "source": "UN",
                    "matchScore": 100,
                    "details": {
                        "aliases": aliases,
                        "birthDate": "",
                        "sanctions": [{"program": un_list_type, "startDate": listed_on, "reason": ""}],
                        "addresses": addresses,
                        "nationalities": [country] if country else [],
                        "identifications": []
                    }
                }
                
                entities.append(sanction)
                
            except Exception as e:
                logger.warning(f"유효하지 않은 UN 단체 제재 데이터: {str(e)}")
                continue
        
        return entities 