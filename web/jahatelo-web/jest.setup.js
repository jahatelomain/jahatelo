import '@testing-library/jest-dom';

// Mock de variables de entorno para tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-minimum-32-chars';
process.env.NODE_ENV = 'test';
