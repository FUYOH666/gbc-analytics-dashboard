type SyncStatusProps = {
  latestSync: {
    status: string;
    started_at: string;
    finished_at: string | null;
    processed_count: number;
    inserted_count: number;
    updated_count: number;
    error_message: string | null;
  } | null;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "n/a";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SyncStatus({ latestSync }: SyncStatusProps) {
  if (!latestSync) {
    return (
      <div className="stack">
        <div className="tag warning">Sync ещё не запускался</div>
        <p className="muted">
          Сначала выполните import и затем ручной `/api/sync`, чтобы заполнить
          Supabase и получить операционные метрики.
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className={`tag ${latestSync.status === "success" ? "success" : "warning"}`}>
        Последний sync: {latestSync.status}
      </div>
      <div className="list">
        <div className="list-item">
          <div className="row">
            <span className="muted">Старт</span>
            <strong>{formatDateTime(latestSync.started_at)}</strong>
          </div>
        </div>
        <div className="list-item">
          <div className="row">
            <span className="muted">Финиш</span>
            <strong>{formatDateTime(latestSync.finished_at)}</strong>
          </div>
        </div>
        <div className="list-item">
          <div className="row">
            <span className="muted">Обработано</span>
            <strong>{latestSync.processed_count}</strong>
          </div>
        </div>
        <div className="list-item">
          <div className="row">
            <span className="muted">Inserted / Updated</span>
            <strong>
              {latestSync.inserted_count} / {latestSync.updated_count}
            </strong>
          </div>
        </div>
      </div>
      {latestSync.error_message ? (
        <p className="muted">Ошибка: {latestSync.error_message}</p>
      ) : null}
    </div>
  );
}
