type KpiCardsProps = {
  items: Array<{
    label: string;
    value: string;
    hint: string;
  }>;
};

export function KpiCards({ items }: KpiCardsProps) {
  return (
    <section className="grid kpi-grid">
      {items.map((item) => (
        <article className="card" key={item.label}>
          <div className="label">{item.label}</div>
          <div className="value">{item.value}</div>
          <div className="hint">{item.hint}</div>
        </article>
      ))}
    </section>
  );
}
