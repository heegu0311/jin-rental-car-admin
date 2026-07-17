export interface Car {
  id: string;
  name: string;
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
}

export interface VehicleUnit {
  id: string;
  plate_number: string;
  status: 'available' | 'rented' | 'maintenance';
}

export interface Category {
  id: string;
  name: string;
}
