/**
 * WVL Sanctions UI
 * 사용자 인터페이스 요소 및 이벤트 처리 담당
 */

// 상수
const SECTIONS = {
  LOGIN: 'login-section',
  MAIN: 'main-section',
  TERMS: 'terms-section',
  PRIVACY: 'privacy-section',
  HELP: 'help-section'
};

/**
 * 페이지 섹션 표시
 * @param {string} sectionId 표시할 섹션 ID
 */
function showSection(sectionId) {
  // 모든 섹션 숨기기
  hideAllSections();
  
  // 요청한 섹션 표시
  const section = document.getElementById(sectionId);
  if (section) {
    section.style.display = 'block';
  }
}

/**
 * 모든 페이지 섹션 숨기기
 */
function hideAllSections() {
  // 주요 섹션
  Object.values(SECTIONS).forEach(id => {
    const section = document.getElementById(id);
    if (section) {
      section.style.display = 'none';
    }
  });
  
  // 추가 페이지 섹션
  document.querySelectorAll('.page-section').forEach(section => {
    section.style.display = 'none';
  });
}

/**
 * 모달 표시
 * @param {string} modalId 모달 ID
 */
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    document.body.classList.add('modal-open');
    
    // 닫기 버튼 이벤트 등록
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.onclick = function() {
        closeModal(modalId);
      };
    }
    
    // 배경 클릭 시 모달 닫기
    modal.onclick = function(e) {
      if (e.target === modal) {
        closeModal(modalId);
      }
    };
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeModal(modalId);
      }
    });
    
    // 모달 컨텐츠 클릭 이벤트 전파 중단
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.onclick = function(e) {
        e.stopPropagation();
      };
    }
  }
}

/**
 * 모달 닫기
 * @param {string} modalId 모달 ID
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
}

/**
 * 알림 표시
 * @param {string} message 메시지
 * @param {string} type 알림 유형 (success, error, info, warning)
 * @param {Element} container 알림을 표시할 컨테이너 (없으면 현재 활성 섹션에서 찾음)
 * @param {number} timeout 자동 닫기 시간 (ms, 기본 5000)
 */
function showAlert(message, type = 'info', container = null, timeout = 5000) {
  // 알림 컨테이너 찾기
  let alertContainer = container;
  
  if (!alertContainer) {
    // 현재 활성화된 섹션의 알림 컨테이너 찾기
    for (const sectionId of Object.values(SECTIONS)) {
      const section = document.getElementById(sectionId);
      if (section && section.style.display !== 'none') {
        alertContainer = section.querySelector('.alert-container');
        if (alertContainer) break;
      }
    }
    
    // 여전히 없으면 문서에서 첫 번째 알림 컨테이너 찾기
    if (!alertContainer) {
      alertContainer = document.querySelector('.alert-container');
    }
  }
  
  if (!alertContainer) return;
  
  // 알림 요소 생성
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.innerHTML = message;
  
  // 컨테이너에 알림 추가
  alertContainer.innerHTML = '';
  alertContainer.appendChild(alertDiv);
  
  // 지정된 시간 후 알림 자동 제거
  if (timeout > 0) {
    setTimeout(() => {
      alertDiv.style.opacity = '0';
      setTimeout(() => {
        if (alertDiv.parentNode) {
          alertDiv.parentNode.removeChild(alertDiv);
        }
      }, 300);
    }, timeout);
  }
  
  return alertDiv;
}

/**
 * 로딩 인디케이터 표시/숨기기
 * @param {boolean} show 표시 여부
 */
function toggleLoading(show) {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = show ? 'flex' : 'none';
  }
}

/**
 * 페이지 섹션 링크 설정
 */
function setupPageSectionLinks() {
  // 이용약관
  const termsLink = document.getElementById('terms-link');
  const termsBackBtn = document.getElementById('terms-back-btn');
  
  if (termsLink) {
    termsLink.addEventListener('click', function(e) {
      e.preventDefault();
      showSection(SECTIONS.TERMS);
    });
  }
  
  if (termsBackBtn) {
    termsBackBtn.addEventListener('click', function() {
      showSection(SECTIONS.MAIN);
    });
  }
  
  // 개인정보처리방침
  const privacyLink = document.getElementById('privacy-link');
  const privacyBackBtn = document.getElementById('privacy-back-btn');
  
  if (privacyLink) {
    privacyLink.addEventListener('click', function(e) {
      e.preventDefault();
      showSection(SECTIONS.PRIVACY);
    });
  }
  
  if (privacyBackBtn) {
    privacyBackBtn.addEventListener('click', function() {
      showSection(SECTIONS.MAIN);
    });
  }
  
  // 도움말
  const helpLink = document.getElementById('help-link');
  const helpBackBtn = document.getElementById('help-back-btn');
  
  if (helpLink) {
    helpLink.addEventListener('click', function(e) {
      e.preventDefault();
      showSection(SECTIONS.HELP);
    });
  }
  
  if (helpBackBtn) {
    helpBackBtn.addEventListener('click', function() {
      showSection(SECTIONS.MAIN);
    });
  }
}

