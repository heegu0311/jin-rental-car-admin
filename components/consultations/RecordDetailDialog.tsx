"use client";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { toast } from "sonner";
import type {
  Inquiry,
  Reservation,
  Vehicle,
  InsuranceConfig,
} from "@/lib/domain/contracts";
import { deleteRecord, updateRecord, type RecordKind } from "@/lib/records";
import type { ReservationConsultationResult } from "@/lib/domain/consultation-result";
import { useSubmitLock } from "@/lib/hooks/use-submit-lock";
import { StatusChips } from "@/components/shared/StatusChips";
import { PhoneLink } from "./PhoneLink";
import { ReservationDetail } from "./ReservationDetail";

type RecordRow = Reservation | Inquiry;

/**
 * 예약 상담·문의 상세. 처리 상태(문의는 답변 기록 포함)를 저장하거나 삭제한다.
 * 저장·삭제가 성공했을 때만 onSaved/onDeleted로 목록에 반영한다.
 */
export function RecordDetailDialog({
  kind,
  record,
  title,
  labels,
  onClose,
  onSaved,
  onDeleted,
  onOutcomeSaved,
  vehicles = [],
  insurance = null,
  consultationResult = null,
}: {
  kind: RecordKind;
  record: RecordRow;
  title: string;
  labels: Record<string, string>;
  onClose: () => void;
  onSaved: (record: RecordRow) => void;
  onDeleted: (id: string) => void;
  onOutcomeSaved: (result: ReservationConsultationResult) => void;
  vehicles?: Vehicle[];
  insurance?: InsuranceConfig | null;
  consultationResult?: ReservationConsultationResult | null;
}) {
  const [status, setStatus] = useState<string>(record.status);
  const [answer, setAnswer] = useState(
    "answer_content" in record ? record.answer_content || "" : "",
  );
  const { busy, run } = useSubmitLock();

  const submit = (remove: boolean) => {
    if (
      remove &&
      !window.confirm(
        "선택한 내역을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.",
      )
    )
      return;
    return run(async () => {
      try {
        const result = remove
          ? await deleteRecord(kind, record.id)
          : await updateRecord(kind, record.id, status, answer);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        if (remove) onDeleted(record.id);
        else
          onSaved({
            ...record,
            status,
            ...(kind === "inquiries" ? { answer_content: answer } : {}),
          } as RecordRow);
        toast.success(
          remove ? "내역을 삭제했습니다." : "처리 상태를 저장했습니다.",
        );
      } catch {
        toast.error("요청을 처리하지 못했습니다. 다시 시도해주세요.");
      }
    });
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-32px)] max-w-xl -translate-x-1/2 -translate-y-1/2 space-y-5 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-xl font-bold">
            {title} 상세
          </Dialog.Title>
          <Dialog.Description asChild>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">신청자</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900">
                  {record.user_name}
                </p>
              </div>
              <PhoneLink phone={record.user_phone} />
            </div>
          </Dialog.Description>
          {"car_name" in record ? (
            <ReservationDetail
              reservation={record}
              vehicles={vehicles}
              insurance={insurance}
              outcome={consultationResult}
              onOutcomeSaved={onOutcomeSaved}
            />
          ) : (
            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <h3 className="font-semibold">{record.title}</h3>
              <p className="whitespace-pre-wrap text-sm leading-7">
                {record.content}
              </p>
              {record.user_email && (
                <p className="text-sm text-slate-500">{record.user_email}</p>
              )}
            </div>
          )}
          <div className="space-y-2 text-sm font-semibold">
            <p>처리 상태</p>
            <StatusChips
              label="처리 상태 선택 · 저장을 눌러 반영"
              value={status}
              options={Object.entries(labels).map(([value, label]) => ({
                value,
                label,
              }))}
              onChange={setStatus}
              disabled={busy}
            />
          </div>
          {kind === "inquiries" && (
            <label className="block text-sm font-semibold">
              답변 / 처리 기록
              <textarea
                disabled={busy}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={5000}
                rows={5}
                className="mt-2 w-full rounded-lg border border-slate-200 p-3"
              />
              <span className="text-xs font-normal text-slate-500">
                저장되는 내부 답변 기록입니다. 고객에게 자동 발송되지는
                않습니다.
              </span>
            </label>
          )}
          <div className="flex justify-between gap-3">
            <button
              disabled={busy}
              onClick={() => submit(true)}
              className="text-sm text-red-600 disabled:opacity-50"
            >
              내역 삭제
            </button>
            <div className="flex gap-3">
              <Dialog.Close
                disabled={busy}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                닫기
              </Dialog.Close>
              <button
                disabled={busy}
                onClick={() => submit(false)}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "처리 중…" : "저장"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
