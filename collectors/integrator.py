#!/usr/bin/env python3
"""
제재 데이터 통합기
여러 소스의 제재 데이터를 통합합니다.
"""

import os
import json
import logging
import shutil
from typing import Dict, List
from datetime import datetime

from collectors.base import OUTPUT_DIR, logger

class SanctionsIntegrator:
    """제재 데이터 통합기 클래스"""
    
    def __init__(self, sources=None):
        """초기화"""
        self.sources = sources or ["UN", "EU", "US"]
        self.logger = logger
    
    def integrate(self) -> bool:
        """모든 소스의 제재 데이터를 통합합니다."""
        self.logger.info("제재 데이터 통합 시작")
        
        # 각 소스의 데이터 로드
        all_sanctions = []
        
        for source in self.sources:
            try:
                source_file = os.path.join(OUTPUT_DIR, f"{source.lower()}_sanctions.json")
                if not os.path.exists(source_file):
                    self.logger.warning(f"{source} 제재 데이터 파일 없음: {source_file}")
                    continue
                    
                with open(source_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                sanctions = data.get("data", [])
                all_sanctions.extend(sanctions)
                self.logger.info(f"{source} 제재 데이터 로드 완료: {len(sanctions)}개 항목")
            except Exception as e:
                self.logger.error(f"{source} 제재 데이터 로드 실패: {str(e)}")
        
        # 중복 제거 (ID 기준)
        unique_sanctions = {}
        for sanction in all_sanctions:
            sanction_id = sanction["id"]
            if sanction_id in unique_sanctions:
                # 기존 항목과 병합
                existing = unique_sanctions[sanction_id]
                existing["source"] = f"{existing['source']},{sanction['source']}"
                
                # 프로그램 병합
                for program in sanction.get("programs", []):
                    if program not in existing["programs"]:
                        existing["programs"].append(program)
                
                # 별칭 병합
                if "details" in sanction and "aliases" in sanction["details"]:
                    for alias in sanction["details"]["aliases"]:
                        if alias not in existing["details"]["aliases"]:
                            existing["details"]["aliases"].append(alias)
                
                # 제재 정보 병합
                if "details" in sanction and "sanctions" in sanction["details"]:
                    for sanction_item in sanction["details"]["sanctions"]:
                        existing["details"]["sanctions"].append(sanction_item)
            else:
                unique_sanctions[sanction_id] = sanction
        
        # 중복 제거된 데이터를 리스트로 변환
        integrated_sanctions = list(unique_sanctions.values())
        
        # 통합된 데이터 저장
        data = {
            "meta": {
                "lastUpdated": datetime.now().isoformat(),
                "sources": self.sources,
                "totalEntries": len(integrated_sanctions)
            },
            "data": integrated_sanctions
        }
        
        try:
            # docs/data 디렉토리 확인 및 생성
            os.makedirs(OUTPUT_DIR, exist_ok=True)
            
            # sanctions.json 파일로 저장
            output_file = os.path.join(OUTPUT_DIR, "sanctions.json")
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            # integrated_sanctions.json 파일로도 저장
            integrated_file = os.path.join(OUTPUT_DIR, "integrated_sanctions.json")
            with open(integrated_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"통합 제재 데이터 저장 완료: {len(integrated_sanctions)}개 항목")
            
            # 소스별 통계
            source_counts = {}
            for sanction in integrated_sanctions:
                for source in sanction["source"].split(","):
                    source = source.strip()
                    source_counts[source] = source_counts.get(source, 0) + 1
            
            for source, count in source_counts.items():
                self.logger.info(f"{source} 소스 항목 수: {count}")
            
            # 유형별 통계
            type_counts = {}
            for sanction in integrated_sanctions:
                entity_type = sanction["type"]
                type_counts[entity_type] = type_counts.get(entity_type, 0) + 1
            
            for entity_type, count in type_counts.items():
                self.logger.info(f"{entity_type} 유형 항목 수: {count}")
            
            return True
        except Exception as e:
            self.logger.error(f"통합 제재 데이터 저장 실패: {str(e)}")
            return False
    
    def clean_temp_files(self, temp_dir):
        """임시 파일을 정리합니다."""
        try:
            for filename in os.listdir(temp_dir):
                file_path = os.path.join(temp_dir, filename)
                try:
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                except Exception as e:
                    self.logger.warning(f"임시 파일 삭제 실패: {filename}, 오류: {str(e)}")
            
            self.logger.info("임시 파일 정리 완료")
        except Exception as e:
            self.logger.warning(f"임시 파일 정리 중 오류 발생: {str(e)}") 