/**
 * 검색 결과 표시
 * @param {Array} results 검색 결과 배열
 * @param {string} query 검색어
 */
function displaySearchResults(results) {
  const resultsList = document.getElementById('results-list');
  const noResults = document.getElementById('no-results');
  const resultsCount = document.getElementById('results-count');
  
  if (!resultsList || !noResults || !resultsCount) return;
  
  // 결과 개수 표시
  resultsCount.textContent = results.length;
  
  if (results.length === 0) {
    // 결과 없음 표시
    resultsList.innerHTML = '';
    noResults.style.display = 'flex';
    return;
  }
  
  // 결과 있음
  noResults.style.display = 'none';
  resultsList.innerHTML = '';
  
  // 결과 목록 생성
  results.forEach(item => {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.dataset.id = item.id;
    
    // 항목 타입에 따른 아이콘 클래스
    let iconClass = 'fa-user';
    const type = item.type ? item.type.toLowerCase() : '';
    
    if (type.includes('기업') || type.includes('기관') || type.includes('entity')) {
      iconClass = 'fa-building';
    } else if (type.includes('선박') || type.includes('vessel')) {
      iconClass = 'fa-ship';
    } else if (type.includes('항공') || type.includes('aircraft')) {
      iconClass = 'fa-plane';
    }
    
    // 국가 코드 처리
    const country = item.country || '';
    
    // 제재 날짜
    let sanctionDate = '';
    if (item.details && item.details.sanctions && item.details.sanctions.length > 0) {
      sanctionDate = item.details.sanctions[0].startDate || '';
    }
    
    // 결과 항목 HTML 생성
    resultItem.innerHTML = `
      <div class="result-icon">
        <i class="fas ${iconClass}"></i>
      </div>
      <div class="result-content">
        <h4 class="result-title">${item.name}</h4>
        <div class="result-meta">
          <span class="result-type">${formatEntityType(item.type)}</span>
          <span class="result-country">${country}</span>
          ${sanctionDate ? `<span class="result-date">제재일: ${formatDate(sanctionDate)}</span>` : ''}
        </div>
      </div>
      <div class="result-action">
        <button class="view-detail-btn" data-id="${item.id}">상세보기</button>
      </div>
    `;
    
    // 결과 목록에 추가
    resultsList.appendChild(resultItem);
  });
  
  // 결과 영역 표시
  const resultsArea = document.getElementById('results-area');
  if (resultsArea) {
    resultsArea.style.display = 'block';
  }
}

/**
 * 상세 정보 표시
 * @param {Object} item 제재 대상 정보
 */
