import { formatMonthLabel, shiftMonthKey, currentMonthKey } from "../utils/date";

interface Props {
  monthKey: string;
  onChange: (monthKey: string) => void;
  monthsWithData: string[];
}

/** Prev / current / next month stepper with a quick jump dropdown. */
export function MonthNavigator({ monthKey, onChange, monthsWithData }: Props) {
  const isCurrent = monthKey === currentMonthKey();
  return (
    <div className="month-nav">
      <button
        className="btn btn-icon"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonthKey(monthKey, -1))}
      >
        ‹
      </button>

      <div className="month-nav-center">
        <span className="month-label">{formatMonthLabel(monthKey)}</span>
        {!isCurrent && (
          <button className="btn btn-link" onClick={() => onChange(currentMonthKey())}>
            Jump to this month
          </button>
        )}
      </div>

      <button
        className="btn btn-icon"
        aria-label="Next month"
        onClick={() => onChange(shiftMonthKey(monthKey, 1))}
      >
        ›
      </button>

      {monthsWithData.length > 0 && (
        <select
          className="month-jump"
          aria-label="Jump to month with data"
          value={monthsWithData.includes(monthKey) ? monthKey : ""}
          onChange={(e) => e.target.value && onChange(e.target.value)}
        >
          <option value="">Months with data…</option>
          {monthsWithData.map((mk) => (
            <option key={mk} value={mk}>
              {formatMonthLabel(mk)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
