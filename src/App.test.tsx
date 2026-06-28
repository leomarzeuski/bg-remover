import { render, screen } from '@testing-library/react';
import App from './App';

test('renderiza o título', () => {
  render(<App />);
  expect(screen.getByText('bg-remover')).toBeInTheDocument();
});
