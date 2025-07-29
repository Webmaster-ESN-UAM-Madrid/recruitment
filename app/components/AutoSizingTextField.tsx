import React, { useEffect, useRef, useState } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

const MIN_ROWS = 3;
const LINE_HEIGHT = 24; // px
const MIN_HEIGHT = MIN_ROWS * LINE_HEIGHT;

const AutoSizingTextField: React.FC<TextFieldProps> = props => {
  const [maxHeight, setMaxHeight] = useState<number>(MIN_HEIGHT);
  const [isResizable, setIsResizable] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const updateHeight = () => {
    if (inputRef.current) {
      const scrollHeight = inputRef.current.scrollHeight;
      setMaxHeight(scrollHeight);
      setIsResizable(scrollHeight > MIN_HEIGHT);
    }
  };

  useEffect(() => {
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [props.value]);

  return (
    <TextField
      {...props}
      multiline
      inputRef={inputRef}
      InputProps={{
        ...props.InputProps,
        sx: {
          '& textarea': {
            minHeight: `${MIN_HEIGHT}px`,
            maxHeight: `${maxHeight}px`,
            resize: isResizable ? 'vertical' : 'none',
            overflow: 'auto',
          },
          backgroundColor: 'rgba(0,0,0,0.04)',
          ...props.InputProps?.sx,
        },
      }}
    />
  );
};

export default AutoSizingTextField;
