/**
 * data-splitter.js - 대용량 데이터 파일 분할 유틸리티
 * 
 * UN, EU, US 제재 데이터 파일을 3MB 이하의 청크로 분할하고
 * 분할된 파일에 대한 색인 정보를 생성합니다.
 */

// 데이터 분할 설정
const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB
const DATA_SOURCES = ['un', 'eu', 'us'];
const DATA_DIR = 'data/';
const SPLIT_DIR = 'data/split/';

/**
 * 데이터 파일 분할 처리
 */
async function splitSanctionsData() {
    console.log('대용량 데이터 파일 분할 시작...');
    
    // 분할 디렉토리 확인 또는 생성
    ensureDirectory(SPLIT_DIR);
    
    // 각 데이터 소스별 분할 처리
    for (const source of DATA_SOURCES) {
        try {
            console.log(`${source} 제재 데이터 분할 처리 중...`);
            
            // 원본 데이터 로드
            const sourceFile = `${DATA_DIR}${source}_sanctions.json`;
            const data = await loadJsonFile(sourceFile);
            
            if (!data) {
                console.warn(`${sourceFile} 파일을 찾을 수 없습니다.`);
                continue;
            }
            
            // 데이터 구조 확인
            let sanctionsData = [];
            
            // 데이터 구조에 따라 처리
            if (data.data && Array.isArray(data.data)) {
                // UN 형식
                sanctionsData = data.data;
            } else if (Array.isArray(data)) {
                // EU, US 형식
                sanctionsData = data;
            } else {
                console.error(`${sourceFile} 파일의 구조를 인식할 수 없습니다.`);
                continue;
            }
            
            // 메타데이터 분리
            const metadata = data.meta || {
                lastUpdated: new Date().toISOString(),
                source: source.toUpperCase(),
                totalEntries: sanctionsData.length,
                version: "1.0"
            };
            
            // 생성할 분할 파일의 수 계산
            const totalItems = sanctionsData.length;
            // 최대 3MB를 기준으로 각 파일에 들어갈 항목 수 추정
            // 평균 항목 크기를 계산하여 청크당 항목 수 결정
            const avgItemSize = JSON.stringify(sanctionsData).length / totalItems;
            const itemsPerChunk = Math.max(1, Math.floor(CHUNK_SIZE / avgItemSize));
            const totalChunks = Math.ceil(totalItems / itemsPerChunk);
            
            console.log(`${source} 데이터: ${totalItems}개 항목, ${totalChunks}개 파일로 분할`);
            
            // 색인 정보
            const index = {
                source: source.toUpperCase(),
                totalItems,
                totalChunks,
                lastUpdated: metadata.lastUpdated,
                chunks: []
            };
            
            // 데이터 분할 처리
            for (let i = 0; i < totalChunks; i++) {
                const start = i * itemsPerChunk;
                const end = Math.min(start + itemsPerChunk, totalItems);
                const chunkData = sanctionsData.slice(start, end);
                
                // 청크 메타데이터
                const chunkMetadata = {
                    chunkIndex: i,
                    totalChunks,
                    itemCount: chunkData.length,
                    startIndex: start,
                    endIndex: end - 1,
                    ...metadata
                };
                
                // 분할 파일 생성
                const chunkFilename = `${source}_sanctions_${i + 1}.json`;
                const chunkContent = {
                    meta: chunkMetadata,
                    data: chunkData
                };
                
                // 파일 저장
                await saveJsonFile(`${SPLIT_DIR}${chunkFilename}`, chunkContent);
                
                // 색인 정보 업데이트
                index.chunks.push({
                    filename: chunkFilename,
                    itemCount: chunkData.length,
                    startIndex: start,
                    endIndex: end - 1
                });
                
                console.log(`${chunkFilename} 파일 생성 완료 (${start+1}~${end}번 항목)`);
            }
            
            // 색인 파일 저장
            await saveJsonFile(`${SPLIT_DIR}${source}_index.json`, index);
            console.log(`${source} 제재 데이터 색인 파일 생성 완료`);
            
        } catch (error) {
            console.error(`${source} 데이터 분할 처리 중 오류 발생:`, error);
        }
    }
    
    console.log('모든 데이터 파일 분할 완료');
}

/**
 * JSON 파일 로드
 */
async function loadJsonFile(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`파일 로드 오류 (${filePath}):`, error);
        return null;
    }
}

/**
 * JSON 파일 저장
 */
async function saveJsonFile(filePath, data) {
    // 브라우저 환경에서는 파일 저장 불가능
    // 실제 구현 시에는 서버 측에서 처리해야 함
    return new Promise((resolve) => {
        console.log(`파일 저장 (${filePath})`);
        resolve();
    });
}

/**
 * 디렉토리 존재 확인 또는 생성
 */
function ensureDirectory(dirPath) {
    // 브라우저 환경에서는 디렉토리 생성 불가능
    // 실제 구현 시에는 서버 측에서 처리해야 함
    console.log(`디렉토리 확인 (${dirPath})`);
}

// 분할 처리 시작
if (typeof module !== 'undefined' && module.exports) {
    // Node.js 환경일 경우
    module.exports = {
        splitSanctionsData
    };
} else {
    // 브라우저 환경일 경우 
    window.dataSplitter = {
        splitSanctionsData
    };
} 