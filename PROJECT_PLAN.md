# DockerInfoManager — 项目方案

> 🦐 只读、只观察、只管理，绝不干涉任何容器。

---

## 一、项目定位

一个 **只读型 Docker 容器信息聚合面板**。通过挂载宿主机的 `/var/run/docker.sock`，以只读方式读取 Docker 守护进程中的数据，将容器信息以可视化的卡片形式展示出来。

### 核心原则

| 原则 | 说明 |
|------|------|
| 🔒 **只读** | 所有 Docker API 调用仅限于 GET/LIST 类操作，禁止任何 POST/PUT/DELETE |
| 🚫 **零干扰** | 不创建、不修改、不删除、不重启、不暂停任何容器 |
| 🧩 **完全独立** | 所有自定义数据（别名、图标、分组）存储在项目自身的数据库中，不写入 Docker 标签或配置 |
| 📊 **纯聚合** | 仅汇总展示，不做任何编排或自动化操作 |
| 🛡️ **访问认证** | 管理页面必须登录后才能访问，所有 API 受 JWT 保护 |

---

## 二、功能清单

### 2.0 登录门禁 🔐

简化为单一门禁：系统只有一个账号（通过环境变量配置用户名密码），输入正确才能进入管理面板。不需要子账号、不需要角色权限、不需要用户管理界面。

#### 认证流程

```
打开任意页面 → 前端/后端双重检查 Token
    ↓
无 Token 或过期 → 无条件跳转登录页
    ↓
用户名密码 → POST /api/auth/login → 返回 JWT
    ↓
所有请求附带 Token → 过期自动退回登录页
    ↓
右上角 [登出] → 清除 Token → 回到登录页
```

#### 路径穿越防火墙 🛡️

| 防护层 | 措施 | 说明 |
|--------|------|------|
| 🔗 **前端路由守卫** | `AuthGuard` 包裹所有路由 | 无 Token → 不渲染任何页面，直接跳 `/login` |
| 🛡️ **后端全局中间件** | FastAPI middleware 拦截每个请求 | 除 `/api/auth/login` 外，无合法 Token → 401 |
| 🔒 **SPA 静态保护** | 单入口打包，反向代理只暴露 `/` 和 `/api` | URL 直接访问内部路由无效 |
| 🚫 **未登录无内容** | 未认证时请求任何路径不返回业务数据 | 防止信息泄露 |
| ⏱️ **Token 短期有效** | 默认 24h，过期彻底失效 | 减少泄露窗口 |
| 🔐 **密码哈希存储** | 环境变量中的密码经 bcrypt 哈希后比对 | 不存明文 |

#### 登录页示意

```
┌──────────────────────────────────────────────┐
│                                              │
│            🦐 DockerInfoManager              │
│                                              │
│    ┌──────────────────────────────────┐      │
│    │  👤 用户名                         │      │
│    │  ┌────────────────────────────┐  │      │
│    │  │                            │  │      │
│    │  └────────────────────────────┘  │      │
│    │                                  │      │
│    │  🔒 密码                         │      │
│    │  ┌────────────────────────────┐  │      │
│    │  │                            │  │      │
│    │  └────────────────────────────┘  │      │
│    │                                  │      │
│    │  [      登  录      ]            │      │
│    └──────────────────────────────────┘      │
│                                              │
└──────────────────────────────────────────────┘
```

#### 账号配置

```bash
# docker-compose.yml 环境变量
ADMIN_USERNAME=admin        # 用户名（部署时修改）
ADMIN_PASSWORD=admin123     # 密码（首次部署务必修改！）
JWT_SECRET_KEY=change-me    # JWT 签名密钥（务必修改！）
JWT_EXPIRE_HOURS=24         # Token 有效期
```

> 用户名密码存环境变量，修改后重启容器生效。无数据库依赖，无用户管理界面。

### 2.1 容器概览仪表盘
### 2.1 容器概览仪表盘

- 显示所有容器的卡片列表（运行中 / 已停止）
- 每张卡片展示：
  - 容器名称
  - 使用的镜像
  - 运行状态（绿/红/灰指示灯）
  - 暴露的端口列表
  - 创建时间 / 运行时长
- 统计面板：总数、运行中、已停止、异常退出

### 2.2 容器详情

- 点击卡片展开详情面板：
  - 完整镜像信息（名称、标签、ID）
  - 所有端口映射（宿主机端口 → 容器端口）
  - 网络信息（IP 地址、网络名称）
  - 挂载卷列表
  - 环境变量（敏感值可脱敏展示）
  - 资源使用（CPU / 内存占用，需配合 Docker Stats API）
  - 创建时间、启动时间

