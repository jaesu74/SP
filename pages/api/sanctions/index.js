// 제재 정보 검색 API
import fs from 'fs';
import path from 'path';
import { calculateStringSimilarity } from '../../../lib/sanctionsService';

export default async function handler(req, res) {
  try {
    // 쿼리 파라미터 확인
    const { q, limit = 100, type, country, source } = req.query;
    const maxResults = parseInt(limit, 10) || 100;
    
    // 검색어 필수
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: '검색어를 입력해주세요.'
      });
    }
    
    // 데이터 디렉토리 경로
    const dataDir = path.join(process.cwd(), 'public/data');
    
    // 모든 제재 데이터 로드 (통합 파일 + 청크 파일)
    const allEntries = await loadAllSanctionsData(dataDir);
    
    // 데이터가 없으면 오류 반환
    if (allEntries.length === 0) {
      return res.status(500).json({
        error: '제재 정보 데이터를 불러올 수 없습니다.'
      });
    }
    
    console.log(`총 ${allEntries.length}개 제재 정보 항목 검색 중...`);
    
    // 검색어 가공 (소문자 및 공백 제거)
    const normQuery = q.toLowerCase().trim();
    const isNumericQuery = /^\d+$/.test(normQuery); // 숫자만 있는지 확인
    
    // 제재 정보 검색
    let results = [];
    
    for (const entry of allEntries) {
      let matchScore = 0;
      const fields = {
        name: entry.name || '',
        aliases: entry.aliases || (entry.details?.aliases || []),
        id: entry.id || '',
        country: entry.country || '',
        type: entry.type || '',
        programs: entry.programs || []
      };
      
      // 이름에서 검색
      const nameSimilarity = calculateStringSimilarity(fields.name, normQuery);
      matchScore = Math.max(matchScore, nameSimilarity);
      
      // ID에서 검색 (숫자 쿼리인 경우)
      if (isNumericQuery && fields.id.includes(normQuery)) {
        matchScore = Math.max(matchScore, 0.95);
      }
      
      // 별칭에서 검색
      if (Array.isArray(fields.aliases)) {
        for (const alias of fields.aliases) {
          const aliasSimilarity = calculateStringSimilarity(alias, normQuery);
          matchScore = Math.max(matchScore, aliasSimilarity);
        }
      }
      
      // 국가에서 검색
      const countrySimilarity = calculateStringSimilarity(fields.country, normQuery);
      matchScore = Math.max(matchScore, countrySimilarity * 0.8); // 국가는 가중치 낮게
      
      // 프로그램 검색
      if (Array.isArray(fields.programs)) {
        for (const program of fields.programs) {
          if (program && typeof program === 'string') {
            const programSimilarity = calculateStringSimilarity(program, normQuery);
            matchScore = Math.max(matchScore, programSimilarity * 0.7);
          }
        }
      }
      
      // 세부 정보 검색 (details 객체 내부)
      if (entry.details) {
        for (const [key, value] of Object.entries(entry.details)) {
          if (value) {
            // 문자열 필드 검색
            if (typeof value === 'string') {
              const detailSimilarity = calculateStringSimilarity(value, normQuery);
              matchScore = Math.max(matchScore, detailSimilarity * 0.6);
            }
            // 배열 필드 검색
            else if (Array.isArray(value)) {
              for (const item of value) {
                if (item && typeof item === 'string') {
                  const itemSimilarity = calculateStringSimilarity(item, normQuery);
                  matchScore = Math.max(matchScore, itemSimilarity * 0.6);
                }
              }
            }
          }
        }
      }
      
      // 필터 적용
      let passesFilter = true;
      
      if (type && fields.type) {
        // INDIVIDUAL => 개인, ENTITY => 기업/단체, VESSEL => 선박, AIRCRAFT => 항공기
        const typeMapping = {
          'INDIVIDUAL': ['개인', 'individual', 'person', 'natural person'],
          'ENTITY': ['기업', '단체', 'entity', 'organization', 'company', 'corporation'],
          'VESSEL': ['선박', 'vessel', 'ship', 'boat'],
          'AIRCRAFT': ['항공기', 'aircraft', 'plane', 'airplane']
        };
        
        const normalizedType = fields.type.toLowerCase();
        
        if (typeMapping[type]) {
          // 타입 매핑에 있는 값 중 하나라도 포함되어 있는지 확인
          passesFilter = typeMapping[type].some(mappedType => 
            normalizedType.includes(mappedType.toLowerCase())
          );
        } else {
          // 직접 일치 여부 확인
          passesFilter = normalizedType === type.toLowerCase();
        }
        
        if (!passesFilter) {
          continue; // 필터 조건에 맞지 않으면 다음 항목으로
        }
      }
      
      if (country && fields.country) {
        // 국가 이름 포함 여부 확인 (대소문자 구분 없이)
        passesFilter = fields.country.toLowerCase().includes(country.toLowerCase());
        
        if (!passesFilter) {
          continue; // 필터 조건에 맞지 않으면 다음 항목으로
        }
      }
      
      if (source && entry.source) {
        // 출처 직접 일치 여부 확인
        passesFilter = entry.source === source;
        
        if (!passesFilter) {
          continue; // 필터 조건에 맞지 않으면 다음 항목으로
        }
      }
      
      // 점수가 0.2 이상이면 결과에 추가
      if (matchScore >= 0.2) {
        results.push({
          ...entry,
          matchScore // 일치 점수 포함
        });
      }
    }
    
    // 일치 점수 기준으로 정렬
    results.sort((a, b) => b.matchScore - a.matchScore);
    
    // 최대 결과 수 제한
    results = results.slice(0, maxResults);
    
    console.log(`검색 결과: ${results.length}개 항목 반환`);
    
    // 결과 반환
    res.status(200).json(results);
  } catch (error) {
    console.error('API 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

/**
 * 모든 제재 데이터를 로드하는 함수
 * @param {string} dataDir - 데이터 디렉토리 경로
 * @returns {Array} 모든 제재 정보 항목
 */
async function loadAllSanctionsData(dataDir) {
  const allEntries = [];
  const processedIds = new Set(); // 중복 방지용
  
  try {
    // 1. 통합 데이터 파일 로드
    const integratedFilePath = path.join(dataDir, 'integrated_sanctions.json');
    if (fs.existsSync(integratedFilePath)) {
      try {
        const integratedData = JSON.parse(fs.readFileSync(integratedFilePath, 'utf8'));
        let entriesLoaded = 0;
        
        // entries 필드 확인
        if (integratedData.entries && Array.isArray(integratedData.entries)) {
          for (const entry of integratedData.entries) {
            if (entry.id && !processedIds.has(entry.id)) {
              allEntries.push(entry);
              processedIds.add(entry.id);
              entriesLoaded++;
            }
          }
        }
        
        // data 필드 확인 (UN 데이터 형식)
        if (integratedData.data && Array.isArray(integratedData.data)) {
          for (const entry of integratedData.data) {
            if (entry.id && !processedIds.has(entry.id)) {
              allEntries.push(entry);
              processedIds.add(entry.id);
              entriesLoaded++;
            }
          }
        }
        
        console.log(`통합 데이터 파일에서 ${entriesLoaded}개 항목 로드`);
      } catch (error) {
        console.warn(`통합 데이터 파일 로드 오류: ${error.message}`);
      }
    }
    
    // 2. 청크 파일들 로드
    const files = fs.readdirSync(dataDir);
    const chunkPattern = /^(un|eu|us)_sanctions_\d+.*\.json$/i;
    
    const chunkFiles = files.filter(file => chunkPattern.test(file));
    console.log(`${chunkFiles.length}개 청크 파일 발견`);
    
    for (const file of chunkFiles) {
      try {
        const chunkFilePath = path.join(dataDir, file);
        const chunkData = JSON.parse(fs.readFileSync(chunkFilePath, 'utf8'));
        let entriesLoaded = 0;
        
        // entries 필드 확인
        if (chunkData.entries && Array.isArray(chunkData.entries)) {
          const prevCount = processedIds.size;
          
          for (const entry of chunkData.entries) {
            if (entry.id && !processedIds.has(entry.id)) {
              allEntries.push(entry);
              processedIds.add(entry.id);
              entriesLoaded++;
            }
          }
        }
        
        // data 필드 확인 (UN 데이터 형식)
        if (chunkData.data && Array.isArray(chunkData.data)) {
          for (const entry of chunkData.data) {
            if (entry.id && !processedIds.has(entry.id)) {
              allEntries.push(entry);
              processedIds.add(entry.id);
              entriesLoaded++;
            }
          }
        }
        
        if (entriesLoaded > 0) {
          console.log(`${file}에서 ${entriesLoaded}개 항목 추가 로드`);
        }
      } catch (error) {
        console.warn(`${file} 로드 오류: ${error.message}`);
      }
    }
    
    // 3. 원본 소스 파일들 로드 (필요한 경우)
    if (allEntries.length === 0) {
      console.log('통합 및 청크 파일에서 데이터를 찾을 수 없어 원본 파일 로드 중...');
      
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
            let entriesLoaded = 0;
            
            // entries 필드 확인
            if (data.entries && Array.isArray(data.entries)) {
              for (const entry of data.entries) {
                if (entry.id && !processedIds.has(entry.id)) {
                  allEntries.push(entry);
                  processedIds.add(entry.id);
                  entriesLoaded++;
                }
              }
            }
            
            // data 필드 확인 (UN 데이터 형식)
            if (data.data && Array.isArray(data.data)) {
              for (const entry of data.data) {
                if (entry.id && !processedIds.has(entry.id)) {
                  allEntries.push(entry);
                  processedIds.add(entry.id);
                  entriesLoaded++;
                }
              }
            }
            
            if (entriesLoaded > 0) {
              console.log(`${file}에서 ${entriesLoaded}개 항목 추가 로드`);
            }
          } catch (error) {
            console.warn(`${file} 로드 오류: ${error.message}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('데이터 로드 중 오류:', error);
  }
  
  return allEntries;
}