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

// DOM이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    // 고급 검색 토글 기능
    const advancedSearchButton = document.getElementById('advanced-search-button');
    const advancedSearchOptions = document.getElementById('advanced-search-options');
    
    if(advancedSearchButton && advancedSearchOptions) {
        advancedSearchButton.addEventListener('click', function() {
            const isExpanded = advancedSearchOptions.style.display === 'block';
            advancedSearchOptions.style.display = isExpanded ? 'none' : 'block';
            
            // 아이콘 회전
            const icon = advancedSearchButton.querySelector('i');
            if(icon) {
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
            }
        });
    }
    
    // 필터 옵션 선택 기능
    const filterOptions = document.querySelectorAll('.filter-option');
    
    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 같은 필터 그룹 내에서만 선택 상태 변경
            const parentGroup = this.closest('.filter-group');
            if(parentGroup) {
                const siblingOptions = parentGroup.querySelectorAll('.filter-option');
                siblingOptions.forEach(sibling => {
                    sibling.classList.remove('selected');
                });
            }
            
            this.classList.add('selected');
        });
    });
    
    // 검색 타입 변경 처리
    const searchTypeRadios = document.querySelectorAll('input[name="search-type"]');
    const numberTypeOptions = document.querySelector('.number-type-options');
    
    searchTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // 라디오 버튼 레이블에 active 클래스 추가/제거
            document.querySelectorAll('.search-type-options .search-option').forEach(option => {
                option.classList.remove('active');
            });
            this.closest('.search-option').classList.add('active');
            
            // 번호 검색 선택시 번호 타입 옵션 표시
            if(this.value === 'number' && numberTypeOptions) {
                numberTypeOptions.style.display = 'flex';
            } else if(numberTypeOptions) {
                numberTypeOptions.style.display = 'none';
            }
        });
    });
    
    // 번호 타입 라디오 버튼 처리
    const numberTypeRadios = document.querySelectorAll('input[name="number-type"]');
    
    numberTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.number-type-options .search-option').forEach(option => {
                option.classList.remove('active');
            });
            this.closest('.search-option').classList.add('active');
        });
    });
    
    // 비밀번호 표시/숨김 토글
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            
            // 입력 타입 변경
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // 아이콘 변경
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });
    
    // 모달 관련 기능
    setupModals();
    
    // 정보 링크 이벤트 처리
    setupInfoLinks();
});

