const fs = require('fs');
const path = require('path');

// 데이터 파일 경로
const dataDir = path.join(process.cwd(), 'public/data');
const outputFile = path.join(dataDir, 'integrated_sanctions.json');

// 각 소스별 파일 경로
const sourceFiles = {
  'UN': path.join(dataDir, 'un_sanctions.json'),
  'EU': path.join(dataDir, 'eu_sanctions.json'),
  'US': path.join(dataDir, 'us_sanctions.json'),
  'Sample': path.join(dataDir, 'sanctions.json')
};

// 통합 데이터 객체
const integratedData = {
  meta: {
    source: 'integrated',
    timestamp: new Date().toISOString(),
    sources: []
  },
  entries: []
};

console.log('제재 정보 통합 시작...');

// 각 소스 파일 처리
Object.entries(sourceFiles).forEach(([source, filePath]) => {
  if (fs.existsSync(filePath)) {
    try {
      console.log(`${source} 데이터 파일 처리 중...`);
      
      // 파일 읽기
      const fileData = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileData);
      
      // 메타 정보 추가
      if (data.meta) {
        integratedData.meta.sources.push({
          name: source,
          ...data.meta
        });
      } else {
        integratedData.meta.sources.push({
          name: source,
          count: data.entries ? data.entries.length : 0
        });
      }
      
      // 엔트리 추가 (중복 ID 확인)
      if (data.entries && Array.isArray(data.entries)) {
        const existingIds = new Set(integratedData.entries.map(e => e.id));
        
        data.entries.forEach(entry => {
          // ID가 없는 경우 생성
          if (!entry.id) {
            entry.id = `${source.toLowerCase()}-${Math.random().toString(36).substring(2, 10)}`;
          }
          
          // 중복 방지
          if (!existingIds.has(entry.id)) {
            // 소스 정보 추가
            if (!entry.source) {
              entry.source = source;
            }
            
            integratedData.entries.push(entry);
            existingIds.add(entry.id);
          }
        });
      }
      
      console.log(`${source} 데이터 처리 완료: ${data.entries ? data.entries.length : 0}개 항목`);
    } catch (error) {
      console.error(`${source} 데이터 처리 중 오류:`, error);
    }
  } else {
    console.warn(`${source} 데이터 파일이 존재하지 않습니다: ${filePath}`);
  }
});

// 기존 샘플 데이터 유지
try {
  const existingData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  if (existingData.entries && Array.isArray(existingData.entries)) {
    const existingIds = new Set(integratedData.entries.map(e => e.id));
    
    existingData.entries.forEach(entry => {
      if (!existingIds.has(entry.id)) {
        integratedData.entries.push(entry);
        existingIds.add(entry.id);
      }
    });
  }
} catch (error) {
  console.warn('기존 통합 데이터 파일을 읽을 수 없습니다. 새로 생성합니다.', error);
}

// 결과 저장
try {
  fs.writeFileSync(outputFile, JSON.stringify(integratedData, null, 2));
  console.log(`통합 데이터 저장 완료: ${integratedData.entries.length}개 항목`);
} catch (error) {
  console.error('통합 데이터 저장 중 오류:', error);
}

console.log('제재 정보 통합 작업 완료!'); 