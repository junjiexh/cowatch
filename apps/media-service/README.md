# Media Service

视频源解析服务，负责：

- 解析不同视频源（夸克网盘、Bilibili 等）
- 提供统一的视频流 URL
- 视频流代理和转发

## 目录结构

```
media-service/
├── cmd/media/            # 入口文件
├── internal/             # 私有代码
│   ├── parsers/         # 各平台解析器
│   │   ├── bilibili/
│   │   └── quark/
│   ├── proxy/           # 视频流代理
│   └── handlers/        # HTTP 处理器
└── pkg/                 # 可导出的包
```

## 运行

```bash
cd apps/media-service
go mod download
go run cmd/media/main.go
```
