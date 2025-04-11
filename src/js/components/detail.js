/**
 * detail.js - 제재 대상 상세 정보 표시 컴포넌트
 */

// 전역 변수
let detailModal = null;
let detailContent = null;
let currentItem = null;

/**
 * 상세 정보 컴포넌트 초기화
 */
function initDetailComponent() {
  console.log('상세 정보 컴포넌트 초기화');

  // 기존 모달 제거 (중복 방지)
  removeExistingModals();

  // 모달 요소 찾기
  detailModal = document.getElementById('detail-modal');
  detailContent = document.getElementById('detail-content');

  if (!detailModal || !detailContent) {
    console.error('상세 정보 모달 요소를 찾을 수 없습니다.');
    return;
  }

  // 닫기 이벤트 설정
  setupCloseEvents();

  // PDF 다운로드 버튼 이벤트 설정
  setupPdfDownload();

  console.log('상세 정보 컴포넌트 초기화 완료');
}

/**
 * 기존 모달 제거
 */
function removeExistingModals() {
  // 다중 모달 방지를 위해 기존에 존재하는 모달 제거
  const existingModals = document.querySelectorAll('.detail-modal');
  existingModals.forEach(modal => {
    if (modal.id !== 'detail-modal' && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  });
}

/**
 * 닫기 이벤트 설정
 */
function setupCloseEvents() {
  // 모달 닫기 버튼 클릭 이벤트
  const closeButton = document.getElementById('detail-close');
  if (closeButton) {
    closeButton.addEventListener('click', hideDetail);
  }

  // 모달 외부 클릭 시 닫기
  detailModal.addEventListener('click', function(e) {
    if (e.target === detailModal) {
      hideDetail();
    }
  });

  // ESC 키 누르면 모달 닫기
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && detailModal.style.display === 'block') {
      hideDetail();
    }
  });
}

/**
 * PDF 다운로드 버튼 이벤트 설정
 */
function setupPdfDownload() {
  const downloadBtn = document.getElementById('detail-download');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      generatePDF(currentItem);
    });
  }
}

/**
 * 상세 정보 표시
 * @param {Object} item 제재 대상 정보
 */
function showDetail(item) {
  if (!detailModal || !detailContent) {
    initDetailComponent();
  }

  if (!item) {
    console.error('표시할 상세 정보가 없습니다.');
    return;
  }

  // 현재 아이템 저장 (PDF 생성용)
  currentItem = item;

  // 상세 정보 렌더링
  renderDetailContent(item);

  // 모달 표시
  detailModal.style.display = 'block';
  document.body.classList.add('modal-open');
}

/**
 * 상세 정보 모달 숨기기
 */
function hideDetail() {
  if (detailModal) {
    detailModal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }
}

/**
 * 상세 정보 내용 렌더링
 * @param {Object} item 제재 대상 정보
 */
