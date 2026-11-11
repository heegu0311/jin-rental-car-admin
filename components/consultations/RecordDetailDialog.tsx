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
import type {
  ReservationConsultationResult,
  ReservationStaffRequest,
} from "@/lib/domain/consultation-result";
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
  onStaffRequestSaved,
  vehicles = [],
  insurance = null,
  consultationResult = null,
  staffRequestRecord = null,
}: {
  kind: RecordKind;
  record: RecordRow;
  title: string;
  labels: Record<string, string>;
  onClose: () => void;
  onSaved: (record: RecordRow) => void;
  onDeleted: (id: string) => void;
  onOutcomeSaved: (result: ReservationConsultationResult) => void;
  onStaffRequestSaved: (request: ReservationStaffRequest) => void;
  vehicles?: Vehicle[];
  insurance?: InsuranceConfig | null;
  consultationResult?: ReservationConsultationResult | null;
  staffRequestRecord?: ReservationStaffRequest | null;
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
        <Dialog.Content className="fixed inset-0 z-50 h-[100dvh] max-h-[100dvh] w-screen max-w-none space-y-2 overflow-x-hidden overflow-y-auto overscroll-contain rounded-none bg-white p-2 shadow-xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:w-[calc(100%-32px)] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:space-y-5 sm:rounded-2xl sm:p-6">
          <Dialog.Title className="px-2 pt-2 text-xl font-bold sm:px-0 sm:pt-0">
            {title} 상세
          </Dialog.Title>
          <Dialog.Description asChild>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-2 sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3">
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
              staffRequestRecord={staffRequestRecord}
              onOutcomeSaved={onOutcomeSaved}
              onStaffRequestSaved={onStaffRequestSaved}
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
          <div className="space-y-2 text-sm font-semibold sm:space-y-2">
            <StatusChips
              label="처리 상태"
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
                className="mt-2 w-full rounded-lg border border-slate-200 p-2 sm:p-3"
              />
              <span className="text-xs font-normal text-slate-500">
                저장되는 내부 답변 기록입니다. 고객에게 자동 발송되지는
                않습니다.
              </span>
            </label>
          )}
          <div className="flex justify-between gap-2 sm:gap-3">
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
