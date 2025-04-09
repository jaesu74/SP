/**
 * detail.js - 제재 대상 상세 정보 표시 컴포넌트
 */

import { showAlert } from '../utils/common.js';
import { getSanctionDetails } from '../services/api.js';
import { getCurrentResults } from './search.js';

let detailModal = null;
let modalOverlay = null;

/**
 * 상세 정보 컴포넌트 초기화
 */
export function initDetailComponent() {
    // 모달 요소 생성
    createModalElements();
    
    // 닫기 이벤트 설정
    setupCloseEvents();
}

/**
 * 모달 요소 생성
 */
function createModalElements() {
    // 이미 존재하는 모달을 찾기
    detailModal = document.getElementById('detail-modal');
    
    // 모달이 없으면 생성
    if (!detailModal) {
        detailModal = document.createElement('div');
        detailModal.id = 'detail-modal';
        detailModal.className = 'modal';
        detailModal.innerHTML = `
            <div class="modal-content maximalist">
                <div class="modal-header">
                    <h2>제재 대상 상세 정보</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="detail-loading">
                        <div class="spinner"></div>
                        <p>정보를 불러오는 중...</p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(detailModal);
    }
    
    // 모달 오버레이 생성
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        document.body.appendChild(modalOverlay);
    }
}

/**
 * 닫기 이벤트 설정
 */
function setupCloseEvents() {
    // 모달 닫기 버튼 클릭 이벤트
    const closeButton = detailModal.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', hideDetail);
    }
    
    // 오버레이 클릭 시 모달 닫기
    modalOverlay.addEventListener('click', hideDetail);
    
    // ESC 키 누르면 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideDetail();
        }
    });
}

/**
 * 상세 정보 표시
 * @param {string} id 제재 대상 ID
 */
export async function showDetail(id) {
    if (!detailModal) {
        initDetailComponent();
    }
    
    // 모달 표시
    modalOverlay.style.display = 'block';
    detailModal.style.display = 'block';
    
    // 내용 초기화
    const modalBody = detailModal.querySelector('.modal-body');
    modalBody.innerHTML = `
        <div class="detail-loading">
            <div class="spinner"></div>
            <p>정보를 불러오는 중...</p>
        </div>
    `;
    
    try {
        // 상세 정보 가져오기
        let item;
        
        // 먼저 검색 결과에서 찾기
        const currentResults = getCurrentResults();
        if (currentResults && currentResults.length > 0) {
            item = currentResults.find(result => result.id === id);
        }
        
        // 검색 결과에 없으면 API 호출
        if (!item) {
            item = await getSanctionDetails(id);
        }
        
        if (!item) {
            throw new Error('상세 정보를 찾을 수 없습니다.');
        }
        
        // 상세 정보 표시
        renderDetailContent(modalBody, item);
        
    } catch (error) {
        console.error('상세 정보 로드 오류:', error);
        modalBody.innerHTML = `
            <div class="detail-error">
                <p>상세 정보를 불러오는데 실패했습니다.</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

/**
 * 상세 정보 모달 숨기기
 */
export function hideDetail() {
    if (modalOverlay) modalOverlay.style.display = 'none';
    if (detailModal) detailModal.style.display = 'none';
}

/**
 * 상세 정보 내용 렌더링
 * @param {HTMLElement} container 내용을 표시할 컨테이너
 * @param {Object} item 제재 대상 정보
 */
function renderDetailContent(container, item) {
    // 기본 정보
    const mainInfo = `
        <div class="detail-header">
            <div class="detail-name-container">
                <h2>${item.name || '이름 없음'}</h2>
                <span class="detail-type ${item.type.toLowerCase()}">${item.type}</span>
            </div>
            <div class="detail-meta">
                <p><strong>국가:</strong> ${item.country || '국가 미상'}</p>
                <p><strong>등재일:</strong> ${formatDetailDate(item.date_listed)}</p>
                <p><strong>출처:</strong> ${item.source || '출처 미상'}</p>
                ${item.programs && item.programs.length > 0 ? 
                    `<p><strong>제재 프로그램:</strong> ${item.programs.join(', ')}</p>` : 
                    ''}
            </div>
        </div>
    `;
    
    // 추가 상세 정보
    let additionalInfo = '';
    
    if (item.details) {
        const details = item.details;
        
        // 별칭 정보
        if (details.aliases && details.aliases.length > 0) {
            additionalInfo += `
                <div class="detail-section">
                    <h3>별칭</h3>
                    <ul class="detail-list">
                        ${details.aliases.map(alias => `<li>${alias}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // 국적 정보
        if (details.nationalities && details.nationalities.length > 0) {
            additionalInfo += `
                <div class="detail-section">
                    <h3>국적</h3>
                    <ul class="detail-list">
                        ${details.nationalities.map(nationality => `<li>${nationality}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // 주소 정보
        if (details.addresses && details.addresses.length > 0) {
            additionalInfo += `
                <div class="detail-section">
                    <h3>주소</h3>
                    <ul class="detail-list">
                        ${details.addresses.map(address => `<li>${address}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // 식별 정보
        if (details.identifications && details.identifications.length > 0) {
            additionalInfo += `
                <div class="detail-section">
                    <h3>식별 정보</h3>
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>유형</th>
                                <th>번호</th>
                                <th>비고</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${details.identifications.map(id => `
                                <tr>
                                    <td>${id.type || '유형 미상'}</td>
                                    <td>${id.number || '번호 미상'}</td>
                                    <td>${id.note || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    }
    
    // 내용 설정
    container.innerHTML = `
        ${mainInfo}
        <div class="detail-content">
            ${additionalInfo || '<p>추가 정보가 없습니다.</p>'}
        </div>
        <div class="detail-actions">
            <button class="btn-primary" id="detail-export">내보내기</button>
            <button class="btn-secondary" id="detail-report">신고하기</button>
        </div>
    `;
    
    // 내보내기 버튼 이벤트
    const exportButton = container.querySelector('#detail-export');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            exportSanctionData(item);
        });
    }
    
    // 신고하기 버튼 이벤트
    const reportButton = container.querySelector('#detail-report');
    if (reportButton) {
        reportButton.addEventListener('click', () => {
            showAlert('신고 기능은 현재 준비 중입니다.', 'info');
        });
    }
}

/**
 * 상세 정보용 날짜 형식 변환
 * @param {string} dateStr ISO 날짜 문자열
 * @returns {string} 형식화된 날짜 문자열
 */
function formatDetailDate(dateStr) {
    if (!dateStr) return '날짜 정보 없음';
    
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}

/**
 * 제재 데이터 내보내기
 * @param {Object} item 제재 대상 정보
 */
function exportSanctionData(item) {
    try {
        // JSON 형식으로 변환
        const dataStr = JSON.stringify(item, null, 2);
        
        // Blob 생성
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        // 다운로드 링크 생성
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sanction_${item.id}.json`;
        
        // 클릭 이벤트 발생
        document.body.appendChild(link);
        link.click();
        
        // 정리
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showAlert('제재 데이터가 성공적으로 내보내졌습니다.', 'success');
    } catch (error) {
        console.error('데이터 내보내기 오류:', error);
        showAlert('데이터 내보내기 중 오류가 발생했습니다.', 'error');
    }
} 