### 2.3 分组管理 🆕

分组是整个面板的核心组织方式，可以让容器按业务维度归类。

#### 分组维度

| 维度 | 示例 | 说明 |
|------|------|------|
| 按项目 | `电商平台` / `内部OA` / `数据中台` | 一个项目通常包含多个容器 |
| 按环境 | `生产环境` / `测试环境` / `开发环境` | 区分部署环境 |
| 按服务类型 | `Web服务` / `数据库` / `消息队列` / `网关` | 按技术角色分类 |
| 按团队 | `前端组` / `后端组` / `运维组` | 按负责人团队分 |

#### 分组功能

- **创建/编辑/删除分组**：自定义分组名称、颜色标签、排序
- **拖拽分组**：容器可以在不同分组间拖拽移动
- **分组折叠**：每个分组可以展开/折叠，隐藏暂时不关注的容器
- **分组筛选**：顶部标签页切换，只看某个分组的容器
- **未分组**：默认分组，放尚未归类的容器
- **分组统计**：每个分组显示容器数量、运行中/停止数

#### 分组交互示意

```
┌─────────────────────────────────────────────────────────┐
│ [全部 12] [生产 5] [测试 4] [数据库 3] [⚙️ 管理分组]   │
├─────────────────────────────────────────────────────────┤
│  📂 生产环境                       5 个容器  [展开 ▾]   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │🟢 nginx  │ │🟢 api    │ │🟢 redis  │  ...          │
│  └──────────┘ └──────────┘ └──────────┘               │
├─────────────────────────────────────────────────────────┤
│  📂 测试环境                       4 个容器  [折叠 ▴]   │
├─────────────────────────────────────────────────────────┤
│  📂 数据库                         3 个容器  [展开 ▾]   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │🟢 mysql  │ │🟢 mongo  │ │🟢 pg    │               │
│  └──────────┘ └──────────┘ └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

### 2.4 自定义管理（独立于 Docker）

| 功能 | 存储位置 | 说明 |
|------|----------|------|
| 🏷️ 自定义别名 | SQLite 本地数据库 | 给容器起一个业务名称，显示在卡片标题 |
| 🖼️ 自定义图标 | SQLite 本地数据库 | 预设图标库（🐳🐘🗄️🌐⚙️📦🔐...），点选即可 |
| 📝 备注说明 | SQLite 本地数据库 | 记录容器用途、负责人、注意事项 |
| 📂 所属分组 | SQLite 本地数据库 | 每个容器归属到一个分组 |
| ⭐ 收藏 | SQLite 本地数据库 | 常用容器置顶显示 |

### 2.5 一键跳转

- 容器卡片上显示可点击的端口按钮
- 点击后在新标签页打开 `http://{容器IP}:{端口}`
- 支持配置跳转协议（HTTP / HTTPS）
- 支持配置默认跳转端口
- 容器图标本身也可点击跳转

### 2.6 搜索与过滤

- 全局搜索：按容器名称、别名、镜像名称、备注全文搜索
- 快速筛选：全部 / 运行中 / 已停止 / 已收藏
- 分组筛选：顶部标签页按分组切换
- 排序：按名称、运行时长、创建时间排序

---

## 三、技术架构

```
┌─────────────────────────────────────────────────────┐
│                    浏览器                             │
│  ┌───────────────────────────────────────────────┐  │
│  │           登录页 (未认证时显示)                  │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │     React 前端 (Vite + TS) — 登录后才可见       │  │
│  │       仪表盘 / 分组 / 卡片 / 搜索 / 配置         │  │
│  └───────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │ HTTP REST API (Bearer Token)
                     │ WebSocket (实时状态, 需认证)
┌────────────────────▼────────────────────────────────┐
│              Python FastAPI 后端                       │
│  ┌──────────────────────────────────────────────┐   │
│  │          🔐 JWT 认证中间件 (全局)              │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────┐   │
│  │ Docker 只读   │  │  自定义数据   │  │ 登录认证 │   │
│  │ API 适配层    │  │  管理模块     │  │ 门禁模块 │   │
│  │ (docker-py)  │  │  (SQLite)    │  │(env vars)│   │
│  └──────┬───────┘  └──────┬───────┘  └────┬────┘   │
│         │                 │               │         │
│         │                 │                           │
│  ┌──────▼─────────────────▼───────┐                  │
│  │        数据聚合 & 缓存层        │                  │
│  └────────────────────────────────┘                  │
└────────────────────┬────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │ /var/run/docker.sock │  ← 只读挂载
          │     (宿主机)         │
          └─────────────────────┘
```

