import { formatShortDate } from "@/utils/format";

export function OrdersChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) return <p className="py-10 text-center text-sm text-fumaca">Sem pedidos no período.</p>;
  const max = Math.max(1, ...data.map((d) => d.count));
  const W = 640;
  const H = 220;
  const pad = { t: 16, r: 8, b: 28, l: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const slot = innerW / data.length;
  const barW = Math.max(4, Math.min(28, slot * 0.62));
  const labelEvery = Math.ceil(data.length / 8);
  const total = data.reduce((n, d) => n + d.count, 0);

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfico de pedidos por dia. Total no período: ${total}.`} className="w-full">
        {[0, 0.5, 1].map((t) => {
          const y = pad.t + innerH * (1 - t);
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#3A302A" strokeWidth="1" />
              <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize="11" fill="#A8A097">
                {Math.round(max * t)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.count / max) * innerH;
          const x = pad.l + slot * i + (slot - barW) / 2;
          return (
            <g key={d.date}>
              <rect x={x} y={pad.t + innerH - h} width={barW} height={Math.max(h, d.count ? 2 : 0)} fill="#D4561A">
                <title>{`${formatShortDate(d.date)}: ${d.count} pedido(s)`}</title>
              </rect>
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#A8A097">
                  {formatShortDate(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>Pedidos por dia</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <th scope="row">{formatShortDate(d.date)}</th>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
