import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { deleteUserAccount } from '../../lib/firebase/auth';
import { useAuth } from '../../lib/firebase/context';
import styles from '../../styles/Login.module.css';

export default function DeleteAccount() {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // 인증되지 않은 사용자 리디렉션
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('인증되지 않은 사용자를 로그인 페이지로 리디렉션합니다.');
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 확인 텍스트 검사
    if (confirmText !== '계정삭제확인') {
      setError('확인 텍스트가 일치하지 않습니다.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await deleteUserAccount();
      
      if (result.success) {
        console.log('계정 삭제 성공');
        setSuccess(true);
        
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('계정 삭제 오류:', err);
      setError('계정 삭제 중 오류가 발생했습니다. 나중에 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 인증 로딩 중이면 로딩 표시
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>인증 정보를 확인하는 중...</p>
      </div>
    );
  }
  
  // 인증되지 않은 경우 아무것도 표시하지 않음 (리디렉션 처리)
  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>회원탈퇴 - 제재 정보 검색 시스템</title>
        <meta name="description" content="제재 정보 검색 시스템 회원탈퇴 페이지" />
      </Head>
      
      <div className={styles.loginBox}>
        <h1 className={styles.title}>제재 정보 검색 시스템</h1>
        <h2 className={styles.subtitle}>회원탈퇴</h2>
        
        {success ? (
          <div className={styles.success}>
            <p>계정이 성공적으로 삭제되었습니다.</p>
            <p>잠시 후 로그인 페이지로 이동합니다...</p>
          </div>
        ) : (
          <>
            <div className={styles.warning}>
              <p>⚠️ 주의: 계정을 삭제하면 되돌릴 수 없습니다.</p>
              <p>모든 개인 데이터가 영구적으로 삭제됩니다.</p>
            </div>
            
            {error && <p className={styles.error}>{error}</p>}
            
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="confirmText">
                  계정 삭제를 확인하려면 '계정삭제확인'을 입력하세요
                </label>
                <input
                  id="confirmText"
                  type="text"
                  className={styles.input}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={loading}
                  placeholder="계정삭제확인"
                />
              </div>
              
              <button 
                type="submit" 
                className={styles.deleteButton}
                disabled={loading || confirmText !== '계정삭제확인'}
              >
                {loading ? '처리 중...' : '계정 삭제'}
              </button>
              
              <div className={styles.linkContainer}>
                <Link href="/" className={styles.link}>
                  취소하고 메인 페이지로 돌아가기
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
} 