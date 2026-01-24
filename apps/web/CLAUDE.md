# Web Frontend

## RULES

在你实现前端UI时，尽量避免使用硬编码的mock数据，可以直接接入API。如果后端没有实现，请你自己修改api-specs/openapi.yaml，
这样，我们就能通过mock server来测试而不用依赖后端。

## UI 设计风格

**主题**: 暗黑赛博朋克 + 玻璃态

### 色彩系统

- **主色调**: 霓虹青色 `oklch(0.75 0.15 195)`
- **辅助色**: 霓虹粉紫 `oklch(0.7 0.2 320)`
- **背景**: 深紫黑色 `oklch(0.08 0.01 280)`
- **文字**: 白色系，透明度分层（100%/80%/60%/40%/30%）

### 视觉效果

- **玻璃态卡片**: `backdrop-blur-xl` + 半透明背景 + 细边框
- **霓虹发光**: 按钮和重点元素使用 `neon-glow` / `neon-glow-subtle`
- **渐变按钮**: 青色到深青色的渐变，hover 时增强
- **背景装饰**: 动态光斑 + 网格纹理 + 噪点叠加 + 暗角

### 动效

- 页面进入: `fade-in` + `slide-in-from-bottom`
- 交互反馈: `transition-all duration-300`
- 使用 `animationDelay` 实现错落进场

### 字体

- 无衬线: Geist Sans
- 等宽: Geist Mono

### 组件库

- 基于 Shadcn UI
- 自定义 utility classes: `glass`, `glass-card`, `neon-glow`, `neon-text`, `neon-border`
