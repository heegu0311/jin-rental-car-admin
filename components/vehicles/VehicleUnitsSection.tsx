"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Hash, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { refreshPublicSiteOrNotify } from "@/lib/public-site";
import { cn } from "@/lib/utils";
import type { VehicleUnit } from "./types";

/**
 * 차량 모델에 속한 실물 차량(번호판)과 현재 상태 관리.
 * 모델을 먼저 저장해야 vehicleId가 생기므로, 새 차량 등록 중에는 안내만 보여준다.
 * 변경은 즉시 DB에 저장되며 모델 정보의 "저장하기"와는 별개다.
 */
export function VehicleUnitsSection({
  supabase,
  vehicleId,
}: {
  supabase: SupabaseClient;
  vehicleId?: string;
}) {
  const [units, setUnits] = useState<VehicleUnit[]>([]);
  const [newPlate, setNewPlate] = useState("");
  const [isAddingUnit, setIsAddingUnit] = useState(false);

  const loadUnits = useCallback(
    async (id: string) => {
      const { data } = await supabase
        .from("vehicle_units")
        .select("*")
        .eq("vehicle_id", id)
        .order("created_at", { ascending: false });
      return (data || []) as VehicleUnit[];
    },
    [supabase],
  );
  useEffect(() => {
    let active = true;
    if (vehicleId)
      loadUnits(vehicleId).then((data) => {
        if (active) setUnits(data);
      });
    return () => {
      active = false;
    };
  }, [vehicleId, loadUnits]);
  const reload = async () => {
    if (vehicleId) setUnits(await loadUnits(vehicleId));
  };

  const handleAddUnit = async () => {
    if (!newPlate.trim() || !vehicleId) return;
    setIsAddingUnit(true);
    const { error } = await supabase.from("vehicle_units").insert([
      {
        vehicle_id: vehicleId,
        plate_number: newPlate.trim(),
        status: "available",
      },
    ]);
    if (!error) {
      setNewPlate("");
      refreshPublicSiteOrNotify("차량 번호를 추가했습니다.");
      await reload();
    } else {
      toast.error("이미 등록된 번호이거나 오류가 발생했습니다.");
    }
    setIsAddingUnit(false);
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm("해당 차량 번호를 삭제하시겠습니까?")) return;
    const { error } = await supabase
      .from("vehicle_units")
      .delete()
      .eq("id", unitId);
    if (error) {
      toast.error("차량 번호를 삭제하지 못했습니다. 다시 시도해주세요.");
      return;
    }
    refreshPublicSiteOrNotify("차량 번호를 삭제했습니다.");
    await reload();
  };

  const handleStatusChange = async (
    unit: VehicleUnit,
    status: VehicleUnit["status"],
  ) => {
    const { error } = await supabase
      .from("vehicle_units")
      .update({ status })
      .eq("id", unit.id)
      .select("id")
      .single();
    if (error) {
      toast.error("상태 변경에 실패했습니다.");
      return;
    }
    refreshPublicSiteOrNotify(`${unit.plate_number} 상태를 변경했습니다.`);
    setUnits((prev) =>
      prev.map((u) => (u.id === unit.id ? { ...u, status } : u)),
    );
  };

  return (
    <div className="space-y-4 pt-6 border-t border-slate-100 bg-slate-50/50 -mx-6 px-6 pb-6">
      <h3 className="text-xs font-bold text-slate-700 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Hash size={14} /> 실물 차량 관리 (번호판)
        </span>
        {vehicleId && (
          <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600">
            총 {units.length}대
          </span>
        )}
      </h3>

      {vehicleId ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={newPlate}
              onChange={(e) => setNewPlate(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUnit();
                }
              }}
              placeholder="차량 번호 입력 (예: 29로3714)"
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all"
            />
            <button
              type="button"
              disabled={isAddingUnit || !newPlate.trim()}
              onClick={handleAddUnit}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              추가
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {units.length > 0 ? (
              units.map((unit) => (
                <div
                  key={unit.id}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl group hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <Hash size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">
                        {unit.plate_number}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            unit.status === "available"
                              ? "bg-emerald-500"
                              : unit.status === "rented"
                                ? "bg-blue-500"
                                : "bg-red-500",
                          )}
                        />
                        <Select
                          value={unit.status}
                          onValueChange={(value) =>
                            handleStatusChange(
                              unit,
                              value as VehicleUnit["status"],
                            )
                          }
                        >
                          <SelectTrigger
                            size="xs"
                            aria-label={`${unit.plate_number} 차량 상태`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">대여 가능</SelectItem>
                            <SelectItem value="rented">대여 중</SelectItem>
                            <SelectItem value="maintenance">정비 중</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteUnit(unit.id)}
                    aria-label={`${unit.plate_number} 삭제`}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-400 font-medium whitespace-pre-wrap">
                  등록된 실물 차량 번호가 없습니다.\n사용자에게 &quot;예약
                  불가&quot;로 표시됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-10 text-center bg-white border border-slate-200 rounded-xl px-6">
          <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400 italic font-medium leading-relaxed">
            개별 차량 번호 등록 및 재고 관리는
            <br />
            기본 차량 모델 정보를 상단에서 저장한 후에 가능합니다.
          </p>
        </div>
      )}
    </div>
  );
}