function displayDetailView(item) {
  const detailModal = document.getElementById('detail-modal');
  const detailContent = document.getElementById('detail-content');
  
  if (!detailModal || !detailContent) {
    console.error('상세 정보 모달 요소를 찾을 수 없습니다.');
    return;
  }
  
  let contentHTML = `
    <div class="detail-container">
      <div class="detail-header">
        <h3>${item.name}</h3>
        <span class="detail-type ${item.type.toLowerCase() === '개인' || item.type.toLowerCase() === 'individual' ? 'individual' : 'entity'}">
          ${item.type}
        </span>
      </div>
      
      <div class="detail-section">
        <h3 class="section-title">기본 정보</h3>
        <div class="detail-data">
          <div class="data-item">
            <span class="data-label">ID:</span>
            <span class="data-value">${item.id}</span>
          </div>
          <div class="data-item">
            <span class="data-label">국가:</span>
            <span class="data-value">${item.country}</span>
          </div>
          <div class="data-item">
            <span class="data-label">제재 프로그램:</span>
            <span class="data-value">${Array.isArray(item.programs) ? item.programs.join(', ') : (item.program || '-')}</span>
          </div>
          ${item.source ? `
          <div class="data-item">
            <span class="data-label">출처:</span>
            <span class="data-value">${item.source}</span>
          </div>
          ` : ''}
          ${item.date_listed ? `
          <div class="data-item">
            <span class="data-label">등재일:</span>
            <span class="data-value">${item.date_listed}</span>
          </div>
          ` : ''}
          ${item.reason ? `
          <div class="data-item reason">
            <span class="data-label">제재 이유:</span>
            <span class="data-value">${item.reason}</span>
          </div>
          ` : ''}
        </div>
      </div>
  `;
  
  // 상세 정보가 있는 경우 추가
  if (item.details) {
    // 별칭 정보
    if (item.details.aliases && item.details.aliases.length) {
      contentHTML += `
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
    
    // 주소 정보
    if (item.details.addresses && item.details.addresses.length) {
      contentHTML += `
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
    if (item.details.identifications && item.details.identifications.length) {
      contentHTML += `
        <div class="detail-section">
          <h3 class="section-title">신분증 정보</h3>
          <div class="detail-data">
            <div class="data-item">
              <ul class="id-list">
                ${item.details.identifications.map(id => `<li><strong>${id.type}:</strong> ${id.number}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      `;
    }
    
    // 관련 제재 정보
    if (item.details.relatedSanctions && item.details.relatedSanctions.length) {
      contentHTML += `
        <div class="detail-section">
          <h3 class="section-title">관련 제재</h3>
          <div class="detail-data">
            <div class="data-item">
              <ul class="related-list">
                ${item.details.relatedSanctions.map(sanction => `<li>${sanction.name} (${sanction.type})</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      `;
    }
    
    // 생년월일
    if (item.details.birthDate) {
      contentHTML += `
        <div class="detail-section">
          <h3 class="section-title">개인 정보</h3>
          <div class="detail-data">
            <div class="data-item">
              <span class="data-label">생년월일:</span>
              <span class="data-value">${item.details.birthDate}</span>
            </div>
          </div>
        </div>
      `;
    }
  }
  
  contentHTML += '</div>';
  detailContent.innerHTML = contentHTML;
  
  // PDF 다운로드 버튼 이벤트
  const downloadBtn = document.getElementById('detail-download');
  if (downloadBtn) {
    downloadBtn.onclick = function() {
      alert('PDF 다운로드 기능은 현재 개발 중입니다.');
    };
  }
  
  // 인쇄 버튼 이벤트
  const printBtn = document.getElementById('detail-print');
  if (printBtn) {
    printBtn.onclick = function() {
      window.print();
    };
  }
  
  // 모달 표시
  showModal('detail-modal');
}

/**
 * 유형 표시 형식화
 * @param {string} type 유형
 * @returns {string} 표시용 유형
 */
function formatEntityType(type) {
  if (!type) return '기관/기업';
  
  const lowerType = type.toLowerCase();
  if (lowerType.includes('개인') || lowerType.includes('individual') || lowerType === 'person') {
    return '개인';
  } else if (lowerType.includes('선박') || lowerType.includes('vessel') || lowerType.includes('ship')) {
    return '선박';
  } else if (lowerType.includes('항공') || lowerType.includes('aircraft')) {
    return '항공기';
  } else {
    return '기관/기업';
  }
}

/**
 * 출처 형식화
 * @param {string} source 출처
 * @returns {string} 표시용 출처
 */
function formatSource(source) {
  if (!source) return '기타';
  
  const sources = {
    'UN': '유엔 안전보장이사회 (UN)',
    'EU': '유럽연합 (EU)',
    'OFAC': '미국 해외자산통제국 (OFAC)',
    'KR': '대한민국 정부'
  };
  
  return sources[source] || source;
}

/**
 * 제재 프로그램 형식화
 * @param {Array} programs 프로그램 배열
 * @returns {string} 표시용 프로그램
 */
function formatPrograms(programs) {
  if (!programs || !Array.isArray(programs) || programs.length === 0) {
    return '-';
  }
  
  return programs.join(', ');
}

/**
 * 날짜 형식화
 * @param {string} dateString 날짜 문자열
 * @returns {string} 형식화된 날짜
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

/**
 * PDF 다운로드
 * @param {Object} item 제재 대상 정보
 */
function downloadDetailPDF(item) {
  // PDF 다운로드 기능 구현
  // (실제 구현은 jsPDF 등의 라이브러리 사용 필요)
  alert('PDF 다운로드 기능은 아직 구현되지 않았습니다.');
}

/**
 * 상세 정보 인쇄
 */
function printDetail() {
  window.print();
}

// 모듈 내보내기
export {
  SECTIONS,
  showSection,
  hideAllSections,
  showModal,
  closeModal,
  showAlert,
  toggleLoading,
  setupPageSectionLinks,
  displaySearchResults,
  displayDetailView,
  formatEntityType,
  formatSource,
  formatPrograms,
  formatDate,
  downloadDetailPDF,
  printDetail
}; 