import PDFDocument from 'pdfkit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '지원되지 않는 요청 방식입니다.' });
  }

  try {
    const data = req.body;
    
    // PDF 생성
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Sanction_${data.id}`,
        Author: 'FACTION Sanctions Search System',
      }
    });
    
    // 응답 헤더 설정 - ASCII 문자만 사용
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sanction_${data.id}.pdf`);
    
    // PDF 스트림을 응답으로 전송
    doc.pipe(res);
    
    // 폰트 설정 - 기본 폰트 사용
    const fontNormal = 'Helvetica';
    const fontBold = 'Helvetica-Bold';
    
    // 문서 타이틀
    doc.font(fontBold).fontSize(16).text('FACTION Sanctions Information', { align: 'center' });
    doc.moveDown(0.5);
    
    // 구분선
    drawLine(doc);
    
    // 기본 정보 섹션
    doc.font(fontBold).fontSize(14).text('Basic Information');
    doc.moveDown(0.5);
    
    // 표 형식으로 기본 정보 출력
    const basicInfo = [
      { label: 'ID', value: data.id },
      { label: 'Name', value: data.name },
      { label: 'Type', value: data.type || 'No information' },
      { label: 'Country', value: data.country || 'No information' },
      { label: 'Source', value: data.source || 'No information' }
    ];
    
    basicInfo.forEach(item => {
      const yPos = doc.y;
      doc.font(fontBold).text(`${item.label}:`, 50, yPos, { width: 100 });
      doc.font(fontNormal).text(item.value, 150, yPos);
      doc.moveDown(0.5);
    });
    
    doc.moveDown(0.5);
    drawLine(doc);
    
    // 제재 프로그램 섹션
    doc.font(fontBold).fontSize(14).text('Sanctions Programs');
    doc.moveDown(0.5);
    
    if (data.programs && data.programs.length > 0) {
      data.programs.forEach(program => {
        doc.font(fontNormal).fontSize(11).text(`• ${program}`);
      });
    } else {
      doc.font(fontNormal).fontSize(11).text('No information');
    }
    
    doc.moveDown(0.5);
    drawLine(doc);
    
    // 별칭 정보 출력 (있는 경우)
    if (data.details && data.details.aliases && data.details.aliases.length > 0) {
      doc.font(fontBold).fontSize(14).text('Aliases');
      doc.moveDown(0.5);
      
      data.details.aliases.forEach(alias => {
        doc.font(fontNormal).fontSize(11).text(`• ${alias}`);
      });
      
      doc.moveDown(0.5);
      drawLine(doc);
    }
    
    // 세부 정보 섹션 (별칭 제외)
    if (data.details) {
      doc.font(fontBold).fontSize(14).text('Additional Information');
      doc.moveDown(0.5);
      
      Object.entries(data.details).forEach(([key, value]) => {
        // 별칭은 이미 위에서 처리했으므로 제외
        if (key === 'aliases') return;
        
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
        doc.font(fontBold).fontSize(11).text(`${formattedKey}:`);
        
        if (Array.isArray(value)) {
          value.forEach(v => {
            // 객체인 경우 JSON 문자열로 변환
            if (typeof v === 'object' && v !== null) {
              const formattedJson = Object.entries(v)
                .map(([k, val]) => `${k}: ${val}`)
                .join(', ');
              doc.font(fontNormal).fontSize(11).text(`• ${formattedJson}`);
            } else {
              doc.font(fontNormal).fontSize(11).text(`• ${v}`);
            }
          });
        } else if (typeof value === 'object' && value !== null) {
          // 객체인 경우 속성별로 출력
          Object.entries(value).forEach(([k, val]) => {
            doc.font(fontNormal).fontSize(11).text(`• ${k}: ${val}`);
          });
        } else {
          doc.font(fontNormal).fontSize(11).text(`${value}`);
        }
        
        doc.moveDown(0.5);
      });
    } else {
      doc.font(fontNormal).fontSize(11).text('No additional information');
    }
    
    // 푸터
    const bottomOfPage = doc.page.height - 50;
    drawLine(doc, bottomOfPage - 20);
    
    doc.font(fontNormal).fontSize(9).text(
      `© ${new Date().getFullYear()} FACTION Sanctions Search System`,
      50,
      bottomOfPage,
      { align: 'center' }
    );
    
    // PDF 문서 종료
    doc.end();
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    res.status(500).json({ error: 'PDF 생성 중 오류가 발생했습니다.' });
  }
}

// 구분선 그리기
function drawLine(doc, yPosition = null) {
  const y = yPosition || doc.y;
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
  doc.moveDown(0.5);
} 