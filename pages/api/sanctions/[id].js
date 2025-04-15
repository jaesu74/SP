// ID로 제재 정보 조회 API
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // ID 파라미터 확인
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'ID가 필요합니다.' });
    }
    
    // 데이터 디렉토리 경로
    const dataDir = path.join(process.cwd(), 'public/data');
    const chunkDir = path.join(dataDir, 'chunks');
    
    // ID로 제재 정보 찾기
    const sanctionEntry = await findSanctionById(id, dataDir, chunkDir);
    
    if (!sanctionEntry) {
      console.log(`ID '${id}'의 제재 정보를 찾을 수 없음`);
      return res.status(404).json({ error: '해당 ID의 제재 정보를 찾을 수 없습니다.' });
    }
    
    // 결과 반환
    res.status(200).json(sanctionEntry);
  } catch (error) {
    console.error('API 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

/**
 * ID로 제재 정보를 찾는 함수
 * @param {string} id - 찾을 제재 정보 ID
 * @param {string} dataDir - 데이터 디렉토리 경로
 * @param {string} chunkDir - 청크 파일 디렉토리 경로
 * @returns {Promise<Object|null>} 제재 정보 객체 또는 null
 */
async function findSanctionById(id, dataDir, chunkDir) {
  try {
    console.log(`ID '${id}'로 제재 정보 검색 중...`);
    
    // 1. 인덱스 파일을 사용하여 빠르게 검색
    const indexFilePath = path.join(chunkDir, 'index.json');
    if (fs.existsSync(indexFilePath)) {
      try {
        const indexContent = fs.readFileSync(indexFilePath, 'utf8');
        const indexData = JSON.parse(indexContent);
        
        // 인덱스에서 ID에 해당하는 청크 파일 찾기
        if (indexData.chunks && indexData.chunks[id] && indexData.chunks[id].length > 0) {
          const chunkFiles = indexData.chunks[id];
          console.log(`인덱스에서 ID '${id}'를 포함하는 청크 파일 ${chunkFiles.length}개 찾음`);
          
          // 각 청크 파일에서 항목 검색
          for (const chunkFile of chunkFiles) {
            const chunkFilePath = path.join(chunkDir, chunkFile);
            if (fs.existsSync(chunkFilePath)) {
              const chunkContent = fs.readFileSync(chunkFilePath, 'utf8');
              const chunkData = JSON.parse(chunkContent);
              
              if (chunkData.data && Array.isArray(chunkData.data)) {
                const entry = chunkData.data.find(entry => entry.id === id);
                if (entry) {
                  console.log(`청크 파일 ${chunkFile}에서 ID '${id}' 항목 찾음`);
                  return await enrichSanctionData(entry, dataDir, chunkDir);
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn(`인덱스 파일 검색 오류: ${error.message}`);
      }
    }
    
    // 2. 인덱스가 없거나 검색 실패 시 모든 청크 파일 검색
    if (fs.existsSync(chunkDir)) {
      try {
        const chunkFiles = fs.readdirSync(chunkDir).filter(file => file !== 'index.json');
        console.log(`인덱스를 통한 검색 실패. ${chunkFiles.length}개 청크 파일 직접 검색...`);
        
        for (const chunkFile of chunkFiles) {
          const chunkFilePath = path.join(chunkDir, chunkFile);
          const chunkContent = fs.readFileSync(chunkFilePath, 'utf8');
          try {
            const chunkData = JSON.parse(chunkContent);
            
            if (chunkData.data && Array.isArray(chunkData.data)) {
              const entry = chunkData.data.find(entry => entry.id === id);
              if (entry) {
                console.log(`청크 파일 ${chunkFile}에서 ID '${id}' 항목 찾음`);
                return await enrichSanctionData(entry, dataDir, chunkDir);
              }
            }
          } catch (error) {
            console.warn(`청크 파일 ${chunkFile} 파싱 오류: ${error.message}`);
          }
        }
      } catch (error) {
        console.warn(`청크 디렉토리 검색 오류: ${error.message}`);
      }
    }
    
    // 3. 청크 검색 실패 시 원본 파일 검색
    // ID에서 소스 정보 추출
    const sourcePrefix = id.split('-')[0];
    let specificFile = null;
    
    if (sourcePrefix === 'UN') {
      specificFile = 'un_sanctions.json';
    } else if (sourcePrefix === 'EU') {
      specificFile = 'eu_sanctions.json';
    } else if (sourcePrefix === 'OFAC' || sourcePrefix === 'US') {
      specificFile = 'us_sanctions.json';
    }
    
    if (specificFile) {
      const filePath = path.join(dataDir, specificFile);
      if (fs.existsSync(filePath)) {
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const sourceData = JSON.parse(fileContent);
          
          // 데이터 구조에 따라 검색
          let foundEntry = null;
          
          if (sourceData.data && Array.isArray(sourceData.data)) {
            foundEntry = sourceData.data.find(entry => entry.id === id);
          }
          
          if (!foundEntry && sourceData.entries && Array.isArray(sourceData.entries)) {
            foundEntry = sourceData.entries.find(entry => entry.id === id);
          }
          
          if (foundEntry) {
            console.log(`원본 파일 ${specificFile}에서 ID '${id}' 항목 찾음`);
            return await enrichSanctionData(foundEntry, dataDir, chunkDir);
          }
        } catch (error) {
          console.warn(`원본 파일 ${specificFile} 검색 오류: ${error.message}`);
        }
      }
    }
    
    // 4. 통합 파일에서 마지막 검색
    const integratedFilePath = path.join(dataDir, 'integrated_sanctions.json');
    if (fs.existsSync(integratedFilePath)) {
      try {
        // 스트림으로 통합 파일을 조금씩 읽기
        const streamSearch = new Promise((resolve, reject) => {
          console.log(`ID '${id}'를 통합 파일에서 스트림으로 검색 시도`);
          
          // 여기서는 스트림 처리 대신 간소화된 방식으로 처리
          try {
            const fileContent = fs.readFileSync(integratedFilePath, 'utf8');
            const data = JSON.parse(fileContent);
            
            let foundEntry = null;
            if (data.data && Array.isArray(data.data)) {
              foundEntry = data.data.find(e => e.id === id);
            } else if (data.entries && Array.isArray(data.entries)) {
              foundEntry = data.entries.find(e => e.id === id);
            }
            
            if (foundEntry) {
              console.log(`통합 파일에서 ID '${id}' 항목 찾음`);
              resolve(foundEntry);
            } else {
              resolve(null);
            }
          } catch (error) {
            console.warn(`통합 파일 검색 오류: ${error.message}`);
            resolve(null);
          }
        });
        
        const foundEntry = await streamSearch;
        if (foundEntry) {
          return await enrichSanctionData(foundEntry, dataDir, chunkDir);
        }
      } catch (error) {
        console.warn(`통합 파일 검색 오류: ${error.message}`);
      }
    }
    
    return null;
  } catch (error) {
    console.error('제재 정보 검색 중 오류:', error);
    return null;
  }
}

/**
 * 제재 정보 데이터 보강
 * @param {Object} entry - 기본 제재 정보
 * @param {string} dataDir - 데이터 디렉토리 경로
 * @param {string} chunkDir - 청크 디렉토리 경로
 * @returns {Object} 보강된 제재 정보
 */
async function enrichSanctionData(entry, dataDir, chunkDir) {
  if (!entry) return null;
  
  // 기존 데이터 깊은 복사
  const result = JSON.parse(JSON.stringify(entry));
  
  try {
    // 출처에 따라 추가 정보 파일 검색
    const sourcePrefix = entry.source?.toLowerCase() || '';
    let foundSourceData = null;
    
    // 청크 디렉토리에서 해당 소스의 청크들 검색
    if (fs.existsSync(chunkDir)) {
      const chunkFiles = fs.readdirSync(chunkDir)
        .filter(file => file.startsWith(sourcePrefix.toLowerCase()) && file !== 'index.json');
      
      for (const chunkFile of chunkFiles) {
        try {
          const chunkPath = path.join(chunkDir, chunkFile);
          const chunkContent = fs.readFileSync(chunkPath, 'utf8');
          const chunkData = JSON.parse(chunkContent);
          
          if (chunkData.data && Array.isArray(chunkData.data)) {
            const sourceEntry = chunkData.data.find(e => e.id === entry.id);
            if (sourceEntry) {
              foundSourceData = sourceEntry;
              break;
            }
          }
        } catch (error) {
          console.warn(`소스 정보 청크 파일 검색 오류: ${error.message}`);
        }
      }
    }
    
    // 청크에서 찾지 못한 경우 원본 파일 검색
    if (!foundSourceData) {
      const sourceFiles = {
        'UN': 'un_sanctions.json',
        'EU': 'eu_sanctions.json',
        'US': 'us_sanctions.json'
      };
      
      const sourceFile = sourceFiles[entry.source];
      if (sourceFile) {
        const sourceFilePath = path.join(dataDir, sourceFile);
        
        if (fs.existsSync(sourceFilePath)) {
          try {
            const fileContent = fs.readFileSync(sourceFilePath, 'utf8');
            const sourceData = JSON.parse(fileContent);
            
            if (sourceData.data && Array.isArray(sourceData.data)) {
              foundSourceData = sourceData.data.find(e => e.id === entry.id);
            }
            
            if (!foundSourceData && sourceData.entries && Array.isArray(sourceData.entries)) {
              foundSourceData = sourceData.entries.find(e => e.id === entry.id);
            }
          } catch (error) {
            console.warn(`원본 소스 파일 검색 오류: ${error.message}`);
          }
        }
      }
    }
    
    // 추가 데이터 병합
    if (foundSourceData) {
      // 상세 정보 병합
      if (foundSourceData.details) {
        result.details = result.details ? 
          { ...result.details, ...foundSourceData.details } : 
          foundSourceData.details;
      }
      
      // 프로그램 정보 병합
      if (foundSourceData.programs && Array.isArray(foundSourceData.programs)) {
        result.programs = result.programs ? 
          Array.from(new Set([...result.programs, ...foundSourceData.programs])) : 
          foundSourceData.programs;
      }
      
      // 별칭 정보 병합
      if (foundSourceData.aliases && Array.isArray(foundSourceData.aliases)) {
        result.aliases = result.aliases ? 
          Array.from(new Set([...result.aliases, ...foundSourceData.aliases])) : 
          foundSourceData.aliases;
      }
      
      // 누락된 필드 보완
      Object.entries(foundSourceData).forEach(([key, value]) => {
        if (result[key] === undefined && key !== 'id') {
          result[key] = value;
        }
      });
    }
    
    // 필수 필드가 누락된 경우 기본값 설정
    if (!result.details) result.details = {};
    if (!result.aliases) result.aliases = [];
    if (!result.programs) result.programs = [];
    
    // 메타 정보 추가
    result.meta = {
      retrievedAt: new Date().toISOString(),
      source: result.source || 'unknown'
    };
    
  } catch (error) {
    console.warn('추가 정보 보강 중 오류:', error);
  }
  
  return result;
} 