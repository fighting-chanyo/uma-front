"use client"
import type { TicketContent } from "@/types/ticket"

interface CompactBetVisualizerProps {
  content: TicketContent
}

// 数値を丸数字に変換
function toCircledNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num, 10) : num;
  const circled = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱"]
  return circled[n - 1] || String(n)
}

export function CompactBetVisualizer({ content }: CompactBetVisualizerProps) {
  // BOX: 1行でコンパクトに
  if (content.method === "BOX" && content.selections && content.selections[0]) {
    return (
      <div className="flex items-center gap-1.5 py-1">
        <span className="text-[10px] font-bold text-white bg-white/10 px-1.5 py-0.5 border border-white/30">
          ボックス
        </span>
        <span className="text-xs font-mono text-foreground tracking-wide">
          {content.selections[0].map(toCircledNumber).join("")}
        </span>
      </div>
    )
  }

  // 流し: 1行でインライン表示
  if (content.method === "NAGASHI" && (content.axis || content.partners)) {
    const getNagashiLabel = () => {
      const isMulti = content.multi
      const isTwoAxis = content.axis && content.axis.length === 2
      if (isTwoAxis) {
        return isMulti ? "2頭軸流し(マルチ)" : "2頭軸流し"
      }
      return isMulti ? "流し(マルチ)" : "流し"
    }

    // 軸馬を着順ごとにグループ化
    const axisGroups = new Map<number, string[]>()
    const axisNoPos: string[] = []

    if (content.axis) {
      content.axis.forEach((horse, idx) => {
        const pos = content.positions?.[idx]
        if (pos) {
          if (!axisGroups.has(pos)) {
            axisGroups.set(pos, [])
          }
          axisGroups.get(pos)!.push(horse)
        } else {
          axisNoPos.push(horse)
        }
      })
    }

    const sortedPositions = Array.from(axisGroups.keys()).sort((a, b) => a - b)

    return (
      <div className="flex items-center gap-1.5 py-1 flex-wrap">
        <span className="text-[10px] font-bold text-white bg-white/10 px-1.5 py-0.5 border border-white/30 mr-1">
          {getNagashiLabel()}
        </span>

        {(() => {
          const dataParts: React.ReactNode[] = []

          // 1. 着順指定ありの軸馬
          sortedPositions.forEach((pos) => {
            const horses = axisGroups.get(pos)
            if (horses && horses.length > 0) {
              dataParts.push(
                <span key={`axis-${pos}`} className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-white/70">{pos}着軸:</span>
                  <span className="text-xs font-mono text-white tracking-wide">
                    {horses.map(toCircledNumber).join("")}
                  </span>
                </span>
              )
            }
          })

          // 2. 着順指定なしの軸馬 (マルチなど)
          if (axisNoPos.length > 0) {
            dataParts.push(
              <span key="axis-nopos" className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-white/70">軸:</span>
                <span className="text-xs font-mono text-white tracking-wide">
                  {axisNoPos.map(toCircledNumber).join("")}
                </span>
              </span>
            )
          }

          // 3. 相手馬
          if (content.partners && content.partners.length > 0) {
            dataParts.push(
              <span key="partners" className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-white/70">相手:</span>
                <span className="text-xs font-mono text-white tracking-wide">
                  {content.partners.map(toCircledNumber).join("")}
                </span>
              </span>
            )
          }

          // セパレーターで結合して表示
          return dataParts.map((part, idx) => (
            <div key={idx} className="flex items-center">
              {part}
              {idx < dataParts.length - 1 && (
                <span className="text-muted-foreground/50 mx-1.5">|</span>
              )}
            </div>
          ))
        })()}
      </div>
    )
  }

  // フォーメーション
  if (content.method === "FORMATION" && content.selections) {
    const dataToUse = content.selections

    // 3連単/3連複系か、それ以外（馬連/ワイドなど）かで着順のラベルを決定
    const isTrifectaLike =
      content.type.includes("TRIFECTA") || content.type.includes("TRIO")
    const defaultLabels = isTrifectaLike
      ? ["1着", "2着", "3着"]
      : ["1頭目", "2頭目"]

    const positions = dataToUse
      .map((data, index) => ({
        label: defaultLabels[index],
        data,
      }))
      .filter(p => p.data && p.data.length > 0)

    return (
      <div className="flex items-center gap-1.5 py-1 flex-wrap text-xs">
        {content.method === "FORMATION" && (
          <span className="text-[10px] font-bold text-white bg-white/10 px-1.5 py-0.5 border border-white/30">
            フォーメーション
          </span>
        )}
        {positions.map((pos, idx) => (
          <span key={idx} className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">
              {pos.label}:
            </span>
            <span className="font-mono text-foreground tracking-wide">
              {pos.data?.map(toCircledNumber).join("")}
            </span>
            {idx < positions.length - 1 && (
              <span className="text-muted-foreground/50 mx-0.5">|</span>
            )}
          </span>
        ))}
      </div>
    )
  }

  // NORMALの場合の表示を追加
  if (content.method === "NORMAL" && content.selections && content.selections[0]) {
    // 以前は枠連のみハイフンの前後のスペースがなかったが、統一する
    const joiner = " - "

    return (
      <div className="flex items-center gap-1.5 py-1">
        <span className="text-xs font-mono text-foreground tracking-wide">
          {(content.selections[0] as any[])
            .map((num: string | number) => toCircledNumber(Number(num)))
            .join(joiner)}
        </span>
      </div>
    )
  }

  return null
}
