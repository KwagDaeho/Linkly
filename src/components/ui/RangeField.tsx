interface RangeFieldProps {
  label: string;
  /** Current value as shown after the label. */
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

/** Labeled slider: "label display" above the range input. */
export const RangeField = (props: RangeFieldProps) => (
  <label>
    {props.label} {props.display}
    <input
      type="range"
      min={props.min}
      max={props.max}
      step={props.step}
      value={props.value}
      onChange={(event) => props.onChange(Number(event.target.value))}
    />
  </label>
);
