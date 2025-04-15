import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../lib/firebase/context';
import { logoutUser, deleteUserAccount, changePassword, reauthenticateUser } from '../lib/firebase/auth';
import styles from '../styles/Login.module.css';

export default function Profile() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // 인증되지 않은 사용자 리디렉션
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user, loading, router]);
  
  // 회원 정보 업데이트
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setMessage('');
      
      // 비밀번호 변경
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          return setError('새 비밀번호가 일치하지 않습니다.');
        }
        
        if (newPassword.length < 6) {
          return setError('비밀번호는 최소 6자 이상이어야 합니다.');
        }
        
        // 현재 비밀번호 확인
        if (!currentPassword) {
          return setError('현재 비밀번호를 입력해주세요.');
        }
        
        try {
          // 먼저 현재 비밀번호로 재인증
          await reauthenticateUser(currentPassword);
          // 비밀번호 변경 실행
          await changePassword(currentPassword, newPassword);
          
          setMessage('비밀번호가 성공적으로 변경되었습니다.');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } catch (error) {
          if (error.code === 'auth/wrong-password') {
            return setError('현재 비밀번호가 올바르지 않습니다.');
          } else if (error.code === 'auth/requires-recent-login') {
            return setError('보안을 위해 다시 로그인이 필요합니다. 로그아웃 후 다시 로그인해주세요.');
          } else {
            return setError(error.message || '비밀번호 변경 중 오류가 발생했습니다.');
          }
        }
      }
      
      // 표시 이름 업데이트
      if (user.displayName !== displayName) {
        // Firebase 표시 이름 변경 호출 - 실제로는 구현 필요
        // await updateUserDisplayName(displayName);
        
        setMessage('프로필이 업데이트되었습니다.');
      }
    } catch (error) {
      setError(error.message || '프로필 업데이트 중 오류가 발생했습니다.');
    }
  };
  
  // 회원 탈퇴
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      
      // 비밀번호가 입력되지 않은 경우
      if (!deletePassword) {
        return setError('계정 삭제를 위해 비밀번호를 입력해주세요.');
      }
      
      try {
        // 먼저 현재 비밀번호로 재인증
        await reauthenticateUser(deletePassword);
        // 계정 삭제 실행
        await deleteUserAccount();
        
        // 성공 시 로그인 페이지로 리디렉션
        router.push('/auth/login');
      } catch (error) {
        if (error.code === 'auth/wrong-password') {
          return setError('비밀번호가 올바르지 않습니다.');
        } else {
          return setError(error.message || '계정 삭제 중 오류가 발생했습니다.');
        }
      }
    } catch (error) {
      setError(error.message || '계정 삭제 중 오류가 발생했습니다.');
    }
  };
  
  // 로딩 중이거나 인증되지 않은 경우 렌더링 중단
  if (loading || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <p>인증 정보를 확인하는 중...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>사용자 프로필 | 제재 정보 검색 시스템</title>
        <meta name="description" content="사용자 프로필 관리" />
      </Head>
      
      <div className={styles.loginBox}>
        <h1 className={styles.title}>사용자 프로필</h1>
        
        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success}>{message}</div>}
        
        <form onSubmit={handleUpdateProfile} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="displayName">이름</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              disabled
              className={styles.input}
            />
            <small>이메일은 변경할 수 없습니다.</small>
          </div>
          
          <div className={styles.separator}>비밀번호 변경</div>
          
          <div className={styles.formGroup}>
            <label htmlFor="currentPassword">현재 비밀번호</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="newPassword">새 비밀번호</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">새 비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
            />
          </div>
          
          <button type="submit" className={styles.button}>
            프로필 업데이트
          </button>
        </form>
        
        <div className={styles.linkContainer}>
          <button 
            type="button" 
            className={styles.link}
            onClick={() => router.push('/')}
          >
            메인 페이지로 돌아가기
          </button>
        </div>
        
        <div className={styles.separator}>계정 삭제</div>
        <p className={styles.warning}>
          계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        
        {!showDeleteConfirm ? (
          <button 
            type="button" 
            className={styles.deleteButton}
            onClick={() => setShowDeleteConfirm(true)}
          >
            계정 삭제
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount}>
            <div className={styles.formGroup}>
              <label htmlFor="deletePassword">비밀번호 확인</label>
              <input
                type="password"
                id="deletePassword"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className={styles.input}
                placeholder="계정 삭제를 위해 비밀번호를 입력하세요"
                required
              />
            </div>
            
            <div className="deleteButtonsContainer">
              <button type="submit" className={styles.deleteButton}>
                계정 삭제 확인
              </button>
              <button 
                type="button" 
                className={styles.button}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
              >
                취소
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .deleteButtonsContainer {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1rem;
          width: 100%;
        }
      `}</style>
    </div>
  );
} 