
# Chat Vercel Starter
Google 로그인 기반 1:1 채팅앱 (Next.js App Router + NextAuth + Prisma + Pusher + Tailwind).  
## 빠른 시작
1) Node 20, pnpm 설치: `npm i -g pnpm`
2) 의존성: `pnpm install`
3) .env 설정: `.env.example` 참고
4) DB 마이그레이션: `pnpm prisma migrate dev --name init`
5) 개발 서버: `pnpm dev`
## 배포(Vercel)
환경변수 그대로 설정하고 빌드하면 됩니다.