### 3.1 技术选型

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| **后端框架** | Python 3.12+ / FastAPI | 异步高性能，自动 OpenAPI 文档 |
| **Docker SDK** | docker-py (官方 SDK) | 成熟稳定，API 覆盖完整 |
| **数据库** | SQLite (aiosqlite) | 零依赖，无需额外容器，数据文件可持久化挂载 |
| **前端框架** | React 18 + TypeScript | 组件化，生态丰富 |
| **构建工具** | Vite | 极速开发与构建 |
| **UI 框架** | TailwindCSS | 原子化 CSS，快速出风格 |
| **图标库** | Lucide React / Heroicons | 轻量、现代 |
| **前端路由** | React Router v6 | SPA 路由 |
| **实时更新** | 轮询 + 可选 WebSocket | 容器状态变化刷新 |
| **部署** | 单个 Docker 镜像 | 多阶段构建，最终镜像 < 150MB |

### 3.2 目录结构

```
DockerInfoManager/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI 入口
│   │   ├── config.py            # 配置管理
│   │   ├── routers/
│   │   │   ├── containers.py      # 容器相关 API
│   │   │   ├── images.py          # 镜像相关 API
│   │   │   ├── groups.py          # 分组管理 API
│   │   │   ├── custom.py          # 自定义数据 API
│   │   │   ├── auth.py            # 登录/登出 API
│   │   │   └── stats.py           # 统计 API
│   │   ├── middleware/
│   │   │   └── auth.py            # JWT 认证中间件（全局拦截，路径穿越防火墙）
│   │   ├── services/
│   │   │   ├── docker_service.py   # Docker SDK 封装（只读白名单）
│   │   │   ├── custom_service.py   # 自定义数据 CRUD
│   │   │   ├── auth_service.py     # 认证服务（JWT 签发/验证，环境变量比对密码）
│   │   │   └── cache_service.py    # 缓存服务
│   │   ├── models/
│   │   │   ├── docker_models.py    # Docker 数据模型
│   │   │   └── custom_models.py    # 自定义数据模型
│   │   └── database.py          # SQLite 数据库管理
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx               # 登录页（唯一无需认证的页面）
│   │   │   ├── Dashboard.tsx           # 仪表盘主页
│   │   │   └── ContainerDetail.tsx     # 容器详情页
│   │   ├── components/
│   │   │   ├── AuthGuard.tsx            # 路由守卫（未登录 → 跳转登录页）
│   │   │   ├── ContainerCard.tsx       # 容器卡片
│   │   │   ├── GroupSection.tsx        # 分组区域（可折叠）
│   │   │   ├── GroupTabs.tsx           # 分组标签页切换
│   │   │   ├── GroupManager.tsx        # 分组管理弹窗
│   │   │   ├── ContainerDetail.tsx     # 详情面板
│   │   │   ├── SearchBar.tsx           # 搜索栏
│   │   │   ├── StatsBar.tsx            # 统计条
│   │   │   ├── LogoutButton.tsx        # 登出按钮（右上角）
│   │   │   └── CustomEditor.tsx        # 自定义编辑
│   │   ├── hooks/
│   │   │   ├── useContainers.ts        # 容器数据 Hook
│   │   │   └── useAuth.ts              # 认证状态 Hook
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript 类型
│   │   └── utils/
│   │       ├── api.ts                  # API 请求封装（自动附加 Token）
│   │       └── token.ts                # Token 存取工具
│   │   ├── hooks/
│   │   │   ├── useContainers.ts        # 容器数据 Hook
│   │   │   └── useAuth.ts              # 认证状态 Hook
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript 类型
│   │   └── utils/
│   │       ├── api.ts                  # API 请求封装（自动附加 Token）
│   │       └── token.ts                # Token 存取工具
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 四、API 设计（只读）

### 4.1 认证 API（仅登录门禁）

| 方法 | 路径 | 说明 | 是否需要认证 |
|------|------|------|:---:|
| `POST` | `/api/auth/login` | 验证用户名密码，返回 JWT Token | ❌ 否 |
| `POST` | `/api/auth/refresh` | 刷新即将过期的 Token | ❌ 否（需携带旧 Token） |
| `POST` | `/api/auth/logout` | 登出，Token 加入黑名单 | ✅ 是 |

> 仅此三个接口。**除 `/api/auth/login` 外，所有 API 都必须携带 `Authorization: Bearer <token>` 请求头**，否则返回 401。
>
> 后端验证逻辑：从环境变量读取 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`（bcrypt 哈希后比对），不依赖数据库。

