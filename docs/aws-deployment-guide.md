# AWS 배포 가이드

이 문서는 제재 정보 검색 시스템을 AWS 클라우드에 배포하는 방법을 설명합니다.

## 사전 요구 사항

1. AWS 계정
2. AWS CLI 설치 및 구성
3. GitHub 계정 및 개인 액세스 토큰
4. Docker 설치

## AWS 서비스 구성요소

이 애플리케이션은 다음 AWS 서비스를 사용합니다:

- **ECR**: Docker 이미지 저장소
- **ECS (Fargate)**: 컨테이너 오케스트레이션
- **CloudFormation**: 인프라 프로비저닝
- **CodePipeline/CodeBuild**: CI/CD 파이프라인
- **ELB**: 로드 밸런싱
- **CloudWatch**: 로깅 및 모니터링

## 배포 절차

### 1. OIDC 인증 설정 (GitHub Actions용)

AWS에 GitHub Actions OIDC 공급자를 설정합니다:

1. AWS IAM 콘솔에서 "자격 증명 공급자" > "추가" 선택
2. 공급자 유형 = "OpenID Connect"
3. 공급자 URL = "https://token.actions.githubusercontent.com"
4. 대상 = "sts.amazonaws.com"
5. IAM 역할 생성 및 다음 신뢰 정책 연결:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<GITHUB_USERNAME>/<REPOSITORY_NAME>:*"
        }
      }
    }
  ]
}
```

6. 필요한 IAM 권한 정책 연결 (AmazonECR-FullAccess, AmazonECS-FullAccess 등)
7. 생성된 역할 ARN을 GitHub 저장소 시크릿으로 저장: `AWS_ROLE_ARN`

### 2. 수동 배포 (선택 사항)

CloudFormation 템플릿을 사용하여 수동으로 인프라를 배포할 수 있습니다:

```bash
# 배포 스크립트 실행 (GitHub 토큰 필요)
./deploy.sh --token YOUR_GITHUB_TOKEN
```

### 3. GitHub Actions 배포 설정

GitHub 저장소 설정에서 다음 시크릿을 구성합니다:

- `AWS_ROLE_ARN`: OIDC 인증용 IAM 역할 ARN
- `FIREBASE_SERVICE_ACCOUNT`: Firebase 서비스 계정 JSON (인증용)
- `GITHUB_TOKEN`: GitHub 액세스 토큰 (자동으로 설정됨)

이후 main 브랜치에 푸시하거나 스케줄 시간에 따라 GitHub Actions 워크플로우가 자동으로 실행됩니다.

## 배포 확인

배포 후 다음 단계로 애플리케이션을 확인할 수 있습니다:

1. AWS 콘솔에서 CloudFormation 스택 확인
2. 로드 밸런서 DNS 이름으로 웹사이트 접속 확인
3. CloudWatch에서 로그 확인

## 문제 해결

일반적인 문제 해결 방법:

1. **이미지 빌드 실패**: Dockerfile 및 빌드 구성 확인
2. **ECS 서비스 시작 실패**: 작업 정의, 로그 및 보안 그룹 확인
3. **API 오류**: 애플리케이션 로그 및 환경 변수 확인
4. **GitHub Actions 워크플로우 실패**: 워크플로우 로그 및 시크릿 확인

## 리소스 정리

사용하지 않는 리소스를 정리하려면:

```bash
# CloudFormation 스택 삭제
aws cloudformation delete-stack --stack-name sanctions-app-stack
``` 