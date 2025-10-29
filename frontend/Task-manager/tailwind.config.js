@import "tailwindcss";

@layer base {
  html {
    font-family: "Poppins", sans-serif;
  }

  body {
    background-color: #fcfcfc;
    overflow-x: hidden;
  }
}

.input-box {
  @apply w-full flex justify-between gap-3 text-sm text-black bg-slate-100/50 px-4 py-3 border border-slate-200 outline-none;
}
