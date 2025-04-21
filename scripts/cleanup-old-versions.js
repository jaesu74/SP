/**
 * 이전 버전의 데이터 파일을 정리하는 스크립트
 * 최신 버전과 직전 버전만 유지하고 나머지는 삭제합니다.
 * 단, 용량이 크면 직전 버전도 삭제합니다.
 */

const fs = require('fs');
const path = require('path');

// 데이터 저장 경로
const DATA_DIR = path.join(__dirname, '../public/data');
// 버전 폴더 경로
const VERSIONS_DIR = path.join(DATA_DIR, 'versions');
// 최대 유지할 버전 수
const MAX_VERSIONS = 2;
// 용량 제한 (바이트 단위, 100MB)
const SIZE_LIMIT = 100 * 1024 * 1024;

/**
 * 특정 폴더의 크기를 계산
 * @param {string} directoryPath - 폴더 경로
 * @returns {number} - 폴더 크기 (바이트)
 */
function getDirectorySize(directoryPath) {
  let totalSize = 0;
  
  function calculateSize(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        calculateSize(itemPath);
      } else {
        totalSize += stats.size;
      }
    }
  }
  
  calculateSize(directoryPath);
  return totalSize;
}

/**
 * 데이터 버전 정리
 */
function cleanupOldVersions() {
  console.log('이전 버전 데이터 정리 시작...');
  
  try {
    // 버전 폴더가 없으면 생성
    if (!fs.existsSync(VERSIONS_DIR)) {
      fs.mkdirSync(VERSIONS_DIR, { recursive: true });
      console.log('버전 폴더가 존재하지 않아 생성했습니다.');
      return;
    }
    
    // 모든 버전 폴더 목록 가져오기
    const versionFolders = fs.readdirSync(VERSIONS_DIR)
      .filter(folder => {
        const folderPath = path.join(VERSIONS_DIR, folder);
        return fs.statSync(folderPath).isDirectory();
      })
      .sort((a, b) => {
        // 날짜 기반 버전 이름 (YYYY-MM-DD) 기준으로 정렬
        return new Date(b) - new Date(a);
      });
    
    console.log(`총 ${versionFolders.length}개의 버전 폴더를 발견했습니다.`);
    
    // 삭제할 버전이 없는 경우
    if (versionFolders.length <= MAX_VERSIONS) {
      console.log(`삭제할 버전이 없습니다. 현재 ${versionFolders.length}개 버전이 있습니다.`);
      return;
    }
    
    // 최신 버전과 직전 버전 유지 (첫 두 개)
    const latestVersion = versionFolders[0];
    const previousVersion = versionFolders[1];
    
    console.log(`최신 버전: ${latestVersion}`);
    console.log(`직전 버전: ${previousVersion}`);
    
    // 직전 버전 폴더 크기 계산
    const previousVersionPath = path.join(VERSIONS_DIR, previousVersion);
    const previousVersionSize = getDirectorySize(previousVersionPath);
    
    // 용량이 크면 직전 버전도 삭제
    const versionsToKeep = (previousVersionSize > SIZE_LIMIT) ? 1 : 2;
    console.log(`직전 버전 용량: ${(previousVersionSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`용량 제한: ${(SIZE_LIMIT / 1024 / 1024).toFixed(2)}MB`);
    console.log(`유지할 버전 수: ${versionsToKeep}`);
    
    // 오래된 버전 삭제
    const versionsToDelete = versionFolders.slice(versionsToKeep);
    console.log(`${versionsToDelete.length}개의 버전을 삭제합니다.`);
    
    for (const version of versionsToDelete) {
      const versionPath = path.join(VERSIONS_DIR, version);
      fs.rmSync(versionPath, { recursive: true, force: true });
      console.log(`버전 삭제 완료: ${version}`);
    }
    
    console.log('이전 버전 데이터 정리 완료.');
  } catch (error) {
    console.error('이전 버전 정리 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
cleanupOldVersions(); 