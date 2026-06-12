import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('./contexts/UserContext', () => ({
    useUser: () => ({ user: null })
}));

vi.mock('./contexts/NotificationContext', () => ({
    useNotification: () => ({ toastList: [], removeToast: vi.fn() }),
    NotificationProvider: ({ children }) => <div>{children}</div>
}));

describe('App Component', () => {
    it('debe renderizar el titulo principal de la landing page', () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>
        );
        expect(screen.getByText('UN UNIVERSO DE ESTRATEGIA Y COMBATE')).toBeDefined();
    });

    it('debe mostrar el boton "JUGAR GRATIS" cuando no hay usuario logueado', () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>
        );
        expect(screen.getByText('JUGAR GRATIS')).toBeDefined();
    });
});