"use client";
import {
  VEHICLE_LABELS,
  type Vehicle,
  type VehicleStatus,
} from "@/lib/domain/contracts";
import { Feedback } from "@/components/shared/feedback";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Car, Category } from "@/components/vehicles/types";
import { VehicleList } from "@/components/vehicles/VehicleList";
import { VehicleModal } from "@/components/vehicles/VehicleModal";
import { CategoryManager } from "@/components/vehicles/CategoryManager";
import {
  Search,
  Plus,
  Car as CarIcon,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { refreshPublicSiteOrNotify } from "@/lib/public-site";

export default function VehiclesPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [supabase] = useState(createClient);

  const loadData = useCallback(async () => {
    return Promise.all([
      supabase
        .from("vehicles")
        .select(
          `
          *,
          vehicle_units (id, status)
        `,
        )
        .order("id", { ascending: false }),
      supabase
        .from("vehicle_categories")
        .select("*")
        .order("created_at", { ascending: true }),
    ]);
  }, [supabase]);

  const applyData = useCallback(
    ([vehiclesRes, categoriesRes]: Awaited<ReturnType<typeof loadData>>) => {
      if (!vehiclesRes.error && vehiclesRes.data) {
        const mapped = vehiclesRes.data.map((v: Vehicle) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          year: String(v.year),
          price: String(v.price_monthly ?? 0),
          badge: v.badge || "",
          condition: v.condition || "",
          image: v.image_url || "",
          fuel: v.fuel || "",
          category_id: v.category_id || "",
          pricePolicy: {
            daily: v.price_daily,
            weekly: v.price_weekly,
            monthly: v.price_monthly,
          },
          unitCount: v.vehicle_units?.length || 0,
          availableCount:
            v.vehicle_units?.filter((u) => u.status === "available").length ||
            0,
          content: v.content || "",
          options: v.options || [],
          manufacturer: v.manufacturer || "",
          seats: v.seats || 5,
          rentedCount:
            v.vehicle_units?.filter((u) => u.status === "rented").length || 0,
          maintenanceCount:
            v.vehicle_units?.filter((u) => u.status === "maintenance").length ||
            0,
        }));
        setCars(mapped);
      }

      if (!categoriesRes.error && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }

      if (vehiclesRes.error || categoriesRes.error)
        setError(
          "차량 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.",
        );
      setLoading(false);
    },
    [],
  );

  const fetchData = () => loadData().then(applyData);
  useEffect(() => {
    let active = true;
    loadData().then((data) => {
      if (active) applyData(data);
    });
    return () => {
      active = false;
    };
  }, [loadData, applyData]);

  const badges = Array.from(
    new Set(cars.map((car) => car.badge).filter(Boolean)),
  ) as string[];

  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.year.includes(searchTerm) ||
      (car.fuel || "").includes(searchTerm);
    const matchesBadge = selectedBadge ? car.badge === selectedBadge : true;
    const matchesCategory = selectedCategoryId
      ? car.category_id === selectedCategoryId
      : true;
    return matchesSearch && matchesBadge && matchesCategory;
  });

  const totalUnits = cars.reduce((acc, car) => acc + (car.unitCount || 0), 0);
  const availableUnits = cars.reduce(
    (acc, car) => acc + (car.availableCount || 0),
    0,
  );
  const rentedUnits = cars.reduce(
    (sum, car) => sum + (car.rentedCount || 0),
    0,
  );

  const stats = [
    {
      label: "전체 모델",
      value: cars.length,
      icon: CarIcon,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
    {
      label: "전체 차량(대)",
      value: totalUnits,
      icon: Hash,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "대여 가능",
      value: availableUnits,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "대여 중",
      value: rentedUnits,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const handleSaveCar = async (carData: Car) => {
    const payload = {
      name: carData.name,
      year: Number(carData.year),
      fuel: carData.fuel,
      badge: carData.badge,
      condition: carData.condition,
      image_url: carData.image,
      category_id: carData.category_id || null,
      price_daily: carData.pricePolicy.daily,
      price_weekly: carData.pricePolicy.weekly,
      price_monthly: carData.pricePolicy.monthly,
      type:
        categories.find((c) => c.id === carData.category_id)?.name ||
        carData.type ||
        "일반",
      content: carData.content || "",
      options: (carData.options || []).map((s) => s.trim()).filter(Boolean),
      manufacturer: carData.manufacturer || "",
      seats: carData.seats || 5,
    };

    if (
      !payload.name.trim() ||
      !Number.isInteger(payload.year) ||
      payload.year < 1990 ||
      payload.year > 2100 ||
      [payload.price_daily, payload.price_weekly, payload.price_monthly].some(
        (p) => !Number.isInteger(p) || p < 0,
      )
    ) {
      throw new Error("차량명, 연식 및 0 이상의 정수 요금을 입력해주세요.");
    }
    const result = editingCar
      ? await supabase
          .from("vehicles")
          .update(payload)
          .eq("id", editingCar.id)
          .select("id")
          .single()
      : await supabase.from("vehicles").insert(payload).select("id").single();
    if (result.error) {
      throw new Error(
        "차량 저장에 실패했습니다. 입력값과 권한을 확인해주세요.",
      );
    }
    refreshPublicSiteOrNotify(
      editingCar ? "차량 정보를 저장했습니다." : "차량을 등록했습니다.",
    );
    fetchData();
    setIsModalOpen(false);
    setEditingCar(null);
  };

  const handleDeleteCar = async (id: string) => {
    if (window.confirm("모델과 등록된 모든 차량 정보를 삭제하시겠습니까?")) {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", id)
        .select("id")
        .single();
      if (error) {
        toast.error("삭제하지 못했습니다. 연결된 데이터를 확인해주세요.");
        return;
      }
      refreshPublicSiteOrNotify("차량을 삭제했습니다.");
      fetchData();
    }
  };

  const handleEditClick = (car: Car) => {
    setEditingCar(car);
    setIsModalOpen(true);
  };

  const handleBulkStatusChange = async (
    carIds: string[],
    status: VehicleStatus,
  ) => {
    const selectedCars = cars.filter((car) => carIds.includes(car.id));
    const unitCount = selectedCars.reduce(
      (total, car) => total + (car.unitCount || 0),
      0,
    );

    if (unitCount === 0) {
      toast.error("선택한 모델에 상태를 변경할 실물 차량이 없습니다.");
      return false;
    }

    const confirmed = window.confirm(
      `선택한 ${selectedCars.length}개 모델의 실물 차량 ${unitCount}대를 모두 '${VEHICLE_LABELS[status]}' 상태로 변경하시겠습니까?`,
    );
    if (!confirmed) return false;

    setBulkUpdating(true);
    try {
      const result = await supabase
        .from("vehicle_units")
        .update({ status })
        .in("vehicle_id", carIds)
        .select("id");

      if (result.error || result.data?.length !== unitCount) {
        toast.error(
          "선택한 차량의 상태를 모두 변경하지 못했습니다. 새로고침 후 현재 상태를 확인해주세요.",
        );
        await fetchData();
        return false;
      }

      refreshPublicSiteOrNotify(
        `${selectedCars.length}개 모델의 실물 차량 ${unitCount}대를 '${VEHICLE_LABELS[status]}' 상태로 변경했습니다.`,
      );
      await fetchData();
      return true;
    } catch {
      toast.error(
        "선택한 차량의 상태를 모두 변경하지 못했습니다. 새로고침 후 현재 상태를 확인해주세요.",
      );
      await fetchData();
      return false;
    } finally {
      setBulkUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <Feedback message={error} />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            차량 관리
          </h1>
          <p className="text-slate-500">
            등록된 전체 차량 모델 및 개별 차량 리스트를 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <CategoryManager onCategoryChange={fetchData} />

          <button
            onClick={() => {
              setEditingCar(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
          >
            <Plus size={18} />
            <span>새 차량 등록</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 transition-all hover:shadow-md"
          >
            <div
              className={cn(
                "p-2.5 md:p-3 rounded-xl shrink-0",
                stat.bg,
                stat.color,
              )}
            >
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-wider">
                {stat.label}
              </p>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={cn(
              "whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold border transition-all",
              !selectedCategoryId
                ? "bg-slate-900 border-slate-900 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
            )}
          >
            전체 차량
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                "whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold border transition-all",
                selectedCategoryId === cat.id
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Filters & View Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="모델명, 연식, 연료 등으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => setSelectedBadge(null)}
              className={cn(
                "whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all uppercase tracking-wider",
                !selectedBadge
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-400",
              )}
            >
              전체 배지
            </button>
            {badges.map((badge) => (
              <button
                key={badge}
                onClick={() => setSelectedBadge(badge)}
                className={cn(
                  "whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all uppercase tracking-wider",
                  selectedBadge === badge
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-400",
                )}
              >
                {badge}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t xl:border-t-0 pt-4 xl:pt-0">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0">
            <button
              aria-label="카드 보기"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all",
                viewMode === "grid"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <LayoutGrid size={18} />
              <span>카드</span>
            </button>
            <button
              aria-label="표 보기"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all",
                viewMode === "table"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <List size={18} />
              <span>목록</span>
            </button>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1" />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 animate-pulse">
            차량 데이터를 불러오는 중...
          </p>
        </div>
      ) : (
        <VehicleList
          cars={filteredCars}
          viewMode={viewMode}
          onEdit={handleEditClick}
          onDelete={handleDeleteCar}
          onBulkStatusChange={handleBulkStatusChange}
          bulkUpdating={bulkUpdating}
        />
      )}

      {isModalOpen && (
        <VehicleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveCar}
          car={editingCar}
          categories={categories}
        />
      )}
    </div>
  );
}
