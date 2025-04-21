// 제재 정보 검색 API
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // 쿼리 파라미터 가져오기
    const { q, limit = 100, type, country, source } = req.query;
    
    // 검색어 확인
    if (!q) {
      return res.status(400).json({ error: "검색어가 필요합니다." });
    }
    
    // 데이터 디렉토리 경로
    const dataDir = path.join(process.cwd(), 'public/data');
    const chunkDir = path.join(dataDir, 'chunks');
    
    // 결과 배열 초기화
    let results = [];
    const seenIds = new Set(); // 중복 항목 방지용
    
    // 1. 청크 파일 사용
    if (fs.existsSync(chunkDir)) {
      try {
        console.log("청크 디렉토리에서 데이터 로드 중...");
        const chunkFiles = fs.readdirSync(chunkDir).filter(file => file !== 'index.json');
        
        // 출처 필터가 있으면 해당 출처 청크만 선택
        const filteredChunks = source
          ? chunkFiles.filter(file => file.toLowerCase().startsWith(source.toLowerCase()))
          : chunkFiles;
        
        console.log(`${filteredChunks.length}개 청크 파일에서 검색 중...`);
        
        // 청크 파일을 순회하며 검색
        for (const chunkFile of filteredChunks) {
          try {
            const chunkPath = path.join(chunkDir, chunkFile);
            const chunkContent = fs.readFileSync(chunkPath, 'utf8');
            const chunkData = JSON.parse(chunkContent);
            
            if (chunkData.data && Array.isArray(chunkData.data)) {
              // 검색 및 필터링
              const chunkResults = chunkData.data.filter(entry => {
                // 이미 결과에 포함된 ID인지 확인
                if (seenIds.has(entry.id)) {
                  return false;
                }
                
                // 기본 텍스트 검색
                const matchesQuery = (
                  (entry.name && entry.name.toLowerCase().includes(q.toLowerCase())) ||
                  (entry.details?.birthDate && entry.details.birthDate.toString().includes(q)) ||
                  (entry.aliases && entry.aliases.some(alias => alias.toLowerCase().includes(q.toLowerCase()))) ||
                  (entry.country && entry.country.toLowerCase().includes(q.toLowerCase())) ||
                  (entry.id && entry.id.toLowerCase().includes(q.toLowerCase()))
                );
                
                if (!matchesQuery) return false;
                
                // 유형 필터링
                if (type && entry.type !== type) return false;
                
                // 국가 필터링
                if (country && (!entry.country || !entry.country.toLowerCase().includes(country.toLowerCase()))) {
                  return false;
                }
                
                // 출처 필터링은 이미 파일명으로 처리했으므로 스킵

                // 결과에 포함할 항목
                seenIds.add(entry.id);
                return true;
              });
              
              results = [...results, ...chunkResults];
              
              // 결과 개수 제한 확인
              if (results.length >= parseInt(limit)) {
                console.log(`검색 결과가 한도(${limit})에 도달했습니다.`);
                break;
              }
            }
          } catch (error) {
            console.warn(`${chunkFile} 처리 중 오류: ${error.message}`);
          }
        }
      } catch (error) {
        console.warn(`청크 디렉토리 검색 오류: ${error.message}`);
      }
    }
    
    // 2. 청크 파일로 충분한 결과를 얻지 못한 경우 통합 파일 검색
    if (results.length < parseInt(limit) && fs.existsSync(path.join(dataDir, 'integrated_sanctions.json'))) {
      try {
        console.log("결과가 충분하지 않아 통합 파일에서 추가 검색 중...");
        const integratedFilePath = path.join(dataDir, 'integrated_sanctions.json');
        
        // 통합 파일 크기 확인
        const stats = fs.statSync(integratedFilePath);
        const fileSizeMB = stats.size / (1024 * 1024);
        console.log(`통합 파일 크기: ${fileSizeMB.toFixed(2)}MB`);
        
        // 통합 파일이 너무 큰 경우 추가 검색 건너뛰기
        if (fileSizeMB > 50) {
          console.log("통합 파일이 너무 커서 청크 결과만 반환합니다.");
        } else {
          // 통합 파일을 읽어서 추가 검색
          const fileContent = fs.readFileSync(integratedFilePath, 'utf8');
          const sanctionsData = JSON.parse(fileContent);
          
          // 통합 데이터 항목 확인
          let entries = [];
          if (sanctionsData.data && Array.isArray(sanctionsData.data)) {
            entries = sanctionsData.data;
          } else if (sanctionsData.entries && Array.isArray(sanctionsData.entries)) {
            entries = sanctionsData.entries;
          }
          
          console.log(`통합 파일에서 ${entries.length}개 항목 검색 중...`);
          
          // 검색 및 필터링
          const additionalResults = entries.filter(entry => {
            // 이미 결과에 포함된 ID는 제외
            if (seenIds.has(entry.id)) {
              return false;
            }
            
            // 기본 텍스트 검색
            const matchesQuery = (
              (entry.name && entry.name.toLowerCase().includes(q.toLowerCase())) ||
              (entry.details?.birthDate && entry.details.birthDate.toString().includes(q)) ||
              (entry.aliases && entry.aliases.some(alias => alias.toLowerCase().includes(q.toLowerCase()))) ||
              (entry.country && entry.country.toLowerCase().includes(q.toLowerCase())) ||
              (entry.id && entry.id.toLowerCase().includes(q.toLowerCase()))
            );
            
            if (!matchesQuery) return false;
            
            // 유형 필터링
            if (type && entry.type !== type) return false;
            
            // 국가 필터링
            if (country && (!entry.country || !entry.country.toLowerCase().includes(country.toLowerCase()))) {
              return false;
            }
            
            // 출처 필터링
            if (source && entry.source !== source) return false;
            
            // 결과에 포함할 항목
            seenIds.add(entry.id);
            return true;
          });
          
          // 결과 추가 (한도 내에서만)
          const remainingLimit = parseInt(limit) - results.length;
          results = [...results, ...additionalResults.slice(0, remainingLimit)];
        }
      } catch (error) {
        console.warn(`통합 파일 검색 오류: ${error.message}`);
      }
    }
    
    console.log(`검색 결과: ${results.length}개 항목 반환`);
    
    // 응답 반환
    res.status(200).json(results);
  } catch (error) {
    console.error("API 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}