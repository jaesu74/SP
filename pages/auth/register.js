import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { registerWithEmailAndPassword } from '../../lib/firebase/auth';
import { useAuth } from '../../lib/firebase/context';
import styles from '../../styles/Login.module.css';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // 이미 로그인한 사용자 리디렉션
  useEffect(() => {
    if (!authLoading && user) {
      console.log('이미 로그인한 사용자를 메인 페이지로 리디렉션합니다.');
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await registerWithEmailAndPassword(
        formData.email, 
        formData.password,
        formData.name
      );
      
      if (result.success) {
        console.log('회원가입 성공');
        setSuccess(true);
        
        // 회원가입 성공 시 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push('/auth/login?registered=true');
        }, 3000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('회원가입 오류:', err);
      setError('회원가입 중 오류가 발생했습니다. 나중에 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>회원가입 - 세계 경제 제재 정보 검색 시스템</title>
        <meta name="description" content="세계 경제 제재 정보 검색 시스템 회원가입 페이지" />
      </Head>
      
      <div className={styles.loginBox}>
        <h1 className={styles.title}>세계 경제 제재 정보 검색 시스템</h1>
        <h2 className={styles.subtitle}>회원가입</h2>
        
        {success ? (
          <div className={styles.success}>
            <p>회원가입이 완료되었습니다!</p>
            <p>잠시 후 로그인 페이지로 이동합니다...</p>
          </div>
        ) : (
          <>
            {error && <p className={styles.error}>{error}</p>}
            
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">이름</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={styles.input}
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="이름 입력"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="email">이메일</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={styles.input}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="이메일 주소 입력"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="password">비밀번호</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className={styles.input}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="비밀번호 입력 (6자 이상)"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">비밀번호 확인</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className={styles.input}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="비밀번호 재입력"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className={styles.button}
                disabled={loading}
              >
                {loading ? '처리 중...' : '회원가입'}
              </button>
              
              <div className={styles.linkContainer}>
                <Link href="/auth/login" className={styles.link}>
                  이미 계정이 있으신가요? 로그인
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
} 