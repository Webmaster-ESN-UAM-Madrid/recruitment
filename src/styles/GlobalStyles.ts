
import { createGlobalStyle } from 'styled-components';

interface GlobalStylesProps {
  background: string;
  text: string;
}

const GlobalStyles = createGlobalStyle<GlobalStylesProps>`
  body {
    background-color: ${props => props.background};
    color: ${props => props.text};
    transition: all 0.3s ease;
  }
`;

export default GlobalStyles;
