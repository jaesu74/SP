import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메소드입니다.' });
  }

  try {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const chunkDir = path.join(dataDir, 'chunks');
    
    // data 디렉토리 확인 및 생성
    if (!fs.existsSync(dataDir)) {
      console.log('data 디렉토리를 생성합니다.');
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // chunks 디렉토리 확인 및 생성
    if (!fs.existsSync(chunkDir)) {
      console.log('chunks 디렉토리를 생성합니다.');
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    return res.status(200).json({ message: '디렉토리 설정 완료' });
  } catch (error) {
    console.error('디렉토리 확인/생성 중 오류:', error);
    return res.status(500).json({ message: '디렉토리 설정 오류', error: error.message });
  }
} 