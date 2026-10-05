import { TextField, type TextFieldProps } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

const parse = (text: string) => {
  const n = parseFloat(text.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};
const show = (n: number) => String(n).replace('.', ',');

type Props = Omit<TextFieldProps, 'value' | 'onChange' | 'type'> & {
  value: number;
  onValueChange: (n: number) => void;
  align?: 'right';
};

export function NumberInput({ value, onValueChange, align, inputProps, ...rest }: Props) {
  const [text, setText] = useState(show(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current && parse(text) !== value) setText(show(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <TextField
      {...rest}
      value={text}
      onFocus={(e) => {
        focused.current = true;
        e.target.select();
      }}
      onBlur={() => {
        focused.current = false;
        setText(show(value));
      }}
      onChange={(e) => {
        const next = e.target.value;
        if (!/^[\d\s]*[.,]?\d*$/.test(next)) return;
        setText(next);
        onValueChange(parse(next));
      }}
      inputProps={{
        ...inputProps,
        inputMode: 'decimal',
        autoComplete: 'off',
        style: { textAlign: align ?? 'left', ...inputProps?.style },
      }}
    />
  );
}
