# 时间额度支取器 · Time Quota Tracker

> 把时间当作**可随时支取的额度**，而不是必须连续偿还的债务。

番茄钟要求你一次坐满 25 分钟，任务清单给你攒下一屁股「没做完」的债。这个工具换个思路：先给一件事**划出一段时间**（额度），然后随时支取一段、随时暂停、随时结账。碎片时间只产生「进度感」，不产生心理负担。

![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?logo=typescript&logoColor=fff)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=000)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=fff)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ 核心特性

- **时间额度**：给每个项目设总量，消耗实时从剩余额度中扣减。
- **分段支取**：每次支取默认只扣一段（可自定义），到点自动结账，不逼你连续完成。
- **不限时支取**：想一口气做完？切到「不限时」，直到你手动结束或额度用尽。
- **随时暂停 / 结束 / 放弃**：中途有事就停，放弃的这段不计入额度。
- **支取流水**：每一次「开始 → 结账」都记录时长与原因，投入看得见。
- **本地持久化**：数据只存在浏览器 localStorage，刷新、断网都不丢，绝不上传。
- **JSON 导入导出**：一键备份，或换设备继续用。
- **中英文切换 / 深色模式 / 提示音 / 系统通知**。
- **键盘快捷键**：`Space` 开始/暂停。

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

生产构建与质量检查：

```bash
npm run build       # 类型检查 + 打包
npm run lint        # oxlint 静态检查
npm run typecheck   # tsc 类型检查
npm test            # Node 内置测试运行器跑单测
npm run check       # lint + typecheck + test + build 一条龙
```

## 🧠 核心设计

计时**不累加 tick**，而是按挂钟时间 `Date.now()` 推算，所以标签页被浏览器节流也不会丢时间；刷新后会话能从 localStorage 恢复继续跑。

```
src/
├── lib/            # 纯函数领域逻辑（额度扣减、结算、持久化、格式化），全部可单测
│   ├── engine.ts   # 状态机 reducer + 派生视图（selectLive / autoSettleReason）
│   ├── quota.ts    # 项目、额度、支取记录的领域操作
│   ├── storage.ts  # localStorage 读写、旧版本迁移、导入导出
│   ├── time.ts     # 时长/日期/百分比格式化
│   └── notify.ts   # Web Audio 提示音 + Notification API
├── i18n/           # 中英文文案（类型约束保证两种语言键完全一致）
├── hooks/          # useTimeQuota（计时引擎）、useTheme、usePreferences、useToasts
├── components/     # 计时面板、项目列表、支取流水、数据面板、弹窗、提示条
└── types/          # 领域模型类型
```

核心规则（见 `src/lib/engine.ts`）：

1. 同一时间只允许一个支取会话；
2. 实际消耗 = 分段上限、剩余额度、已运行时长三者的最小值；
3. 到达单次上限 → 自动结账（`limit`）；额度用尽 → 自动停止（`exhausted`）；手动结束 → `stopped`。

## 🧪 测试

用 Node 内置测试运行器直接执行 TypeScript 单测，零额外依赖：

```bash
npm test
```

覆盖额度扣减边界、结算截断、旧数据迁移、导入导出与中英文文案一致性。

## 📱 使用场景

**碎片化学习**：设「日语精读 90 分钟」，默认分段 15 分钟。等车 5 分钟、课间 10 分钟各支取一段，只看到进度条往前走，不欠任何债。

**任务规划**：给今天的三件要事各划一段额度，随时开始/停止，剩余时间实时更新。

## 🛠️ 技术栈

| 层 | 选型 |
|----|------|
| 框架 | React 19 + TypeScript 6 |
| 构建 | Vite 8 |
| 样式 | 原生 CSS（CSS 变量 + `data-theme` 深色模式） |
| 质量 | oxlint + tsc(strict) + Node 内置测试 |
| CI/CD | GitHub Actions（CI + GitHub Pages 部署） |

## 📦 部署

- **本地**：`npm run build` 后托管 `dist/` 目录即可。
- **GitHub Pages**：仓库已配置 `pages.yml`，推送到 `main` 自动构建并部署。子路径部署通过 `BASE_PATH` 环境变量控制（本项目为 `/time-quota/`）。

## 📄 许可证

[MIT](./LICENSE) © yc-eagle
