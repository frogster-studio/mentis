interface StagingSwitchProps {
  isOn: boolean;
  label: string;
  isDisabled?: boolean;
  onFlip: () => void;
}

export const StagingSwitch = ({ isOn, label, isDisabled = false, onFlip }: StagingSwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={label}
      title={label}
      disabled={isDisabled}
      onClick={onFlip}
      className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:bg-zinc-100 ${
        isOn ? "bg-sky-600" : "bg-zinc-300"
      }`}
    >
      <span
        className={`size-4 rounded-full bg-white transition-transform ${
          isOn ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
};
