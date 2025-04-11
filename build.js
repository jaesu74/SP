const fs = require('fs');
const path = require('path');

// 디렉토리 복사 함수
function copyDir(src, dest) {
  // 대상 디렉토리가 없으면 생성
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // 소스 디렉토리의 파일 목록 가져오기
  const files = fs.readdirSync(src);

  // 각 파일에 대해 처리
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      // 디렉토리인 경우 재귀적으로 복사
      copyDir(srcPath, destPath);
    } else {
      // 파일인 경우 복사
      fs.copyFileSync(srcPath, destPath);
      console.log(`복사: ${srcPath} -> ${destPath}`);
    }
  }
}

// HTML 파일 복사 및 경로 수정 함수
function copyAndModifyHtml(srcPath, destPath) {
  let content = fs.readFileSync(srcPath, 'utf8');
  
  // src/ 경로 참조 제거 (dist에서는 상대 경로만 사용)
  content = content.replace(/src="src\//g, 'src="');
  content = content.replace(/href="src\//g, 'href="');
  
  fs.writeFileSync(destPath, content);
  console.log(`HTML 변환 및 복사: ${srcPath} -> ${destPath}`);
}

// 빌드 시작
console.log('빌드 프로세스 시작...');

// dist 디렉토리 구조 확인 및 생성
const directories = [
  'dist',
  'dist/js',
  'dist/js/components',
  'dist/js/services',
  'dist/js/utils',
  'dist/css',
  'dist/assets',
  'dist/assets/img',
  'dist/data'
];

for (const dir of directories) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`디렉토리 생성: ${dir}`);
  }
}

// JS 파일 복사
copyDir('src/js', 'dist/js');

// CSS 파일 복사
copyDir('src/css', 'dist/css');

// 데이터 파일 복사
copyDir('src/data', 'dist/data');

// 에셋 파일 복사
copyDir('src/assets', 'dist/assets');

// HTML 파일 복사 및 경로 수정
copyAndModifyHtml('index.html', 'dist/index.html');

console.log('빌드 완료!'); 