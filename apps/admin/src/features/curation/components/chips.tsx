interface ChipsProps {
  values: string[];
}

export const Chips = ({ values }: ChipsProps) => {
  if (values.length === 0) {
    return <span className="text-zinc-400">None</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span key={value} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
          {value}
        </span>
      ))}
    </div>
  );
};
