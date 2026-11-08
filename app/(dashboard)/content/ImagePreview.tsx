"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { Monitor, Smartphone } from "lucide-react";
import {
  mobileImageVariant,
  type ContentSlug,
  type SiteContent,
} from "@/lib/domain/contracts";

/**
 * 고객 사이트의 이미지 영역을 실제 픽셀 크기로 그린 뒤 축소해 보여준다.
 * 크기·글자·덮개 값은 web 1440px/390px에서 DOM 실측한 값이고, 문구 기본값은 web과 같다.
 * 배너는 문구가 길면 web처럼 높이가 늘어난다.
 */
interface Frame {
  width: number;
  minHeight: number;
  padding: string;
  title: readonly [size: number, line: number];
  subtitle: readonly [size: number, line: number, gap: number];
  badge?: readonly [size: number, line: number, padding: string, gap: number];
  eyebrow?: readonly [size: number, line: number, gap: number];
}

interface BannerSpec {
  align: "center" | "left";
  overlay: string;
  badge?: { text: string; color: string; radius: number };
  /** 홈 히어로의 제목 위 문구 */
  eyebrow?: string;
  subtitleColor: string;
  subtitleMaxWidth?: number;
  text: (draft: SiteContent) => { title: string; subtitle: string };
  desktop: Frame;
  mobile: Frame;
}

const SLATE = "#94a3b8";
const PAGE_DESKTOP = { width: 1440, minHeight: 420, padding: "32px 24px" };
const PAGE_MOBILE = { width: 390, minHeight: 156, padding: "16px 20px" };

export const IMAGE_PREVIEWS: Partial<Record<ContentSlug, BannerSpec>> = {
  home: {
    align: "left",
    overlay: "rgba(15,23,42,0.82)",
    eyebrow: "Best Rentcar",
    subtitleColor: "rgba(255,255,255,0.82)",
    text: (d) => ({
      title:
        d.title || "30년 이상 한길을 걸어온 렌터카, 믿음으로 선택받는 진렌트카",
      subtitle:
        d.subtitle ||
        "30년 이상의 경험과 신뢰를 이어온 렌터카 전문기업\n고객의 안전과 만족을 최우선으로, 믿을 수 있는 차량과 서비스를 제공합니다.",
    }),
    desktop: {
      width: 1440,
      minHeight: 537,
      padding: "60px 80px",
      title: [48, 66],
      subtitle: [16, 26, 16],
      eyebrow: [20, 24, 12],
    },
    mobile: {
      width: 390,
      minHeight: 400,
      padding: "28px 20px",
      title: [32, 42],
      subtitle: [14, 22, 12],
      eyebrow: [14, 18, 8],
    },
  },
  about: {
    align: "center",
    overlay: "rgba(15,23,42,0.75)",
    subtitleColor: SLATE,
    text: (d) => ({
      title:
        d.title &&
        d.title !== "고객과 함께하는 진렌트카" &&
        d.title !== "회사소개"
          ? d.title
          : "30년 이상의 경험과 신뢰",
      subtitle:
        d.subtitle && !d.subtitle.startsWith("30년이 넘는 시간 동안")
          ? d.subtitle
          : "고객님의 여정에 항상 안전과 편안함을 더합니다.",
    }),
    desktop: {
      ...PAGE_DESKTOP,
      title: [40, 48],
      subtitle: [16, 24, 12],
    },
    mobile: {
      ...PAGE_MOBILE,
      title: [28, 36],
      subtitle: [14, 22, 12],
    },
  },
  info: {
    align: "center",
    overlay:
      "linear-gradient(rgba(0,0,0,0), rgba(15,23,42,0.8) 55%, rgba(15,23,42,0.9))",
    subtitleColor: SLATE,
    text: (d) => ({
      title: d.title || "이용안내",
      subtitle:
        d.subtitle || "진렌트카의 서비스 이용 절차와 주의사항을 안내합니다.",
    }),
    desktop: { ...PAGE_DESKTOP, title: [48, 48], subtitle: [18, 24, 12] },
    mobile: { ...PAGE_MOBILE, title: [32, 40], subtitle: [14, 22, 12] },
  },
  accident: {
    align: "left",
    overlay: "rgba(11,18,32,0.7)",
    badge: {
      text: "100% 무과실 사고 대차 지원",
      color: "#3b82f6",
      radius: 100,
    },
    subtitleColor: SLATE,
    subtitleMaxWidth: 850,
    text: () => ({
      title:
        "갑작스러운 사고에도 당황하지 마세요,\n진렌트카가 든든한 발이 되어 드립니다.",
      subtitle:
        "교통사고 발생 시, 상대방 보험사 부담으로 신속하게 동급 이상의 대체 차량을 대여해 드립니다. 번거로운 청구 절차부터 신속한 현장 딜리버리까지 원스톱으로 해결해 드립니다.",
    }),
    desktop: {
      width: 1440,
      minHeight: 420,
      padding: "0 80px",
      title: [48, 60],
      subtitle: [18, 28, 24],
      badge: [13, 19.5, "6px 14px", 24],
    },
    mobile: {
      width: 390,
      minHeight: 156,
      padding: "20px",
      title: [28, 38],
      subtitle: [13, 22, 16],
      badge: [11, 16.5, "6px 14px", 16],
    },
  },
  contact: {
    align: "center",
    overlay: "rgba(15,23,42,0.75)",
    subtitleColor: SLATE,
    text: (d) => ({
      title: d.title && d.title !== "고객센터" ? d.title : "1:1 문의",
      subtitle:
        d.subtitle ||
        "궁금한 점이 있으시면 언제든지 문의해 주세요. 신속하고 정확하게 답변해 드리겠습니다.",
    }),
    desktop: { ...PAGE_DESKTOP, title: [40, 48], subtitle: [16, 24, 12] },
    mobile: { ...PAGE_MOBILE, title: [32, 40], subtitle: [14, 22, 12] },
  },
};

