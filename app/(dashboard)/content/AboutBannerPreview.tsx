"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Monitor, Smartphone } from "lucide-react";

/**
 * 고객 사이트 /about 상단 배너(PageBanner + .wf-about-banner)를 실제 픽셀 크기로 그린 뒤 축소해 보여준다.
 * 크기·글자·덮개 값은 web 1440px/390px에서 DOM 실측한 값이며, 배너 문구는 web의 고정 문구와 같다.
 */
const FRAMES = [
  {
    key: "desktop",
    label: "데스크톱 (1440px)",
    Icon: Monitor,
    width: 1440,
    height: 420,
    padding: "32px 24px",
    title: 40,
    titleLine: 48,
    subtitle: 16,
    subtitleLine: 24,
  },
  {
    key: "mobile",
    label: "모바일 (390px)",
    Icon: Smartphone,
    width: 390,
    height: 156,
    padding: "16px 20px",
    title: 28,
    titleLine: 36,
    subtitle: 14,
    subtitleLine: 22,
  },
] as const;

type Frame = (typeof FRAMES)[number];

function ScaledBanner({ frame, image }: { frame: Frame; image: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / frame.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [frame.width]);
  return (
    <div
      ref={box}
      className="relative w-full overflow-hidden rounded-lg border border-slate-200"
      style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
    >
      <div
        className="absolute left-0 top-0 flex origin-top-left items-center justify-center overflow-hidden bg-[#0f172a] text-center text-white"
        style={{
          width: frame.width,
          height: frame.height,
          transform: `scale(${scale})`,
          visibility: scale ? "visible" : "hidden",
        }}
      >
        {image ? (
          <Image src={image} alt="" fill unoptimized className="object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-[rgba(15,23,42,0.75)]" />
        <div className="relative" style={{ padding: frame.padding }}>
          <span className="mb-3 inline-block rounded-full bg-[#14b8a6] px-3 py-1 text-xs font-bold">
            SINCE 1995
          </span>
          <h1
            className="font-extrabold"
            style={{
              fontSize: frame.title,
              lineHeight: `${frame.titleLine}px`,
            }}
          >
            30년 이상의 경험과 신뢰
          </h1>
          <p
            className="mt-3 text-[#94a3b8]"
            style={{
              fontSize: frame.subtitle,
              lineHeight: `${frame.subtitleLine}px`,
              wordBreak: "keep-all",
            }}
          >
            고객님의 여정에 항상 안전과 편안함을 더합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AboutBannerPreview({
  image,
  defaultImage,
}: {
  image: string;
  /** 이미지를 비웠을 때 운영 사이트가 표시하는 기본 배너 주소. 없으면 남색 배경만 보인다. */
  defaultImage?: string;
}) {
  const shown = image || defaultImage || "";
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">
          화면별 배너 미리보기
        </h3>
        <p className="mt-1 text-xs font-normal leading-5 text-slate-500">
          이미지는 가운데를 기준으로 배너를 꽉 채우고, 넘치는 위아래·좌우는
          잘립니다. 글자가 잘 보이도록 어두운 막이 덮입니다.
          {image
            ? null
            : defaultImage
              ? " 지금은 운영 중인 기본 배너 이미지를 보여주고 있습니다. 새 이미지를 넣으면 바로 바뀝니다."
              : " 이미지를 비워 두면 웹사이트의 기본 배너 이미지가 표시됩니다(고객 사이트 주소 설정이 없어 여기서는 불러오지 못했습니다)."}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] md:items-start">
        {FRAMES.map((frame) => (
          <figure key={frame.key} className="space-y-2">
            <figcaption className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <frame.Icon size={14} aria-hidden="true" />
              {frame.label}
            </figcaption>
            <ScaledBanner frame={frame} image={shown} />
          </figure>
        ))}
      </div>
    </section>
  );
}
