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
        renderDetailContent(item);
        
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
 * @param {Object} item 제재 대상 정보
 */
function renderDetailContent(item) {
    // Format the listing date if available
    let formattedDate = 'Unknown';
    if (item.date_listed) {
        const date = new Date(item.date_listed);
        formattedDate = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Set the appropriate type class
    let typeClass = 'unknown';
    let typeText = 'Unknown';
    
    if (item.type) {
        const type = item.type.toLowerCase();
        if (type === 'individual') {
            typeClass = 'individual';
            typeText = 'Individual';
        } else if (type === 'entity') {
            typeClass = 'entity';
            typeText = 'Entity';
        } else if (type === 'vessel') {
            typeClass = 'vessel';
            typeText = 'Vessel';
        } else if (type === 'aircraft') {
            typeClass = 'aircraft';
            typeText = 'Aircraft';
        }
    }

    // Create detail HTML content
    let detailHTML = `
        <div class="detail-modal">
            <div class="detail-close"></div>
            <div class="detail-container">
                <div class="detail-header">
                    <div class="detail-name-container">
                        <h2>${item.name || 'Unknown Name'}</h2>
                        <span class="detail-type ${typeClass}">${typeText}</span>
                    </div>
                    <div class="detail-meta">
                        <p><strong>Country:</strong> ${item.country || 'Unknown'}</p>
                        <p><strong>Listed Date:</strong> ${formattedDate}</p>
                        <p><strong>Source:</strong> ${item.source || 'Unknown'}</p>
                        <p><strong>Program:</strong> ${item.program || 'N/A'}</p>
                    </div>
                </div>
                <div class="detail-content">
                    ${item.reason ? `
                    <div class="detail-section">
                        <h3>Reason for Listing</h3>
                        <p>${item.reason}</p>
                    </div>
                    ` : ''}
                    
                    ${item.aliases && item.aliases.length > 0 ? `
                    <div class="detail-section">
                        <h3>Also Known As</h3>
                        <ul class="detail-list">
                            ${item.aliases.map(alias => `<li>${alias}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${item.nationalities && item.nationalities.length > 0 ? `
                    <div class="detail-section">
                        <h3>Nationalities</h3>
                        <ul class="detail-list">
                            ${item.nationalities.map(nationality => `<li>${nationality}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${item.addresses && item.addresses.length > 0 ? `
                    <div class="detail-section">
                        <h3>Addresses</h3>
                        <ul class="detail-list">
                            ${item.addresses.map(address => `<li>${address}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${item.identifications && item.identifications.length > 0 ? `
                    <div class="detail-section">
                        <h3>Identification</h3>
                        <table class="detail-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Number</th>
                                    <th>Country</th>
                                    <th>Additional Info</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${item.identifications.map(id => `
                                <tr>
                                    <td>${id.type || 'N/A'}</td>
                                    <td>${id.number || 'N/A'}</td>
                                    <td>${id.country || 'N/A'}</td>
                                    <td>${id.additional_info || 'N/A'}</td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : ''}
                </div>
                <div class="detail-actions">
                    <button class="btn btn-secondary detail-close-btn">Close</button>
                    <button class="btn btn-primary detail-pdf-btn">Download PDF</button>
                </div>
            </div>
        </div>
    `;

    // Add to document and set up event listeners
    document.body.insertAdjacentHTML('beforeend', detailHTML);
    
    // Set up event listeners for close button and background click
    const modal = document.querySelector('.detail-modal');
    const closeBtn = document.querySelector('.detail-close');
    const closeBtnAction = document.querySelector('.detail-close-btn');
    const pdfBtn = document.querySelector('.detail-pdf-btn');
    
    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Close modal function
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    closeBtnAction.addEventListener('click', closeModal);
    
    // Close when clicking outside the container
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // PDF generation and download
    pdfBtn.addEventListener('click', () => {
        generatePDF(item);
    });
}

function generatePDF(item) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set font
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(69, 39, 160); // Purple color
    
    // Title
    doc.text('Sanctions Data', 105, 15, { align: 'center' });
    
    // Entity/Individual Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(item.name || 'Unknown Name', 105, 30, { align: 'center' });
    
    // Add type badge
    doc.setFillColor(92, 107, 192); // Blue color for visual distinction
    doc.roundedRect(85, 35, 40, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(item.type || 'Unknown Type', 105, 40, { align: 'center' });
    
    // Basic information
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    let yPos = 55;
    
    // Format date
    let formattedDate = 'Unknown';
    if (item.date_listed) {
        const date = new Date(item.date_listed);
        formattedDate = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Add metadata
    doc.setFont('helvetica', 'bold');
    doc.text('Basic Information', 20, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Country: ${item.country || 'Unknown'}`, 25, yPos);
    yPos += 8;
    doc.text(`Listed Date: ${formattedDate}`, 25, yPos);
    yPos += 8;
    doc.text(`Source: ${item.source || 'Unknown'}`, 25, yPos);
    yPos += 8;
    doc.text(`Program: ${item.program || 'N/A'}`, 25, yPos);
    yPos += 15;
    
    // Add reason if available
    if (item.reason) {
        doc.setFont('helvetica', 'bold');
        doc.text('Reason for Listing', 20, yPos);
        yPos += 10;
        
        doc.setFont('helvetica', 'normal');
        const reasonLines = doc.splitTextToSize(item.reason, 170);
        doc.text(reasonLines, 25, yPos);
        yPos += reasonLines.length * 7 + 10;
    }
    
    // Add aliases if available
    if (item.aliases && item.aliases.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Also Known As', 20, yPos);
        yPos += 10;
        
        doc.setFont('helvetica', 'normal');
        item.aliases.forEach(alias => {
            doc.text(`• ${alias}`, 25, yPos);
            yPos += 7;
        });
        yPos += 5;
    }
    
    // Check if we need a new page
    if (yPos > 270) {
        doc.addPage();
        yPos = 20;
    }
    
    // Save the PDF
    doc.save(`sanctions-data-${item.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}