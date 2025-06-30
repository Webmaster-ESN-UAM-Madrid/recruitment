import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    theme: 'light' | 'dark';
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
    };
  }
}
