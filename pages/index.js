import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { searchSanctions, getSanctionById } from '../lib/sanctionsService';
import { useAuth } from '../lib/firebase/context';
import { logoutUser } from '../lib/firebase/auth';

// 팝업 모달 컴포넌트 추가
const DetailModal = ({ item, isOpen, onClose, activeTab, setActiveTab }) => {
  if (!isOpen || !item) return null;

  const handleDownloadPDF = async () => {
    try {
      // 상태 업데이트 - 다운로드 중
      onStatusChange({ isDownloading: true });
      
      // PDF 생성을 위한 API 호출
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        throw new Error('PDF 생성 중 오류가 발생했습니다.');
      }
      
      // PDF 바이너리 데이터 받기
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // PDF 다운로드
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `sanction_${item.id}.pdf`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // 상태 업데이트 - 다운로드 완료
      onStatusChange({ isDownloading: false });
    } catch (error) {
      console.error('PDF 다운로드 중 오류:', error);
      alert('PDF 다운로드 중 오류가 발생했습니다.');
      onStatusChange({ isDownloading: false });
    }
  };

  const handleDownloadText = () => {
    if (!item) return;
    
    // 텍스트 내용 생성
    let textContent = `FACTION 세계 무역 제재 정보\n\n`;
    textContent += `ID: ${item.id}\n`;
    textContent += `이름: ${item.name}\n`;
    textContent += `유형: ${item.type || '정보 없음'}\n`;
    textContent += `국가: ${item.country || '정보 없음'}\n`;
    textContent += `출처: ${item.source || '정보 없음'}\n\n`;
    
    textContent += `제재 프로그램:\n`;
    if (item.programs && item.programs.length > 0) {
      item.programs.forEach(program => {
        textContent += `- ${program}\n`;
      });
    } else {
      textContent += `정보 없음\n`;
    }
    
    textContent += `\n세부 정보:\n`;
    if (item.details) {
      Object.entries(item.details).forEach(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
        
        if (Array.isArray(value)) {
          textContent += `${formattedKey}:\n`;
          value.forEach(v => {
            textContent += `- ${v}\n`;
          });
        } else {
          textContent += `${formattedKey}: ${value}\n`;
        }
      });
    } else {
      textContent += `세부 정보 없음\n`;
    }
    
    // 텍스트 파일 다운로드
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sanction_${item.id}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (!item) return;
    
    const jsonContent = JSON.stringify(item, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sanction_${item.id}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onStatusChange = (statusUpdate) => {
    // 모달에서 상태 변경을 위한 콜백
    // 여기서는 아이템 업데이트를 직접 할 수 없으므로 필요한 경우 콜백을 통해 처리
  };

  // 상세 정보 렌더링
  const renderDetailContent = () => {
    if (!item) return null;
    
    if (item.isLoading) {
      return (
        <div className="modal-loading">
          <div className="modal-loading-spinner"></div>
          <p>상세 정보를 불러오는 중입니다...</p>
        </div>
      );
    }
    
    if (item.loadError) {
      return (
        <div className="modal-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="modal-error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{item.errorMessage || '상세 정보를 불러오는 중 오류가 발생했습니다.'}</p>
          <button 
            onClick={() => onRetry(item)}
            className="retry-btn"
          >
            다시 시도
          </button>
        </div>
      );
    }
    
    switch(activeTab) {
      case 'basic':
        return (
          <div className="detail-grid">
            <div>
              <h4 className="detail-section-title">기본 정보</h4>
              <ul className="detail-list">
                <li><span className="detail-label">ID:</span> {item.id}</li>
                <li><span className="detail-label">이름:</span> {item.name}</li>
                <li><span className="detail-label">유형:</span> {item.type || '정보 없음'}</li>
                <li><span className="detail-label">국가:</span> {item.country || '정보 없음'}</li>
                <li><span className="detail-label">출처:</span> {item.source || '정보 없음'}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="detail-section-title">제재 정보</h4>
              <ul className="detail-list">
                <li>
                  <span className="detail-label">제재 프로그램:</span> 
                  <div className="detail-tags">
                    {item.programs && item.programs.length > 0 
                      ? item.programs.map((program, idx) => (
                        <span key={idx} className="tag blue-tag">
                          {program}
                        </span>
                      ))
                      : <span className="no-data">정보 없음</span>}
                  </div>
                </li>
                {item.details && (
                  <>
                    {item.details.aliases && item.details.aliases.length > 0 && (
                      <li>
                        <span className="detail-label">별칭:</span>
                        <div className="detail-tags">
                          {item.details.aliases.map((alias, idx) => (
                            <span key={idx} className="tag gray-tag">
                              {alias}
                            </span>
                          ))}
                        </div>
                      </li>
                    )}
                    {item.details.startDate && (
                      <li><span className="detail-label">등재일:</span> {item.details.startDate}</li>
                    )}
                  </>
                )}
              </ul>
            </div>
            
            {/* 추가 상세 정보 */}
            {item.details && (
              <div className="full-width">
                <h4 className="detail-section-title">추가 정보</h4>
                <div className="detail-grid">
                  {Object.entries(item.details).map(([key, value]) => {
                    // 이미 위에서 표시된 정보는 제외
                    if (key === 'aliases' || key === 'startDate') return null;
                    
                    return (
                      <div key={key} className="detail-item">
                        <div className="detail-label capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </div>
                        <div className="detail-value">
                          {Array.isArray(value) 
                            ? value.map((v, i) => (
                              <span key={i} className="tag gray-tag">
                                {typeof v === 'object' 
                                  ? JSON.stringify(v) // 객체는 문자열로 변환
                                  : v}
                              </span>
                            ))
                            : typeof value === 'object'
                              ? JSON.stringify(value) // 객체는 문자열로 변환 
                              : <span>{value}</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      case 'json':
        return (
          <div>
            <div className="detail-header">
              <h4 className="detail-section-title">JSON 데이터</h4>
              <button
                onClick={handleDownloadJSON}
                className="download-btn json-btn"
              >
                JSON 다운로드
              </button>
            </div>
            <pre className="json-display">
              {JSON.stringify(item, null, 2)}
            </pre>
          </div>
        );
      case 'download':
        return (
          <div>
            <h4 className="detail-section-title">문서 다운로드</h4>
            <p>이 제재 항목에 대한 정보를 다양한 형식으로 다운로드할 수 있습니다.</p>
            
            <div className="download-actions">
              <button
                onClick={handleDownloadPDF}
                className="download-btn pdf-btn"
                disabled={item.isDownloading}
              >
                {item.isDownloading ? (
                  <>
                    <span className="loading-spinner"></span>
                    <span>PDF 생성 중...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="download-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF 다운로드
                  </>
                )}
              </button>
              
              <button
                onClick={handleDownloadText}
                className="download-btn text-btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="download-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                텍스트 다운로드
              </button>
              
              <button
                onClick={handleDownloadJSON}
                className="download-btn json-btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="download-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
                JSON 다운로드
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>{item.name}</h2>
          <p>ID: {item.id}</p>
        </div>
        
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            기본 정보
          </button>
          <button 
            className={`modal-tab ${activeTab === 'json' ? 'active' : ''}`}
            onClick={() => setActiveTab('json')}
          >
            JSON 데이터
          </button>
          <button 
            className={`modal-tab ${activeTab === 'download' ? 'active' : ''}`}
            onClick={() => setActiveTab('download')}
          >
            다운로드
          </button>
        </div>
        
        <div className="modal-content">
          {renderDetailContent()}
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filter, setFilter] = useState({ type: '', country: '', source: '' });
  const [activeTab, setActiveTab] = useState('basic');
  const [visibleResults, setVisibleResults] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // 인증되지 않은 사용자 리디렉션
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('인증되지 않은 사용자를 로그인 페이지로 리디렉션합니다.');
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await logoutUser();
      console.log('로그아웃 성공');
      router.push('/auth/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 인증 로딩 중이거나 인증되지 않은 경우 렌더링 중단
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>인증 정보를 확인하는 중...</p>
      </div>
    );
  }
  
  if (!user) {
    return null; // 인증되지 않은 경우 아무것도 렌더링하지 않음 (리디렉션 처리)
  }

  // 제재 정보 검색 함수
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    try {
      setSearching(true);
      setVisibleResults(20); // 새 검색시 표시 결과 초기화
      setHasSearched(true); // 검색 시작 시 상태 업데이트
      
      const results = await searchSanctions(searchTerm, { 
        limit: 300, // 최대 300개 검색
        type: filter.type || undefined,
        country: filter.country || undefined,
        source: filter.source || undefined
      });
      
      setSearchResults(results);
      setTotalCount(results.length);
      setSelectedItem(null);
    } catch (error) {
      console.error("검색 중 오류 발생:", error);
    } finally {
      setSearching(false);
    }
  };

  // 더 많은 결과 로드
  const loadMoreResults = () => {
    setVisibleResults(prev => Math.min(prev + 20, searchResults.length));
  };

  // 항목 선택 시 상세 정보 표시
  const handleItemSelect = async (item) => {
    try {
      // 이미 상세 정보가 불러와진 경우는 API 호출 건너뛰기
      if (selectedItem && selectedItem.id === item.id && selectedItem.details) {
        console.log('이미 로드된 상세 정보를 사용합니다.');
        setSelectedItem(selectedItem);
        setIsModalOpen(true);
        setActiveTab('basic');
        return;
      }
      
      // 로딩 상태 표시
      setSelectedItem({
        ...item, 
        isLoading: true, 
        loadError: false
      });
      setIsModalOpen(true);
      
      console.log(`ID '${item.id}'의 상세 정보를 요청합니다.`);
      
      // API를 통해 상세 정보 가져오기
      const detailedItem = await getSanctionById(item.id);
      
      // 상세 정보 설정
      setSelectedItem({
        ...detailedItem,
        isLoading: false,
        loadError: false
      });
      
      setActiveTab('basic');
    } catch (error) {
      console.error("상세 정보 로딩 중 오류 발생:", error);
      
      // 오류 상태 표시 - 기본 항목 정보는 유지하고 오류 상태만 추가
      setSelectedItem({
        ...item,
        isLoading: false,
        loadError: true,
        errorMessage: error.message || '상세 정보를 불러오는 중 오류가 발생했습니다.'
      });
    }
  };

  // 결과 다운로드 (CSV 형식)
  const handleDownloadCSV = () => {
    if (!searchResults.length) return;
    
    // CSV 헤더 생성
    const headers = ['ID', '이름', '유형', '국가', '출처', '제재 프로그램'];
    
    // CSV 행 데이터 생성
    const rows = searchResults.map(item => [
      item.id,
      item.name,
      item.type || '',
      item.country || '',
      item.source || '',
      (item.programs || []).join('; ')
    ]);
    
    // CSV 문자열 생성
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // CSV 파일 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sanctions_search_result_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 항목 JSON 다운로드
  const handleDownloadJSON = (item) => {
    if (!item) return;
    
    const jsonContent = JSON.stringify(item, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sanction_${item.id}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 텍스트 파일 다운로드
  const handleDownloadText = (item) => {
    if (!item) return;
    
    // 텍스트 내용 생성
    let textContent = `FACTION 세계 무역 제재 정보\n\n`;
    textContent += `ID: ${item.id}\n`;
    textContent += `이름: ${item.name}\n`;
    textContent += `유형: ${item.type || '정보 없음'}\n`;
    textContent += `국가: ${item.country || '정보 없음'}\n`;
    textContent += `출처: ${item.source || '정보 없음'}\n\n`;
    
    textContent += `제재 프로그램:\n`;
    if (item.programs && item.programs.length > 0) {
      item.programs.forEach(program => {
        textContent += `- ${program}\n`;
      });
    } else {
      textContent += `정보 없음\n`;
    }
    
    textContent += `\n세부 정보:\n`;
    if (item.details) {
      Object.entries(item.details).forEach(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
        
        if (Array.isArray(value)) {
          textContent += `${formattedKey}:\n`;
          value.forEach(v => {
            textContent += `- ${v}\n`;
          });
        } else {
          textContent += `${formattedKey}: ${value}\n`;
        }
      });
    } else {
      textContent += `세부 정보 없음\n`;
    }
    
    // 텍스트 파일 다운로드
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sanction_${item.id}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PDF 다운로드
  const handleDownloadPDF = async (item) => {
    if (!item) return;
    
    try {
      setSelectedItem(prev => ({...prev, isDownloading: true}));
      
      // PDF 생성을 위한 API 호출
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        throw new Error('PDF 생성 중 오류가 발생했습니다.');
      }
      
      // PDF 바이너리 데이터 받기
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // PDF 다운로드
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `sanction_${item.id}.pdf`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSelectedItem(prev => ({...prev, isDownloading: false}));
    } catch (error) {
      console.error('PDF 다운로드 중 오류:', error);
      alert('PDF 다운로드 중 오류가 발생했습니다.');
      setSelectedItem(prev => ({...prev, isDownloading: false}));
    }
  };

  // 사용자 이름 포맷팅 (최대 5자 + '님')
  const formatUserName = (name) => {
    if (!name) return '';
    const displayName = name.length > 5 ? name.slice(0, 5) : name;
    return `${displayName}님`;
  };

  // 사용자 프로필 페이지로 이동
  const goToProfile = () => {
    router.push('/profile');
  };

  return (
    <div className="app-container">
      <Head>
        <title>세계 경제 제재 정보 검색 시스템</title>
        <meta name="description" content="세계 경제 제재 정보 검색 시스템" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="main-container">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">세계 경제 제재 정보 검색 시스템</h1>
            <p className="app-subtitle">UN, EU, US(OFAC) 제재 데이터베이스 통합 검색</p>
            
            <div className="user-actions">
              {user && (
                <>
                  <button 
                    className="user-profile-btn" 
                    onClick={goToProfile}
                    title={user.displayName || user.email}
                  >
                    {formatUserName(user.displayName || user.email.split('@')[0])}
                  </button>
                  <button className="logout-btn" onClick={handleLogout}>
                    로그아웃
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <main>
          {/* 검색 폼 */}
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-container">
              <div className="search-input-group">
                <input 
                  type="text"
                  placeholder="이름, 별칭, 국가, 식별번호 등으로 검색..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={searching}
                />
                <button 
                  type="submit"
                  className="search-button"
                  disabled={searching}
                >
                  {searching ? (
                    <>
                      <span className="loading-spinner"></span>
                      <span>검색 중...</span>
                    </>
                  ) : '검색'}
                </button>
              </div>
              
              {/* 필터 옵션 */}
              <div className="filter-container">
                <div className="filter-group">
                  <label className="filter-label">유형</label>
                  <select
                    className="filter-select"
                    value={filter.type}
                    onChange={(e) => setFilter({...filter, type: e.target.value})}
                  >
                    <option value="">모든 유형</option>
                    <option value="INDIVIDUAL">개인</option>
                    <option value="ENTITY">기업/단체</option>
                    <option value="VESSEL">선박</option>
                    <option value="AIRCRAFT">항공기</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label className="filter-label">국가</label>
                  <input
                    type="text"
                    placeholder="국가명"
                    className="filter-input"
                    value={filter.country}
                    onChange={(e) => setFilter({...filter, country: e.target.value})}
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">출처</label>
                  <select
                    className="filter-select"
                    value={filter.source}
                    onChange={(e) => setFilter({...filter, source: e.target.value})}
                  >
                    <option value="">모든 출처</option>
                    <option value="UN">UN</option>
                    <option value="EU">EU</option>
                    <option value="US">US (OFAC)</option>
                  </select>
                </div>
              </div>
            </div>
          </form>

          {/* 시작 화면 */}
          {!hasSearched && searchResults.length === 0 && !searchTerm && (
            <div className="start-screen">
              <div className="help-container">
                <h2 className="help-title">경제 제재 정보 검색을 시작하세요</h2>
                <p className="help-text">세계 경제 제재 대상 개인, 기업, 단체, 선박 등의 정보를 검색할 수 있습니다.</p>
                
                <div className="help-grid">
                  <div className="help-card">
                    <div className="help-card-icon">1</div>
                    <div className="help-card-content">
                      <h3 className="help-card-title">검색어 입력</h3>
                      <p className="help-card-text">이름, 별칭, 국가명, 식별번호 등으로 검색이 가능합니다.</p>
                    </div>
                  </div>
                  
                  <div className="help-card">
                    <div className="help-card-icon">2</div>
                    <div className="help-card-content">
                      <h3 className="help-card-title">필터 설정</h3>
                      <p className="help-card-text">유형, 국가, 출처 필터를 설정하여 검색 결과를 좁힐 수 있습니다.</p>
                    </div>
                  </div>
                  
                  <div className="help-card">
                    <div className="help-card-icon">3</div>
                    <div className="help-card-content">
                      <h3 className="help-card-title">상세 정보 확인</h3>
                      <p className="help-card-text">검색 결과에서 항목을 선택하여 상세 정보를 확인할 수 있습니다.</p>
                    </div>
                  </div>
                  
                  <div className="help-card">
                    <div className="help-card-icon">4</div>
                    <div className="help-card-content">
                      <h3 className="help-card-title">데이터 다운로드</h3>
                      <p className="help-card-text">상세 정보를 PDF, TEXT로 다운로드할 수 있습니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 검색 결과 */}
          <div className={`results-container ${hasSearched ? 'results-expanded' : ''}`}>
            {searchResults.length > 0 && (
              <div className="results-wrapper">
                <div className="results-header">
                  <h2 className="results-title">
                    검색 결과: {visibleResults}/{searchResults.length}건 
                    {searchResults.length >= 300 && ' (최대 300건)'}
                  </h2>
                  <button
                    onClick={handleDownloadCSV}
                    className="download-btn csv-btn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="download-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV 다운로드
                  </button>
                </div>
                
                <div className="results-grid">
                  {searchResults.slice(0, visibleResults).map((result) => (
                    <div 
                      key={result.id} 
                      className="result-card"
                    >
                      <div className="result-content">
                        <h3 className="result-title">{result.name}</h3>
                        <div className="result-details">
                          <p>
                            <span className="result-label">유형:</span>{' '}
                            {result.type ? (
                              <span className="result-tag">
                                {result.type}
                              </span>
                            ) : '-'}
                          </p>
                          <p><span className="result-label">국가:</span> {result.country || '-'}</p>
                          <p><span className="result-label">출처:</span> {result.source || '-'}</p>
                          {result.details?.startDate && (
                            <p><span className="result-label">등재일:</span> {result.details.startDate}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleItemSelect(result)}
                          className="view-details-btn"
                        >
                          상세 정보 보기
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {visibleResults < searchResults.length && (
                  <div className="load-more-container">
                    <button
                      onClick={loadMoreResults}
                      className="load-more-btn"
                    >
                      더 보기 ({visibleResults}/{searchResults.length})
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* 검색 결과 없음 */}
            {searchTerm && !searching && searchResults.length === 0 && (
              <div className="no-results">
                <div className="no-results-content">
                  <svg xmlns="http://www.w3.org/2000/svg" className="no-results-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="no-results-text">검색 결과가 없습니다.</p>
                  <p className="no-results-hint">다른 검색어나 필터 옵션을 시도해보세요.</p>
                </div>
              </div>
            )}
          </div>
          
          {/* 모달 팝업으로 상세 정보 표시 */}
          <DetailModal 
            item={selectedItem}
            isOpen={isModalOpen && selectedItem !== null}
            onClose={() => setIsModalOpen(false)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onRetry={handleItemSelect}
          />
        </main>
      </div>

      <footer className="app-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} FACTION 경제 제재 정보 검색 시스템</p>
        </div>
      </footer>

      <style jsx>{`
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          width: 100%;
        }
        
        .app-title {
          margin: 0;
          font-size: 1.8rem;
          color: #333;
        }
        
        .app-subtitle {
          margin: 0.5rem 0 0;
          font-size: 1rem;
          color: white;
        }
        
        .user-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .user-profile-btn {
          background-color: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .user-profile-btn:hover {
          background-color: #1976d2;
        }
        
        .logout-btn {
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .logout-btn:hover {
          background-color: #d32f2f;
        }
      `}</style>
    </div>
  );
} 