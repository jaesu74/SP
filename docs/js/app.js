/**
 * WVL Sanctions Search Application
 * 메인 애플리케이션 진입점
 */

// 모듈 가져오기
import { searchSanctions, getSanctionDetails, getRecentSanctions } from './api.js';
import { login, logout, checkLoginStatus } from './auth.js';
import { 
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
  printDetail,
  downloadDetailPDF
} from './ui.js';

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * 애플리케이션 초기화
 */
function initializeApp() {
  console.log('WVL Sanctions Search Application 초기화...');
  
  // 초기 상태 설정
  hideAllSections();
  toggleLoading(false);
  
  // 이벤트 리스너 설정
  setupEventListeners();
  
  // 로그인 상태 확인
  const userInfo = checkLoginStatus();
  if (userInfo) {
    // 로그인된 상태
    updateUserInfo(userInfo);
    showSection(SECTIONS.MAIN);
  } else {
    // 로그인되지 않은 상태
    showSection(SECTIONS.LOGIN);
  }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  // 로그인 폼
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }
  
  // 로그아웃 버튼
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // 비밀번호 토글
  const togglePasswordBtn = document.querySelector('.toggle-password');
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
  }
  
  // 검색 폼
  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', handleSearch);
  }
  
  // 고급 검색 토글
  const advancedToggle = document.getElementById('advanced-toggle');
  if (advancedToggle) {
    advancedToggle.addEventListener('click', toggleAdvancedSearch);
  }
  
  // 필터 버튼
  setupFilterButtons();
  
  // 상세 정보 모달 닫기 버튼
  const detailClose = document.getElementById('detail-close');
  if (detailClose) {
    detailClose.addEventListener('click', () => closeModal('detail-modal'));
  }
  
  // 인쇄 버튼
  const detailPrint = document.getElementById('detail-print');
  if (detailPrint) {
    detailPrint.addEventListener('click', printDetail);
  }
  
  // PDF 다운로드 버튼
  const detailDownload = document.getElementById('detail-download');
  if (detailDownload) {
    detailDownload.addEventListener('click', () => {
      // 현재 표시 중인 제재 대상 ID 가져오기
      const detailModal = document.getElementById('detail-modal');
      if (detailModal && detailModal.dataset.itemId) {
        downloadDetailPDF(detailModal.dataset.itemId);
      } else {
        showAlert('다운로드할 항목을 찾을 수 없습니다.', 'error');
      }
    });
  }
  
  // 페이지 섹션 링크 (이용약관, 개인정보처리방침, 도움말)
  setupPageSectionLinks();
}

/**
 * 로그인 폼 제출 처리
 * @param {Event} event 폼 제출 이벤트
 */
function handleLoginSubmit(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  const result = login(email, password);
  
  if (result.success) {
    showAlert(result.message, 'success');
    updateUserInfo(result.user);
    showSection(SECTIONS.MAIN);
    
    // 최근 제재 대상 표시
    showRecentSanctions();
  } else {
    showAlert(result.message, 'error');
  }
}

/**
 * 로그아웃 처리
 */
function handleLogout() {
  const result = logout();
  
  if (result.success) {
    showAlert(result.message, 'info');
    showSection(SECTIONS.LOGIN);
  }
}

/**
 * 사용자 정보 업데이트
 * @param {Object} user 사용자 정보
 */
function updateUserInfo(user) {
  const userNameElement = document.getElementById('user-name');
  if (userNameElement && user) {
    userNameElement.textContent = user.name || '사용자';
  }
}

/**
 * 비밀번호 가시성 토글
 */
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('password');
  if (!passwordInput) return;
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    this.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    this.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

/**
 * 고급 검색 토글
 */
function toggleAdvancedSearch() {
  const advancedSearch = document.getElementById('advanced-search');
  if (!advancedSearch) return;
  
  advancedSearch.classList.toggle('active');
  
  const icon = this.querySelector('i');
  if (icon) {
    icon.classList.toggle('fa-sliders-h');
    icon.classList.toggle('fa-times');
  }
}

/**
 * 필터 버튼 설정
 */
function setupFilterButtons() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // 'all' 필터가 클릭된 경우 다른 모든 필터 비활성화
      if (this.getAttribute('data-filter') === 'all') {
        filterBtns.forEach(otherBtn => {
          if (otherBtn !== this) {
            otherBtn.classList.remove('active');
          }
        });
        this.classList.add('active');
      } else {
        // 'all' 필터 비활성화
        const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allFilterBtn) {
          allFilterBtn.classList.remove('active');
        }
        
        // 현재 버튼 토글
        this.classList.toggle('active');
        
        // 활성화된 필터가 하나도 없으면 'all' 필터 활성화
        const hasActiveFilters = document.querySelector('.filter-btn.active') !== null;
        if (!hasActiveFilters && allFilterBtn) {
          allFilterBtn.classList.add('active');
        }
      }
      
      // 검색 결과에 필터 적용 또는 최신 데이터 표시
      const resultsArea = document.getElementById('results-area');
      if (resultsArea && resultsArea.style.display !== 'none') {
        applyFilters();
      } else {
        // 검색 결과가 없는 경우 필터에 해당하는 최근 데이터 표시
        showRecentSanctions();
      }
    });
  });
  
  // 첫 번째 필터 버튼 (all) 활성화
  if (filterBtns.length > 0) {
    filterBtns[0].classList.add('active');
  }
}

