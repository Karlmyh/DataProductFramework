# DataProductFramework

这个仓库用于发布“数据产品三层匹配框架”的静态网页版本。

## 仓库内容

- `index.html`
  - 站点首页
- `three_axis_framework_cn.html`
  - 首页别名
- `method_library/`
  - 规则页、词表页、索引页、核验页的静态 HTML
- `.nojekyll`
  - 让 GitHub Pages 正常发布带下划线目录的静态文件

## 建议发布方式

在 GitHub 仓库页面中进入：

`Settings -> Pages`

然后设置：

- `Build and deployment`: `Deploy from a branch`
- `Branch`: `main`
- `Folder`: `/ (root)`

保存后，GitHub Pages 会自动把仓库根目录的静态文件发布出来。

## 说明

- 主页里的论文链接是外部公开链接。
- 主页里的规则页链接已经改成站内 `.html` 页面，可以直接点击浏览。
- 如果后续需要更新页面内容，可以从主项目重新生成静态站 bundle，再覆盖本仓库根目录内容。
