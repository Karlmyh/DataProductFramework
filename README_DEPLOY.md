# GitHub Pages Deploy Bundle

这个目录已经是可直接部署的静态站：

- `index.html`: 主页面
- `three_axis_framework_cn.html`: 主页面别名
- `method_library/**/*.html`: 规则页、词表页、索引页与核验页
- `*_demo/`: 可直接打开的交互式演示页面
- `.nojekyll`: 让 GitHub Pages 不忽略下划线目录

## 推荐部署方式

1. 把这个目录整体推到一个 GitHub 仓库的 `docs/` 目录，或单独的 `gh-pages` 分支。
2. 在仓库设置中启用 GitHub Pages。
3. 选择 `docs/` 或 `gh-pages` 作为发布源。
4. 发布后，首页就是 `index.html`。
