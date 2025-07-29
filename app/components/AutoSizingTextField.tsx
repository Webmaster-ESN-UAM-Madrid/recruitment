import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from 'react';
import { TextField, TextFieldProps } from '@mui/material';

type AutoSizingTextFieldProps = TextFieldProps & {
  minRows?: number;
  lineHeight?: number;
  maxLines?: number;
};

const AutoSizingTextField: React.FC<AutoSizingTextFieldProps> = ({
  minRows = 3,
  lineHeight = 24,
  maxLines,
  InputProps = {},
  ...props
}) => {
  const minHeight = minRows * lineHeight;
  const maxAllowedHeight = maxLines ? maxLines * lineHeight : undefined;

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [maxHeight, setMaxHeight] = useState<number>(minHeight);
  const [isResizable, setIsResizable] = useState(false);

  const updateHeight = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'; // Reset height to get accurate scrollHeight
      const scrollHeight = inputRef.current.scrollHeight;
      const calculatedHeight = Math.max(minHeight, scrollHeight);
      const finalHeight = maxAllowedHeight
        ? Math.min(calculatedHeight, maxAllowedHeight)
        : calculatedHeight;

      setMaxHeight(finalHeight);
      setIsResizable(finalHeight > minHeight);
    }
  }, [minHeight, maxAllowedHeight]);

  useLayoutEffect(() => {
    updateHeight();
  }, [props.value, updateHeight]);

  useEffect(() => {
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [updateHeight]);

  return (
    <TextField
      {...props}
      multiline
      rows={minRows}
      inputRef={inputRef}
      InputProps={{
        ...InputProps,
        sx: {
          backgroundColor: 'rgba(0,0,0,0.04)',
          ...InputProps.sx,
          '& .MuiInputBase-inputMultiline': {
            height: `${maxHeight}px`,
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
            resize: isResizable ? 'vertical' : 'none',
            overflow: 'auto',

            // Scrollbar Styling
            scrollbarWidth: 'thin', // Firefox
            scrollbarColor: 'rgba(0,0,0,0.3) transparent',

            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: '4px',
            },
          },
        },
      }}
    />
  );
};

export default AutoSizingTextField;
