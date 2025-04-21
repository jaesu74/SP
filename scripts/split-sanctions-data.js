const fs = require('fs');
const path = require('path');

// 데이터 디렉토리 경로
const dataDir = path.join(process.cwd(), 'public/data');
const OUTPUT_SIZE_LIMIT = 1.8 * 1024 * 1024; // 1.8MB

// 백업 디렉토리 생성 (이전 데이터 옮기기 위함)
const backupDir = path.join(process.cwd(), 'data-backup');
if (!fs.existsSync(backupDir)) {
  try {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`백업 디렉토리 생성됨: ${backupDir}`);
  } catch (error) {
    console.warn(`백업 디렉토리 생성 실패: ${error.message}`);
  }
}

// 이전 청크 파일 삭제 함수
function cleanupOldChunks() {
  try {
    const files = fs.readdirSync(dataDir);
    const chunkPattern = /^(un|eu|us)_sanctions_\d+\.json$/i;
    
    let deletedCount = 0;
    
    // 청크 파일 찾아서 삭제
    files.forEach(file => {
      if (chunkPattern.test(file)) {
        const filePath = path.join(dataDir, file);
        
        try {
          // 선택적으로 백업 (백업하지 않고 바로 삭제할 수도 있음)
          // const backupPath = path.join(backupDir, file);
          // fs.copyFileSync(filePath, backupPath);
          
          // 파일 삭제
          fs.unlinkSync(filePath);
          deletedCount++;
        } catch (err) {
          console.warn(`${file} 삭제 실패: ${err.message}`);
        }
      }
    });
    
    console.log(`이전 청크 파일 ${deletedCount}개 삭제 완료`);
  } catch (error) {
    console.error(`이전 청크 파일 정리 중 오류: ${error.message}`);
  }
}

// 통합 데이터 생성
const integratedData = {
  meta: {
    source: "integrated",
    timestamp: new Date().toISOString(),
    sources: [],
    lastUpdated: new Date().toISOString()
  },
  entries: []
};

// 샘플 데이터 로드
const sampleDataPath = path.join(dataDir, 'integrated_sanctions.json');
let existingSampleData = { entries: [] };

try {
  if (fs.existsSync(sampleDataPath)) {
    const sampleDataStr = fs.readFileSync(sampleDataPath, 'utf8');
    existingSampleData = JSON.parse(sampleDataStr);
    console.log(`기존 통합 데이터 로드: ${existingSampleData.entries.length}개 항목`);
    
    // 기존 샘플 데이터의 항목 추가
    if (existingSampleData.entries && Array.isArray(existingSampleData.entries)) {
      const sampleEntries = existingSampleData.entries.filter(entry => 
        entry.source === '샘플 데이터'
      );
      
      if (sampleEntries.length > 0) {
        console.log(`기존 샘플 데이터 ${sampleEntries.length}개 항목 유지`);
        sampleEntries.forEach(entry => integratedData.entries.push(entry));
      }
    }
  }
} catch (error) {
  console.warn(`기존 통합 데이터 로드 실패: ${error.message}`);
}

// 각 파일별 처리
const sourceFiles = {
  'UN': 'un_sanctions.json',
  'EU': 'eu_sanctions.json',
  'US': 'us_sanctions.json'
};

console.log('제재 데이터 처리 시작...');

// 이전 청크 파일 정리
cleanupOldChunks();

