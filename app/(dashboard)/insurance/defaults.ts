import type {
  InsuranceConfig,
  InsurancePlan,
  InsuranceUnit,
} from "@/lib/domain/contracts";

// 저장된 설정이 없을 때 편집기에 채우는 초기값(2026-10 고객사 제공 요금표). 저장·공개 전에는 웹에 노출되지 않는다.
const GENERAL_21_DETAILS = [
  { label: "보상 한도", value: "500만원" },
  { label: "과실 책정 시 자기 부담금", value: "50만원" },
  { label: "휴차 보상료", value: "1일 렌트비의 100%" },
  { label: "단독 사고 보험 처리", value: "불가" },
];
function unit(
  required: boolean,
  over26: [number, number, number],
  under26: [number, number, number],
  under26Details: boolean,
): InsuranceUnit {
  const tiers = ["일반자차", "플러스자차", "프리미엄자차"];
  const plans = (age: string, prices: number[], details: boolean) =>
    tiers.map((tier, i): InsurancePlan => ({
      name: `${tier} ${age}`,
      price: prices[i],
      details: details && i === 0 ? GENERAL_21_DETAILS : [],
    }));
  return {
    required,
    plans: {
      "만 26세 이상": plans("26세", over26, false),
      "만 26세 미만": plans("21세", under26, under26Details),
    },
  };
}
export const DEFAULT_INSURANCE: InsuranceConfig = {
  daily: unit(false, [10000, 15000, 20000], [20000, 30000, 40000], false),
  weekly: unit(true, [40000, 60000, 80000], [80000, 120000, 160000], true),
  monthly: unit(
    false,
    [100000, 150000, 200000],
    [200000, 300000, 400000],
    true,
  ),
};
