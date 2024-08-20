import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { act } from 'react-dom/test-utils';

const FACES = ['U', 'D', 'L', 'R', 'F', 'B'];

test('renders learn react link', () => {
  render(<App />);
  const loadingElement = screen.getByText(/Loading.../i);
  expect(loadingElement).toBeInTheDocument();
  const initializingElement = screen.getByText(/Initializing solver.../i);
  expect(initializingElement).toBeInTheDocument();
});

jest.mock('cubejs', () => ({
  __esModule: true,
  default: class MockCube {
    static initSolver() { }
    static random() { return new MockCube(); }
    static fromString() { return new MockCube(); }  // Add this line
    solve() { return 'U R F'; }
    asString() { return 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB'; }
    isSolved() { return true; }
    move() { return this; }  // Add this line
  }
}));

describe('Rubik\'s Cube App', () => {
  test('renders cube after initialization', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByText(/Initializing solver.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Current Step:/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Algorithm:/i)).toBeInTheDocument();
  });

  test('renders cube controls', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    FACES.forEach(face => {
      expect(screen.getByRole('button', { name: face })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: `${face}'` })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Scramble/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Solve/i })).toBeInTheDocument();
  });

  test('scramble button changes cube state', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    const scrambleButton = screen.getByRole('button', { name: /Scramble/i });
    await act(async () => {
      userEvent.click(scrambleButton);
    });

    expect(screen.getByText(/Current Step: Scrambled/i)).toBeInTheDocument();
  });

  test('solve button changes cube state', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    const scrambleButton = screen.getByRole('button', { name: /Scramble/i });
    await act(async () => {
      userEvent.click(scrambleButton);
    });

    expect(screen.getByText(/Current Step: Scrambled/i)).toBeInTheDocument();

    const solveButton = screen.getByRole('button', { name: /Solve/i });
    await act(async () => {
      userEvent.click(solveButton);
    });

    expect(screen.getByText(/Current Step:/)).toBeInTheDocument();
    expect(screen.getByText(/Current Algorithm: U R F/i)).toBeInTheDocument();
  });
});

test('end-to-end scramble and solution', async () => {
  render(<App />);

  await waitFor(() => {
    expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
  });

  // Scramble the cube
  const scrambleButton = screen.getByRole('button', { name: /Scramble/i });
  await act(async () => {
    userEvent.click(scrambleButton);
  });

  expect(screen.getByText(/Current Step: Scrambled/i)).toBeInTheDocument();

  // Solve the cube
  const solveButton = screen.getByRole('button', { name: /Solve/i });
  await act(async () => {
    userEvent.click(solveButton);
  });

  // Wait for the solution to complete
  await waitFor(() => {
    expect(screen.getByText(/Current Step: Solved/i)).toBeInTheDocument();
  }, { timeout: 10000 });

  // Verify the cube is solved
  expect(screen.queryByText(/Current Algorithm:/i)).not.toBeInTheDocument();
});