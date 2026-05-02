import { useEffect } from "react";

export function useTheme() {
  useEffect(() => {
    // Force dark mode always
    document.documentElement.classList.add("dark");
  }, []);
}