/** width 기준으로 그린 화면을 상자 폭에 맞게 축소한다. 높이는 실제 내용 높이를 따른다. */
function Scaled({
  width,
  minHeight,
  children,
}: {
  width: number;
  minHeight: number;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [height, setHeight] = useState(minHeight);
  useEffect(() => {
    const outer = box.current;
    const el = inner.current;
    if (!outer || !el) return;
    const observer = new ResizeObserver(() => {
      setScale(outer.clientWidth / width);
      setHeight(el.offsetHeight);
    });
    observer.observe(outer);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);
  return (
    <div
      ref={box}
      className="relative w-full overflow-hidden rounded-lg border border-slate-200"
      style={
        scale
          ? { height: height * scale }
          : { aspectRatio: `${width} / ${minHeight}` }
      }
    >
      <div
        ref={inner}
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width,
          transform: `scale(${scale})`,
          visibility: scale ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Banner({
  spec,
  frame,
  image,
  draft,
  slug,
  contactSettings,
}: {
  spec: BannerSpec;
  frame: Frame;
  image: string;
  draft: SiteContent;
  slug: ContentSlug;
  contactSettings?: { phone: string; hours: string };
}) {
  const { title, subtitle } = spec.text(draft);
  const left = spec.align === "left";
  return (
    <Scaled width={frame.width} minHeight={frame.minHeight}>
      <div
        className={`relative flex items-center overflow-hidden bg-[#0f172a] text-white ${left ? "justify-start text-left" : "justify-center text-center"}`}
        style={{ minHeight: frame.minHeight, padding: frame.padding }}
      >
        {image ? (
          <Image
            src={
              frame.width === 390 ? mobileImageVariant(image) || image : image
            }
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{ background: spec.overlay }}
        />
        <div
          className="relative"
          style={{
            wordBreak: "keep-all",
            width:
              slug === "home" ? (frame.width === 390 ? 350 : 662) : undefined,
          }}
        >
          {spec.badge && frame.badge ? (
            <div
              className="flex items-center"
              style={{
                marginBottom: frame.badge[3],
                gap: frame.eyebrow?.[2],
                justifyContent: left ? "flex-start" : "center",
              }}
            >
              <span
                className="inline-block font-bold"
                style={{
                  background: "#fff",
                  color: "#1e293b",
                  border: "1.5px solid #1e293b",
                  borderRadius: 12,
                  fontSize: frame.badge[0],
                  lineHeight: `${frame.badge[1]}px`,
                  padding: frame.badge[2],
                }}
              >
                {spec.badge.text}
              </span>
              {spec.eyebrow && frame.eyebrow ? (
                <em
                  className="font-medium not-italic"
                  style={{
                    color: spec.badge.color,
                    fontSize: frame.eyebrow[0],
                    lineHeight: `${frame.eyebrow[1]}px`,
                  }}
                >
                  {spec.eyebrow}
                </em>
              ) : null}
            </div>
          ) : spec.eyebrow && frame.eyebrow ? (
            <em
              className="mb-3 block font-medium not-italic text-sky-500"
              style={{
                fontSize: frame.eyebrow[0],
                lineHeight: `${frame.eyebrow[1]}px`,
              }}
            >
              {spec.eyebrow}
            </em>
          ) : null}
          <h1
            className="whitespace-pre-line font-extrabold"
            style={{
              fontSize: frame.title[0],
              lineHeight: `${frame.title[1]}px`,
              maxWidth: left && spec.eyebrow ? 662 : undefined,
            }}
          >
            {title}
          </h1>
          <p
            className="whitespace-pre-line"
            style={{
              color: spec.subtitleColor,
              fontSize: frame.subtitle[0],
              lineHeight: `${frame.subtitle[1]}px`,
              marginTop: frame.subtitle[2],
              maxWidth:
                spec.subtitleMaxWidth ?? (spec.eyebrow ? 662 : undefined),
            }}
          >
            {subtitle}
          </p>
          {slug === "home" && (
            <div
              className="mt-8 flex w-[618px] max-w-full overflow-hidden rounded-lg"
              style={{ gap: frame.width === 390 ? 10 : 0 }}
            >
              {(
                [
                  "카카오 채널 빠른 상담",
                  "네이버 톡톡 빠른 상담",
                  "전화 연결 빠른 상담",
                ] as const
              ).map((label, index) => (
                <div
                  key={label}
                  className="flex flex-1 items-center justify-between p-4 font-bold"
                  style={{
                    height: frame.width === 390 ? 56 : 90,
                    borderRadius: frame.width === 390 ? 12 : 0,
                    justifyContent:
                      frame.width === 390 ? "center" : "space-between",
                    background: ["#eab308", "#16a34a", "#0f172a"][index],
                    color: index === 0 ? "#111827" : "#fff",
                    fontSize: frame.width === 390 ? 11 : 13,
                  }}
                >
                  {frame.width !== 390 && <span>{label}</span>}
                  <Image
                    src={`/channel-${["kakao", "naver", "phone"][index]}.svg`}
                    width={24}
                    height={24}
                    alt=""
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {slug === "contact" && (
        <div
          className="relative mx-auto grid gap-6"
          style={{
            marginTop: frame.width === 390 ? 24 : -80,
            width: frame.width === 390 ? 358 : 1200,
            gridTemplateColumns: frame.width === 390 ? "1fr" : "400px 1fr",
            paddingBottom: 80,
          }}
        >
          <aside className="rounded-xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm">
            <h2 className="text-xl font-bold">고객센터</h2>
            <p className="mt-8 text-sm text-slate-500">대표 전화</p>
            <strong className="mt-1 block text-4xl">
              {contactSettings?.phone || "전화번호 미등록"}
            </strong>
            <p className="text-sm text-slate-500">{contactSettings?.hours}</p>
            <div className="mt-7 space-y-4 border-t border-slate-200 pt-7">
              <div className="rounded-lg bg-yellow-500 p-3 text-center font-bold">
                카카오톡 상담 바로가기
              </div>
              <div className="rounded-lg bg-green-600 p-3 text-center font-bold text-white">
                네이버 톡톡 상담 바로가기
              </div>
              <div className="rounded-lg border border-slate-300 p-3 text-center font-bold">
                전화 상담 신청
              </div>
            </div>
          </aside>
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-900">
            <h2 className="text-xl font-bold">1:1 문의</h2>
            <div className="mt-6 grid gap-5">
              {[
                "성함",
                "연락처",
                "문의 유형",
                "문의 내용",
                "개인정보 수집 및 이용",
              ].map((label) => (
                <div key={label}>
                  <p className="mb-2 text-sm font-semibold">{label}</p>
                  <div className="h-11 rounded-lg border border-slate-200 bg-white" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Scaled>
  );
}

const FRAMES = [
  { key: "desktop", label: "데스크톱 (1440px)", Icon: Monitor },
  { key: "mobile", label: "모바일 (390px)", Icon: Smartphone },
] as const;

export function ImagePreview({
  slug,
  draft,
  defaultImage,
  contactSettings,
}: {
  slug: ContentSlug;
  draft: SiteContent;
  /** 이미지를 비웠을 때 운영 사이트가 표시하는 기본 이미지 주소. */
  defaultImage?: string;
  contactSettings?: { phone: string; hours: string };
}) {
  const spec = IMAGE_PREVIEWS[slug];
  if (!spec) return null;
  const image = draft.image_url;
  const shown = image || defaultImage || "";
  const note = image
    ? " 현재 등록된 대표 이미지 URL을 초기값으로 사용합니다."
    : defaultImage
      ? " 지금은 운영 중인 기본 이미지를 보여주고 있습니다. 새 이미지를 넣으면 바로 바뀝니다."
      : " 이미지를 비워 두면 웹사이트의 기본 이미지가 표시됩니다(고객 사이트 주소 설정이 없어 여기서는 불러오지 못했습니다).";
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">화면별 미리보기</h3>
        <p className="mt-1 text-xs font-normal leading-5 text-slate-500">
          이미지는 가운데를 기준으로 영역을 꽉 채우고, 넘치는 위아래·좌우는
          잘립니다. 글자가 잘 보이도록 어두운 막이 덮이며, 문구는 위 입력값을
          반영합니다.
          {note}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] md:items-start">
        {FRAMES.map(({ key, label, Icon }) => (
          <figure key={key} className="space-y-2">
            <figcaption className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Icon size={14} aria-hidden="true" />
              {label}
            </figcaption>
            <Banner
              spec={spec}
              frame={spec[key]}
              image={shown}
              draft={draft}
              slug={slug}
              contactSettings={contactSettings}
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
