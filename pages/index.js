import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { searchSanctions, getSanctionById } from '../lib/sanctionsService';
import { useAuth } from '../lib/firebase/context';
import { logoutUser } from '../lib/firebase/auth';

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
      const detailedItem = await getSanctionById(item.id);
      setSelectedItem(detailedItem);
      setActiveTab('basic');
      
      // 상세 정보가 표시된 위치로 스크롤
      setTimeout(() => {
        document.getElementById('detailsSection')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error("상세 정보 로딩 중 오류 발생:", error);
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

  // 상세 정보 렌더링
  const renderDetailContent = () => {
    if (!selectedItem) return null;
    
    switch(activeTab) {
      case 'basic':
        return (
          <div className="detail-grid">
            <div>
              <h4 className="detail-section-title">기본 정보</h4>
              <ul className="detail-list">
                <li><span className="detail-label">ID:</span> {selectedItem.id}</li>
                <li><span className="detail-label">이름:</span> {selectedItem.name}</li>
                <li><span className="detail-label">유형:</span> {selectedItem.type || '정보 없음'}</li>
                <li><span className="detail-label">국가:</span> {selectedItem.country || '정보 없음'}</li>
                <li><span className="detail-label">출처:</span> {selectedItem.source || '정보 없음'}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="detail-section-title">제재 정보</h4>
              <ul className="detail-list">
                <li>
                  <span className="detail-label">제재 프로그램:</span> 
                  <div className="detail-tags">
                    {selectedItem.programs && selectedItem.programs.length > 0 
                      ? selectedItem.programs.map((program, idx) => (
                        <span key={idx} className="tag blue-tag">
                          {program}
                        </span>
                      ))
                      : <span className="no-data">정보 없음</span>}
                  </div>
                </li>
                {selectedItem.details && (
                  <>
                    {selectedItem.details.aliases && selectedItem.details.aliases.length > 0 && (
                      <li>
                        <span className="detail-label">별칭:</span>
                        <div className="detail-tags">
                          {selectedItem.details.aliases.map((alias, idx) => (
                            <span key={idx} className="tag gray-tag">
                              {alias}
                            </span>
                          ))}
                        </div>
                      </li>
                    )}
                    {selectedItem.details.birthDate && (
                      <li><span className="detail-label">생년월일:</span> {selectedItem.details.birthDate}</li>
                    )}
                  </>
                )}
              </ul>
            </div>
            
            {/* 추가 상세 정보 */}
            {selectedItem.details && (
              <div className="full-width">
                <h4 className="detail-section-title">추가 정보</h4>
                <div className="detail-grid">
                  {Object.entries(selectedItem.details).map(([key, value]) => {
                    // 이미 위에서 표시된 정보는 제외
                    if (key === 'aliases' || key === 'birthDate') return null;
                    
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
                onClick={() => handleDownloadJSON(selectedItem)}
                className="download-btn json-btn"
              >
                JSON 다운로드
              </button>
            </div>
            <pre className="json-display">
              {JSON.stringify(selectedItem, null, 2)}
            </pre>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <Head>
        <title>제재 정보 검색 시스템</title>
        <meta name="description" content="제재 정보 검색 시스템" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="main-container">
        <header className="app-header">
          <div className="header-wrapper">
            <div className="header-title-container">
              <h1 className="app-title">제재 정보 검색 시스템</h1>
              <p className="app-subtitle">UN, EU, US(OFAC) 제재 데이터베이스 통합 검색</p>
            </div>
            
            <div className="user-container">
              <div className="user-info">
                <span className="user-name">{user.displayName || user.email}</span>
                <div className="email-logout-container">
                  <button onClick={handleLogout} className="logout-button">
                    로그아웃
                  </button>
                  <span className="user-email">{user.email}</span>
                </div>
              </div>
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
                <h2 className="help-title">제재 정보 검색을 시작하세요</h2>
                <p className="help-text">국제 제재 대상 개인, 기업, 단체, 선박 등의 정보를 검색할 수 있습니다.</p>
                
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
                      onClick={() => handleItemSelect(result)}
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
                          {result.details?.birthDate && (
                            <p><span className="result-label">등재일:</span> {result.details.birthDate}</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // 카드 클릭 이벤트와 겹치지 않도록
                            handleItemSelect(result);
                          }}
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
          
          {/* 상세 정보 */}
          {selectedItem && (
            <div id="detailsSection" className="details-section">
              <div className="details-header">
                <div>
                  <h3 className="details-title">{selectedItem.name}</h3>
                  <p className="details-subtitle">
                    {selectedItem.type && <span className="details-type">{selectedItem.type}</span>}
                    {selectedItem.country && <span className="details-country">{selectedItem.country}</span>}
                  </p>
                </div>
                
                <div className="details-actions">
                  <button
                    onClick={() => handleDownloadPDF(selectedItem)}
                    className="download-btn pdf-btn"
                    title="PDF로 다운로드"
                    disabled={selectedItem.isDownloading}
                  >
                    {selectedItem.isDownloading ? '다운로드 중...' : 'PDF'}
                  </button>
                  <button
                    onClick={() => handleDownloadText(selectedItem)}
                    className="download-btn text-btn"
                    title="텍스트 파일로 다운로드"
                  >
                    텍스트
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="back-btn"
                  >
                    ← 목록으로 돌아가기
                  </button>
                </div>
              </div>
              
              {/* 탭 메뉴 */}
              <div className="tabs-container">
                <nav className="tabs-nav">
                  <button
                    onClick={() => setActiveTab('basic')}
                    className={`tab-btn ${activeTab === 'basic' ? 'active-tab' : ''}`}
                  >
                    기본 정보
                  </button>
                  <button
                    onClick={() => setActiveTab('json')}
                    className={`tab-btn ${activeTab === 'json' ? 'active-tab' : ''}`}
                  >
                    JSON 데이터
                  </button>
                </nav>
              </div>
              
              {/* 탭 내용 */}
              <div className="tab-content">
                {renderDetailContent()}
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="app-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} 제재 정보 검색 시스템</p>
        </div>
      </footer>

      <style jsx>{`
        /* 사용자 관련 스타일 */
        .header-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 0 1rem;
        }
        
        .header-title-container {
          flex: 1;
        }
        
        .user-container {
          display: flex;
          align-items: center;
          margin-left: 1rem;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        
        .email-logout-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .user-name {
          font-weight: 600;
          color: #444;
          font-size: 0.9rem;
          margin-bottom: 0.3rem;
        }
        
        .user-email {
          font-size: 0.8rem;
          color: #666;
        }
        
        .logout-button {
          padding: 0.3rem 0.6rem;
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.7rem;
          transition: background-color 0.3s;
        }
        
        .logout-button:hover {
          background-color: #d32f2f;
        }
        
        /* 기존 스타일 유지 */
      `}</style>
    </div>
  );
} 