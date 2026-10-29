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
  /** true면 섹션을 ABOUT_FIELDS 고정 항목 입력으로 편집한다. */
  fixedFields?: true;
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
  about: {
    route: "/about",
    placement: "회사소개 페이지의 상단 배너, 대표 인사말 서명과 찾아오시는 길",
    summary:
      "상단 배너 이미지, 대표자 이름과 상호·주소·대표 전화·영업시간·배차 시간을 관리합니다. 배너·인사말 문구는 고정입니다.",
    preview: [
      "상단 배너 이미지",
      "대표 인사말 · 대표자",
      "찾아오시는 길 · 상호",
      "주소·전화·영업·배차 시간",
    ],
    fields: {
      title: hiddenField("회사소개에서는 제목을 사용하지 않습니다."),
      subtitle: hiddenField("회사소개 인사말 문구는 고정입니다."),
      image: visibleField(
        "회사소개 페이지 상단 배너 배경으로 사용됩니다. 비워 두면 기본 이미지를 사용합니다.",
      ),
      sections: visibleField(
        "비워 둔 항목은 사업자·상담 채널 설정의 값을 그대로 사용합니다.",
      ),
    },
    fixedFields: true,
  },
  info: {
    route: "/info",
    placement: "이용안내 페이지의 상단 배너",
    summary: "이용안내 상단 배너의 제목·소개 문구와 이미지를 관리합니다.",
    preview: ["상단 배너", "기본 이용 절차", "주의사항"],
    fields: {
      title: visibleField("이용안내 페이지 상단 배너의 큰 제목입니다."),
      subtitle: visibleField("상단 배너 제목 아래의 소개 문구입니다."),
      image: visibleField("이용안내 페이지 상단 배너 배경으로 사용됩니다."),
      sections: hiddenField("이용안내에서는 내용 섹션을 사용하지 않습니다."),
    },
  },
  accident: {
    route: "/accident",
    placement: "사고대차 페이지의 상단 배너와 서비스 소개",
    summary: "사고대차 소개 제목·설명과 배너 이미지를 관리합니다.",
    preview: ["상단 배너 이미지", "서비스 소개", "자주 묻는 질문"],
    fields: {
      title: visibleField("사고대차 서비스 소개 영역의 큰 제목입니다."),
      subtitle: visibleField("서비스 소개 제목 아래의 설명으로 표시됩니다."),
      image: visibleField("사고대차 페이지 상단 배너 배경으로 사용됩니다."),
      sections: hiddenField("사고대차에서는 내용 섹션을 사용하지 않습니다."),
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
    slugs: ["home"],
  },
  {
    title: "서비스 안내 페이지",
    description: "상단 배너와 서비스 설명이 있는 개별 안내 페이지입니다.",
    slugs: ["about", "info", "accident", "new-car"],
  },
  {
    title: "고객지원·운영 정보",
    description: "문의 화면과 사이트 전역의 운영 정보입니다.",
    slugs: ["contact", "settings"],
  },
] as const satisfies ReadonlyArray<{
  title: string;
  description: string;
  slugs: readonly ContentSlug[];
}>;
