import { 
  Users, 
  Car, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreHorizontal,
  Bell
} from 'lucide-react'

const stats = [
  { 
    label: '총 예약', 
    value: '128', 
    change: '+12.5%', 
    trend: 'up', 
    icon: Calendar,
    color: 'bg-blue-600'
  },
  { 
    label: '차량 대여율', 
    value: '84%', 
    change: '+3.2%', 
    trend: 'up', 
    icon: Car,
    color: 'bg-emerald-600'
  },
  { 
    label: '신규 문의', 
    value: '12', 
    change: '-2.4%', 
    trend: 'down', 
    icon: Users,
    color: 'bg-indigo-600'
  },
  { 
    label: '이번 달 매출', 
    value: '₩42.8M', 
    change: '+18.7%', 
    trend: 'up', 
    icon: TrendingUp,
    color: 'bg-amber-600'
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">대시보드</h1>
        <p className="text-slate-500">진렌트카 현황을 한눈에 확인하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-xl text-white`}>
                <stat.icon size={24} />
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-extrabold text-slate-900">{stat.value}</h3>
              <span className={`text-xs font-bold flex items-center gap-0.5 ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-8 h-[400px]">
          <h3 className="font-bold text-lg text-slate-900 mb-6">최근 예약 현황</h3>
          <div className="flex flex-col items-center justify-center h-[280px] text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
            차트 라이브러리 연동 대기중
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <h3 className="font-bold text-lg text-slate-900 mb-6">최근 알람</h3>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 items-start border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center">
                  <Bell size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">새로운 1:1 문의가 등록되었습니다.</p>
                  <p className="text-xs text-slate-400 mt-1">2시간 전</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
