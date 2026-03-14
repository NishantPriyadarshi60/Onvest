import "@testing-library/jest-dom/vitest";

process.env.INVITE_JWT_SECRET = process.env.INVITE_JWT_SECRET ?? "test-secret-min-32-chars-long";
