import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const exampleNotices = [
  {
    title: '[안내] 진렌트카 서비스 그랜드 오픈!',
    content: '<h1>진렌트카 공식 홈페이지가 오픈되었습니다!</h1><p>안녕하세요, 진렌트카입니다. 고객님들께 더 나은 렌탈 경험을 제공해드리기 위해 공식 홈페이지를 새롭게 오픈하였습니다.</p><p>앞으로 홈페이지를 통해 차량 예약, 이벤트 소식 등을 편리하게 확인하실 수 있습니다.</p><p>많은 관심과 성원 부탁드립니다. 감사합니다.</p>',
    is_pinned: true,
  },
  {
    title: '[공지] 2024년 봄맞이 전 차종 할인 프로모션 안내',
    content: '<h2>봄맞이 전 차종 10%~20% 할인!</h2><p>따뜻한 봄을 맞아 진렌트카에서 파격적인 할인 프로모션을 준비했습니다.</p><ul><li>기한: 2024년 4월 1일 ~ 5월 31일</li><li>대상: 홈페이지 예약 전 객체</li><li>내용: 주중 20%, 주말 10% 할인</li></ul><p>지금 바로 예약하시고 즐거운 봄나들이 떠나보세요!</p>',
    is_pinned: true,
  },
  {
    title: '[필독] 렌트 차량 반납 시 주의사항 안내',
    content: '<p>차량 반납 시 아래 사항을 반드시 확인해 주시기 바랍니다.</p><ol><li>연료 부족 시 주유비가 청구될 수 있습니다.</li><li>차량 내 쓰레기는 수거해 주세요.</li><li>반납 시간을 엄수해 주시기 바랍니다. (지연 시 추가 요금 발생)</li></ol>',
    is_pinned: false,
  },
  {
    title: '장기 렌트 서비스 이용 가이드',
    content: '<p>진렌트카 장기 렌트 서비스는 1개월 이상의 렌탈 고객님을 위한 경제적인 서비스입니다.</p><p>자세한 상담은 1:1 문의 또는 고객센터를 이용해 주세요.</p>',
    is_pinned: false,
  },
  {
    title: '신규 가입 회원 5,000원 쿠폰 지급 종료 안내',
    content: '<p>그동안 진행되었던 신규 가입 회원 쿠폰 지급 이벤트가 종료될 예정입니다.</p><p>종료일: 2024년 4월 30일</p><p>이미 발급 받으신 쿠폰은 유효기간 내에 사용이 가능합니다.</p>',
    is_pinned: false,
  }
]

async function seed() {
  console.log('Seeding example notices...')
  
  // Note: Since this is RLS enabled, and I'm using the publishable key, 
  // insert might fail if the user is not authenticated.
  // HOWEVER, for a quick seed, I'll try it. 
  // If it fails, I'll suggest the user to use the SQL editor or provide the SQL.
  
  const { data, error } = await supabase
    .from('notices')
    .insert(exampleNotices)
    .select()

  if (error) {
    console.error('Error seeding data:', error)
    console.log('\n--- SQL for Manual Execution ---')
    console.log(`
INSERT INTO notices (title, content, is_pinned) VALUES 
('${exampleNotices[0].title}', '${exampleNotices[0].content}', ${exampleNotices[0].is_pinned}),
('${exampleNotices[1].title}', '${exampleNotices[1].content}', ${exampleNotices[1].is_pinned}),
('${exampleNotices[2].title}', '${exampleNotices[2].content}', ${exampleNotices[2].is_pinned}),
('${exampleNotices[3].title}', '${exampleNotices[3].content}', ${exampleNotices[3].is_pinned}),
('${exampleNotices[4].title}', '${exampleNotices[4].content}', ${exampleNotices[4].is_pinned});
    `)
  } else {
    console.log('Successfully seeded:', data.length, 'notices.')
  }
}

seed()
