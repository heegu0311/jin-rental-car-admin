export interface Car {
  id: number;
  name: string;
  year: string;
  price: string; // 월 렌트료 기준 (화면 표시용)
  badge?: string;
  condition: string;
  image: string;
  fuel?: string;
  pricePolicy: {
    daily: number;   // 1일 대여 시 일일 요금
    weekly: number;  // 1주일 대여 시 일일 요금
    monthly: number; // 1개월 대여 시 일일 요금
  };
}

export const CARS: Car[] = [
  { 
    id: 1, name: "아반떼", year: "2023", price: "550,000", badge: "인기", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1590362891991-f20dc2368a96?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 55000, weekly: 36000, monthly: 18300 }
  },
  { 
    id: 2, name: "아반떼", year: "2024", price: "580,000", badge: "신차급", condition: "비흡연/완벽점검", 
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 58000, weekly: 38000, monthly: 19300 }
  },
  { 
    id: 3, name: "아반떼", year: "2025", price: "620,000", badge: "신차", condition: "비흡연/완벽점검", 
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 62000, weekly: 41000, monthly: 20600 }
  },
  { 
    id: 4, name: "K3", year: "2024", price: "520,000", badge: "경제적", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 52000, weekly: 34000, monthly: 17300 }
  },
  { 
    id: 5, name: "모닝", year: "2022", price: "350,000", badge: "특가", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1606132402127-1426eb84788c?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 35000, weekly: 23000, monthly: 11600 }
  },
  { 
    id: 6, name: "레이", year: "2022", price: "380,000", badge: "인기", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1606132402127-1426eb84788c?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 38000, weekly: 25000, monthly: 12600 }
  },
  { 
    id: 7, name: "K5", year: "2023", price: "650,000", fuel: "휘발유", badge: "스테디셀러", condition: "비흡연/완벽점검", 
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 65000, weekly: 43000, monthly: 21600 }
  },
  { 
    id: 8, name: "K5", year: "2023", price: "630,000", fuel: "LPG", badge: "저렴한연비", condition: "비흡연/완벽점검", 
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 63000, weekly: 42000, monthly: 21000 }
  },
  { 
    id: 9, name: "K5", year: "2025", price: "720,000", badge: "신차", condition: "비흡연/완벽점검", 
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 72000, weekly: 48000, monthly: 24000 }
  },
  { 
    id: 10, name: "소나타", year: "2023", price: "680,000", fuel: "휘발유", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 68000, weekly: 45000, monthly: 22600 }
  },
  { 
    id: 11, name: "소나타", year: "2024", price: "660,000", fuel: "LPG", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 66000, weekly: 44000, monthly: 22000 }
  },
  { 
    id: 12, name: "K8", year: "2022", price: "820,000", fuel: "LPG", badge: "럭셔리", condition: "비흡연/완벽점검", 
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 82000, weekly: 54000, monthly: 27300 }
  },
  { 
    id: 13, name: "더 뉴 그랜저", year: "2021", price: "780,000", fuel: "LPG", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 78000, weekly: 52000, monthly: 26000 }
  },
  { 
    id: 14, name: "그랜져", year: "2025", price: "950,000", fuel: "휘발유", badge: "최고급", condition: "비흡연/완벽점검", 
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 95000, weekly: 63000, monthly: 31600 }
  },
  { 
    id: 15, name: "G80", year: "2023", price: "1,200,000", badge: "프리미엄", condition: "비흡연/VIP점검", 
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 120000, weekly: 80000, monthly: 40000 }
  },
  { 
    id: 16, name: "셀토스", year: "2024", price: "590,000", badge: "인기SUV", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 59000, weekly: 39000, monthly: 19600 }
  },
  { 
    id: 17, name: "셀토스", year: "2025", price: "630,000", badge: "신차", condition: "비흡연/완벽점검", 
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 63000, weekly: 42000, monthly: 21000 }
  },
  { 
    id: 18, name: "니로 하이브리드", year: "2022", price: "580,000", badge: "연비최강", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 58000, weekly: 38000, monthly: 19300 }
  },
  { 
    id: 19, name: "QM6", year: "2022", price: "650,000", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 65000, weekly: 43000, monthly: 21600 }
  },
  { 
    id: 20, name: "스포티지", year: "2025", price: "780,000", badge: "추천", condition: "비흡연/완벽점검", 
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 78000, weekly: 52000, monthly: 26000 }
  },
  { 
    id: 21, name: "싼타페", year: "2021", price: "720,000", fuel: "경유", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 72000, weekly: 48000, monthly: 24000 }
  },
  { 
    id: 22, name: "싼타페", year: "2025", price: "880,000", fuel: "휘발유", badge: "풀체인지", condition: "비흡연/완벽점검", 
    image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 88000, weekly: 58000, monthly: 29300 }
  },
  { 
    id: 23, name: "쏘렌토", year: "2023", price: "790,000", badge: "패밀리카", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 79000, weekly: 52000, monthly: 26300 }
  },
  { 
    id: 24, name: "쏘렌토", year: "2024", price: "840,000", badge: "신차급", condition: "비흡연/완벽점검", 
    image: "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 84000, weekly: 56000, monthly: 28000 }
  },
  { 
    id: 25, name: "쏘렌토", year: "2025", price: "890,000", badge: "신차", condition: "비흡연/완벽점검", 
    image: "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 89000, weekly: 59000, monthly: 29600 }
  },
  { 
    id: 26, name: "스타렉스", year: "19", price: "550,000", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 55000, weekly: 36000, monthly: 18300 }
  },
  { 
    id: 27, name: "스타렉스", year: "20", price: "580,000", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 58000, weekly: 38000, monthly: 19300 }
  },
  { 
    id: 28, name: "카니발", year: "2020", price: "720,000", badge: "특가", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 72000, weekly: 48000, monthly: 24000 }
  },
  { 
    id: 29, name: "카니발", year: "2023", price: "890,000", badge: "인기", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 89000, weekly: 59000, monthly: 29600 }
  },
  { 
    id: 30, name: "스타리아", year: "2022", price: "850,000", condition: "비흡연/실내크리닝", 
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 85000, weekly: 56000, monthly: 28300 }
  },
  { 
    id: 31, name: "스타리아", year: "2025", price: "980,000", badge: "최신", condition: "비흡연/완벽점검", 
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    pricePolicy: { daily: 98000, weekly: 65000, monthly: 32600 }
  },
];
