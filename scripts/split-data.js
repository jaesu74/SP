const fs = require('fs');
const path = require('path');

const MAX_CHUNK_SIZE = 1.5 * 1024 * 1024; // 약 1.5MB 제한
const DATA_DIR = path.join(process.cwd(), 'public/data');
const CHUNK_DIR = path.join(DATA_DIR, 'chunks');

// 청크 디렉토리 생성
if (!fs.existsSync(CHUNK_DIR)) {
  fs.mkdirSync(CHUNK_DIR, { recursive: true });
}

// 데이터 분할 함수
function splitData() {
  try {
    console.log('데이터 분할 시작...');
    
    // 소스별 파일 분할
    const sourceFiles = [
      { name: 'un_sanctions.json', prefix: 'un' },
      { name: 'eu_sanctions.json', prefix: 'eu' },
      { name: 'us_sanctions.json', prefix: 'us' },
      { name: 'integrated_sanctions.json', prefix: 'integrated' }
    ];
    
    // 기존 청크 파일 삭제
    const existingChunks = fs.readdirSync(CHUNK_DIR);
    for (const file of existingChunks) {
      fs.unlinkSync(path.join(CHUNK_DIR, file));
    }
    console.log(`기존 청크 파일 ${existingChunks.length}개 삭제 완료`);
    
    // 인덱스 파일 초기화
    const indexData = {
      chunks: {},
      meta: {
        created: new Date().toISOString(),
        totalEntries: 0
      }
    };
    
    // 각 소스 파일 처리
    for (const { name, prefix } of sourceFiles) {
      const filePath = path.join(DATA_DIR, name);
      
      if (!fs.existsSync(filePath)) {
        console.log(`${name} 파일이 없습니다. 건너뜁니다.`);
        continue;
      }
      
      // 원본 파일 읽기
      const fileContent = fs.readFileSync(filePath, 'utf8');
      let originalData;
      
      try {
        originalData = JSON.parse(fileContent);
      } catch (error) {
        console.error(`${name} 파일 파싱 오류: ${error.message}`);
        continue;
      }
      
      // 데이터 엔트리 추출
      let entries = [];
      
      if (originalData.data && Array.isArray(originalData.data)) {
        entries = originalData.data;
      } else if (originalData.entries && Array.isArray(originalData.entries)) {
        entries = originalData.entries;
      } else {
        console.error(`${name} 파일에 유효한 데이터 배열이 없습니다.`);
        continue;
      }
      
      console.log(`${name}에서 ${entries.length}개 항목 로드됨`);
      
      // 청크로 분할
      const chunks = [];
      let currentChunk = [];
      let currentSize = 0;
      let chunkIndex = 0;
      
      for (const entry of entries) {
        const entrySize = JSON.stringify(entry).length;
        
        // 항목이 최대 청크 크기보다 크면 건너뜀
        if (entrySize > MAX_CHUNK_SIZE) {
          console.warn(`경고: ${entry.id || 'Unknown'} 항목이 너무 큽니다 (${Math.round(entrySize/1024)}KB). 별도 처리 필요`);
          continue;
        }
        
        // 현재 청크가 최대 크기에 도달하면 새 청크 시작
        if (currentSize + entrySize > MAX_CHUNK_SIZE) {
          chunks.push(currentChunk);
          currentChunk = [];
          currentSize = 0;
          chunkIndex++;
        }
        
        currentChunk.push(entry);
        currentSize += entrySize;
      }
      
      // 마지막 청크 추가
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
      
      console.log(`${name}에서 ${chunks.length}개 청크 생성됨`);
      
      // 청크 파일 저장
      for (let i = 0; i < chunks.length; i++) {
        const chunkFileName = `${prefix}_chunk_${i}.json`;
        const chunkPath = path.join(CHUNK_DIR, chunkFileName);
        
        const chunkData = {
          meta: {
            source: prefix,
            chunkIndex: i,
            totalChunks: chunks.length,
            entryCount: chunks[i].length
          },
          data: chunks[i]
        };
        
        fs.writeFileSync(chunkPath, JSON.stringify(chunkData, null, 2));
        
        // 인덱스에 청크 정보 추가
        for (const entry of chunks[i]) {
          if (entry.id) {
            if (!indexData.chunks[entry.id]) {
              indexData.chunks[entry.id] = [];
            }
            indexData.chunks[entry.id].push(chunkFileName);
          }
        }
        
        indexData.meta.totalEntries += chunks[i].length;
      }
    }
    
    // 인덱스 파일 저장
    fs.writeFileSync(
      path.join(CHUNK_DIR, 'index.json'), 
      JSON.stringify(indexData, null, 2)
    );
    
    console.log(`인덱스 파일 생성 완료: ${Object.keys(indexData.chunks).length}개 항목 인덱싱됨`);
    console.log('데이터 분할 완료!');
    
    // 인덱스 정보 반환
    return indexData;
  } catch (error) {
    console.error('데이터 분할 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 직접 실행 시 데이터 분할 실행
if (require.main === module) {
  try {
    splitData();
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  }
}

module.exports = { splitData }; 