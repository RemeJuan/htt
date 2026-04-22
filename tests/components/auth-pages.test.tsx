import { describe, expect, it, vi } from "vitest";

const authFormMock = vi.hoisted(() => vi.fn(({ mode }: { mode: string }) => <div data-testid="auth-form" data-mode={mode} />));

vi.mock("@/components/auth-form", () => ({ AuthForm: authFormMock }));

import LoginPage, { metadata as loginMetadata } from "@/app/login/page";
import SignupPage, { metadata as signupMetadata } from "@/app/signup/page";
import { render, screen } from "@/tests/utils/render";

describe("auth pages", () => {
  it("passes login mode", () => {
    expect(loginMetadata.title).toBe("Log in");
    expect(signupMetadata.title).toBe("Sign up");

    render(<LoginPage />);
    expect(screen.getByTestId("auth-form")).toHaveAttribute("data-mode", "login");
  });

  it("passes signup mode", () => {
    render(<SignupPage />);
    expect(screen.getByTestId("auth-form")).toHaveAttribute("data-mode", "signup");
  });
});
