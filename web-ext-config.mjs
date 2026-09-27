// Конфигурация web-ext. Ключи подписи НЕ храните здесь —
// передавайте их через переменные окружения (см. docs/AMO_SUBMISSION.md).
export default {
  sourceDir: ".",
  artifactsDir: "web-ext-artifacts",
  build: {
    overwriteDest: true,
    // В сборку не должны попадать служебные файлы
    ignoreFiles: [
      "dist/**",
      "web-ext-artifacts/**",
      "node_modules/**",
      "docs/**",
      "amo/**",
      "scripts/**",
      ".github/**",
      "*.md",
      "package.json",
      "package-lock.json",
      "build.sh",
      "web-ext-config.mjs",
      ".gitignore",
      ".gitattributes"
    ]
  },
  run: {
    // Открываем МЭШ при запуске dev-профиля
    startUrl: ["https://school.mos.ru/"]
  },
  lint: {
    warningsAsErrors: false
  }
};
