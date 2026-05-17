// 검색 인덱스 API — 클라이언트 fuse.js가 빌드 타임 데이터를 요청
import { NextResponse } from 'next/server'
import { getAllArticleIndex } from '@/lib/db'

export const dynamic = 'force-static'   // 빌드 시 JSON 생성

export function GET() {
  const index = getAllArticleIndex()
  return NextResponse.json(index)
}