/**
 * 검색 처리
 * @param {Event} event 폼 제출 이벤트
 */
async function handleSearch(event) {
  event.preventDefault();
  
  const searchInput = document.getElementById('search-input');
  if (!searchInput || !searchInput.value.trim()) {
    showAlert('검색어를 입력해주세요.', 'warning');
    return;
  }
  
  const query = searchInput.value.trim();
  
  // 검색 옵션 수집
  const options = {
    types: getActiveFilterTypes(),
    country: document.getElementById('country')?.value || '',
    program: document.getElementById('program')?.value || ''
  };
  
  // 로딩 인디케이터 표시
  toggleLoading(true);
  
  try {
    // 검색 실행
    const results = await searchSanctions(query, options);
    
    // 결과 표시
    displaySearchResults(results);
    
    // 결과 항목에 이벤트 리스너 추가
    attachResultItemListeners();
  } catch (error) {
    console.error('검색 오류:', error);
    showAlert('검색 중 오류가 발생했습니다.', 'error');
  } finally {
    // 로딩 인디케이터 숨기기
    toggleLoading(false);
  }
}

/**
 * 활성화된 필터 유형 가져오기
 * @returns {Array} 활성화된 필터 유형 배열
 */
function getActiveFilterTypes() {
  const activeFilters = Array.from(document.querySelectorAll('.filter-btn.active'))
    .map(btn => btn.getAttribute('data-filter'));
  
  return activeFilters.length > 0 ? activeFilters : ['all'];
}

/**
 * 검색 결과 항목에 이벤트 리스너 추가
 */
function attachResultItemListeners() {
  // 상세보기 버튼
  document.querySelectorAll('.view-detail-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const id = this.getAttribute('data-id');
      if (id) {
        await showDetailById(id);
      }
    });
  });
  
  // 결과 항목 클릭 (상세보기)
  document.querySelectorAll('.result-item').forEach(item => {
    item.addEventListener('click', async function(e) {
      // 버튼 영역 클릭은 무시 (이미 버튼에 이벤트가 있음)
      if (e.target.closest('.view-detail-btn')) return;
      
      const id = this.dataset.id;
      if (id) {
        await showDetailById(id);
      }
    });
  });
}

/**
 * ID로 상세 정보 표시
 * @param {string} id 제재 대상 ID
 */
async function showDetailById(id) {
  toggleLoading(true);
  
  try {
    const item = await getSanctionDetails(id);
    if (item) {
      // 상세 정보 표시
      displayDetailView(item);
      
      // 현재 표시 중인 아이템 ID 저장
      const detailModal = document.getElementById('detail-modal');
      if (detailModal) {
        detailModal.dataset.itemId = id;
      }
    } else {
      showAlert('상세 정보를 찾을 수 없습니다.', 'error');
    }
  } catch (error) {
    console.error('상세 정보 조회 오류:', error);
    showAlert('상세 정보를 불러오는 중 오류가 발생했습니다.', 'error');
  } finally {
    toggleLoading(false);
  }
}

/**
 * 필터 적용
 */
function applyFilters() {
  const activeTypes = getActiveFilterTypes();
  
  // 모든 결과 항목 가져오기
  const resultItems = document.querySelectorAll('.result-item');
  
  // 결과가 없으면 종료
  if (resultItems.length === 0) return;
  
  // 'all' 필터가 활성화되어 있으면 모든 항목 표시
  if (activeTypes.includes('all')) {
    resultItems.forEach(item => {
      item.style.display = 'flex';
    });
    return;
  }
  
  // 각 항목에 필터 적용
  resultItems.forEach(item => {
    const typeElement = item.querySelector('.result-type');
    if (!typeElement) return;
    
    const type = typeElement.textContent;
    
    // 유형 매핑
    let itemType = '';
    if (type === '개인') itemType = 'individual';
    else if (type === '기관/기업') itemType = 'entity';
    else if (type === '선박') itemType = 'vessel';
    else if (type === '항공기') itemType = 'aircraft';
    
    // 활성화된 필터에 항목 유형이 포함되어 있으면 표시, 아니면 숨김
    item.style.display = activeTypes.includes(itemType) ? 'flex' : 'none';
  });
}

/**
 * 최근 제재 대상 표시
 */
async function showRecentSanctions() {
  // 활성화된 필터 유형
  const activeTypes = getActiveFilterTypes();
  const type = activeTypes.includes('all') ? null : activeTypes[0];
  
  toggleLoading(true);
  
  try {
    // 최근 제재 대상 가져오기
    const recentItems = await getRecentSanctions(10, type);
    
    // 결과 표시
    displaySearchResults(recentItems);
    
    // 결과 항목에 이벤트 리스너 추가
    attachResultItemListeners();
  } catch (error) {
    console.error('최근 제재 대상 조회 오류:', error);
    showAlert('최근 제재 대상을 불러오는 중 오류가 발생했습니다.', 'error');
  } finally {
    toggleLoading(false);
  }
}

// 접근성을 위해 전역으로 일부 함수 노출
window.WVL = {
  showDetailById,
  printDetail
};