// 모달 설정 함수
function setupModals() {
    // 모달 닫기 버튼
    const closeButtons = document.querySelectorAll('.close-btn');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if(modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(event) {
        if(event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(event) {
        if(event.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal[style*="display: block"]');
            openModals.forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
}

// 정보 링크 설정 함수
function setupInfoLinks() {
    // 정보 링크들 (회사 소개, 도움말, 이용약관, 개인정보처리방침, 문의하기)
    const infoLinks = {
        'about-link': 'about-content',
        'help-link': 'help-content',
        'terms-link': 'terms-content',
        'privacy-link': 'privacy-content',
        'contact-link': 'contact-content'
    };
    
    const infoModal = document.getElementById('info-modal');
    const infoTitle = document.getElementById('info-title');
    const infoContent = document.getElementById('info-content');
    
    // 각 링크에 이벤트 리스너 추가
    for(const linkId in infoLinks) {
        const links = document.querySelectorAll(`#${linkId}`);
        
        links.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                
                if(infoModal && infoContent) {
                    // 모달 제목 설정
                    if(infoTitle) {
                        infoTitle.textContent = this.textContent;
                    }
                    
                    // 컨텐츠 로드
                    const contentId = infoLinks[linkId];
                    const contentElement = document.getElementById(contentId);
                    
                    if(contentElement) {
                        infoContent.innerHTML = contentElement.innerHTML;
                        infoModal.style.display = 'block';
                    }
                }
            });
        });
    }
}

// 검색 수행 함수
function performSearch() {
    // 검색 파라미터 수집
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (!query) {
        showAlert('검색어를 입력해주세요.', 'warning');
        return;
    }
    
    // 검색 유형 확인
    const searchType = document.querySelector('input[name="search-type"]:checked').value;
    
    // 번호 유형 (번호 검색인 경우)
    let numberType = null;
    if (searchType === 'number') {
        numberType = document.querySelector('input[name="number-type"]:checked').value;
    }
    
    // 국가 필터
    const countryFilter = document.querySelector('.country-filter .filter-option.selected');
    const country = countryFilter ? countryFilter.getAttribute('data-value') : '';
    
    // 프로그램 필터
    const programFilter = document.querySelector('.program-filter .filter-option.selected');
    const program = programFilter ? programFilter.getAttribute('data-value') : '';
    
    // 날짜 범위 필터
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    // 검색 파라미터 객체
    const searchParams = {
        query: query,
        type: searchType,
        numberType: numberType,
        country: country,
        program: program,
        startDate: startDate,
        endDate: endDate
    };
    
    // 로딩 표시
    toggleLoading(true);
    
    // 실제 검색 구현은 app.js에서 구현
    console.log('검색 파라미터:', searchParams);
    
    // app.js의 searchSanctionData 호출
    searchSanctionData(searchParams)
        .then(results => {
            // 검색 결과 표시
            displaySearchResults(results);
            toggleLoading(false);
            
            // 결과 수 업데이트
            updateResultsCount(results.length);
        })
        .catch(error => {
            console.error('검색 오류:', error);
            showAlert('검색 중 오류가 발생했습니다.', 'error');
            toggleLoading(false);
        });
}

// 검색 결과 표시 함수
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    // 결과가 없는 경우
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>검색 결과가 없습니다.</p>
                <p>다른 검색어나 필터를 사용해보세요.</p>
            </div>
        `;
        return;
    }
    
    // 결과 컨테이너 비우기
    resultsContainer.innerHTML = '';
    
    // 결과 카드 생성
    results.forEach(result => {
        const card = document.createElement('div');
        card.className = 'result-card maximalist';
        
        // 별칭 정보 추출
        let alias = '없음';
        if (result.details && result.details.aliases && result.details.aliases.length > 0) {
            alias = result.details.aliases[0];
        }
        
        // 프로그램 정보 추출
        let programName = '-';
        if (Array.isArray(result.programs) && result.programs.length > 0) {
            programName = getProgramName(result.programs[0]);
        } else if (result.program) {
            programName = getProgramName(result.program);
        }
        
        // 등재일 정보 추출
        let listDate = '-';
        if (result.details && result.details.sanctions && result.details.sanctions.length > 0) {
            const firstSanction = result.details.sanctions[0];
            if (firstSanction.startDate) {
                listDate = formatDate(firstSanction.startDate);
            }
        }
        
        const cardContent = `
            <div class="result-header">
                <h3>${result.name}</h3>
                <span class="result-id">${result.id}</span>
            </div>
            <div class="result-body">
                <p><strong>별칭:</strong> ${alias}</p>
                <p><strong>국가:</strong> ${getCountryName(result.country)}</p>
                <p><strong>유형:</strong> ${result.type}</p>
                <p><strong>프로그램:</strong> ${programName}</p>
                <p><strong>등재일:</strong> ${listDate}</p>
            </div>
            <div class="result-footer">
                <button class="btn-secondary detail-btn" data-id="${result.id}">
                    상세 정보
                </button>
            </div>
        `;
        
        card.innerHTML = cardContent;
        resultsContainer.appendChild(card);
        
        // 상세 정보 버튼에 이벤트 리스너 추가
        const detailBtn = card.querySelector('.detail-btn');
        if (detailBtn) {
            detailBtn.addEventListener('click', function() {
                // app.js의 getSanctionDetail 호출
                getSanctionDetail(result.id)
                    .then(detailData => {
                        if (detailData) {
                            showDetailModal(detailData);
                        } else {
                            showAlert('상세 정보를 찾을 수 없습니다.', 'error');
                        }
                    })
                    .catch(error => {
                        console.error('상세 정보 조회 오류:', error);
                        showAlert('상세 정보를 불러오는 중 오류가 발생했습니다.', 'error');
                    });
            });
        }
    });
}

// 결과 수 업데이트 함수
function updateResultsCount(count) {
    const countElement = document.querySelector('.results-count');
    if (countElement) {
        countElement.textContent = `${count}개의 결과`;
    }
}

// 상세 정보 모달 표시 함수
function showDetailModal(resultData) {
    const detailModal = document.getElementById('detail-modal');
    const detailContent = document.getElementById('detail-content');
    
    if(!detailModal || !detailContent || !resultData) {
        console.error('모달 요소 또는 데이터가 없습니다.');
        return;
    }
    
    console.log('상세 정보 표시:', resultData);
    
    // 상세 정보 HTML 생성
    let detailHTML = `
        <div class="detail-container">
            <div class="detail-header">
                <h3>${resultData.name || '이름 없음'}</h3>
                <span class="detail-type ${(resultData.type && resultData.type.toLowerCase().includes('individual')) ? 'individual' : 'entity'}">
                    ${resultData.type || '유형 정보 없음'}
                </span>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title">기본 정보</h3>
                <div class="detail-data">
                    <div class="data-item">
                        <span class="data-label">ID:</span>
                        <span class="data-value">${resultData.id || '-'}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">국가:</span>
                        <span class="data-value">${resultData.country || '-'}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">제재 프로그램:</span>
                        <span class="data-value">${Array.isArray(resultData.programs) ? resultData.programs.join(', ') : (resultData.program || '-')}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">출처:</span>
                        <span class="data-value">${resultData.source || '-'}</span>
                    </div>
    `;
    
    // 제재 이유 정보
    if (resultData.details && resultData.details.sanctions && resultData.details.sanctions.length > 0) {
        detailHTML += `
            <div class="data-item">
                <span class="data-label">제재 내역:</span>
                <div class="data-value sanctions-list">
                    <ul>
        `;
        
        resultData.details.sanctions.forEach(sanction => {
            detailHTML += `
                <li>
                    <strong>프로그램:</strong> ${sanction.program || '-'}<br>
                    <strong>시작일:</strong> ${sanction.startDate || '-'}<br>
                    ${sanction.reason ? `<strong>이유:</strong> ${sanction.reason}` : ''}
                </li>
            `;
        });
        
        detailHTML += `
                    </ul>
                </div>
            </div>
        `;
    } else if (resultData.reason) {
        // 이전 형식의 제재 이유
        detailHTML += `
            <div class="data-item">
                <span class="data-label">제재 이유:</span>
                <span class="data-value">${resultData.reason}</span>
            </div>
        `;
    }
    
    detailHTML += `
            </div>
        </div>
    `;
    
    // 상세 정보 추가 (제재 대상 유형에 따라 다른 정보 표시)
    if (resultData.details) {
        // 별칭 정보
        if (resultData.details.aliases && resultData.details.aliases.length) {
            detailHTML += `
                <div class="detail-section">
                    <h3 class="section-title">별칭</h3>
                    <div class="detail-data">
                        <div class="data-item">
                            <ul class="aliases-list">
                                ${resultData.details.aliases.map(alias => `<li>${alias}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 주소 정보
        if (resultData.details.addresses && resultData.details.addresses.length) {
            detailHTML += `
                <div class="detail-section">
                    <h3 class="section-title">주소</h3>
                    <div class="detail-data">
                        <div class="data-item">
                            <ul class="addresses-list">
                                ${resultData.details.addresses.map(address => `<li>${address}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 국적 정보
        if (resultData.details.nationalities && resultData.details.nationalities.length) {
            detailHTML += `
                <div class="detail-section">
                    <h3 class="section-title">국적</h3>
                    <div class="detail-data">
                        <div class="data-item">
                            <ul class="nationalities-list">
                                ${resultData.details.nationalities.map(nationality => `<li>${nationality}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 신분증 정보
        if (resultData.details.identifications && resultData.details.identifications.length) {
            detailHTML += `
                <div class="detail-section">
                    <h3 class="section-title">신분증 정보</h3>
                    <div class="detail-data">
                        <div class="data-item">
                            <ul class="id-list">
                                ${resultData.details.identifications.map(id => 
                                    `<li><strong>${id.type || '기타'}:</strong> ${id.number}${id.country ? ` (${id.country})` : ''}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 생년월일
        if (resultData.details.birthDate) {
            detailHTML += `
                <div class="detail-section">
                    <h3 class="section-title">개인 정보</h3>
                    <div class="detail-data">
                        <div class="data-item">
                            <span class="data-label">생년월일:</span>
                            <span class="data-value">${resultData.details.birthDate}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    detailHTML += '</div>';
    
    // 컨텐츠 설정 및 모달 표시
    detailContent.innerHTML = detailHTML;
    detailModal.style.display = 'block';
    
    // 닫기 버튼 이벤트
    const closeBtn = document.getElementById('detail-close');
    if (closeBtn) {
        closeBtn.onclick = function() {
            detailModal.style.display = 'none';
        };
    }
    
    // 인쇄 버튼 이벤트
    const printBtn = document.getElementById('detail-print');
    if (printBtn) {
        printBtn.onclick = function() {
            window.print();
        };
    }
    
    // PDF 다운로드 버튼 이벤트
    const downloadBtn = document.getElementById('detail-download');
    if (downloadBtn) {
        downloadBtn.onclick = function() {
            alert('PDF 다운로드 기능은 현재 개발 중입니다.');
        };
    }
}

// 헬퍼 함수
function getCountryName(countryCode) {
    const countryMap = {
        'NK': '북한',
        'RU': '러시아',
        'IR': '이란',
        'SY': '시리아',
        'CN': '중국'
    };
    
    return countryMap[countryCode] || countryCode;
}

function getProgramName(programCode) {
    const programMap = {
        'UN_SANCTIONS': 'UN 제재',
        'EU_SANCTIONS': 'EU 제재',
        'US_SANCTIONS': 'US 제재'
    };
    
    return programMap[programCode] || programCode;
}

function formatDate(dateString) {
    if(!dateString) return '';
    
    // YYYY-MM-DD 형식의 날짜를 YYYY.MM.DD 형식으로 변환
    const parts = dateString.split('-');
    if(parts.length === 3) {
        return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }
    
    return dateString;
}

// 인쇄 함수
function printDetail(content, title) {
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html>
        <head>
            <title>${title} - 제재 정보</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; margin-bottom: 30px; }
                .detail-section { margin-bottom: 25px; }
                .detail-section h3 { border-bottom: 1px solid #ddd; padding-bottom: 8px; }
                .detail-info p { margin: 8px 0; }
                .footer { margin-top: 30px; text-align: center; color: #888; font-size: 14px; }
            </style>
        </head>
        <body>
            <h1>${title} - 제재 정보</h1>
            ${content}
            <div class="footer">
                <p>© ${new Date().getFullYear()} WVL 제재 조회 시스템</p>
                <p>이 문서는 ${new Date().toLocaleString()}에 출력되었습니다.</p>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // 잠시 후 인쇄 다이얼로그 표시
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// app.js로부터 함수 import하여 연결
document.addEventListener('DOMContentLoaded', async function() {
    // app.js의 함수 import 시도
    try {
        const appModule = await import('./app.js');
        
        // 검색 버튼에 이벤트 리스너 연결
        const searchButton = document.getElementById('search-button');
        if (searchButton) {
            searchButton.addEventListener('click', async function(e) {
                e.preventDefault();
                
                // 검색 입력값과 필터 수집
                const searchInput = document.getElementById('search-input');
                const query = searchInput ? searchInput.value.trim() : '';
                
                // 검색 타입
                const searchType = document.querySelector('input[name="search-type"]:checked').value;
                
                // 번호 타입 (번호 검색인 경우)
                let numberType = '';
                if (searchType === 'number') {
                    const numberTypeRadio = document.querySelector('input[name="number-type"]:checked');
                    numberType = numberTypeRadio ? numberTypeRadio.value : 'all';
                }
                
                // 필터 값
                const countryFilter = document.querySelector('.country-filter .filter-option.selected');
                const programFilter = document.querySelector('.program-filter .filter-option.selected');
                
                const country = countryFilter ? countryFilter.getAttribute('data-value') : '';
                const program = programFilter ? programFilter.getAttribute('data-value') : '';
                
                // 날짜 범위
                const startDate = document.getElementById('start-date')?.value || '';
                const endDate = document.getElementById('end-date')?.value || '';
                
                // 검색 파라미터
                const params = {
                    query,
                    type: searchType,
                    numberType,
                    country,
                    program,
                    startDate,
                    endDate
                };
                
                try {
                    // app.js의 searchSanctionData 함수 호출
                    const results = await appModule.searchSanctionData(params);
                    displayResults(results);
                } catch (error) {
                    console.error('검색 중 오류 발생:', error);
                    showAlert('검색 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
                }
            });
        }
        
        // 결과 항목의 상세 정보 버튼에 이벤트 위임 설정
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            resultsContainer.addEventListener('click', async function(e) {
                // 상세 정보 버튼 클릭 확인
                if (e.target.matches('.btn-secondary.detail-btn') || e.target.closest('.btn-secondary.detail-btn')) {
                    const button = e.target.matches('.btn-secondary.detail-btn') ? 
                        e.target : e.target.closest('.btn-secondary.detail-btn');
                    
                    const id = button.getAttribute('data-id');
                    if (id) {
                        try {
                            // app.js의 getSanctionDetail 함수 호출
                            const detailData = await appModule.getSanctionDetail(id);
                            if (detailData) {
                                showDetailModal(detailData);
                            } else {
                                showAlert('상세 정보를 찾을 수 없습니다.', 'error');
                            }
                        } catch (error) {
                            console.error('상세 정보 조회 중 오류 발생:', error);
                            showAlert('상세 정보를 불러오는 중 오류가 발생했습니다.', 'error');
                        }
                    }
                }
            });
        }
        
    } catch (error) {
        console.error('app.js 모듈을 불러오는 중 오류 발생:', error);
    }
}); 