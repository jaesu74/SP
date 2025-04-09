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
    
    // 기존 detail-modal 클래스의 요소 모두 제거
    const existingModals = document.querySelectorAll('.detail-modal');
    existingModals.forEach(modal => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    });
}

/**
 * 상세 정보 내용 렌더링
 * @param {HTMLElement} container 내용을 표시할 컨테이너
 * @param {Object} item 제재 대상 정보
 */
function renderDetailContent(container, item) {
    // 데이터 구조 분석 및 깊은 추출
    const details = item.details || {};
    const birthDate = details.birthDate || item.birthDate || '';
    const aliases = details.aliases || item.aliases || [];
    const addresses = details.addresses || item.addresses || [];
    const nationalities = details.nationalities || item.nationalities || [];
    const identifications = details.identifications || item.identifications || [];
    const sanctions = details.sanctions || [];
    const reason = sanctions.length > 0 ? (sanctions[0].reason || '') : (item.reason || '');
    
    // 프로그램 정보 추출
    const programs = Array.isArray(item.programs) ? item.programs : 
                     (item.program ? [item.program] : []);
    
    // 등재일 형식화
    let formattedDate = '알 수 없음';
    if (item.date_listed) {
        const date = new Date(item.date_listed);
        if (!isNaN(date.getTime())) {
            formattedDate = date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            formattedDate = item.date_listed;
        }
    } else if (sanctions.length > 0 && sanctions[0].startDate) {
        const date = new Date(sanctions[0].startDate);
        if (!isNaN(date.getTime())) {
            formattedDate = date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            formattedDate = sanctions[0].startDate;
        }
    }

    // 타입별 클래스 설정
    let typeClass = 'unknown';
    let typeText = '알 수 없음';
    
    if (item.type) {
        const type = item.type.toLowerCase();
        if (type === 'individual' || type === '개인') {
            typeClass = 'individual';
            typeText = '개인';
        } else if (type === 'entity' || type === '단체') {
            typeClass = 'entity';
            typeText = '단체';
        } else if (type === 'vessel' || type === '선박') {
            typeClass = 'vessel';
            typeText = '선박';
        } else if (type === 'aircraft' || type === '항공기') {
            typeClass = 'aircraft';
            typeText = '항공기';
        } else {
            typeText = item.type;
        }
    }

    // 출처 정보 처리
    let sourceInfo = item.source || '알 수 없음';
    if (sourceInfo === 'UN') sourceInfo = '유엔(UN)';
    else if (sourceInfo === 'EU') sourceInfo = '유럽연합(EU)';
    else if (sourceInfo === 'US') sourceInfo = '미국(US/OFAC)';

    // 프로그램 정보 처리
    const programInfo = programs.map(p => {
        if (p === 'DPRK') return '북한 제재';
        if (p === 'RUSSIA') return '러시아 제재';
        if (p === 'IRAN') return '이란 제재';
        if (p === 'SYRIA') return '시리아 제재';
        return p;
    }).join(', ');

    // HTML 내용 생성
    const detailContent = `
        <div class="detail-header">
            <div class="detail-name-container">
                <h2>${item.name || '이름 없음'}</h2>
                <span class="detail-type ${typeClass}">${typeText}</span>
            </div>
            <div class="detail-meta">
                <p><strong>국가:</strong> ${item.country || '알 수 없음'}</p>
                <p><strong>등재일:</strong> ${formattedDate}</p>
                <p><strong>출처:</strong> ${sourceInfo}</p>
                ${programInfo ? `<p><strong>제재 프로그램:</strong> ${programInfo}</p>` : ''}
                ${item.matchScore ? `<p><strong>일치도:</strong> ${item.matchScore}%</p>` : ''}
            </div>
        </div>
        <div class="detail-content">
            ${birthDate ? `
            <div class="detail-section">
                <h3>생년월일</h3>
                <p>${birthDate}</p>
            </div>
            ` : ''}

            ${reason ? `
            <div class="detail-section">
                <h3>제재 사유</h3>
                <p>${reason}</p>
            </div>
            ` : ''}
            
            ${sanctions.length > 0 ? `
            <div class="detail-section">
                <h3>제재 정보</h3>
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>프로그램</th>
                            <th>시작일</th>
                            <th>종료일</th>
                            <th>사유</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sanctions.map(sanction => `
                        <tr>
                            <td>${sanction.program || '-'}</td>
                            <td>${sanction.startDate ? new Date(sanction.startDate).toLocaleDateString('ko-KR') : '-'}</td>
                            <td>${sanction.endDate ? new Date(sanction.endDate).toLocaleDateString('ko-KR') : '진행중'}</td>
                            <td>${sanction.reason || '-'}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
            
            ${aliases && aliases.length > 0 ? `
            <div class="detail-section">
                <h3>별칭</h3>
                <ul class="detail-list">
                    ${aliases.map(alias => `<li>${alias}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${nationalities && nationalities.length > 0 ? `
            <div class="detail-section">
                <h3>국적</h3>
                <ul class="detail-list">
                    ${nationalities.map(nationality => `<li>${nationality}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${addresses && addresses.length > 0 ? `
            <div class="detail-section">
                <h3>주소</h3>
                <ul class="detail-list">
                    ${addresses.map(address => `<li>${address}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${identifications && identifications.length > 0 ? `
            <div class="detail-section">
                <h3>신원 정보</h3>
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>유형</th>
                            <th>번호</th>
                            <th>발급국</th>
                            <th>추가 정보</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${identifications.map(id => `
                        <tr>
                            <td>${id.type || '알 수 없음'}</td>
                            <td>${id.number || '알 수 없음'}</td>
                            <td>${id.country || '알 수 없음'}</td>
                            <td>${id.additional_info || '-'}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            ${item.vessel_info ? `
            <div class="detail-section">
                <h3>선박 정보</h3>
                <table class="detail-table simple">
                    ${item.vessel_info.imo_number ? `<tr><td>IMO 번호</td><td>${item.vessel_info.imo_number}</td></tr>` : ''}
                    ${item.vessel_info.call_sign ? `<tr><td>호출 부호</td><td>${item.vessel_info.call_sign}</td></tr>` : ''}
                    ${item.vessel_info.vessel_type ? `<tr><td>선박 유형</td><td>${item.vessel_info.vessel_type}</td></tr>` : ''}
                    ${item.vessel_info.flag ? `<tr><td>국적기</td><td>${item.vessel_info.flag}</td></tr>` : ''}
                    ${item.vessel_info.tonnage ? `<tr><td>톤수</td><td>${item.vessel_info.tonnage}</td></tr>` : ''}
                </table>
            </div>
            ` : ''}
        </div>
        <div class="detail-actions">
            <button id="close-detail-btn" class="btn btn-secondary">닫기</button>
        </div>
    `;
    
    // 내용 설정
    container.innerHTML = detailContent;
    
    // 버튼 이벤트 리스너 추가
    container.querySelector('#close-detail-btn').addEventListener('click', hideDetail);
}