function renderDetailContent(item) {
  // 날짜 포맷팅 함수
  const formatDate = (dateStr) => {
    if (!dateStr) return '정보 없음';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 유형에 따른 클래스 설정
  const getTypeClass = (type) => {
    if (!type) return '';
    type = type.toLowerCase();
    if (type.includes('개인') || type.includes('individual')) return 'individual';
    if (type.includes('기업') || type.includes('단체') || type.includes('entity')) return 'entity';
    if (type.includes('선박') || type.includes('vessel')) return 'vessel';
    if (type.includes('항공') || type.includes('aircraft')) return 'aircraft';
    return '';
  };

  // HTML 구성
  let html = `
        <div class="detail-container">
            <div class="detail-header">
                <h3>${item.name || '이름 정보 없음'}</h3>
                <span class="detail-type ${getTypeClass(item.type)}">${item.type || '유형 정보 없음'}</span>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title">기본 정보</h3>
                <div class="detail-data">
                    <div class="data-item">
                        <div class="data-label">ID</div>
                        <div class="data-value">${item.id || '-'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">국가</div>
                        <div class="data-value">${item.country || '정보 없음'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">제재 프로그램</div>
                        <div class="data-value">${Array.isArray(item.programs) ? item.programs.join(', ') : (item.program || '정보 없음')}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">출처</div>
                        <div class="data-value">${item.source || '정보 없음'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">등재일</div>
                        <div class="data-value">${formatDate(item.date_listed)}</div>
                    </div>
                </div>
            </div>
    `;

  // 제재 사유
  if (item.reason) {
    html += `
            <div class="detail-section">
                <h3 class="section-title">제재 사유</h3>
                <div class="detail-data">
                    <div class="data-item reason">
                        <div class="data-value">${item.reason}</div>
                    </div>
                </div>
            </div>
        `;
  }

  // 상세 정보가 있을 경우
  if (item.details) {
    // 별칭 정보
    if (item.details.aliases && item.details.aliases.length > 0) {
      html += `
                <div class="detail-section">
                    <h3 class="section-title">별칭</h3>
                    <div class="detail-data">
                        <div class="data-item">
                            <ul class="aliases-list">
                                ${item.details.aliases.map(alias => `<li>${alias}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
    }

    // 국적 정보
    if (item.details.nationalities && item.details.nationalities.length > 0) {
      html += `
                <div class="detail-section">
                    <h3 class="section-title">국적</h3>
                    <div class="detail-data">
                        <div class="data-item">
                            <ul class="aliases-list">
                                ${item.details.nationalities.map(nationality => `<li>${nationality}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
    }

    // 주소 정보
    if (item.details.addresses && item.details.addresses.length > 0) {
      html += `
                <div class="detail-section">
                    <h3 class="section-title">주소</h3>
                    <div class="detail-data">
                        <div class="data-item">
                            <ul class="addresses-list">
                                ${item.details.addresses.map(address => `<li>${address}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
    }

    // 신분증 정보
    if (item.details.identifications && item.details.identifications.length > 0) {
      html += `
                <div class="detail-section">
                    <h3 class="section-title">신분증 정보</h3>
                    <div class="detail-data">
                        <div class="data-item">
                            <ul class="id-list">
                                ${item.details.identifications.map(id => `
                                    <li>
                                        <strong>${id.type || '기타'}:</strong> ${id.number || '번호 없음'}
                                        ${id.country ? `(${id.country})` : ''}
                                        ${id.issueDate ? ` - 발급일: ${id.issueDate}` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
    }

    // 개인 정보 (생년월일, 출생지 등)
    if (item.details.birthDate || item.details.birthPlace) {
      html += `
                <div class="detail-section">
                    <h3 class="section-title">개인 정보</h3>
                    <div class="detail-data">
                        ${item.details.birthDate ? `
                        <div class="data-item">
                            <div class="data-label">생년월일</div>
                            <div class="data-value">${item.details.birthDate}</div>
                        </div>
                        ` : ''}
                        ${item.details.birthPlace ? `
                        <div class="data-item">
                            <div class="data-label">출생지</div>
                            <div class="data-value">${item.details.birthPlace}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
    }
  }

  html += '</div>';

  // 내용 설정
  detailContent.innerHTML = html;
}

/**
 * PDF 파일 생성
 * @param {Object} item 제재 대상 정보
 */
function generatePDF(item) {
  if (!item) {
    alert('PDF 생성을 위한 데이터가 없습니다.');
    return;
  }

  try {
    // jsPDF 확인
    if (typeof window.jspdf === 'undefined') {
      console.log('jsPDF 로딩 중...');
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        console.log('jsPDF 로딩 완료');
        setTimeout(() => generatePDF(item), 500);
      };
      document.head.appendChild(script);
      return;
    }

    // 날짜 포맷팅 함수
    const formatDate = (dateStr) => {
      if (!dateStr) return '정보 없음';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // PDF 생성
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 문서 제목
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('제재 대상 상세 정보', 105, 20, { align: 'center' });

    // 제재 대상 기본 정보
    doc.setFontSize(16);
    doc.setTextColor(60, 60, 60);
    doc.text(item.name || '이름 정보 없음', 20, 35);

    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`유형: ${item.type || '정보 없음'}`, 20, 45);
    doc.text(`국가: ${item.country || '정보 없음'}`, 20, 52);
    doc.text(`출처: ${item.source || '정보 없음'}`, 20, 59);
    doc.text(`제재 프로그램: ${Array.isArray(item.programs) ? item.programs.join(', ') : (item.program || '정보 없음')}`, 20, 66);
    doc.text(`등재일: ${formatDate(item.date_listed)}`, 20, 73);

    let yPosition = 83;

    // 제재 사유
    if (item.reason) {
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('제재 사유', 20, yPosition);

      yPosition += 7;
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);

      // 긴 텍스트 줄바꿈 처리
      const splitReason = doc.splitTextToSize(item.reason, 170);
      doc.text(splitReason, 20, yPosition);

      yPosition += (splitReason.length * 7) + 10;
    }

    // 상세 정보
    if (item.details) {
      // 별칭 정보
      if (item.details.aliases && item.details.aliases.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('별칭', 20, yPosition);

        yPosition += 7;
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);

        item.details.aliases.forEach(alias => {
          doc.text(`- ${alias}`, 25, yPosition);
          yPosition += 7;
        });

        yPosition += 10;
      }

      // 새 페이지 확인
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }

      // 국적 정보
      if (item.details.nationalities && item.details.nationalities.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('국적', 20, yPosition);

        yPosition += 7;
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);

        item.details.nationalities.forEach(nationality => {
          doc.text(`- ${nationality}`, 25, yPosition);
          yPosition += 7;
        });

        yPosition += 10;
      }

      // 새 페이지 확인
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }

      // 주소 정보
      if (item.details.addresses && item.details.addresses.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('주소', 20, yPosition);

        yPosition += 7;
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);

        item.details.addresses.forEach(address => {
          const splitAddress = doc.splitTextToSize(`- ${address}`, 170);
          doc.text(splitAddress, 25, yPosition);
          yPosition += (splitAddress.length * 7);

          // 페이지 넘침 확인
          if (yPosition > 260) {
            doc.addPage();
            yPosition = 20;
          }
        });

        yPosition += 10;
      }

      // 새 페이지 확인
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }

      // 신분증 정보
      if (item.details.identifications && item.details.identifications.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('신분증 정보', 20, yPosition);

        yPosition += 7;
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);

        item.details.identifications.forEach(id => {
          const idText = `- ${id.type || '기타'}: ${id.number || '번호 없음'}${id.country ? ` (${id.country})` : ''}${id.issueDate ? ` - 발급일: ${id.issueDate}` : ''}`;
          const splitId = doc.splitTextToSize(idText, 170);
          doc.text(splitId, 25, yPosition);
          yPosition += (splitId.length * 7);

          // 페이지 넘침 확인
          if (yPosition > 260) {
            doc.addPage();
            yPosition = 20;
          }
        });

        yPosition += 10;
      }

      // 새 페이지 확인
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }

      // 개인 정보 (생년월일, 출생지 등)
      if (item.details.birthDate || item.details.birthPlace) {
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('개인 정보', 20, yPosition);

        yPosition += 7;
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);

        if (item.details.birthDate) {
          doc.text(`- 생년월일: ${item.details.birthDate}`, 25, yPosition);
          yPosition += 7;
        }

        if (item.details.birthPlace) {
          doc.text(`- 출생지: ${item.details.birthPlace}`, 25, yPosition);
          yPosition += 7;
        }

        yPosition += 10;
      }
    }

    // 페이지 번호 및 생성일 추가
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);

      // 현재 날짜 가져오기
      const today = new Date();
      const dateStr = today.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc.text(`${dateStr} 생성 - 페이지 ${i}/${totalPages}`, 105, 285, { align: 'center' });
    }

    // 파일명 설정 및 다운로드
    const fileName = `${item.name || 'sanction'}_${item.id || ''}.pdf`;
    doc.save(fileName);

    // 다운로드 메시지
    alert('PDF 다운로드가 시작되었습니다.');
  } catch (error) {
    console.error('PDF 생성 중 오류 발생:', error);
    alert('PDF 생성 중 오류가 발생했습니다.');
  }
}

// 외부에서 접근 가능한 함수들 내보내기
window.detailModule = {
  initDetailComponent,
  showDetail,
  hideDetail,
  generatePDF
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initDetailComponent);