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
    // 기존 모달 제거 (중복 방지)
    removeExistingModals();
    
    // 모달 요소 생성
    createModalElements();
    
    // 닫기 이벤트 설정
    setupCloseEvents();
}

/**
 * 기존 모달 제거
 */
function removeExistingModals() {
    // id로 찾기
    const existingModal = document.getElementById('detail-modal');
    if (existingModal) {
        existingModal.parentNode.removeChild(existingModal);
    }
    
    // 클래스로 찾기
    const existingModals = document.querySelectorAll('.detail-modal');
    existingModals.forEach(modal => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    });
}

/**
 * 모달 요소 생성
 */
function createModalElements() {
    // 모달 생성
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
    
    // 모달 오버레이 생성
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    document.body.appendChild(modalOverlay);
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
    if (modalOverlay) {
        modalOverlay.addEventListener('click', hideDetail);
    }
    
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
    console.log('상세 정보 표시 요청:', id);
    
    // 초기화되지 않았으면 초기화
    if (!detailModal || !modalOverlay) {
        initDetailComponent();
    }
    
    // 모달 및 오버레이 표시
    if (modalOverlay) modalOverlay.style.display = 'block';
    if (detailModal) detailModal.style.display = 'block';
    
    // 내용 초기화
    const modalBody = detailModal.querySelector('.modal-body');
    if (!modalBody) {
        console.error('모달 본문을 찾을 수 없습니다.');
        return;
    }
    
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
        
        console.log('상세 정보 로드 완료:', item);
        
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
    console.log('상세 정보 렌더링:', item);
    
    // 필수 필드 확인 및 기본값 설정
    const name = item.name || '이름 없음';
    const type = item.type || 'UNKNOWN';
    const country = item.country || '미상';
    const source = item.source || '';
    
    // 데이터 구조 분석 및 깊은 추출
    const details = item.details || {};
    const birthDate = details.birthDate || item.birthDate || '';
    const birthPlace = details.birthPlace || item.birthPlace || '';
    const aliases = details.aliases || item.aliases || [];
    const addresses = details.addresses || item.addresses || [];
    const nationalities = details.nationalities || item.nationalities || [];
    const identifications = details.identifications || item.identifications || [];
    
    // 제재 정보 추출
    const sanctions = details.sanctions || [];
    const reason = item.reason || 
                  (sanctions.length > 0 ? (sanctions[0].reason || '') : '') || 
                  '제재 사유 미상';
    
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
    }
    
    // 유형에 따른 클래스 설정
    let typeClass = '';
    switch(type.toLowerCase()) {
        case 'individual':
            typeClass = 'individual';
            break;
        case 'entity':
            typeClass = 'entity';
            break;
        case 'vessel':
            typeClass = 'vessel';
            break;
        case 'aircraft':
            typeClass = 'aircraft';
            break;
        default:
            typeClass = 'unknown';
    }
    
    // 컨테이너에 HTML 생성
    container.innerHTML = `
        <div class="detail-container">
            <div class="detail-header">
                <div class="detail-title">
                    <h3>${name}</h3>
                    <span class="detail-type ${typeClass}">${type}</span>
                </div>
                <div class="detail-actions">
                    <button class="btn-pdf" onclick="window.generatePDF()">PDF 다운로드</button>
                </div>
            </div>
            
            <div class="detail-section">
                <h4 class="section-title">기본 정보</h4>
                <div class="detail-data">
                    <div class="data-item">
                        <span class="data-label">국가:</span>
                        <span class="data-value">${country}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">등재일:</span>
                        <span class="data-value">${formattedDate}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">출처:</span>
                        <span class="data-value">${source}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">제재 프로그램:</span>
                        <span class="data-value">${programs.join(', ') || '정보 없음'}</span>
                    </div>
                    ${type.toLowerCase() === 'individual' ? `
                    <div class="data-item">
                        <span class="data-label">생년월일:</span>
                        <span class="data-value">${birthDate || '정보 없음'}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">출생지:</span>
                        <span class="data-value">${birthPlace || '정보 없음'}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="detail-section">
                <h4 class="section-title">제재 사유</h4>
                <div class="detail-data">
                    <div class="data-item reason">
                        <div class="data-value">${reason || '제재 사유 정보 없음'}</div>
                    </div>
                </div>
            </div>
            
            ${aliases.length > 0 ? `
            <div class="detail-section">
                <h4 class="section-title">별칭</h4>
                <div class="detail-data">
                    <ul class="aliases-list">
                        ${aliases.map(alias => `<li>${alias}</li>`).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}
            
            ${nationalities.length > 0 ? `
            <div class="detail-section">
                <h4 class="section-title">국적</h4>
                <div class="detail-data">
                    <ul class="aliases-list">
                        ${nationalities.map(nationality => `<li>${nationality}</li>`).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}
            
            ${addresses.length > 0 ? `
            <div class="detail-section">
                <h4 class="section-title">주소</h4>
                <div class="detail-data">
                    <ul class="addresses-list">
                        ${addresses.map(address => `<li>${address}</li>`).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}
            
            ${identifications.length > 0 ? `
            <div class="detail-section">
                <h4 class="section-title">식별 정보</h4>
                <div class="detail-data">
                    <ul class="id-list">
                        ${identifications.map(id => `
                            <li>
                                <strong>${id.type || '기타'}</strong>: ${id.number || '번호 없음'}
                                ${id.country ? ` (${id.country})` : ''}
                                ${id.issueDate ? ` 발급일: ${id.issueDate}` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}
            
            ${sanctions.length > 0 ? `
            <div class="detail-section">
                <h4 class="section-title">제재 내역</h4>
                <div class="detail-data">
                    <ul class="sanctions-list">
                        ${sanctions.map(sanction => `
                            <li>
                                <strong>${sanction.program || '제재 프로그램 미상'}</strong>
                                ${sanction.startDate ? ` - 시작일: ${sanction.startDate}` : ''}
                                ${sanction.endDate ? ` - 종료일: ${sanction.endDate}` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    // PDF 생성 함수를 전역 객체에 등록
    window.generatePDF = () => generatePDF(item);
}

/**
 * PDF 파일 생성
 * @param {Object} item 제재 대상 정보
 */
function generatePDF(item) {
    try {
        // jsPDF 라이브러리가 로드되었는지 확인
        if (typeof jsPDF === 'undefined') {
            // 라이브러리 로드
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            document.head.appendChild(script);
            
            script.onload = () => {
                // 스크립트 로드 완료 후 PDF 생성 시도
                setTimeout(() => generatePDF(item), 100);
            };
            
            return showAlert('PDF 생성을 위한 라이브러리를 로드 중입니다. 잠시 후 다시 시도하세요.', 'info');
        }
        
        // 필수 필드 확인 및 기본값 설정
        const name = item.name || '이름 없음';
        const type = item.type || 'UNKNOWN';
        const country = item.country || '미상';
        const source = item.source || '';
        
        // 데이터 구조 분석 및 깊은 추출
        const details = item.details || {};
        const birthDate = details.birthDate || item.birthDate || '';
        const birthPlace = details.birthPlace || item.birthPlace || '';
        const aliases = details.aliases || item.aliases || [];
        const addresses = details.addresses || item.addresses || [];
        const nationalities = details.nationalities || item.nationalities || [];
        const identifications = details.identifications || item.identifications || [];
        
        // 제재 정보 추출
        const sanctions = details.sanctions || [];
        const reason = item.reason || 
                      (sanctions.length > 0 ? (sanctions[0].reason || '') : '') || 
                      '제재 사유 미상';
        
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
        }
        
        // PDF 생성
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // 페이지 상단 제목
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text('제재 대상 상세 정보', 105, 15, { align: 'center' });
        
        // 이름과 유형
        doc.setFontSize(16);
        doc.setTextColor(60, 60, 60);
        doc.text(name, 15, 25);
        
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.text(`유형: ${type}`, 15, 35);
        
        // 기본 정보
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('1. 기본 정보', 15, 45);
        
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.text(`국가: ${country}`, 20, 55);
        doc.text(`등재일: ${formattedDate}`, 20, 62);
        doc.text(`출처: ${source}`, 20, 69);
        doc.text(`제재 프로그램: ${programs.join(', ') || '정보 없음'}`, 20, 76);
        
        if (type.toLowerCase() === 'individual') {
            doc.text(`생년월일: ${birthDate || '정보 없음'}`, 20, 83);
            doc.text(`출생지: ${birthPlace || '정보 없음'}`, 20, 90);
        }
        
        // 제재 사유
        let yPos = type.toLowerCase() === 'individual' ? 100 : 83;
        
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('2. 제재 사유', 15, yPos);
        
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        
        // 긴 텍스트 래핑 처리
        const reasonLines = doc.splitTextToSize(reason || '제재 사유 정보 없음', 170);
        doc.text(reasonLines, 20, yPos + 10);
        
        yPos += 10 + (reasonLines.length * 7);
        
        // 별칭
        if (aliases && aliases.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text('3. 별칭', 15, yPos);
            
            doc.setFontSize(12);
            doc.setTextColor(80, 80, 80);
            
            aliases.forEach((alias, index) => {
                doc.text(`- ${alias}`, 20, yPos + 10 + (index * 7));
            });
            
            yPos += 10 + (aliases.length * 7);
        }
        
        // 국적
        if (nationalities && nationalities.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text('4. 국적', 15, yPos);
            
            doc.setFontSize(12);
            doc.setTextColor(80, 80, 80);
            
            nationalities.forEach((nationality, index) => {
                doc.text(`- ${nationality}`, 20, yPos + 10 + (index * 7));
            });
            
            yPos += 10 + (nationalities.length * 7);
        }
        
        // 페이지 초과 시 새 페이지 추가
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        
        // 주소
        if (addresses && addresses.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text('5. 주소', 15, yPos);
            
            doc.setFontSize(12);
            doc.setTextColor(80, 80, 80);
            
            let addressYPos = yPos + 10;
            addresses.forEach((address) => {
                const addressLines = doc.splitTextToSize(`- ${address}`, 170);
                doc.text(addressLines, 20, addressYPos);
                addressYPos += addressLines.length * 7;
                
                // 페이지 초과 시 새 페이지 추가
                if (addressYPos > 280) {
                    doc.addPage();
                    addressYPos = 20;
                }
            });
            
            yPos = addressYPos + 5;
        }
        
        // 페이지 초과 시 새 페이지 추가
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        
        // 식별 정보
        if (identifications && identifications.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text('6. 식별 정보', 15, yPos);
            
            doc.setFontSize(12);
            doc.setTextColor(80, 80, 80);
            
            let idYPos = yPos + 10;
            identifications.forEach((id) => {
                let idText = `- ${id.type || '기타'}: ${id.number || '번호 없음'}`;
                if (id.country) idText += ` (${id.country})`;
                if (id.issueDate) idText += ` 발급일: ${id.issueDate}`;
                
                const idLines = doc.splitTextToSize(idText, 170);
                doc.text(idLines, 20, idYPos);
                idYPos += idLines.length * 7;
                
                // 페이지 초과 시 새 페이지 추가
                if (idYPos > 280) {
                    doc.addPage();
                    idYPos = 20;
                }
            });
            
            yPos = idYPos + 5;
        }
        
        // 페이지 초과 시 새 페이지 추가
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        
        // 제재 내역
        if (sanctions && sanctions.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text('7. 제재 내역', 15, yPos);
            
            doc.setFontSize(12);
            doc.setTextColor(80, 80, 80);
            
            let sanctionYPos = yPos + 10;
            sanctions.forEach((sanction) => {
                let sanctionText = `- ${sanction.program || '제재 프로그램 미상'}`;
                if (sanction.startDate) sanctionText += ` - 시작일: ${sanction.startDate}`;
                if (sanction.endDate) sanctionText += ` - 종료일: ${sanction.endDate}`;
                
                const sanctionLines = doc.splitTextToSize(sanctionText, 170);
                doc.text(sanctionLines, 20, sanctionYPos);
                sanctionYPos += sanctionLines.length * 7;
                
                // 페이지 초과 시 새 페이지 추가
                if (sanctionYPos > 280) {
                    doc.addPage();
                    sanctionYPos = 20;
                }
            });
        }
        
        // 푸터 - 생성 날짜
        const today = new Date();
        const dateStr = today.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text(`생성일: ${dateStr} - 페이지 ${i}/${pageCount}`, 105, 290, { align: 'center' });
        }
        
        // 파일명 설정 및 다운로드
        const filename = `${name}_${source}_제재정보.pdf`;
        doc.save(filename);
        
        showAlert('PDF 다운로드가 시작되었습니다.', 'success');
    } catch (error) {
        console.error('PDF 생성 오류:', error);
        showAlert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
} 