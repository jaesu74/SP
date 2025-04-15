/**
 * docs/data 폴더에서 public/data 폴더로 제재 데이터 파일을 동기화하는 스크립트
 * 배포 전에 실행하여 프론트엔드에서 접근 가능한 데이터를 최신 상태로 유지합니다.
 */

const fs = require('fs');
const path = require('path');

// 디렉토리 경로
const sourceDir = path.join(process.cwd(), 'docs/data');
const targetDir = path.join(process.cwd(), 'public/data');

// 대상 파일 목록
const filesToSync = [
  'integrated_sanctions.json',
  'un_sanctions.json',
  'eu_sanctions.json',
  'us_sanctions.json',
  'diagnostic_info.json',
  'version.json'
];

// 대상 디렉토리가 없으면 생성
if (!fs.existsSync(targetDir)) {
  console.log(`대상 디렉토리 생성: ${targetDir}`);
  fs.mkdirSync(targetDir, { recursive: true });
}

// 파일 동기화 함수
async function syncFiles() {
  let syncedCount = 0;
  let errorCount = 0;
  
  console.log('데이터 파일 동기화 시작...');
  
  for (const file of filesToSync) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    // 소스 파일이 존재하는지 확인
    if (!fs.existsSync(sourcePath)) {
      console.warn(`소스 파일이 존재하지 않습니다: ${file}`);
      continue;
    }
    
    try {
      // 파일 복사
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`파일 동기화 완료: ${file}`);
      syncedCount++;
    } catch (error) {
      console.error(`파일 동기화 중 오류 발생 (${file}):`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n데이터 동기화 결과:');
  console.log(`- 성공: ${syncedCount}개 파일`);
  console.log(`- 실패: ${errorCount}개 파일`);
  
  return syncedCount > 0;
}

// 스크립트 실행
syncFiles()
  .then(success => {
    if (success) {
      console.log('데이터 동기화가 완료되었습니다.');
      process.exit(0);
    } else {
      console.error('데이터 동기화에 실패했습니다.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('동기화 중 오류 발생:', error);
    process.exit(1);
  }); 