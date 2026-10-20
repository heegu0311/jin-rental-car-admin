export interface Car {
  id: string;
  name: string;
  type?: string;
  year: string;
  price: string;
  badge?: string;
  condition: string;
  image: string;
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
