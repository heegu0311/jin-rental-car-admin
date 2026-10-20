"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  INSURANCE_AGE_GROUPS,
  INSURANCE_LIMITS,
  insuranceClasses,
  insuranceClassLabel,
  RENTAL_UNIT_LABELS,
  type InsuranceAgeGroup,
  type InsuranceConfig,
  type InsuranceClass,
  type InsurancePlan,
  type RentalType,
} from "@/lib/domain/contracts";
import { PageHeading } from "@/components/shared/feedback";
import { Panel } from "@/components/shared/Panel";
import { notifySaved } from "@/lib/public-site";
import { saveInsurance } from "./actions";

const UNITS = ["daily", "weekly", "monthly"] as const;
/** 모든 단위·연령의 보험에 같은 변경을 적용한다(배기량 구간 추가·삭제 시 요금 배열을 맞춘다). */
function mapAllPlans(
  config: InsuranceConfig,
  change: (plan: InsurancePlan) => InsurancePlan,
): InsuranceConfig {
  const units = { ...config.units };
  for (const u of UNITS)
    units[u] = {
      ...units[u],
      plans: Object.fromEntries(
        INSURANCE_AGE_GROUPS.map((age) => [
          age,
          units[u].plans[age].map(change),
        ]),
      ) as Record<InsuranceAgeGroup, InsurancePlan[]>,
    };
  return { ...config, units };
}
const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export function InsuranceEditor({
  initial,
  initialPublished,
  hasSaved,
  filledDetails,
}: {
  initial: InsuranceConfig;
  initialPublished: boolean;
  hasSaved: boolean;
  filledDetails: number;
}) {
  const [draft, setDraft] = useState(initial);
  const [published, setPublished] = useState(initialPublished);
  const [unit, setUnit] = useState<RentalType>("daily");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const current = draft.units[unit];
  const classes = insuranceClasses(draft.ccLimits);
  const setCurrent = (next: typeof current) =>
    setDraft({ ...draft, units: { ...draft.units, [unit]: next } });
  const setPlans = (
    age: InsuranceAgeGroup,
    change: (plans: InsurancePlan[]) => InsurancePlan[],
  ) =>
    setCurrent({
      ...current,
      plans: { ...current.plans, [age]: change(current.plans[age]) },
    });
  const setPrice = (
    age: InsuranceAgeGroup,
    index: number,
    cls: InsuranceClass,
    value: string,
  ) => {
    const price = Math.max(0, Math.trunc(Number(value) || 0));
    const { prices } = current.plans[age][index];
    editPlan(age, index, {
      prices:
        cls === "van"
          ? { ...prices, van: price }
          : { ...prices, cc: prices.cc.map((p, j) => (j === cls ? price : p)) },
    });
  };
  // 마지막 구간을 나누면 새 구간은 기존 마지막 구간 요금을 이어받는다.
  const addLimit = () => {
    const last = draft.ccLimits.at(-1) ?? 0;
    setDraft(
      mapAllPlans(
        { ...draft, ccLimits: [...draft.ccLimits, last + 500] },
        (p) => ({
          ...p,
          prices: {
            ...p.prices,
            cc: [...p.prices.cc, p.prices.cc.at(-1) ?? 0],
          },
        }),
      ),
    );
  };
  // 상한 i를 지우면 구간 i와 i+1이 합쳐지고 구간 i 요금을 남긴다.
  const removeLimit = (i: number) =>
    setDraft(
      mapAllPlans(
        { ...draft, ccLimits: draft.ccLimits.filter((_, j) => j !== i) },
        (p) => ({
          ...p,
          prices: {
            ...p.prices,
            cc: p.prices.cc.filter((_, j) => j !== i + 1),
          },
        }),
      ),
    );
  const limitsSorted = draft.ccLimits.every(
    (limit, i) => limit > 0 && (i === 0 || limit > draft.ccLimits[i - 1]),
  );
  const editPlan = (
    age: InsuranceAgeGroup,
    index: number,
    next: Partial<InsurancePlan>,
  ) =>
    setPlans(age, (plans) =>
      plans.map((p, i) => (i === index ? { ...p, ...next } : p)),
    );

  return (
    <form
      className="max-w-5xl space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        try {
          const r = await saveInsurance(draft, published);
          if ("error" in r) toast.error(r.error);
          else
            notifySaved(
              published
                ? "저장되었습니다. 상담 신청 화면에 반영됩니다."
                : "초안으로 저장되었습니다. 웹사이트에는 표시되지 않습니다.",
              r.site,
            );
        } catch {
          toast.error("저장 요청에 실패했습니다. 다시 시도해주세요.");
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      <PageHeading
        title="자차보험 설정"
        description="렌트 단위(일·주·월)·연령별 보험을 등록하고, 요금은 차량 배기량 구간별로 설정합니다. 승합차는 배기량과 관계없이 승합 요금을 적용합니다. 차량별 배기량·승합 여부는 차량 관리에서 입력합니다."
      />
      {!hasSaved && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          아직 저장된 설정이 없습니다. 아래 요금표를 확인한 뒤 공개를 켜고
          저장해야 웹사이트에 표시됩니다.
        </p>
      )}
      {filledDetails > 0 && (
        <p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          상세 조건이 비어 있던 보험 {filledDetails}개에 등급별 기본 보장 내용을
          채웠습니다. 내용을 확인한 뒤 저장해야 웹사이트에 반영됩니다.
        </p>
      )}
      <fieldset disabled={busy} className="space-y-6">
        <Panel
          title="배기량 구간"
          action={
            <button
              type="button"
              disabled={draft.ccLimits.length >= INSURANCE_LIMITS.ccLimits}
              onClick={addLimit}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40"
            >
              <Plus size={15} aria-hidden="true" /> 구간 추가
            </button>
          }
        >
          <p className="text-sm text-slate-500">
            구간 상한(cc 이하)을 작은 값부터 입력합니다. 일·주·월 모든 보험에
            함께 적용되며, 배기량이 입력되지 않은 차량은 고객 화면에 요금 범위로
            표시됩니다.
          </p>
          {draft.ccLimits.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">
              구간이 없으면 모든 배기량에 같은 요금을 적용합니다.
            </p>
          )}
          <ol className="mt-3 flex flex-wrap gap-2">
            {draft.ccLimits.map((limit, i) => (
              <li key={i} className="flex items-center gap-1">
                <label className="flex items-center gap-1 text-sm text-slate-600">
                  <input
                    className={`${input} w-28`}
                    type="number"
                    inputMode="numeric"
                    aria-label={`${i + 1}번째 구간 상한(cc)`}
                    min={1}
                    max={INSURANCE_LIMITS.cc}
                    step={1}
                    required
                    value={limit}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        ccLimits: draft.ccLimits.map((l, j) =>
                          j === i
                            ? Math.max(
                                0,
                                Math.trunc(Number(e.target.value) || 0),
                              )
                            : l,
                        ),
                      })
                    }
                  />
                  cc 이하
                </label>
                <button
                  type="button"
                  aria-label={`${limit}cc 구간 삭제`}
                  onClick={() => removeLimit(i)}
                  className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
          {!limitsSorted && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              구간 상한은 작은 값부터 커지도록 입력해주세요.
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            적용 구간:{" "}
            {classes
              .map((cls) => insuranceClassLabel(draft.ccLimits, cls))
              .join(" / ")}
          </p>
        </Panel>
        <div className="flex gap-2" role="tablist" aria-label="렌트 단위">
          {UNITS.map((u) => (
            <button
              key={u}
              type="button"
              role="tab"
              aria-selected={unit === u}
              onClick={() => setUnit(u)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold ${unit === u ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}
            >
              {RENTAL_UNIT_LABELS[u]}
            </button>
          ))}
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4"
            checked={current.required}
            onChange={(e) =>
              setCurrent({ ...current, required: e.target.checked })
            }
          />
          <span>
            <strong className="block text-slate-900">
              {RENTAL_UNIT_LABELS[unit]} 자차보험 가입 필수
            </strong>
            <span className="mt-1 block text-xs text-slate-500">
              켜면 고객 화면에서 &lsquo;선택 안함&rsquo;이 사라지고 보험을 꼭
              골라야 접수됩니다.
            </span>
          </span>
        </label>
        {INSURANCE_AGE_GROUPS.map((age) => (
          <Panel
            key={age}
            title={`${RENTAL_UNIT_LABELS[unit]} · ${age}`}
            action={
              <button
                type="button"
                disabled={current.plans[age].length >= INSURANCE_LIMITS.plans}
                onClick={() =>
                  setPlans(age, (plans) => [
                    ...plans,
                    {
                      name: "",
                      prices: {
                        cc: draft.ccLimits.map(() => 0).concat(0),
                        van: 0,
                      },
                      details: [],
                    },
                  ])
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40"
              >
                <Plus size={15} aria-hidden="true" /> 보험 추가
              </button>
            }
          >
            {current.plans[age].length === 0 && (
              <p className="text-sm text-slate-500">등록된 보험이 없습니다.</p>
            )}
            <ol className="space-y-4">
              {current.plans[age].map((plan, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <label className="text-xs font-semibold text-slate-600">
                      보험명
                      <input
                        className={`${input} mt-1`}
                        value={plan.name}
                        required
                        maxLength={INSURANCE_LIMITS.name}
                        placeholder="예: 일반자차 26세"
                        onChange={(e) =>
                          editPlan(age, i, { name: e.target.value })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`${plan.name || "보험"} 삭제`}
                      onClick={() =>
                        setPlans(age, (plans) =>
                          plans.filter((_, j) => j !== i),
                        )
                      }
                      className="grid size-10 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </div>
                  <fieldset className="mt-3">
                    <legend className="text-xs font-semibold text-slate-600">
                      배기량 구간별 추가 요금(원)
                    </legend>
                    <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {classes.map((cls) => (
                        <label key={cls} className="text-xs text-slate-500">
                          {insuranceClassLabel(draft.ccLimits, cls)}
                          <input
                            className={`${input} mt-1`}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={INSURANCE_LIMITS.price}
                            step={1}
                            required
                            value={
                              cls === "van"
                                ? plan.prices.van
                                : (plan.prices.cc[cls] ?? 0)
                            }
                            onChange={(e) =>
                              setPrice(age, i, cls, e.target.value)
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-600">
                      선택 시 보이는 상세 조건{" "}
                      <span className="font-normal text-slate-400">
                        (필수, 고객이 보험을 고르면 표시)
                      </span>
                    </p>
                    {plan.details.map((d, k) => (
                      <div key={k} className="flex gap-2">
                        <input
                          className={input}
                          aria-label="항목"
                          placeholder="예: 보상 한도"
                          required
                          maxLength={INSURANCE_LIMITS.detailLabel}
                          value={d.label}
                          onChange={(e) =>
                            editPlan(age, i, {
                              details: plan.details.map((x, j) =>
                                j === k ? { ...x, label: e.target.value } : x,
                              ),
                            })
                          }
                        />
                        <input
                          className={input}
                          aria-label="내용"
                          placeholder="예: 500만원"
                          required
                          maxLength={INSURANCE_LIMITS.detailValue}
                          value={d.value}
                          onChange={(e) =>
                            editPlan(age, i, {
                              details: plan.details.map((x, j) =>
                                j === k ? { ...x, value: e.target.value } : x,
                              ),
                            })
                          }
                        />
                        <button
                          type="button"
                          aria-label="상세 조건 삭제"
                          onClick={() =>
                            editPlan(age, i, {
                              details: plan.details.filter((_, j) => j !== k),
                            })
                          }
                          className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled={plan.details.length >= INSURANCE_LIMITS.details}
                      onClick={() =>
                        editPlan(age, i, {
                          details: [...plan.details, { label: "", value: "" }],
                        })
                      }
                      className="text-xs font-semibold text-blue-600 disabled:opacity-40"
                    >
                      + 상세 조건 추가
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        ))}
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          <span>
            <strong className="block text-slate-900">웹사이트에 공개</strong>
            <span className="mt-1 block text-xs text-slate-500">
              끄면 렌트 상담 신청 화면에서 자차보험 선택이 숨겨집니다. 일·주·월
              설정이 함께 저장됩니다.
            </span>
          </span>
        </label>
      </fieldset>
      <button
        disabled={busy}
        className="sticky bottom-4 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg disabled:opacity-50"
      >
        {busy ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}