### 4.2 Docker 只读 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/containers` | 获取容器列表（含基本信息） |
| `GET` | `/api/containers/{id}` | 获取单个容器详情 |
| `GET` | `/api/containers/{id}/stats` | 获取容器实时资源占用 |
| `GET` | `/api/images` | 获取镜像列表 |
| `GET` | `/api/networks` | 获取网络列表 |
| `GET` | `/api/volumes` | 获取卷列表 |
| `GET` | `/api/overview` | 获取概览统计 |

### 4.3 分组管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/groups` | 获取所有分组列表 |
| `POST` | `/api/groups` | 创建新分组 |
| `PUT` | `/api/groups/{id}` | 更新分组（名称、颜色、排序） |
| `DELETE` | `/api/groups/{id}` | 删除分组（容器回归「未分组」） |
| `PUT` | `/api/groups/{id}/sort` | 调整分组排序 |

### 4.4 自定义数据 API（完整 CRUD，仅操作 SQLite）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/custom/containers` | 获取所有自定义数据（含分组信息） |
| `GET` | `/api/custom/containers/{id}` | 获取单个容器自定义数据 |
| `PUT` | `/api/custom/containers/{id}` | 更新别名、图标、分组、备注等 |
| `DELETE` | `/api/custom/containers/{id}` | 删除自定义数据 |
| `PUT` | `/api/custom/containers/{id}/group` | 单独移动容器到指定分组 |

### 4.5 安全措施

```python
# docker_service.py 核心安全约束

# 白名单：仅允许这些 Docker API 操作
ALLOWED_OPERATIONS = {
    "containers": ["list", "get"],
    "images":     ["list", "get"],
    "networks":   ["list", "get"],
    "volumes":    ["list", "get"],
    "info":       ["get"],
    "version":    ["get"],
}

# 所有操作必须通过此函数
def execute_readonly(client, resource, action, **kwargs):
    if action not in ALLOWED_OPERATIONS.get(resource, []):
        raise PermissionError(f"操作被拒绝: {resource}.{action}")
    return getattr(getattr(client, resource), action)(**kwargs)
```

---

## 五、部署方案

### 5.1 Docker Compose

```yaml
version: '3.8'

services:
  docker-info-manager:
    image: docker-info-manager:latest
    container_name: docker-info-manager
    ports:
      - "8080:8080"
    volumes:
      # ⚠️ 只读挂载 docker.sock
      - /var/run/docker.sock:/var/run/docker.sock:ro
      # 持久化自定义数据
      - ./data:/app/data
    environment:
      - DOCKER_SOCK_PATH=/var/run/docker.sock
      - DATABASE_PATH=/app/data/docker_info.db
      - POLL_INTERVAL=30
      # 登录门禁（部署时务必修改！）
      - ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY:-change-me-in-production}
      - JWT_EXPIRE_HOURS=24
    restart: unless-stopped
```

### 5.2 镜像构建

```dockerfile
# 多阶段构建

# 阶段1: 构建前端
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY frontend/ ./
RUN pnpm build

# 阶段2: 最终镜像
FROM python:3.12-slim
WORKDIR /app

# 安装依赖
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY backend/ ./

# 复制前端构建产物
COPY --from=frontend-builder /app/frontend/dist ./static

# 创建数据目录
RUN mkdir -p /app/data

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

---

## 六、前端界面设计

### 6.1 主仪表盘

```
┌──────────────────────────────────────────────────────────┐
│  🦐 DockerInfoManager         🔍 搜索...   [全部 ▾]      │
├──────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                    │
│  │  12  │ │  8   │ │  3   │ │  1   │                    │
│  │ 全部 │ │运行中│ │已停止│ │异常  │                    │
│  └──────┘ └──────┘ └──────┘ └──────┘                    │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐│
│  │ 🟢 nginx-proxy  │ │ 🟢 redis-cache  │ │🟢 my-app    ││
│  │ nginx:alpine    │ │ redis:7         │ │ my-app:1.0  ││
│  │ 🖼️ 反向代理     │ │ 🖼️ 缓存服务     │ │ 🖼️ 业务应用  ││
│  │ ┌──────┐┌─────┐ │ │ ┌─────┐         │ │┌────┐┌────┐ ││
│  │ │80:80 ││443  │ │ │ │6379 │         │ ││3000││8080│ ││
│  │ └──────┘└─────┘ │ │ └─────┘         │ │└────┘└────┘ ││
│  │ 运行 3 天        │ │ 运行 7 天       │ │运行 1 小时   ││
│  │ ⭐         ✏️    │ │ ⭐         ✏️   │ │⭐       ✏️   ││
│  └─────────────────┘ └─────────────────┘ └─────────────┘│
└──────────────────────────────────────────────────────────┘
```

### 6.2 卡片交互

- **点击端口标签**：新标签页跳转到 `http://host:port`
- **点击星星**：收藏/取消收藏
- **点击编辑按钮**：弹出侧边栏编辑自定义信息
- **点击卡片主体**：展开/跳转到详情页

