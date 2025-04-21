import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { loginWithEmailAndPassword } from '../../lib/firebase/auth';
import { useAuth } from '../../lib/firebase/context';
import styles from '../../styles/Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteInfo, setShowDeleteInfo] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // URL 쿼리 파라미터 확인
  useEffect(() => {
    // 회원가입 성공 시 메시지 표시
    if (router.query.registered === 'true') {
      setError('회원가입이 완료되었습니다. 이메일과 비밀번호로 로그인해주세요.');
    }
  }, [router.query]);

  // 이미 로그인한 사용자 리디렉션
  useEffect(() => {
    if (!authLoading && user) {
      console.log('이미 로그인한 사용자를 메인 페이지로 리디렉션합니다.');
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 간단한 유효성 검사
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const result = await loginWithEmailAndPassword(email, password);
      
      if (result.success) {
        console.log('로그인 성공, 메인 페이지로 이동합니다.');
        router.push('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      setError('로그인 중 오류가 발생했습니다. 나중에 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 회원탈퇴 안내 토글
  const toggleDeleteInfo = () => {
    setShowDeleteInfo(!showDeleteInfo);
  };

  // 로그인 페이지 UI 렌더링
  return (
    <div className={styles.container}>
      <Head>
        <title>로그인 - 제재 정보 검색 시스템</title>
        <meta name="description" content="제재 정보 검색 시스템 로그인 페이지" />
      </Head>
      
      <div className={styles.loginBox}>
        <h1 className={styles.title}>제재 정보 검색 시스템</h1>
        <h2 className={styles.subtitle}>로그인</h2>
        
        {error && <p className={styles.error}>{error}</p>}
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="이메일 주소 입력"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="비밀번호 입력"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        
        <div className={styles.linkContainer}>
          <div className={styles.linkGroup}>
            <Link href="/auth/register" className={styles.link}>
              계정이 없으신가요? 회원가입
            </Link>
          </div>
          
          <div className={styles.linkGroup}>
            <button onClick={toggleDeleteInfo} className={styles.linkButton}>
              회원탈퇴를 원하시나요?
            </button>
            
            {showDeleteInfo && (
              <div className={styles.deleteInfo}>
                <p>회원탈퇴는 로그인 후 가능합니다.</p>
                <p>로그인 후 <span className={styles.highlight}>마이페이지 &gt; 회원탈퇴</span>를 이용해주세요.</p>
                <Link href="/auth/delete-account" className={styles.deleteLink}>
                  회원탈퇴 페이지로 이동
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 