// 각 소스 파일 처리 및 분할
Object.entries(sourceFiles).forEach(([source, filename]) => {
  const filePath = path.join(dataDir, filename);
  
  if (fs.existsSync(filePath)) {
    try {
      console.log(`${source} 데이터 파일 처리 중...`);
      
      // 파일 읽기
      const fileData = fs.readFileSync(filePath, 'utf8');
      let data;
      
      try {
        data = JSON.parse(fileData);
      } catch (parseError) {
        console.error(`${source} 데이터 파일 파싱 오류: ${parseError.message}`);
        return;
      }
      
      // 통합 데이터 메타정보 추가
      integratedData.meta.sources.push({
        name: source,
        count: data.entries ? data.entries.length : 0,
        lastUpdated: new Date().toISOString()
      });
      
      // 데이터 처리
      if (data.entries && Array.isArray(data.entries)) {
        console.log(`${source}: ${data.entries.length}개 항목 처리 중...`);
        
        // 기존 ID 목록 추출
        const existingIds = new Set(integratedData.entries.map(e => e.id));
        
        // 소스별 분할 파일 생성
        const chunks = [];
        let currentChunk = [];
        let currentSize = 0;
        let chunkIndex = 0;
        
        // 각 항목을 처리하며 청크 분할
        data.entries.forEach((entry, index) => {
          // ID가 없으면 생성
          if (!entry.id) {
            entry.id = `${source.toLowerCase()}-${Math.random().toString(36).substring(2, 10)}`;
          }
          
          // 소스 정보 추가
          if (!entry.source) {
            entry.source = source;
          }
          
          // 중복 항목 제거
          if (!existingIds.has(entry.id)) {
            // 항목 추가
            integratedData.entries.push(entry);
            existingIds.add(entry.id);
            
            // 항목 크기 계산 (근사값)
            const entrySize = JSON.stringify(entry).length;
            
            // 현재 청크가 크기 제한에 도달하면 새 청크 시작
            if (currentSize + entrySize > OUTPUT_SIZE_LIMIT && currentChunk.length > 0) {
              chunks.push(currentChunk);
              currentChunk = [entry];
              currentSize = entrySize;
              chunkIndex++;
            } else {
              currentChunk.push(entry);
              currentSize += entrySize;
            }
          }
          
          // 진행 상황 표시
          if ((index + 1) % 1000 === 0 || index === data.entries.length - 1) {
            console.log(`${source}: ${index + 1}/${data.entries.length} 항목 처리됨`);
          }
        });
        
        // 마지막 청크 추가
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
        }
        
        // 청크별 파일 저장
        console.log(`${source}: ${chunks.length}개 청크로 분할 중...`);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        chunks.forEach((chunk, index) => {
          const chunkData = {
            meta: {
              source: source,
              timestamp: new Date().toISOString(),
              chunk: {
                index: index + 1,
                total: chunks.length
              }
            },
            entries: chunk
          };
          
          const chunkFileName = `${source.toLowerCase()}_sanctions_${index + 1}_${timestamp}.json`;
          const chunkFilePath = path.join(dataDir, chunkFileName);
          
          fs.writeFileSync(chunkFilePath, JSON.stringify(chunkData, null, 2));
          console.log(`${chunkFileName} 저장 완료 (${chunk.length}개 항목)`);
        });
      }
    } catch (error) {
      console.error(`${source} 데이터 처리 중 오류:`, error);
    }
  } else {
    console.warn(`${source} 데이터 파일이 존재하지 않습니다: ${filePath}`);
  }
});

// 통합 데이터에 통계 정보 추가
integratedData.meta.totalEntries = integratedData.entries.length;
integratedData.meta.lastProcessed = new Date().toISOString();

// 통합 데이터 저장
const integratedDataPath = path.join(dataDir, 'integrated_sanctions.json');

// 기존 통합 데이터 백업 (선택적)
// if (fs.existsSync(integratedDataPath)) {
//   const backupFileName = `integrated_sanctions_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
//   const backupFilePath = path.join(backupDir, backupFileName);
//   try {
//     fs.copyFileSync(integratedDataPath, backupFilePath);
//     console.log(`기존 통합 데이터 백업 완료: ${backupFilePath}`);
//   } catch (backupError) {
//     console.warn(`통합 데이터 백업 실패: ${backupError.message}`);
//   }
// }

// 새 통합 데이터 저장
fs.writeFileSync(integratedDataPath, JSON.stringify(integratedData, null, 2));
console.log(`통합 데이터 저장 완료: ${integratedData.entries.length}개 항목`);

// 캐시 파일 정리
try {
  const cacheDir = path.join(process.cwd(), '.next', 'cache');
  if (fs.existsSync(cacheDir)) {
    console.log('Next.js 캐시 정리 중...');
    // 서버 재시작 시 자동으로 캐시가 재구축되므로, 특정 캐시 파일만 삭제
    const dataCache = path.join(cacheDir, 'data');
    if (fs.existsSync(dataCache)) {
      fs.readdirSync(dataCache).forEach(file => {
        try {
          fs.unlinkSync(path.join(dataCache, file));
        } catch (err) {
          // 무시
        }
      });
    }
  }
} catch (error) {
  console.warn(`캐시 정리 중 오류: ${error.message}`);
}

console.log('제재 데이터 처리 완료!');
console.log('새 데이터가 성공적으로 저장되었으며, 과거 데이터는 삭제되었습니다.'); 