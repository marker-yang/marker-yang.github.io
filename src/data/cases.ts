export type Metric = { value: string; label: string };

export type CaseStudy = {
  slug: string;
  index: string;
  title: string;
  client: string;
  period: string;
  role: string;
  stack: string[];
  summary: string;
  metrics: Metric[];
  image?: { src: string; alt: string; ratio: string; wide?: boolean };
  diagram?: 'pipeline';
  body: {
    context: string;
    problem: string[];
    approach: { title: string; text: string }[];
    result: { value: string; label: string; note?: string }[];
    closing?: string;
  };
};

export const cases: CaseStudy[] = [
  {
    slug: 'lowcode',
    index: '01',
    title: 'PaaS 与 CMS 低代码平台',
    client: '广州盛原成科技',
    period: '2022.08 — 2024.09',
    role: '前端负责人',
    stack: ['Vue3', 'TypeScript', 'Vite', 'LogicFlow', 'ECharts'],
    summary:
      '面向企业客户的低代码平台。客户要在上面自己搭流程、自己配页面，平台必须能接住每个人不一样的需求。',
    metrics: [
      { value: '6~10s → 1s', label: '首屏加载' },
      { value: '20+', label: '可复用物料组件' },
      { value: '0 → 1', label: '流程编辑器' },
    ],
    image: {
      src: '/img/lowcode.webp',
      alt: '低代码平台中的产线运行监控页面，由可视化物料在画布上搭建而成',
      ratio: '1600 / 871',
    },
    body: {
      context:
        '这是一套给企业客户使用的 PaaS 与 CMS 平台。客户不是开发者，却需要自己画业务流程图、自己配置数据看板、自己拖出页面——平台的价值，全在于「客户能不能不找研发就完成这件事」。',
      problem: [
        '每个客户的流程形态都不一样，靠业务代码去适配，边际成本随客户数量线性上涨，最后平台会被需求拖垮。',
        '复杂页面由几十个物料组成，加上图表初始化，首屏要 6 到 10 秒才出来。客户在演示会上等一个加载圈，信任就已经掉了一半。',
        '物料之间没有统一的配置约定，每加一个组件就要重新写一遍属性面板，复用率接近于零。',
      ],
      approach: [
        {
          title: '把「客户自定义」变成机制，而不是需求',
          text: '基于 LogicFlow 开发编辑器的核心插件，设计自定义节点注册机制与校验规则：客户通过一份声明就能定义节点长什么样、允许连到哪里、什么条件下不合法。此后新增一类业务流程，不再需要改编辑器。',
        },
        {
          title: '用一套配置协议约束所有物料',
          text: '定义统一的组件配置协议，属性面板、校验、序列化全部由协议驱动，再基于它做出动态表单、地图选址、可视化图表等 20 多个物料组件。新增物料的成本从「一天」降到「一小时」。',
        },
        {
          title: '把渲染切成片',
          text: '用 requestAnimationFrame 做分片渲染，把页面拆成多个时间片逐步挂载，避免一次同步渲染卡死主线程；配合 LRU Cache 缓存已渲染过的物料实例，返回上一页时直接复用。',
        },
      ],
      result: [
        { value: '1s 内', label: '首屏加载', note: '原 6~10s' },
        { value: '20+', label: '可复用物料' },
        { value: '声明式', label: '客户自定义节点', note: '无需改代码' },
      ],
      closing:
        '这个项目教会我一件事：平台类产品的工程量，不在功能数量，而在「第 N 个客户接入时，你需要写多少新代码」。',
    },
  },
  {
    slug: 'data-automation',
    index: '02',
    title: '多市场运营数据日报自动化',
    client: 'WHOOSHPRO PTE. LTD.',
    period: '2026.04 — 2026.10',
    role: '独立设计与开发',
    stack: ['Python', 'Playwright', '影刀 RPA', 'ShopifyQL', '飞书多维表格 API'],
    summary:
      '一家跨境品牌在九个平台经营，每天的数据散在九个后台里。人肉统计每天要花掉一整个上午。',
    metrics: [
      { value: '9', label: '业务线自动抓取' },
      { value: '31', label: '业务维度' },
      { value: '0', label: '人工介入' },
    ],
    diagram: 'pipeline',
    body: {
      context:
        '这家公司的生意分布在 Google、Facebook、Awin、Impact、Klarna、KOL、Klaviyo 和 Shopify 上。每个渠道有自己的后台、自己的口径、自己的导出按钮——而决策层每天早上要看一张把它们并起来的表。',
      problem: [
        '数据孤岛。九个后台之间没有共同主键，同一笔订单在不同渠道的口径还不一样。',
        '统计靠人工。运营每天复制、粘贴、校对，四个小时起步，且错一个单元格整张表就失去意义。',
        '没有沉淀。日报只存在于某个人当天的聊天记录里，无法回溯、无法对比趋势。',
      ],
      approach: [
        {
          title: '先把口径定死，再写脚本',
          text: '梳理每个渠道的核心指标定义，用 ShopifyQL 精确拉取销售 GMV、实收金额、订单数、折扣率、转化率、客单价，确保同一个数字在任何渠道都指同一件事。最终固定成 31 列业务维度。',
        },
        {
          title: '让脚本替人点后台',
          text: '用 Python 与 Playwright 编写浏览器自动化，配合影刀 RPA 处理那些需要登录态、验证码或页面上没有接口的环节。九个来源的抓取在同一次运行里串起来，失败的位置会单独告警，不会静默吞掉一天的数据。',
        },
        {
          title: '直接写进团队已经在用的地方',
          text: '深度集成飞书多维表格 API：跨月时自动创建月份子表，31 列数据逐日追加，累加汇总行自动计算并写入。团队不需要学习新工具，打开熟悉的表格就有当天数据。',
        },
      ],
      result: [
        { value: '9 → 1', label: '数据来源收敛为一张表' },
        { value: '31 列', label: '固定业务维度' },
        { value: '每日', label: '自动运行并归档', note: '含跨月建表' },
      ],
      closing:
        '自动化真正难的不是抓取，是让九套不一样的口径在同一张表里讲同一件事。',
    },
  },
  {
    slug: 'dtc',
    index: '03',
    title: '海外电商自建站',
    client: 'EK Lights（广东熠日科技）',
    period: '2025.04 — 2026.10',
    role: '前端与自动化',
    stack: ['Shopify OS 2.0', 'Liquid', 'Vue3', 'Metafields', 'PageSpeed Insights'],
    summary:
      '一个面向全球客户的企业官网。运营要能自己改页面，用户要能在一秒内看到首屏，而第三方插件正在把这两件事一起毁掉。',
    metrics: [
      { value: '4s+ → 1.9s', label: '首屏 LCP' },
      { value: '+80%', label: '运营配置效率' },
      { value: '无刷新', label: '抽屉式购物车' },
    ],
    image: {
      src: '/img/dtc.webp',
      alt: 'EK Lights 官网在笔记本与手机上的展示：首页主视觉、产品列表与 Claypaky 收购新闻',
      ratio: '1600 / 493',
      wide: true,
    },
    body: {
      context:
        '专业舞台灯光品牌 EK Lights 的海外官网。它既要撑住一个全球品牌的形象——大画幅的产品摄影、克制的排版、多语言——又要保留完整的电商能力：产品线导航、商品详情、购物车与促销，一个都不能少。',
      problem: [
        '运营依赖研发。EK 的产品线有 MC、EC、K 系列等多条，改一句文案、换一张图、上下架一款灯，都要排进研发的迭代里。',
        '首屏 4 秒以上。第三方 App 各自注入脚本和样式，加上未压缩的图片，用户在看到内容之前就流失了。',
        '购物链路割裂。原生的跳页式购物车打断了浏览，加购转化率一直上不去。',
      ],
      approach: [
        {
          title: '让运营自己拖页面',
          text: '基于 Liquid 深度二开主题，编写自定义 JSON Schema 并绑定 Metafields，把商品详情页与大促落地页拆成可拖拽配置的模块。运营在后台拼页面，研发不再出现在这条路径上。',
        },
        {
          title: '重做购物链路',
          text: '用 Shopify Ajax API 重构为无刷新抽屉式购物车，并定制阶梯满减进度条与组合捆绑加购组件。用户加购时不离开当前页，满减门槛直观可见。',
        },
        {
          title: '把第三方脚本关进笼子',
          text: '用 defer / async 延迟加载非关键脚本，清理 App 卸载后残留的代码与样式，图片全部懒加载并转现代格式，最后对照 Google PageSpeed Insights 逐项压 LCP。首屏从 4 秒以上降到 1.9 秒以内。',
        },
        {
          title: '高频运营操作交给脚本',
          text: '多语言文案同步、批量上下架、素材归档这些每天重复的动作，用 Python 与影刀 RPA 写成浏览器自动化，日常运营配置效率提升 80% 以上。',
        },
      ],
      result: [
        { value: '1.9s', label: '首屏 LCP', note: '原 4s+' },
        { value: '80%+', label: '运营配置提效' },
        { value: '模块化', label: '页面拖拽搭建' },
      ],
      closing:
        '性能优化最有效的手段，往往是删掉别人塞进来的东西。',
    },
  },
  {
    slug: 'this-site',
    index: '04',
    title: '本站',
    client: '个人项目',
    period: '2026.11',
    role: '设计、开发、性能',
    stack: ['Astro', 'Canvas', 'CSS', 'TypeScript'],
    summary:
      '你正在看的这个页面。没有后端、没有框架运行时，首屏的那片节点网络是手写的 Canvas。',
    metrics: [
      { value: '0 KB', label: '框架运行时' },
      { value: '< 1.5s', label: '首屏 LCP 目标' },
      { value: '100%', label: '静态输出' },
    ],
    body: {
      context:
        '一个给自己用的站，用来把做过的事讲清楚。它同时也是我最近一次完整的技术决策：在一个内容极其简单的站点上，什么该做得重，什么该做得轻。',
      problem: [
        '不想用模板。作品集站本身就在替你做判断，一个用模板搭出来的作品集，等于第一句话就承认自己只会套模板。',
        '不想为动效付出性能。首屏任何一处卡顿，都会在这次「演示」里变成减分项。',
        '内容会长期变更。案例要能不断补充，但每次改文案不应该需要我重新部署一次架构思考。',
      ],
      approach: [
        {
          title: '把框架整个去掉',
          text: '用 Astro 输出纯静态 HTML 与 CSS，页面上唯一的 JavaScript 是首屏的 Canvas 和几百行的交互脚本。没有框架运行时、没有水合、没有客户端路由。',
        },
        {
          title: '首屏那片节点网络',
          text: '手写 Canvas：节点是圆角方块而非圆点，因为它们是流程图的隐喻；节点缓慢漂移，靠近时以细线相连，鼠标会轻微影响周围的节点。移动端与 prefers-reduced-motion 下直接渲染一帧静态图，不再启动动画循环。',
        },
        {
          title: '动效只做在能看见的地方',
          text: '滚动驱动的文字显影、数字计数与图片位移全部基于 IntersectionObserver 和 rAF，不使用动画库；离屏即停止，在低端机上降级为直接显示。',
        },
      ],
      result: [
        { value: '静态', label: '无服务端依赖' },
        { value: 'Canvas', label: '首屏视觉', note: '无第三方图形库' },
        { value: '可降级', label: '动效策略' },
      ],
      closing:
        '最好的性能优化仍然是把代码删掉——这次我删掉的是整个框架。',
    },
  },
];