### 6.3 自定义编辑面板

```
┌── 编辑容器 ──────────────────────┐
│                                   │
│  别名: [nginx-反向代理________]   │
│                                   │
│  图标: [🖼️ 选择图标 ▾]           │
│  ┌─────┐ ┌─────┐ ┌─────┐        │
│  │ 🐳  │ │ 🌐  │ │ 🗄️  │ ...    │
│  └─────┘ └─────┘ └─────┘        │
│                                   │
│  分组: [生产环境 ▾]              │
│                                   │
│  备注:                            │
│  ┌───────────────────────────┐   │
│  │ 公司主站反向代理，        │   │
│  │ 负责人：张三              │   │
│  └───────────────────────────┘   │
│                                   │
│         [取消]    [保存]          │
└───────────────────────────────────┘
```

---

## 七、数据库设计（SQLite）

```sql
-- 自定义容器信息表
CREATE TABLE container_custom (
    id              TEXT PRIMARY KEY,   -- Docker 容器 ID
    alias           TEXT,               -- 自定义别名
    icon            TEXT,               -- 图标标识符/emoji
    group_name      TEXT,               -- 分组名称
    notes           TEXT,               -- 备注
    is_favorite     INTEGER DEFAULT 0,  -- 是否收藏
    jump_protocol   TEXT DEFAULT 'http',-- 跳转协议
    jump_port       INTEGER,           -- 默认跳转端口
    created_at      TEXT,
    updated_at      TEXT
);

-- 自定义分组表
CREATE TABLE custom_group (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL UNIQUE,
    color           TEXT,
    icon            TEXT,
    sort_order      INTEGER DEFAULT 0
);
```

---

## 八、开发阶段规划

### Phase 1: 基础骨架 (1-2 天)
- [x] 项目结构搭建
- [ ] FastAPI 项目初始化
- [ ] React 项目初始化 (Vite + TailwindCSS)
- [ ] Docker 镜像构建流程

### Phase 2: 后端核心 (2-3 天)
- [ ] Docker SDK 只读封装层
- [ ] JWT 认证中间件（全局路径穿越防火墙）
- [ ] 登录/登出 API（环境变量验证密码）
- [ ] 容器列表/详情 API
- [ ] 镜像列表 API
- [ ] 资源统计 API
- [ ] SQLite 数据库初始化与自定义数据 API

### Phase 3: 前端核心 (3-4 天)
- [ ] 登录页面与 AuthGuard 路由守卫
- [ ] Token 管理与自动刷新
- [ ] 仪表盘布局
- [ ] 容器卡片组件
- [ ] 分组展示与折叠
- [ ] 搜索与过滤
- [ ] 容器详情面板
- [ ] 自定义编辑面板

### Phase 4: 完善与部署 (1-2 天)
- [ ] 端口跳转功能
- [ ] 状态实时刷新
- [ ] Docker Compose 部署配置
- [ ] README 文档

**预计总工期：7-11 天**

---

## 九、安全审查清单

- [x] `docker.sock` 以 `:ro` 只读模式挂载
- [x] 后端代码层面禁止所有 Docker 写操作
- [x] 自定义数据完全存储在独立 SQLite 中
- [x] 不修改任何 Docker 对象（容器、镜像、网络、卷）
- [x] 不读取/暴露敏感环境变量（可配置脱敏规则）
- [x] 无特权模式运行
- [x] 最小化镜像依赖
- [x] 账号密码通过环境变量配置，bcrypt 哈希比对
- [x] JWT 全局中间件保护所有 API（路径穿越防火墙）
- [x] 前端 AuthGuard 路由守卫，未登录不渲染任何页面
- [x] 登录前访问任意路径不返回业务数据

---

## 十、扩展方向（可选，非本期）

- 🔔 容器异常告警（Webhook / 邮件通知）
- 📈 历史资源使用趋势图（Prometheus 集成）
- 🔐 OIDC / OAuth2 单点登录（GitHub / GitLab / LDAP）
- 🌓 暗色模式
- 📱 PWA 移动端支持
- 📋 Docker Compose 项目识别（通过 labels 自动分组）

---

> 如果你认可这个方案，告诉我，我就开始从 Phase 1 搭建代码。
