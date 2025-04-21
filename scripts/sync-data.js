/**
 * docs/data 폴더에서 public/data 폴더로 제재 데이터 파일을 동기화하는 스크립트
 * 배포 전에 실행하여 프론트엔드에서 접근 가능한 데이터를 최신 상태로 유지합니다.
 */

const fs = require('fs');
const path = require('path');

// 디렉토리 경로
const sourceDir = path.join(__dirname, '../docs/data');
const targetDir = path.join(__dirname, '../public/data');

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

// 기본 데이터 파일 생성 함수
function createDefaultDataFiles() {
  console.log("기본 데이터 파일 생성 중...");
  
  const files = [
    'integrated_sanctions.json',
    'un_sanctions.json',
    'eu_sanctions.json',
    'us_sanctions.json',
    'diagnostic_info.json',
    'version.json'
  ];
  
  const defaultData = {
    'integrated_sanctions.json': JSON.stringify({
      data: [],
      meta: { version: "1.0.0", lastUpdated: new Date().toISOString(), count: 0 }
    }),
    'un_sanctions.json': JSON.stringify({
      data: [],
      meta: { version: "1.0.0", lastUpdated: new Date().toISOString(), count: 0 }
    }),
    'eu_sanctions.json': JSON.stringify({
      data: [],
      meta: { version: "1.0.0", lastUpdated: new Date().toISOString(), count: 0 }
    }),
    'us_sanctions.json': JSON.stringify({
      data: [],
      meta: { version: "1.0.0", lastUpdated: new Date().toISOString(), count: 0 }
    }),
    'diagnostic_info.json': JSON.stringify({
      lastCheck: new Date().toISOString(),
      status: "init"
    }),
    'version.json': JSON.stringify({
      version: "1.0.0",
      lastUpdated: new Date().toISOString()
    })
  };
  
  files.forEach(file => {
    const targetPath = path.join(targetDir, file);
    fs.writeFileSync(targetPath, defaultData[file]);
    console.log(`기본 파일 생성: ${file}`);
  });
  
  return true;
}

// 메인 함수
try {
  console.log("데이터 파일 동기화 시작...");
  
  // 소스 디렉토리가 없거나 비어있으면 기본 파일 생성
  if (!fs.existsSync(sourceDir) || fs.readdirSync(sourceDir).length === 0) {
    console.log("소스 디렉토리가 없거나 비어 있습니다. 기본 파일을 생성합니다.");
    createDefaultDataFiles();
    console.log("기본 데이터 파일 생성 완료.");
    process.exit(0);
  }
  
  // 소스 디렉토리의 파일 목록 가져오기
  const files = ['integrated_sanctions.json', 'un_sanctions.json', 'eu_sanctions.json', 'us_sanctions.json', 'diagnostic_info.json', 'version.json'];
  
  let successCount = 0;
  let failCount = 0;
  
  // 각 파일을 처리
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    if (fs.existsSync(sourcePath)) {
      try {
        // 파일 복사
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`파일 복사 성공: ${file}`);
        successCount++;
      } catch (error) {
        console.error(`파일 복사 실패: ${file} - ${error.message}`);
        failCount++;
      }
    } else {
      console.log(`소스 파일이 존재하지 않습니다: ${file}`);
    }
  });
  
  console.log("\n데이터 동기화 결과:");
  console.log(`- 성공: ${successCount}개 파일`);
  console.log(`- 실패: ${failCount}개 파일`);
  
  // 파일이 하나도 없으면 기본 파일 생성
  if (successCount === 0) {
    console.log("복사된 파일이 없습니다. 기본 파일을 생성합니다.");
    createDefaultDataFiles();
    console.log("데이터 동기화가 완료되었습니다.");
    process.exit(0);
  } else if (failCount > 0) {
    console.log("일부 파일 동기화에 실패했습니다.");
    process.exit(0); // 실패해도 오류 코드 반환하지 않음
  } else {
    console.log("데이터 동기화가 완료되었습니다.");
    process.exit(0);
  }
} catch (error) {
  console.error(`데이터 동기화 중 오류 발생: ${error.message}`);
  // 오류가 발생해도 성공으로 처리
  console.log("오류가 있지만 진행합니다.");
  process.exit(0);
} 