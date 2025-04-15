/**
 * 제재 정보 데이터에서 중복 항목을 제거하는 스크립트
 * 동일한 ID를 가진 항목은 최신 데이터만 유지합니다.
 */

const fs = require('fs');
const path = require('path');

// 데이터 저장 경로
const DATA_DIR = path.join(__dirname, '../public/data');
// 통합 데이터 파일 경로
const INTEGRATED_DATA_PATH = path.join(DATA_DIR, 'integrated_sanctions.json');
// 각 출처별 데이터 파일 경로
const SOURCE_DATA_PATHS = {
  un: path.join(DATA_DIR, 'un_sanctions.json'),
  eu: path.join(DATA_DIR, 'eu_sanctions.json'),
  us: path.join(DATA_DIR, 'us_sanctions.json')
};

/**
 * 데이터 파일에서 중복 제거
 * @param {string} filePath - 데이터 파일 경로
 * @returns {number} - 제거된 중복 항목 수
 */
function removeDuplicates(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`파일이 존재하지 않습니다: ${filePath}`);
    return 0;
  }
  
  try {
    // 데이터 파일 읽기
    const rawData = fs.readFileSync(filePath, 'utf8');
    let sanctionsData = JSON.parse(rawData);
    
    console.log(`파일 처리 중: ${path.basename(filePath)}`);
    console.log(`원본 데이터 항목 수: ${sanctionsData.length}`);
    
    // ID 기준 중복 제거 (Map 사용하여 가장 최근 항목만 유지)
    const uniqueMap = new Map();
    
    for (const item of sanctionsData) {
      if (!item.id) {
        console.warn('ID가 없는 항목을 발견했습니다. 이 항목은 건너뜁니다.');
        continue;
      }
      
      // Map에 저장하여 동일 ID의 이전 항목 덮어쓰기
      uniqueMap.set(item.id, item);
    }
    
    // 중복 제거된 배열로 변환
    const uniqueData = Array.from(uniqueMap.values());
    
    // 제거된 중복 항목 수 계산
    const removedCount = sanctionsData.length - uniqueData.length;
    console.log(`중복 제거 후 항목 수: ${uniqueData.length}`);
    console.log(`제거된 중복 항목 수: ${removedCount}`);
    
    // 결과 저장
    fs.writeFileSync(filePath, JSON.stringify(uniqueData, null, 2), 'utf8');
    console.log(`중복 제거 완료: ${path.basename(filePath)}`);
    
    return removedCount;
  } catch (error) {
    console.error(`${path.basename(filePath)} 처리 중 오류 발생:`, error);
    return 0;
  }
}

/**
 * 모든 데이터 파일에서 중복 제거
 */
function removeAllDuplicates() {
  console.log('===== 제재 정보 중복 데이터 제거 시작 =====');
  let totalRemoved = 0;
  
  // 통합 데이터 파일에서 중복 제거
  if (fs.existsSync(INTEGRATED_DATA_PATH)) {
    console.log('\n## 통합 데이터 중복 제거');
    totalRemoved += removeDuplicates(INTEGRATED_DATA_PATH);
  }
  
  // 각 출처별 데이터 파일에서 중복 제거
  for (const [source, filePath] of Object.entries(SOURCE_DATA_PATHS)) {
    if (fs.existsSync(filePath)) {
      console.log(`\n## ${source.toUpperCase()} 데이터 중복 제거`);
      totalRemoved += removeDuplicates(filePath);
    }
  }
  
  console.log('\n===== 요약 =====');
  console.log(`총 제거된 중복 항목 수: ${totalRemoved}`);
  console.log('===== 제재 정보 중복 데이터 제거 완료 =====');
}

// 스크립트 직접 실행 시
if (require.main === module) {
  removeAllDuplicates();
}

module.exports = { removeAllDuplicates }; 