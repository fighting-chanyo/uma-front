"use client"
import type { Ticket } from "@/types/ticket"

interface CompactBetVisualizerProps {
  content: Ticket["content"]
  buyType: Ticket["buyType"]
}

// 馬番を丸数字に変換
function toCircledNumber(num: string): string {
  const n = Number.parseInt(num, 10)
  const circled = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱"]
  return circled[n - 1] || num
}

export function CompactBetVisualizer({ content, buyType }: CompactBetVisualizerProps) {
  // BOX: 1行でコンパクトに
  if (buyType === "BOX" && content.horses) {
    return (
      <div className="flex items-center gap-1.5 py-1">
        <span className="text-[10px] font-bold text-[#00f3ff]/70 bg-[#00f3ff]/10 px-1.5 py-0.5 border border-[#00f3ff]/30">
          BOX
        </span>
        <span className="text-xs font-mono text-foreground tracking-wide">
          {content.horses.map(toCircledNumber).join(" ")}
        </span>
      </div>
    )
  }

  // 流し: 1行でインライン表示
  if (buyType === "NAGASHI" && (content.axis || content.partners)) {
    return (
      <div className="flex items-center gap-1.5 py-1 flex-wrap">
        {content.multi && (
          <span className="text-[10px] font-bold text-[#00ff41]/70 bg-[#00ff41]/10 px-1.5 py-0.5 border border-[#00ff41]/30">
            マルチ
          </span>
        )}
        <span className="text-[10px] font-bold text-[#ff003c]/70">軸:</span>
        <span className="text-xs font-mono text-[#ff003c] tracking-wide">
          {content.axis?.map(toCircledNumber).join(" ") || "-"}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="text-[10px] font-bold text-[#00f3ff]/70">相手:</span>
        <span className="text-xs font-mono text-[#00f3ff] tracking-wide">
          {content.partners?.map(toCircledNumber).join(" ") || "-"}
        </span>
      </div>
    )
  }

  // フォーメーション: インライン区切り表示
  if (buyType === "FORMATION" && content["1st"]) {
    const positions = [
      { key: "1st", label: "1着", data: content["1st"] },
      { key: "2nd", label: "2着", data: content["2nd"] },
      { key: "3rd", label: "3着", data: content["3rd"] },
    ].filter((p) => p.data && p.data.length > 0)

    return (
      <div className="flex items-center gap-1 py-1 flex-wrap text-xs">
        {positions.map((pos, idx) => (
          <span key={pos.key} className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">{pos.label}:</span>
            <span className="font-mono text-foreground tracking-wide">{pos.data?.map(toCircledNumber).join("")}</span>
            {idx < positions.length - 1 && <span className="text-muted-foreground/50 mx-0.5">|</span>}
          </span>
        ))}
      </div>
    )
  }

  return null
}
