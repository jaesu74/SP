# 베이스 이미지
FROM node:18-alpine AS base

# 의존성 설치 단계
FROM base AS deps
WORKDIR /app

# 패키지 파일 복사
COPY package.json package-lock.json ./

# 먼저 scripts 디렉토리 복사 (prepare 스크립트에 필요)
COPY scripts ./scripts/

# 종속성 설치
RUN npm ci --frozen-lockfile --production

# 빌드 단계
FROM base AS builder
WORKDIR /app

# 의존성 복사
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/scripts ./scripts
COPY . .

# 환경 변수 설정 (만약 있다면)
ARG FIREBASE_SERVICE_ACCOUNT
ENV FIREBASE_SERVICE_ACCOUNT=${FIREBASE_SERVICE_ACCOUNT}

# 데이터 동기화 및 빌드
RUN npm run sync-data
RUN npm run build

# 프로덕션 단계
FROM base AS runner
WORKDIR /app

# 환경 변수 설정
ENV NODE_ENV=production
ENV FIREBASE_SERVICE_ACCOUNT=${FIREBASE_SERVICE_ACCOUNT}

# 필요한 파일만 복사
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/scripts ./scripts

# 헬스체크 및 유지보수를 위한 스크립트 복사
COPY --from=builder /app/scripts ./scripts

# 사용자 설정 (보안 강화)
RUN addgroup --gid 1001 nodejs
RUN adduser --disabled-password --gecos "" --uid 1001 --ingroup nodejs nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

# 포트 설정
EXPOSE 3000

# 앱 실행
CMD ["npm", "start"] 