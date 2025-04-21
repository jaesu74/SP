/**
 * sanctions.js - 제재 정보 검색 및 표시 관련 기능
 */

// 모듈을 즉시 실행 함수로 감싸서 전역 스코프 오염 방지
(function() {
  // DOM 요소
  let searchForm;
  let searchInput;
  let searchButton;
  let messageContainer;
  let loadingIndicator;
  let resultsContainer;
  let detailContainer;
  
  // API 클라이언트
  let sanctionsAPI;
  
  // 초기화 함수
  function init() {
    try {
      // DOM 요소 초기화
      searchForm = document.getElementById('search-form');
      searchInput = document.getElementById('searchInput');
      searchButton = document.getElementById('searchButton');
      messageContainer = document.getElementById('messageContainer');
      loadingIndicator = document.getElementById('loadingIndicator');
      resultsContainer = document.getElementById('resultsContainer');
      detailContainer = document.getElementById('detailContainer');
      
      // API 클라이언트 초기화 - window 객체에서 가져옴
      if (typeof window.SanctionsAPI === 'function') {
        console.log('SanctionsAPI 클래스를 찾았습니다.');
        sanctionsAPI = new window.SanctionsAPI();
      } else {
        console.error('SanctionsAPI 클래스를 전역 객체에서 찾을 수 없습니다.');
        showMessage('API 초기화 오류가 발생했습니다. 페이지를 새로고침하거나 브라우저 캐시를 지워주세요.', 'danger');
      }
      
      // 이벤트 리스너 등록
      registerEventListeners();
      
      // 검색 버튼 스타일 조정
      if (searchButton) {
        searchButton.style.width = 'auto';
        searchButton.style.padding = '0.375rem 0.75rem';
        searchButton.classList.add('btn-normal-size');
      }
    } catch (error) {
      console.error('제재 검색 모듈 초기화 실패:', error);
      displayError('제재 검색 모듈 초기화 중 오류가 발생했습니다.');
    }
  }
  
  // 이벤트 리스너 등록 함수
  function registerEventListeners() {
    if (searchForm) {
      searchForm.addEventListener('submit', handleSearch);
    } else {
      console.error('검색 폼을 찾을 수 없습니다.');
    }

    // 상세 검색 토글 기능 추가
    const advancedToggle = document.getElementById('advanced-toggle');
    const advancedSearch = document.getElementById('advanced-search');
    
    if (advancedToggle && advancedSearch) {
      advancedToggle.addEventListener('click', function(e) {
        e.preventDefault();
        advancedSearch.classList.toggle('show');
        
        // 아이콘 변경
        const icon = this.querySelector('i');
        if (icon) {
          if (advancedSearch.classList.contains('show')) {
            icon.classList.remove('fa-caret-right');
            icon.classList.add('fa-caret-down');
          } else {
            icon.classList.remove('fa-caret-down');
            icon.classList.add('fa-caret-right');
          }
        }
      });
      
      // 필터 선택 이벤트 리스너
      const filters = [
        document.getElementById('sourceFilter'),
        document.getElementById('typeFilter'),
        document.getElementById('countryFilter'),
        document.getElementById('yearFilter')
      ];
      
      filters.forEach(filter => {
        if (filter) {
          filter.addEventListener('change', function() {
            // 검색어가 있으면 바로 검색 실행
            if (searchInput && searchInput.value.trim()) {
              handleSearch(new Event('submit'));
            }
          });
        }
      });
    }
  }
  
  // 오류 표시 함수
  function displayError(message) {
    console.error('에러 발생:', message);
    if (messageContainer) {
      messageContainer.innerHTML = '';
      const alertDiv = document.createElement('div');
      alertDiv.className = 'alert alert-danger alert-dismissible fade show';
      alertDiv.role = 'alert';
      alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      messageContainer.appendChild(alertDiv);
    }
  }
  
  // 메시지 표시 함수
  function showMessage(message, type = 'info') {
    if (!messageContainer) {
      console.error('메시지 컨테이너를 찾을 수 없습니다.');
      return;
    }
    
    messageContainer.innerHTML = '';
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    messageContainer.appendChild(alertDiv);
  }
  
  // 로딩 인디케이터 토글 함수
  function toggleLoading(show) {
    if (!loadingIndicator || !searchButton) return;
    loadingIndicator.style.display = show ? 'block' : 'none';
    searchButton.disabled = show;
  }
  
  // 결과 컨테이너 초기화 함수
  function clearResults() {
    if (!resultsContainer || !detailContainer) return;
    resultsContainer.innerHTML = '';
    detailContainer.style.display = 'none';
  }
  
  // 검색 처리 함수
  async function handleSearch(event) {
    event.preventDefault();
    
    if (!searchInput) {
      displayError('검색 입력 필드를 찾을 수 없습니다.');
      return;
    }
    
    const query = searchInput.value.trim();
    if (!query) {
      showMessage('검색어를 입력해주세요.', 'warning');
      return;
    }
    
    // 이전 결과 및 메시지 초기화
    clearResults();
    if (messageContainer) messageContainer.innerHTML = '';
    
    // 로딩 표시
    toggleLoading(true);
    
    try {
      // API 객체 확인
      if (!sanctionsAPI) {
        console.log('sanctionsAPI 초기화 필요, 초기화 시도 중...');
        
        // 전역 변수에서 sanctionsAPI 확인
        if (window.sanctionsAPI) {
          console.log('window.sanctionsAPI 발견, 사용합니다.');
          sanctionsAPI = window.sanctionsAPI;
        } 
        // window 객체에서 SanctionsAPI 클래스 확인
        else if (typeof window.SanctionsAPI === 'function') {
          console.log('SanctionsAPI 클래스 발견, 초기화합니다.');
          sanctionsAPI = new window.SanctionsAPI();
          // 전역 객체에도 저장
          window.sanctionsAPI = sanctionsAPI;
        } else {
          throw new Error('SanctionsAPI를 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.');
        }
      }
      
      // API 검색 메소드 확인
      if (typeof sanctionsAPI.searchSanctions !== 'function') {
        console.error('searchSanctions 메소드를 찾을 수 없습니다.');
        if (typeof sanctionsAPI.search === 'function') {
          console.log('search 메소드 발견, 대신 사용합니다.');
          sanctionsAPI.searchSanctions = sanctionsAPI.search;
        } else {
          throw new Error('검색 메소드를 찾을 수 없습니다.');
        }
      }

      // 상세 검색 필터 적용
      const filters = {};
      
      // 출처 필터
      const sourceFilter = document.getElementById('sourceFilter');
      if (sourceFilter && sourceFilter.value) {
        filters.source = sourceFilter.value;
      }
      
      // 유형 필터
      const typeFilter = document.getElementById('typeFilter');
      if (typeFilter && typeFilter.value) {
        filters.type = typeFilter.value;
      }
      
      // 국가 필터
      const countryFilter = document.getElementById('countryFilter');
      if (countryFilter && countryFilter.value) {
        filters.country = countryFilter.value;
      }
      
      // 등재 연도 필터
      const yearFilter = document.getElementById('yearFilter');
      if (yearFilter && yearFilter.value) {
        filters.year = yearFilter.value;
      }
      
      console.log('검색 시작:', query, '필터:', filters);
      const searchResults = await sanctionsAPI.searchSanctions(query, filters);
      console.log('검색 결과:', searchResults);
      
      toggleLoading(false);
      
      if (!searchResults || searchResults.length === 0) {
        showMessage('검색 결과가 없습니다.', 'info');
        return;
      }
      
      displayResults(searchResults);
    } catch (error) {
      toggleLoading(false);
      console.error('검색 오류:', error);
      showMessage('검색 중 오류가 발생했습니다: ' + error.message, 'danger');
    }
  }
  
  // 검색 결과 표시 함수
  function displayResults(results) {
    clearResults();
    
    const resultCount = document.createElement('p');
    resultCount.textContent = `총 ${results.length}개의 결과가 있습니다.`;
    resultCount.className = 'mb-3';
    resultsContainer.appendChild(resultCount);
    
    // 그리드 컨테이너 생성
    const gridContainer = document.createElement('div');
    gridContainer.className = 'results-list';
    
    // 로그에 첫 번째 결과의 모든 필드 출력 (확인용)
    if (results.length > 0) {
      console.log("첫 번째 결과의 모든 필드:", results[0]);
    }
    
    // 결과 순회하면서 카드 형태로 표시
    results.forEach(sanction => {
      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';
      resultItem.setAttribute('data-id', sanction._id || sanction.id);
      
      // 카드 헤더 (이름과 타입)
      const header = document.createElement('div');
      header.className = 'result-header';
      
      const nameTitle = document.createElement('h3');
      nameTitle.textContent = sanction.name || '정보 없음';
      
      const typeSpan = document.createElement('span');
      typeSpan.className = 'result-type';
      typeSpan.textContent = sanction.type || '정보 없음';
      
      header.appendChild(nameTitle);
      header.appendChild(typeSpan);
      
      // 카드 본문 (출처, 국가, 나이, 성별, 상태, 등재일로 정리)
      const body = document.createElement('div');
      body.className = 'result-body';
      
      // 1. 출처 정보
      const sourceP = document.createElement('p');
      sourceP.innerHTML = `<strong>출처:</strong> ${sanction.source || '정보 없음'}`;
      body.appendChild(sourceP);
      
      // 2. 국가 정보
      const countryP = document.createElement('p');
      countryP.innerHTML = `<strong>국가:</strong> ${sanction.country || '정보 없음'}`;
      body.appendChild(countryP);
      
      // 3. 나이 정보 (생년월일/설립일로부터 계산)
      let ageText = '정보 없음';
      const birthInfo = sanction.birth_info || sanction.dob || sanction.date_of_birth;
      if (birthInfo) {
        let birthDate = null;
        if (typeof birthInfo === 'string') {
          birthDate = new Date(birthInfo);
        } else if (typeof birthInfo === 'object' && birthInfo.date) {
          birthDate = new Date(birthInfo.date);
        }
        
        if (birthDate && !isNaN(birthDate.getTime())) {
          const ageDiff = Date.now() - birthDate.getTime();
          const ageDate = new Date(ageDiff);
          const age = Math.abs(ageDate.getUTCFullYear() - 1970);
          ageText = `${age}세`;
        }
      }
      const ageP = document.createElement('p');
      ageP.innerHTML = `<strong>나이:</strong> ${ageText}`;
      body.appendChild(ageP);
      
      // 4. 성별 정보
      const genderP = document.createElement('p');
      genderP.innerHTML = `<strong>성별:</strong> ${sanction.gender || '정보 없음'}`;
      body.appendChild(genderP);
      
      // 5. 상태 정보
      const statusP = document.createElement('p');
      statusP.innerHTML = `<strong>상태:</strong> ${sanction.status || '활성'}`;
      body.appendChild(statusP);
      
      // 6. 등재일 정보 (Start Date)
      const listDate = sanction.list_date || sanction.listing_date || null;
      const listingDateP = document.createElement('p');
      listingDateP.innerHTML = `<strong>등재일:</strong> ${listDate ? new Date(listDate).toLocaleDateString() : '정보 없음'}`;
      body.appendChild(listingDateP);
      
      // 추가 정보가 있는 경우 표시
      const hasExtraInfo = (
        (sanction.nationalities && sanction.nationalities.length > 0) ||
        (sanction.identifications && sanction.identifications.length > 0) ||
        sanction.address || sanction.addresses ||
        sanction.birth_info || sanction.dob ||
        sanction.reason || sanction.remarks
      );
      
      if (hasExtraInfo) {
        const extraInfoP = document.createElement('p');
        extraInfoP.className = 'extra-info-hint';
        extraInfoP.innerHTML = `<strong>추가 정보가 있습니다. 상세 정보를 확인하세요.</strong>`;
        body.appendChild(extraInfoP);
      }
      
      // 카드 푸터 (상세 정보 버튼)
      const footer = document.createElement('div');
      footer.className = 'result-footer';
      
      const detailButton = document.createElement('button');
      detailButton.className = 'btn-detail';
      detailButton.textContent = '상세 정보';
      detailButton.addEventListener('click', async () => {
        try {
          toggleLoading(true);
          const sanctionId = sanction._id || sanction.id;
          const sanctionDetail = await sanctionsAPI.getSanctionDetail(sanctionId);
          toggleLoading(false);
          showSanctionDetailsInModal(sanctionDetail);
        } catch (error) {
          toggleLoading(false);
          showMessage('상세 정보를 불러오는 중 오류가 발생했습니다.', 'danger');
          console.error('Detail fetch error:', error);
        }
      });
      
      footer.appendChild(detailButton);
      
      // 카드 조립
      resultItem.appendChild(header);
      resultItem.appendChild(body);
      resultItem.appendChild(footer);
      
      // 그리드에 카드 추가
      gridContainer.appendChild(resultItem);
    });
    
    // 결과 컨테이너에 그리드 추가
    resultsContainer.appendChild(gridContainer);
  }
  
  // 제재 상세 정보를 모달에 표시 함수
  function showSanctionDetailsInModal(sanction) {
    // 모달 요소 가져오기
    const modal = document.getElementById('detail-modal');
    const modalContent = document.getElementById('detail-content');
    
    // 모달 내용 초기화
    modalContent.innerHTML = '';
    
    // 콘솔에 모든 필드 출력 (확인용)
    console.log("상세 정보의 모든 필드:", sanction);
    console.log("상세 정보의 모든 키:", Object.keys(sanction));
    
    // 상세 정보 구성
    const detailsContent = document.createElement('div');
    detailsContent.className = 'sanction-detail';
    
    // 출처에 따른 정보 확인 및 그룹화
    const source = sanction.source || '정보 없음';
    let sourceHtml = '';
    if (source.includes('UN')) {
      sourceHtml = `<span class="source-badge un">UN</span>`;
    } else if (source.includes('EU')) {
      sourceHtml = `<span class="source-badge eu">EU</span>`;
    } else if (source.includes('US')) {
      sourceHtml = `<span class="source-badge us">US</span>`;
    } else {
      sourceHtml = source;
    }
    
    // 출처 및 제목 정보
    const titleSection = document.createElement('div');
    titleSection.className = 'title-section';
    titleSection.innerHTML = `
      <div class="source-info">${sourceHtml}</div>
      <h4>${sanction.name || '정보 없음'}</h4>
      <div class="subtitle">${sanction.type || '정보 없음'} - ${sanction.country || '정보 없음'}</div>
    `;
    detailsContent.appendChild(titleSection);
    
    // 기본 정보 테이블
    const infoTable = document.createElement('table');
    infoTable.className = 'table table-bordered';
    
    // ID 필드 확인 (MongoDB의 _id 또는 변환된 id)
    const sanctionId = sanction._id || sanction.id || '정보 없음';
    
    // 등재일 확인 (list_date 또는 listing_date)
    const listDate = sanction.list_date || sanction.listing_date || null;
    const formattedDate = listDate ? new Date(listDate).toLocaleDateString() : '정보 없음';
    
    // 기본 정보 섹션
    const basicInfoSection = document.createElement('div');
    basicInfoSection.className = 'detail-section';
    basicInfoSection.innerHTML = '<h5>기본 정보</h5>';
    
    // 테이블 생성 시작
    let tableHtml = '';
    
    // 기본 정보 행 (모든 출처 공통)
    tableHtml += `
      <tr>
        <th>ID</th>
        <td>${sanctionId}</td>
      </tr>
      <tr>
        <th>이름</th>
        <td>${sanction.name || '정보 없음'}</td>
      </tr>
      <tr>
        <th>유형</th>
        <td>${sanction.type || '정보 없음'}</td>
      </tr>
      <tr>
        <th>국가</th>
        <td>${sanction.country || '정보 없음'}</td>
      </tr>
      <tr>
        <th>출처</th>
        <td>${source}</td>
      </tr>
      <tr>
        <th>등재일</th>
        <td>${formattedDate}</td>
      </tr>
      <tr>
        <th>상태</th>
        <td>${sanction.status || '활성'}</td>
      </tr>
    `;
    
    // 출처별 특화 정보 추가
    if (source.includes('UN')) {
      // UN 특화 필드 추가
      if (sanction.reference_number) {
        tableHtml += `
          <tr>
            <th>UN 참조번호</th>
            <td>${sanction.reference_number}</td>
          </tr>
        `;
      }
      
      if (sanction.un_list_type) {
        tableHtml += `
          <tr>
            <th>UN 리스트 유형</th>
            <td>${sanction.un_list_type}</td>
          </tr>
        `;
      }
    } 
    else if (source.includes('EU')) {
      // EU 특화 필드 추가
      if (sanction.program) {
        tableHtml += `
          <tr>
            <th>EU 프로그램</th>
            <td>${sanction.program}</td>
          </tr>
        `;
      }
      
      if (sanction.regulation_number) {
        tableHtml += `
          <tr>
            <th>EU 규제 번호</th>
            <td>${sanction.regulation_number}</td>
          </tr>
        `;
      }
    } 
    else if (source.includes('US')) {
      // US 특화 필드 추가
      if (sanction.ofac_id || sanction.entity_number) {
        tableHtml += `
          <tr>
            <th>OFAC ID</th>
            <td>${sanction.ofac_id || sanction.entity_number || '정보 없음'}</td>
          </tr>
        `;
      }
      
      if (sanction.programs || sanction.program) {
        const programs = sanction.programs || [sanction.program];
        tableHtml += `
          <tr>
            <th>US 프로그램</th>
            <td>${Array.isArray(programs) ? programs.join(', ') : programs}</td>
          </tr>
        `;
      }
    }
    
    // 추가 필드 확인 및 표시 (모든 출처)
    if (sanction.entity_number && !source.includes('US')) {
      tableHtml += `
        <tr>
          <th>엔티티 번호</th>
          <td>${sanction.entity_number}</td>
        </tr>
      `;
    }
    
    if (sanction.updated_at || sanction.last_updated) {
      const updateDate = sanction.updated_at || sanction.last_updated;
      tableHtml += `
        <tr>
          <th>최종 갱신일</th>
          <td>${updateDate ? new Date(updateDate).toLocaleDateString() : '정보 없음'}</td>
        </tr>
      `;
    }
    
    // 모든 가능한 추가 필드 검사
    const additionalFields = {
      'original_name': '원본 이름',
      'aka': '다른 이름',
      'title': '직함',
      'position': '직위',
      'function': '역할',
      'organization': '소속 조직',
      'gender': '성별',
      'start_date': '시작일',
      'end_date': '종료일',
      'reason': '제재 사유',
      'remarks': '비고',
      'designation_date': '지정일',
      'designation_details': '지정 세부정보',
      'call_sign': '호출부호',
      'vessel_type': '선박 유형',
      'vessel_flag': '선박 국적',
      'vessel_owner': '선박 소유자',
      'tonnage': '톤수',
      'gross_registered_tonnage': '총등록톤수',
      'construction_details': '건조 세부정보'
    };
    
    // 추가 필드 추가
    for (const [key, label] of Object.entries(additionalFields)) {
      if (sanction[key] && sanction[key] !== '' && sanction[key] !== 'N/A') {
        tableHtml += `
          <tr>
            <th>${label}</th>
            <td>${Array.isArray(sanction[key]) ? sanction[key].join(', ') : sanction[key]}</td>
          </tr>
        `;
      }
    }
    
    infoTable.innerHTML = tableHtml;
    basicInfoSection.appendChild(infoTable);
    detailsContent.appendChild(basicInfoSection);
    
    // 생년월일/설립일 정보
    const birthInfo = sanction.birth_info || sanction.dob || sanction.date_of_birth;
    if (birthInfo) {
      const birthSection = document.createElement('div');
      birthSection.className = 'detail-section';
      birthSection.innerHTML = '<h5>생년월일/설립일 정보</h5>';
      
      const birthTable = document.createElement('table');
      birthTable.className = 'table table-bordered';
      
      let birthTableHtml = '';
      
      if (Array.isArray(birthInfo)) {
        // 배열인 경우 각 항목 처리
        birthInfo.forEach(info => {
          if (typeof info === 'string') {
            birthTableHtml += `
              <tr>
                <td>${info}</td>
              </tr>
            `;
          } else if (typeof info === 'object') {
            // 객체인 경우 각 속성 처리
            const date = info.date || '정보 없음';
            const place = info.place || '정보 없음';
            const country = info.country || '';
            
            birthTableHtml += `
              <tr>
                <th>날짜</th>
                <td>${date}</td>
              </tr>
              <tr>
                <th>장소</th>
                <td>${place} ${country ? `(${country})` : ''}</td>
              </tr>
            `;
          }
        });
      } else if (typeof birthInfo === 'string') {
        birthTableHtml += `
          <tr>
            <td>${birthInfo}</td>
          </tr>
        `;
      } else if (typeof birthInfo === 'object') {
        // 객체인 경우 각 속성 처리
        const date = birthInfo.date || '정보 없음';
        const place = birthInfo.place || '정보 없음';
        const country = birthInfo.country || '';
        
        birthTableHtml += `
          <tr>
            <th>날짜</th>
            <td>${date}</td>
          </tr>
        `;
        
        if (place || country) {
          birthTableHtml += `
            <tr>
              <th>장소</th>
              <td>${place} ${country ? `(${country})` : ''}</td>
            </tr>
          `;
        }
      }
      
      birthTable.innerHTML = birthTableHtml;
      birthSection.appendChild(birthTable);
      detailsContent.appendChild(birthSection);
    }
    
    // 국적 정보 추가
    if (sanction.nationalities && sanction.nationalities.length > 0) {
      const nationalitiesSection = document.createElement('div');
      nationalitiesSection.className = 'detail-section';
      nationalitiesSection.innerHTML = '<h5>국적 정보</h5>';
      
      const nationalitiesList = document.createElement('ul');
      nationalitiesList.className = 'detail-list';
      
      sanction.nationalities.forEach(nationality => {
        const nationalityItem = document.createElement('li');
        nationalityItem.textContent = nationality;
        nationalitiesList.appendChild(nationalityItem);
      });
      
      nationalitiesSection.appendChild(nationalitiesList);
      detailsContent.appendChild(nationalitiesSection);
    }
    
    // 별명 정보 추가
    if (sanction.aliases && sanction.aliases.length > 0) {
      const aliasesSection = document.createElement('div');
      aliasesSection.className = 'detail-section';
      aliasesSection.innerHTML = '<h5>별명/별칭 정보</h5>';
      
      const aliasesList = document.createElement('ul');
      aliasesList.className = 'detail-list';
      
      sanction.aliases.forEach(alias => {
        const aliasItem = document.createElement('li');
        aliasItem.textContent = alias;
        aliasesList.appendChild(aliasItem);
      });
      
      aliasesSection.appendChild(aliasesList);
      detailsContent.appendChild(aliasesSection);
    }
    
    // 주소 정보 추가
    const addressField = sanction.addresses || sanction.address;
    if (addressField) {
      const addressesSection = document.createElement('div');
      addressesSection.className = 'detail-section';
      addressesSection.innerHTML = '<h5>주소 정보</h5>';
      
      const addressesList = document.createElement('ul');
      addressesList.className = 'detail-list';
      
      // 주소가 배열인 경우
      if (Array.isArray(addressField)) {
        addressField.forEach(address => {
          // 주소가 문자열 또는 객체인 경우 처리
          if (typeof address === 'string') {
            const addressItem = document.createElement('li');
            addressItem.textContent = address;
            addressesList.appendChild(addressItem);
          } else if (typeof address === 'object') {
            const addressItem = document.createElement('li');
            // 주소 객체의 여러 필드 확인 및 조합
            let addressText = '';
            if (address.street) addressText += address.street;
            if (address.city) addressText += (addressText ? ', ' : '') + address.city;
            if (address.state) addressText += (addressText ? ', ' : '') + address.state;
            if (address.country) addressText += (addressText ? ', ' : '') + address.country;
            if (address.zip) addressText += (addressText ? ' ' : '') + address.zip;
            
            // 주소 텍스트가 없는 경우 JSON으로 표시
            addressItem.textContent = addressText || JSON.stringify(address);
            addressesList.appendChild(addressItem);
          }
        });
      } 
      // 주소가 문자열인 경우
      else if (typeof addressField === 'string') {
        const addressItem = document.createElement('li');
        addressItem.textContent = addressField;
        addressesList.appendChild(addressItem);
      }
      // 주소가 객체인 경우
      else if (typeof addressField === 'object') {
        const addressItem = document.createElement('li');
        // 주소 객체의 여러 필드 확인 및 조합
        let addressText = '';
        if (addressField.street) addressText += addressField.street;
        if (addressField.city) addressText += (addressText ? ', ' : '') + addressField.city;
        if (addressField.state) addressText += (addressText ? ', ' : '') + addressField.state;
        if (addressField.country) addressText += (addressText ? ', ' : '') + addressField.country;
        if (addressField.zip) addressText += (addressText ? ' ' : '') + addressField.zip;
        
        // 주소 텍스트가 없는 경우 JSON으로 표시
        addressItem.textContent = addressText || JSON.stringify(addressField);
        addressesList.appendChild(addressItem);
      }
      
      addressesSection.appendChild(addressesList);
      detailsContent.appendChild(addressesSection);
    }
    
    // 식별 정보 추가
    if (sanction.identifications && sanction.identifications.length > 0) {
      const idSection = document.createElement('div');
      idSection.className = 'detail-section';
      idSection.innerHTML = '<h5>식별 정보</h5>';
      
      const idTable = document.createElement('table');
      idTable.className = 'table table-sm table-bordered';
      idTable.innerHTML = `
        <thead>
          <tr>
            <th>유형</th>
            <th>번호</th>
            <th>발급국</th>
            <th>발급일</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      `;
      
      const idTableBody = idTable.querySelector('tbody');
      
      sanction.identifications.forEach(ident => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${ident.type || '정보 없음'}</td>
          <td>${ident.number || '정보 없음'}</td>
          <td>${ident.country || '정보 없음'}</td>
          <td>${ident.issue_date ? new Date(ident.issue_date).toLocaleDateString() : '정보 없음'}</td>
        `;
        idTableBody.appendChild(tr);
      });
      
      idSection.appendChild(idTable);
      detailsContent.appendChild(idSection);
    }
    
    // 관련 문서 정보
    const documents = sanction.documents || [];
    if (documents.length > 0) {
      const docsSection = document.createElement('div');
      docsSection.className = 'detail-section';
      docsSection.innerHTML = '<h5>관련 문서</h5>';
      
      const docsList = document.createElement('ul');
      docsList.className = 'detail-list';
      
      documents.forEach(doc => {
        const docItem = document.createElement('li');
        const docLink = document.createElement('a');
        docLink.href = doc.url || '#';
        docLink.target = '_blank';
        docLink.textContent = doc.title || '문서';
        
        if (!doc.url) {
          docLink.style.textDecoration = 'line-through';
          docLink.onclick = (e) => e.preventDefault();
        }
        
        docItem.appendChild(docLink);
        docsList.appendChild(docItem);
      });
      
      docsSection.appendChild(docsList);
      detailsContent.appendChild(docsSection);
    }
    
    // 푸터 액션 섹션 추가 (PDF 및 텍스트 다운로드 버튼)
    const actionsSection = document.createElement('div');
    actionsSection.className = 'actions-section';
    
    // 버튼 컨테이너 생성
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    // PDF 다운로드 버튼
    const pdfBtn = document.createElement('button');
    pdfBtn.className = 'btn-primary btn-download';
    pdfBtn.style.width = '33%'; // 버튼 크기를 1/3로 설정
    pdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> PDF 다운로드';
    pdfBtn.addEventListener('click', () => handlePdfDownload(sanctionId));
    
    // 텍스트 다운로드 버튼
    const textBtn = document.createElement('button');
    textBtn.className = 'btn-secondary btn-download';
    textBtn.style.width = '33%'; // 버튼 크기를 1/3로 설정
    textBtn.style.marginLeft = '10px';
    textBtn.innerHTML = '<i class="fas fa-file-alt"></i> 텍스트 저장';
    textBtn.addEventListener('click', () => downloadAsText(sanction));
    
    buttonContainer.appendChild(pdfBtn);
    buttonContainer.appendChild(textBtn);
    actionsSection.appendChild(buttonContainer);
    detailsContent.appendChild(actionsSection);
    
    // 모달에 내용 추가
    modalContent.appendChild(detailsContent);
    
    // 모달 표시 (부트스트랩 대신 직접 표시)
    modal.style.display = 'block';
    
    // 모달 닫기 이벤트 설정
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
      button.onclick = function() {
        modal.style.display = 'none';
      }
    });
    
    // 모달 외부 클릭 시 닫기
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    }
  }
  
  // PDF 다운로드 처리 함수
  async function handlePdfDownload(sanctionId) {
    try {
      toggleLoading(true);
      showMessage('PDF 파일을 준비 중입니다...', 'info');
      
      try {
        await sanctionsAPI.downloadPdf(sanctionId);
        toggleLoading(false);
        showMessage('PDF 다운로드가 완료되었습니다.', 'success');
      } catch (pdfError) {
        console.error('PDF download error:', pdfError);
        showMessage('PDF를 생성할 수 없습니다. 대신 텍스트로 저장합니다.', 'warning');
        toggleLoading(false);
        
        // PDF 다운로드 실패 시 텍스트로 다운로드
        const sanctionDetail = await sanctionsAPI.getSanctionDetail(sanctionId);
        downloadAsText(sanctionDetail);
      }
    } catch (error) {
      toggleLoading(false);
      showMessage('정보를 가져오는 중 오류가 발생했습니다: ' + error.message, 'danger');
      console.error('Detail fetch error:', error);
    }
  }
  
  // 텍스트 파일로 저장 함수
  function downloadAsText(sanction) {
    try {
      // ObjectId 또는 id 확인
      const sanctionId = sanction._id || sanction.id || '정보 없음';
      
      // 텍스트 내용 생성
      let textContent = `제재 세부 정보\n`;
      textContent += `===================\n\n`;
      textContent += `ID: ${sanctionId}\n`;
      textContent += `이름: ${sanction.name || '정보 없음'}\n`;
      textContent += `유형: ${sanction.type || '정보 없음'}\n`;
      textContent += `국가: ${sanction.country || '정보 없음'}\n`;
      textContent += `출처: ${sanction.source || '정보 없음'}\n`;
      
      // 등재일 처리
      const listDate = sanction.list_date || sanction.listing_date || null;
      textContent += `등재일: ${listDate ? new Date(listDate).toLocaleDateString() : '정보 없음'}\n`;
      
      textContent += `상태: ${sanction.status || '활성'}\n`;
      
      // 추가 필드 처리
      if (sanction.program) {
        textContent += `프로그램: ${sanction.program}\n`;
      }
      
      if (sanction.entity_number) {
        textContent += `엔티티 번호: ${sanction.entity_number}\n`;
      }
      
      if (sanction.updated_at || sanction.last_updated) {
        const updateDate = sanction.updated_at || sanction.last_updated;
        textContent += `최종 갱신일: ${updateDate ? new Date(updateDate).toLocaleDateString() : '정보 없음'}\n`;
      }
      
      textContent += `\n`;
      
      // 국적 정보
      if (sanction.nationalities && sanction.nationalities.length > 0) {
        textContent += `국적 목록:\n`;
        sanction.nationalities.forEach(nationality => {
          textContent += `- ${nationality}\n`;
        });
        textContent += `\n`;
      }
      
      // 별명 정보
      if (sanction.aliases && sanction.aliases.length > 0) {
        textContent += `별명 목록:\n`;
        sanction.aliases.forEach(alias => {
          textContent += `- ${alias}\n`;
        });
        textContent += `\n`;
      }
      
      // 주소 정보
      const addressField = sanction.addresses || sanction.address;
      if (addressField) {
        textContent += `주소 목록:\n`;
        
        // 주소가 배열인 경우
        if (Array.isArray(addressField)) {
          addressField.forEach(address => {
            if (typeof address === 'string') {
              textContent += `- ${address}\n`;
            } else if (typeof address === 'object') {
              textContent += `- ${JSON.stringify(address)}\n`;
            }
          });
        } 
        // 주소가 문자열인 경우
        else if (typeof addressField === 'string') {
          textContent += `- ${addressField}\n`;
        }
        // 주소가 객체인 경우
        else if (typeof addressField === 'object') {
          textContent += `- ${JSON.stringify(addressField)}\n`;
        }
        
        textContent += `\n`;
      }
      
      // 식별 정보
      if (sanction.identifications && sanction.identifications.length > 0) {
        textContent += `식별 정보:\n`;
        sanction.identifications.forEach(ident => {
          textContent += `- 유형: ${ident.type || '정보 없음'}, `;
          textContent += `번호: ${ident.number || '정보 없음'}, `;
          textContent += `발급국: ${ident.country || '정보 없음'}, `;
          textContent += `발급일: ${ident.issue_date ? new Date(ident.issue_date).toLocaleDateString() : '정보 없음'}\n`;
        });
        textContent += `\n`;
      }
      
      // 추가 정보
      if (sanction.additional_info) {
        textContent += `추가 정보:\n`;
        textContent += JSON.stringify(sanction.additional_info, null, 2);
        textContent += `\n\n`;
      }
      
      // 기타 필드 - 모든 필드를 확인하고 출력
      const knownFields = [
        '_id', 'id', 'name', 'type', 'country', 'source', 'list_date', 'listing_date', 
        'status', 'program', 'entity_number', 'updated_at', 'last_updated',
        'nationalities', 'aliases', 'addresses', 'address', 'identifications', 'additional_info'
      ];
      
      textContent += `기타 정보:\n`;
      let hasOtherFields = false;
      
      for (const key in sanction) {
        if (!knownFields.includes(key) && sanction[key] !== null && sanction[key] !== undefined) {
          hasOtherFields = true;
          const value = typeof sanction[key] === 'object' 
            ? JSON.stringify(sanction[key]) 
            : sanction[key];
          textContent += `${key}: ${value}\n`;
        }
      }
      
      if (!hasOtherFields) {
        textContent += '추가 필드 없음\n';
      }
      
      // 파일 생성 및 다운로드
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `sanction_${sanctionId}.txt`;
      
      document.body.appendChild(a);
      a.click();
      
      // 정리
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showMessage('텍스트 파일이 다운로드되었습니다.', 'success');
    } catch (error) {
      console.error('텍스트 다운로드 오류:', error);
      showMessage('텍스트 다운로드 중 오류가 발생했습니다.', 'danger');
    }
  }
  
  // 전역 객체에 함수 노출
  window.initSanctions = init;
  
  // 페이지 로드 시 초기화
  document.addEventListener('DOMContentLoaded', init);
})(); 