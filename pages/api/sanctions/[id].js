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
    
    // ID로 제재 정보 찾기
    const sanctionEntry = await findSanctionById(id, dataDir);
    
    if (!sanctionEntry) {
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
 * @returns {Promise<Object|null>} 제재 정보 객체 또는 null
 */
async function findSanctionById(id, dataDir) {
  try {
    console.log(`ID '${id}'로 제재 정보 검색 중...`);
    
    // 1. 통합 데이터 파일에서 검색
    const integratedFilePath = path.join(dataDir, 'integrated_sanctions.json');
    if (fs.existsSync(integratedFilePath)) {
      try {
        const integratedData = JSON.parse(fs.readFileSync(integratedFilePath, 'utf8'));
        if (integratedData.entries && Array.isArray(integratedData.entries)) {
          const entry = integratedData.entries.find(entry => entry.id === id);
          if (entry) {
            console.log(`통합 데이터 파일에서 ID '${id}' 항목 찾음`);
            return enrichSanctionData(entry, dataDir);
          }
        }
      } catch (error) {
        console.warn(`통합 데이터 파일 검색 오류: ${error.message}`);
      }
    }
    
    // 2. 청크 파일들에서 검색
    const files = fs.readdirSync(dataDir);
    const chunkPattern = /^(un|eu|us)_sanctions_\d+.*\.json$/i;
    
    const chunkFiles = files.filter(file => chunkPattern.test(file));
    
    for (const file of chunkFiles) {
      try {
        const chunkFilePath = path.join(dataDir, file);
        const chunkData = JSON.parse(fs.readFileSync(chunkFilePath, 'utf8'));
        
        if (chunkData.entries && Array.isArray(chunkData.entries)) {
          const entry = chunkData.entries.find(entry => entry.id === id);
          if (entry) {
            console.log(`${file}에서 ID '${id}' 항목 찾음`);
            return enrichSanctionData(entry, dataDir);
          }
        }
      } catch (error) {
        console.warn(`${file} 검색 오류: ${error.message}`);
      }
    }
    
    // 3. 원본 소스 파일들에서 검색
    const sourceFiles = [
      'un_sanctions.json',
      'eu_sanctions.json',
      'us_sanctions.json'
    ];
    
    for (const file of sourceFiles) {
      const filePath = path.join(dataDir, file);
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (data.entries && Array.isArray(data.entries)) {
            const entry = data.entries.find(entry => entry.id === id);
            if (entry) {
              console.log(`${file}에서 ID '${id}' 항목 찾음`);
              return enrichSanctionData(entry, dataDir);
            }
          }
        } catch (error) {
          console.warn(`${file} 검색 오류: ${error.message}`);
        }
      }
    }
    
    console.log(`ID '${id}'의 제재 정보를 찾을 수 없음`);
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
 * @returns {Object} 보강된 제재 정보
 */
async function enrichSanctionData(entry, dataDir) {
  if (!entry) return null;
  
  // 기존 데이터 깊은 복사
  const result = JSON.parse(JSON.stringify(entry));
  
  try {
    // 출처에 따라 추가 정보 파일 검색
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
          const sourceData = JSON.parse(fs.readFileSync(sourceFilePath, 'utf8'));
          const sourceEntry = sourceData.entries?.find(e => e.id === entry.id);
          
          if (sourceEntry) {
            // 상세 정보 병합
            if (sourceEntry.details) {
              result.details = result.details ? 
                { ...result.details, ...sourceEntry.details } : 
                sourceEntry.details;
            }
            
            // 프로그램 정보 병합
            if (sourceEntry.programs && Array.isArray(sourceEntry.programs)) {
              result.programs = result.programs ? 
                Array.from(new Set([...result.programs, ...sourceEntry.programs])) : 
                sourceEntry.programs;
            }
            
            // 별칭 정보 병합
            if (sourceEntry.aliases && Array.isArray(sourceEntry.aliases)) {
              result.aliases = result.aliases ? 
                Array.from(new Set([...result.aliases, ...sourceEntry.aliases])) : 
                sourceEntry.aliases;
            }
            
            // 누락된 필드 보완
            Object.entries(sourceEntry).forEach(([key, value]) => {
              if (result[key] === undefined && key !== 'id') {
                result[key] = value;
              }
            });
            
            console.log(`${sourceFile}에서 추가 정보 병합 완료`);
          }
        } catch (error) {
          console.warn(`${sourceFile} 추가 정보 로드 오류: ${error.message}`);
        }
      }
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