type DateCell = { label: string; value: string };

type ToolModalDateGridProps = {
  cells: [DateCell, DateCell, DateCell];
};

function DateCellView({ label, value }: DateCell) {
  return (
    <div className="px-2 py-2 text-center first:pl-0 last:pr-0">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

export function ToolModalDateGrid({ cells }: ToolModalDateGridProps) {
  return (
    <div className="grid grid-cols-3 divide-x border-t border-slate-100 pt-3">
      {cells.map((cell) => (
        <DateCellView key={cell.label} label={cell.label} value={cell.value} />
      ))}
    </div>
  );
}
