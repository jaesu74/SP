/**
 * WVL Sanctions Data Updater
 * 제재 데이터 업데이트 스크립트
 * 
 * 참고: 이 스크립트는 브라우저에서 직접 실행하지 않고,
 * 별도의 Node.js 환경에서 실행하거나 CRON 작업으로 설정해야 합니다.
 */

// Node.js 환경에서 실행할 때 필요한 모듈
// const fs = require('fs');
// const path = require('path');
// const axios = require('axios');

// 각 기관별 제재 데이터 API URL
const API_URLS = {
  // UN 제재 리스트
  UN: 'https://api.un.org/sc/1267/sanctions/assets',
  
  // OFAC 제재 리스트
  OFAC: 'https://sanctionssearch.ofac.treas.gov/Api/Search/GetAllNonSDNData',
  
  // EU 제재 리스트
  EU: 'https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=dG9rZW4tMjMxMg',
  
  // 한국 제재 리스트 (가상의 URL, 실제 API 사용 시 변경 필요)
  KR: 'https://api.example.or.kr/sanctions/list'
};

// 제재 데이터 파일 경로
const SANCTIONS_FILE_PATH = './data/sanctions.json';

/**
 * 데이터 업데이트 메인 함수
 */
async function updateSanctionsData() {
  console.log('제재 데이터 업데이트 시작...');
  
  try {
    // 기존 데이터 불러오기
    const existingData = await loadExistingData();
    
    // 각 소스별로 새 데이터 가져오기
    const newData = await fetchAllSources();
    
    // 데이터 병합
    const mergedData = mergeData(existingData, newData);
    
    // 데이터 저장
    await saveData(mergedData);
    
    console.log('제재 데이터 업데이트 완료!');
    console.log(`총 ${mergedData.data.length}개 항목, 마지막 업데이트: ${mergedData.meta.lastUpdated}`);
    
    return mergedData;
  } catch (error) {
    console.error('제재 데이터 업데이트 실패:', error);
    throw error;
  }
}

/**
 * 기존 데이터 불러오기
 */
async function loadExistingData() {
  try {
    // 브라우저 환경에서는 fetch 사용
    const response = await fetch(SANCTIONS_FILE_PATH);
    if (!response.ok) {
      throw new Error(`파일 로드 실패: ${response.status}`);
    }
    return await response.json();
    
    // Node.js 환경에서는 아래 코드 사용
    // const data = fs.readFileSync(SANCTIONS_FILE_PATH, 'utf8');
    // return JSON.parse(data);
  } catch (error) {
    console.warn('기존 데이터 로드 실패, 새 데이터 생성:', error.message);
    
    // 기본 데이터 구조 반환
    return {
      meta: {
        lastUpdated: new Date().toISOString(),
        sources: [],
        totalEntries: 0
      },
      data: []
    };
  }
}

/**
 * 모든 소스에서 데이터 가져오기
 */
async function fetchAllSources() {
  const results = {
    meta: {
      lastUpdated: new Date().toISOString(),
      sources: [],
      totalEntries: 0
    },
    data: []
  };
  
  // 각 소스별로 병렬 처리
  const sourcePromises = Object.entries(API_URLS).map(async ([source, url]) => {
    try {
      console.log(`${source} 데이터 가져오는 중...`);
      const sourceData = await fetchSourceData(source, url);
      
      if (sourceData && sourceData.length > 0) {
        console.log(`${source} 데이터 ${sourceData.length}건 로드 완료`);
        
        // 메타데이터 업데이트
        results.meta.sources.push(source);
        results.meta.totalEntries += sourceData.length;
        
        // 데이터 추가
        results.data = results.data.concat(sourceData);
      } else {
        console.warn(`${source} 데이터 없음`);
      }
    } catch (error) {
      console.error(`${source} 데이터 가져오기 실패:`, error.message);
    }
  });
  
  // 모든 소스 처리 대기
  await Promise.all(sourcePromises);
  
  return results;
}

/**
 * 특정 소스에서 데이터 가져오기
 */
async function fetchSourceData(source, url) {
  try {
    // 실제 API 호출 구현 (각 소스별로 파싱 로직 다름)
    // 브라우저 환경에서는 fetch 사용
    // const response = await fetch(url);
    // if (!response.ok) {
    //   throw new Error(`API 요청 실패: ${response.status}`);
    // }
    // const data = await response.json();
    
    // Node.js 환경에서는 아래 코드 사용
    // const response = await axios.get(url);
    // const data = response.data;
    
    // 여기서는 예시로 더미 데이터 반환
    return getDummyData(source);
  } catch (error) {
    console.error(`${source} 데이터 가져오기 중 오류:`, error);
    return [];
  }
}

/**
 * 데이터 병합
 */
function mergeData(existingData, newData) {
  // 업데이트된 메타데이터
  const meta = {
    lastUpdated: new Date().toISOString(),
    sources: Array.from(new Set([...existingData.meta.sources, ...newData.meta.sources])),
    totalEntries: 0
  };
  
  // ID를 키로 하는 맵 생성
  const itemsMap = new Map();
  
  // 기존 데이터 맵에 추가
  if (existingData.data && Array.isArray(existingData.data)) {
    existingData.data.forEach(item => {
      if (item.id) {
        itemsMap.set(item.id, item);
      }
    });
  }
  
  // 새 데이터로 맵 업데이트 (중복 시 덮어쓰기)
  if (newData.data && Array.isArray(newData.data)) {
    newData.data.forEach(item => {
      if (item.id) {
        itemsMap.set(item.id, item);
      }
    });
  }
  
  // 맵에서 배열로 변환
  const mergedData = Array.from(itemsMap.values());
  
  // 총 항목 수 업데이트
  meta.totalEntries = mergedData.length;
  
  return {
    meta,
    data: mergedData
  };
}

/**
 * 데이터 저장
 */
async function saveData(data) {
  // 브라우저 환경에서는 다운로드 또는 서버 API 호출 필요
  // 여기서는 로그만 출력
  console.log('데이터 저장 (실제 구현은 환경에 따라 다름)');
  
  // Node.js 환경에서는 아래 코드 사용
  // const jsonData = JSON.stringify(data, null, 2);
  // fs.writeFileSync(SANCTIONS_FILE_PATH, jsonData, 'utf8');
}

/**
 * 테스트용 더미 데이터 생성
 */
function getDummyData(source) {
  // 실제 구현에서는 제거, 테스트용
  const count = Math.floor(Math.random() * 10) + 5;
  const items = [];
  
  for (let i = 0; i < count; i++) {
    const id = `${source}-${Date.now()}-${i}`;
    
    items.push({
      id,
      name: `테스트 항목 ${id}`,
      type: Math.random() > 0.5 ? '개인' : '기관/기업',
      country: '테스트 국가',
      programs: [`${source}-SANCTIONS`],
      source,
      matchScore: Math.floor(Math.random() * 100),
      details: {
        aliases: [`별칭 1 for ${id}`, `별칭 2 for ${id}`],
        birthDate: '2000-01-01',
        sanctions: [
          {
            program: `${source}-SANCTIONS`,
            startDate: new Date().toISOString().split('T')[0],
            reason: '테스트 제재 사유'
          }
        ]
      }
    });
  }
  
  return items;
}

// 브라우저 환경에서 직접 실행하는 경우
if (typeof window !== 'undefined') {
  // 전역 객체에 함수 노출
  window.updateSanctionsData = updateSanctionsData;
}

// Node.js 환경에서 모듈로 내보내는 경우
if (typeof module !== 'undefined') {
  module.exports = {
    updateSanctionsData
  };
} 