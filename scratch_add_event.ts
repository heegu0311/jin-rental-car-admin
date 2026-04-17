import { createClient } from './lib/supabase/client'

const supabase = createClient()

async function addExampleEvent() {
  const { data, error } = await supabase
    .from('events')
    .insert([
      {
        title: '[봄맞이] 전 차종 주말 대여 15% 특별 할인!',
        description: '<h1>봄맞이 드라이브, 진렌트카와 함께하세요!</h1><p>따뜻한 봄날, 소중한 사람들과의 여행을 위해 진렌트카가 특별한 혜택을 준비했습니다.</p><h2>이벤트 안내</h2><ul><li><strong>대상:</strong> 전 차종 대여 고객</li><li><strong>기간:</strong> 2026년 4월 1일 ~ 5월 31일</li><li><strong>혜택:</strong> 주말(금-일) 대여 시 15% 현장 할인</li></ul><p>지금 바로 예약하고 즐거운 봄나들이를 떠나보세요!</p>',
        image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
        start_date: '2026-04-01T00:00:00Z',
        end_date: '2026-05-31T23:59:59Z',
        is_active: true
      }
    ])

  if (error) {
    console.error('Error adding event:', error)
  } else {
    console.log('Successfully added example event:', data)
  }
}

addExampleEvent()
