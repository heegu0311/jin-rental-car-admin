import type {
  InsuranceConfig,
  InsuranceDetail,
  InsurancePlan,
  InsuranceUnit,
} from "@/lib/domain/contracts";

// 저장된 설정이 없을 때 편집기에 채우는 초기값(2026-10 고객사 제공 요금표). 저장·공개 전에는 웹에 노출되지 않는다.
function details(limit: string, solo: string): InsuranceDetail[] {
  return [
    { label: "보상 한도", value: limit },
    { label: "과실 책정 시 자기 부담금", value: "50만원" },
    { label: "휴차 보상료", value: "1일 렌트비의 100%" },
    { label: "단독 사고 보험 처리", value: solo },
  ];
}
const SOLO_300 = "단독 사고 시 보험 수리 한도 300만원까지";
// 등급별 보장 내용. 렌트 단위·연령대와 무관하게 같다.
const TIER_DETAILS = {
  일반자차: details("500만원", "불가"),
  플러스자차: details("500만원", SOLO_300),
  프리미엄자차: details("1000만원", SOLO_300),
};
type Tier = keyof typeof TIER_DETAILS;
/** 상세 조건이 빈 보험에 보험명 앞부분(등급)이 일치하는 기본 보장 내용을 채운다. 채운 개수를 함께 반환한다. */
export function fillMissingDetails(config: InsuranceConfig) {
  let filled = 0;
  const next = structuredClone(config);
  for (const unit of Object.values(next))
    for (const plans of Object.values(unit.plans))
      for (const plan of plans) {
        const tier = (Object.keys(TIER_DETAILS) as Tier[]).find((t) =>
          plan.name.startsWith(t),
        );
        if (!plan.details.length && tier) {
          plan.details = TIER_DETAILS[tier].map((d) => ({ ...d }));
          filled++;
        }
      }
  return { config: next, filled };
}
const TIERS = Object.keys(TIER_DETAILS) as Tier[];

function unit(
  required: boolean,
  over26: [number, number, number],
  under26: [number, number, number],
): InsuranceUnit {
  const plans = (age: string, prices: number[]) =>
    TIERS.map((tier, i): InsurancePlan => ({
      name: `${tier} ${age}`,
      price: prices[i],
      details: TIER_DETAILS[tier],
    }));
  return {
    required,
    plans: {
      "만 26세 이상": plans("26세", over26),
      "만 26세 미만": plans("21세", under26),
    },
  };
}
export const DEFAULT_INSURANCE: InsuranceConfig = {
  daily: unit(false, [10000, 15000, 20000], [20000, 30000, 40000]),
  weekly: unit(true, [40000, 60000, 80000], [80000, 120000, 160000]),
  monthly: unit(false, [100000, 150000, 200000], [200000, 300000, 400000]),
};
