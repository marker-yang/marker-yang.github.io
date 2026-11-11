# my-site

杨天的个人站。纯静态，Astro 构建，无框架运行时。

- 线上地址：**https://marker-yang.github.io/**
- 仓库：`marker-yang/marker-yang.github.io`（`main` 放源码，`gh-pages` 放构建产物）
- 设计决策记录：[`docs/site-brief.md`](docs/site-brief.md)
- 用语约定：[`GLOSSARY.md`](GLOSSARY.md)

## 开发

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 输出到 dist/
npm run preview  # 预览构建产物
```

## 内容在哪

所有文案集中在 `src/data/cases.ts`：

| 导出 | 用途 |
| --- | --- |
| `cases` | 四个案例。首页摘要 + 各自的 `/work/<slug>/` 详情页 |
| `shortProjects` | 首页「其他项目」三栏 |
| `timeline` | 「关于」右侧的工作经历 |

改文字只改这个文件；页面模板在 `src/pages/` 与 `src/components/`。

新增一个案例：往 `cases` 数组里加一项，`slug` 会自动生成详情页并接入上一个/下一个导航。截图放 `public/img/<slug>.webp`，在条目里填 `image`；不填则自动使用内置的线稿图形（`CaseRow` 里按 slug 区分）。

## 部署（GitHub Pages）

源码在 `main`，构建产物推到 `gh-pages`，Pages 从 `gh-pages` 分支发布。

```bash
SITE_URL=https://marker-yang.github.io npm run build

# 产物推到一个只含 dist 内容的 gh-pages 分支
rm -rf /tmp/ghp && mkdir -p /tmp/ghp && cp -r dist/. /tmp/ghp/
touch /tmp/ghp/.nojekyll          # 关键：否则 Jekyll 会吞掉 _astro/
cd /tmp/ghp && git init -q -b gh-pages && git add -A
git -c user.name="marker" -c user.email="1042164333@qq.com" commit -qm "build"
git push -f https://github.com/marker-yang/marker-yang.github.io.git gh-pages
```

**`.nojekyll` 不是可选项。** GitHub Pages 默认跑 Jekyll，它跳过所有下划线开头的目录，`_astro/` 里的 CSS 与 JS 会全部 404——页面只剩无样式的 HTML。

`SITE_URL` 决定 canonical 与分享卡片的绝对路径；不设时回退到当前访问域名。

## 目录

```
src/
  data/cases.ts          全部内容
  layouts/Base.astro     文档骨架、导航、页脚、滚动显隐
  components/            Hero / Work / CaseRow / About / Contact
  pages/
    index.astro          首页
    work/[slug].astro    案例详情
    404.astro
  scripts/
    hero-net.ts          首屏 Canvas 节点网络
    motion.ts            数字滚动、图片视差
  styles/                设计变量、布局、导航与页脚
public/
  fonts/                 Inter Tight（latin 子集，44KB）
  img/                   案例截图（webp + jpg 回退）
  og.png                 分享卡片 1200×630
```

## 几个刻意的决定

- **不用 web 等宽字体**。等宽只用于几处小号标签，系统字体栈足够，省掉一个 40KB 请求。
- **中文不引入 web 字体**。一个中文字体子集动辄几 MB，不值得；走系统中文字体，`font-family` 里按优先级排好。
- **首屏视觉降级**。移动端把节点网络限制在标题上方的窄带、节点数减半；`prefers-reduced-motion` 下只画一帧静态图。
- **邮箱不写在 HTML 里**。地址在运行时拼出来，静态文件里搜不到，减少爬虫抓取。
- **导航主题跟随所在区块**。深色区块标了 `data-dark`，导航条据此切换深浅，避免深色文字压在深色底上。
