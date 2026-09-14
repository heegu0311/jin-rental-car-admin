import type { ContentSlug } from "@/lib/domain/contracts";

export interface ContentFieldGuide {
  description: string;
  isVisible: boolean;
}

export interface ContentGuide {
  route: string;
  placement: string;
  summary: string;
  preview: readonly string[];
  fields: {
    title: ContentFieldGuide;
    subtitle: ContentFieldGuide;
    image: ContentFieldGuide;
    sections: ContentFieldGuide;
  };
}

const hiddenField = (description: string): ContentFieldGuide => ({
  description,
  isVisible: false,
});

const visibleField = (description: string): ContentFieldGuide => ({
  description,
  isVisible: true,
});

export const CONTENT_GUIDES = {
  home: {
    route: "/",
    placement: "메인 페이지 최상단의 큰 배너",
    summary: "첫 화면의 배경 이미지, 큰 제목과 소개 문구를 바꿉니다.",
    preview: ["배경 이미지", "큰 제목", "소개 문구"],
    fields: {
      title: visibleField("메인 배너 왼쪽의 가장 큰 제목으로 표시됩니다."),
      subtitle: visibleField("큰 제목 아래의 두세 줄 소개 문구로 표시됩니다."),
      image: visibleField("메인 배너 전체 배경 이미지로 사용됩니다."),
      sections: hiddenField("메인 배너에서는 내용 섹션을 사용하지 않습니다."),
    },
  },
  benefits: {
    route: "/",
    placement: "메인 배너 바로 아래의 진렌트카 특장점 영역",
    summary: "특장점 영역의 제목과 네 개의 장점 카드를 관리합니다.",
    preview: ["영역 제목", "특장점 카드 1", "특장점 카드 2~4"],
    fields: {
      title: visibleField("JIN RENTAL CAR ADVANTAGE 아래의 제목입니다."),
      subtitle: hiddenField(
        "홈 특장점 영역에서는 소개 문구를 사용하지 않습니다.",
      ),
      image: hiddenField(
        "홈 특장점 영역에서는 대표 이미지를 사용하지 않습니다.",
      ),
      sections: visibleField(
        "각 섹션이 특장점 카드 한 개가 되며 제목과 설명으로 표시됩니다.",
      ),
    },
  },
  about: {
    route: "/about",
    placement: "회사소개 페이지의 상단 배너와 대표 인사말",
    summary:
      "회사 소개 이미지, 인사말 제목·본문과 추가 소개 내용을 관리합니다.",
    preview: ["상단 배너 이미지", "대표 인사말", "추가 소개 섹션"],
    fields: {
      title: visibleField("회사소개 본문의 대표 인사말 제목으로 표시됩니다."),
      subtitle: visibleField("대표 인사말 제목 아래의 회사 소개 본문입니다."),
      image: visibleField("회사소개 페이지 상단 배너 배경으로 사용됩니다."),
      sections: visibleField(
        "찾아오시는 길 아래에 추가 소개 내용으로 표시됩니다.",
      ),
    },
  },
  info: {
    route: "/info",
    placement: "이용안내 페이지의 상단 배너와 하단 추가 안내",
    summary: "이용안내의 첫 제목·이미지와 추가 안내 섹션을 관리합니다.",
    preview: ["상단 배너", "기본 이용 절차", "추가 안내 섹션"],
    fields: {
      title: visibleField("이용안내 페이지 상단 배너의 큰 제목입니다."),
      subtitle: visibleField("상단 배너 제목 아래의 소개 문구입니다."),
      image: visibleField("이용안내 페이지 상단 배너 배경으로 사용됩니다."),
      sections: visibleField(
        "기본 이용 절차와 주의사항 다음에 추가로 표시됩니다.",
      ),
    },
  },
  accident: {
    route: "/accident",
    placement: "사고대차 페이지의 서비스 소개와 하단 추가 안내",
    summary: "사고대차 소개 제목·설명, 배너 이미지와 추가 내용을 관리합니다.",
    preview: ["상단 배너 이미지", "서비스 소개", "추가 안내 섹션"],
    fields: {
      title: visibleField("사고대차 서비스 소개 영역의 큰 제목입니다."),
      subtitle: visibleField("서비스 소개 제목 아래의 설명으로 표시됩니다."),
      image: visibleField("사고대차 페이지 상단 배너 배경으로 사용됩니다."),
      sections: visibleField("FAQ 아래에 추가 안내 카드로 표시됩니다."),
    },
  },
  privacy: {
    route: "/privacy",
    placement: "개인정보처리방침 페이지 전체",
    summary: "공개 중인 개인정보처리방침의 제목과 조항을 관리합니다.",
    preview: ["문서 제목", "문서 소개", "방침 조항"],
    fields: {
      title: visibleField("개인정보처리방침 페이지의 문서 제목입니다."),
      subtitle: visibleField("문서 제목 아래의 방침 소개 문구입니다."),
      image: visibleField("입력하면 문서 상단에 대표 이미지가 표시됩니다."),
      sections: visibleField("각 섹션이 방침 조항 한 개로 표시됩니다."),
    },
  },
  terms: {
    route: "/terms",
    placement: "서비스 이용약관 페이지 전체",
    summary: "공개 중인 서비스 이용약관의 제목과 조항을 관리합니다.",
    preview: ["문서 제목", "문서 소개", "약관 조항"],
    fields: {
      title: visibleField("이용약관 페이지의 문서 제목입니다."),
      subtitle: visibleField("문서 제목 아래의 약관 소개 문구입니다."),
      image: visibleField("입력하면 문서 상단에 대표 이미지가 표시됩니다."),
      sections: visibleField("각 섹션이 약관 조항 한 개로 표시됩니다."),
    },
  },
  contact: {
    route: "/contact",
    placement: "1:1 문의 페이지의 상단 배너",
    summary: "문의 화면에 처음 보이는 제목, 설명과 배너 이미지를 관리합니다.",
    preview: ["상단 배너 이미지", "문의 제목", "문의 소개 문구"],
    fields: {
      title: visibleField("1:1 문의 페이지 상단 배너의 큰 제목입니다."),
      subtitle: visibleField("상단 배너 제목 아래의 안내 문구입니다."),
      image: visibleField("문의 페이지 상단 배너 배경으로 사용됩니다."),
      sections: hiddenField("문의 페이지에서는 내용 섹션을 사용하지 않습니다."),
    },
  },
  "new-car": {
    route: "/new-car",
    placement: "신차 장기렌트 상담 폼 상단",
    summary: "신차 상담 폼 위의 제목과 소개 문구를 관리합니다.",
    preview: ["상담 페이지 제목", "소개 문구", "신차 상담 폼"],
    fields: {
      title: visibleField("신차 상담 폼 바로 위의 큰 제목입니다."),
      subtitle: visibleField("큰 제목 아래의 상담 안내 문구입니다."),
      image: hiddenField(
        "신차 상담 페이지에서는 대표 이미지를 사용하지 않습니다.",
      ),
      sections: hiddenField(
        "신차 상담 페이지에서는 내용 섹션을 사용하지 않습니다.",
      ),
    },
  },
  settings: {
    route: "웹사이트 공통",
    placement: "헤더·푸터·상담 버튼·회사소개·고객센터의 공통 정보",
    summary: "전화번호, 영업시간, 주소, 사업자 정보와 상담 채널을 관리합니다.",
    preview: ["대표 전화·영업시간", "사업자·주소", "카카오·네이버·SNS 링크"],
    fields: {
      title: hiddenField(
        "공통 설정에서는 제목을 공개 화면에 직접 표시하지 않습니다.",
      ),
      subtitle: hiddenField(
        "공통 설정에서는 소개 문구를 공개 화면에 직접 표시하지 않습니다.",
      ),
      image: hiddenField("공통 설정에서는 대표 이미지를 사용하지 않습니다."),
      sections: visibleField(
        "섹션 제목은 설정 항목명, 내용은 실제 표시값입니다. 기존 항목명을 바꾸면 연결이 끊길 수 있습니다.",
      ),
    },
  },
} satisfies Record<ContentSlug, ContentGuide>;

export const CONTENT_GROUPS = [
  {
    title: "메인 페이지",
    description: "방문자가 처음 보는 홈 화면의 주요 영역입니다.",
    slugs: ["home", "benefits"],
  },
  {
    title: "서비스 안내 페이지",
    description: "상단 배너와 서비스 설명이 있는 개별 안내 페이지입니다.",
    slugs: ["about", "info", "accident", "new-car"],
  },
  {
    title: "고객지원·운영 정보",
    description: "문의 화면, 정책 문서와 사이트 전역의 운영 정보입니다.",
    slugs: ["contact", "privacy", "terms", "settings"],
  },
] as const satisfies ReadonlyArray<{
  title: string;
  description: string;
  slugs: readonly ContentSlug[];
}>;
