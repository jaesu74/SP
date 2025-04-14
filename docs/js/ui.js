/**
 * UI 모듈
 */

// DOM 요소 접근 헬퍼
const $ = id => document.getElementById(id);
const $$ = selector => document.querySelectorAll(selector);

// 초기화
function init() {
  // 모달 설정
  $$('.close-btn').forEach(btn => {
    btn.onclick = () => btn.closest('.modal').style.display = 'none';
  });
  
  // 모달 닫기 (외부 클릭)
  window.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
  });
  
  // 비밀번호 토글
  $$('.toggle-password').forEach(btn => {
    btn.onclick = () => {
      const input = btn.previousElementSibling;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.classList.toggle('fa-eye');
      btn.classList.toggle('fa-eye-slash');
    };
  });
  
  // ESC로 모달 닫기
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') $$('.modal[style*="display: block"]').forEach(m => m.style.display = 'none');
  });
}

// 섹션 표시
function showSection(id) {
  $$('.page-section').forEach(s => s.style.display = 'none');
  const section = $(id);
  if (section) section.style.display = 'block';
  }
  
  // 모달 표시
function showModal(id) {
  const modal = $(id);
  if (modal) modal.style.display = 'block';
}

// 알림 표시
function showAlert(msg, type = 'info', opts = {}) {
  const container = document.querySelector('.alert-container');
  if (!container) return;
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = msg;
  
  container.innerHTML = '';
  container.appendChild(alert);
  
  if (!opts.isStatic) {
    setTimeout(() => {
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 300);
    }, 3000);
  }
  
  return alert;
}

// 날짜 형식화
function formatDate(str) {
  if (!str) return '';
  try {
    const date = new Date(str);
    return isNaN(date) ? str : date.toLocaleDateString('ko-KR');
  } catch (e) {
    return str;
  }
}

// 전역 함수 등록
window.showSection = showSection;
window.showModal = showModal;
window.showAlert = showAlert;
window.formatDate = formatDate;

// 초기화
document.addEventListener('DOMContentLoaded', init); 