import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./layout/header', () => () => <header>Header</header>);
jest.mock('./layout/footer', () => () => <footer>Footer</footer>);
jest.mock('./pages/Home', () => () => <div>Home Page</div>);
jest.mock('./API/api', () => ({
  authAPI: {
    getProfile: jest.fn(() => Promise.resolve({ data: null }))
  },
  getStoredToken: jest.fn(() => null),
  getStoredRefreshToken: jest.fn(() => null),
  persistSession: jest.fn(),
  clearSession: jest.fn(),
  setAuthToken: jest.fn()
}));

test('renders the app branding and primary navigation', () => {
  render(<App />);
  expect(screen.getByText('Header')).toBeInTheDocument();
  expect(screen.getByText('Home Page')).toBeInTheDocument();
  expect(screen.getByText('Footer')).toBeInTheDocument();
});
