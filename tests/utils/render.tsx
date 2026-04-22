import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

export function render(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return rtlRender(ui, options);
}
