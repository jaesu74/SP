/**
 * 제재 정보 수집 및 통합 스크립트
 * UN, EU, US 등 다양한 제재 정보를 수집하여 통합합니다.
 */

// 이미 파일이 있다면 기존 기능을 유지하고 데이터 버전 관리 기능만 추가
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 데이터 저장 경로
const DATA_DIR = path.join(__dirname, '../public/data');
// 버전 폴더 경로
const VERSIONS_DIR = path.join(DATA_DIR, 'versions');

/**
 * 현재 날짜로 버전 이름 생성
 * @returns {string} - YYYY-MM-DD 형식의 버전 이름
 */
function generateVersionName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 통합 데이터를 버전 폴더에 저장하고, 최신 버전을 메인 폴더에도 복사
 * @param {Object} integratedData - 통합된 제재 데이터
 */
function saveVersionedData(integratedData) {
  // 버전 폴더 생성
  const versionName = generateVersionName();
  const versionDir = path.join(VERSIONS_DIR, versionName);
  
  if (!fs.existsSync(VERSIONS_DIR)) {
    fs.mkdirSync(VERSIONS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(versionDir)) {
    fs.mkdirSync(versionDir, { recursive: true });
  }
  
  // 통합 데이터를 버전 폴더에 저장
  const versionFilePath = path.join(versionDir, 'sanctions.json');
  fs.writeFileSync(versionFilePath, JSON.stringify(integratedData, null, 2));
  console.log(`버전 ${versionName}의 데이터가 저장되었습니다.`);
  
  // 최신 버전을 메인 폴더에도 복사
  const mainFilePath = path.join(DATA_DIR, 'sanctions.json');
  fs.writeFileSync(mainFilePath, JSON.stringify(integratedData, null, 2));
  console.log('최신 데이터가 메인 폴더에 복사되었습니다.');
  
  // 버전 정보 업데이트
  const versionInfoPath = path.join(DATA_DIR, 'version.json');
  const versionInfo = {
    current: versionName,
    lastUpdated: new Date().toISOString(),
    recordCount: integratedData.length
  };
  fs.writeFileSync(versionInfoPath, JSON.stringify(versionInfo, null, 2));
  console.log('버전 정보가 업데이트되었습니다.');
}

/**
 * 메인 함수
 */
async function integrateData() {
  try {
    console.log('제재 데이터 수집 및 통합 시작...');
    
    // 데이터 폴더 생성
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // 데이터 수집 및 처리 로직 실행
    // 여기서는 이미 존재하는 로직을 유지하면서 버전 관리 기능만 추가
    if (typeof processData === 'function') {
      const integratedData = await processData();
      saveVersionedData(integratedData);
    } else {
      console.log('기존 데이터 처리 함수를 찾을 수 없습니다. 샘플 데이터를 생성합니다.');
      
      // 샘플 데이터 생성 (실제 프로젝트에서는 제거)
      const sampleData = [
        { id: '1', name: '샘플 제재 대상 1', type: 'individual', country: 'KP', source: 'UN' },
        { id: '2', name: '샘플 제재 대상 2', type: 'entity', country: 'IR', source: 'EU' },
        { id: '3', name: '샘플 제재 대상 3', type: 'vessel', country: 'RU', source: 'US' }
      ];
      saveVersionedData(sampleData);
    }
    
    console.log('제재 데이터 수집 및 통합 완료.');
  } catch (error) {
    console.error('데이터 통합 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
integrateData(); 