export const shortProjects = [
  {
    name: '流量平台',
    client: '深圳微米信息服务',
    period: '2020.09 — 2022.08',
    stack: 'Vue3 · Vite · TypeScript',
    text: '从 0 到 1 搭建流量中台，沉淀通用 UI 组件库与高阶业务 Hooks。落地 H5 积木化配置方案，把常规营销页的研发周期缩短 70% 以上；设计前端无痕埋点 SDK，采集 PV、UV、曝光与点击转化，配合 ECharts 与虚拟滚动支撑大数据量趋势看板。',
  },
  {
    name: '民生服务小程序',
    client: '深圳市三度空间',
    period: '2020.03 — 2020.09',
    stack: 'React · Taro · TypeScript · Python',
    text: '基于 React + Taro 独立完成从 0 到 1 的架构与上线，闭环封装登录鉴权、腾讯云慧眼人脸核身与高德地图 LBS 能力。针对运营数据高频录入的痛点，用 Python 编写定时批量构建与清洗脚本。',
  },
  {
    name: '随选网',
    client: '深圳市三度空间',
    period: '2018.08 — 2020.02',
    stack: 'Vue2 · JavaScript · ECharts',
    text: '负责多端适配与首屏性能：图片懒加载、CDN 优化、虚拟列表实现不定高无限滚动，页面加载耗时降低 80%。v2 重构时梳理历史遗留代码，抽取公共组件建立组件规范。',
  },
];

export const timeline = [
  { period: '2025.03 — 2026.10', company: 'WHOOSHPRO PTE. LTD.', place: '新加坡', role: '前端 / 全栈' },
  { period: '2022.08 — 2024.09', company: '广州盛原成科技', place: '广州', role: '前端负责人' },
  { period: '2020.05 — 2022.08', company: '深圳微米信息服务', place: '深圳', role: '前端开发' },
  { period: '2018.08 — 2020.03', company: '深圳市三度空间', place: '深圳', role: '前端开发' },
];
