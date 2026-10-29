export interface Car {
  id: string;
  name: string;
  type?: string;
  year: string;
  price: string;
  badge?: string;
  condition: string;
  /** 대표 사진(images[0]). 목록·카드에 쓴다. */
  image: string;
  /** 상세 캐러셀 사진. 첫 장이 대표 사진이다. */
  images?: string[];
  fuel?: string;
  category_id?: string;
  pricePolicy: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  unitCount?: number;
  availableCount?: number;
  content?: string;
  options?: string[];
  manufacturer?: string;
  seats?: number;
  /** 배기량(cc). 빈 값이면 null. */
  displacement_cc?: number | null;
  is_van?: boolean;
  /** 100km당 초과 주행 요금(원). 빈 값이면 null. */
  extra_km_fee?: number | null;
  /** 일/주/월 기본 약정 주행거리(km). 빈 값이면 null. */
  km_daily?: number | null;
  km_weekly?: number | null;
  km_monthly?: number | null;
  rentedCount?: number;
  maintenanceCount?: number;
}

export interface VehicleUnit {
  id: string;
  plate_number: string;
  status: "available" | "rented" | "maintenance";
}

export interface Category {
  id: string;
  name: string;
}
