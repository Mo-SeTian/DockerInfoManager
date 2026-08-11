# 🦐 DockerInfoManager

只读型 Docker 容器信息聚合面板。挂载 `docker.sock` 以只读方式读取宿主机上的所有容器，提供可视化的管理仪表盘。

> **核心原则：绝不干扰任何容器，一切操作完全独立于 Docker。**

---

## ✨ 功能

| 功能 | 说明 |
|------|------|
| 🔐 **登录门禁** | JWT 认证，输入账号密码才能进入管理界面 |
| 📊 **容器仪表盘** | 卡片式展示所有容器，状态指示灯一目了然 |
| 📋 **容器详情** | 镜像信息、端口映射、网络、挂载卷、环境变量 |
| 🏷️ **自定义管理** | 别名、图标、备注，数据存 SQLite，不碰 Docker |
| 📂 **分组管理** | 按项目/环境/类型分组，可折叠，标签页切换 |
| 🔗 **一键跳转** | 点击端口标签或容器图标，直接跳转到服务页面 |
| 🔍 **搜索过滤** | 按名称、镜像、状态、分组快速筛选 |

---

## 🚀 快速启动

### 方式一：Docker Hub 镜像（推荐）

```bash
mkdir docker-info-manager && cd docker-info-manager
```

创建 `docker-compose.yml`：

```yaml
services:
  docker-info-manager:
    image: your-dockerhub-username/docker-info-manager:latest
    container_name: docker-info-manager
    ports:
      - "8888:8000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./data:/app/data
    environment:
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=admin123
      - JWT_SECRET_KEY=change-me-in-production
      - JWT_EXPIRE_HOURS=24
    restart: unless-stopped
```

```bash
docker compose up -d
```

### 方式二：本地构建

```bash
git clone https://github.com/Mo-SeTian/DockerInfoManager.git
cd DockerInfoManager
docker compose up -d --build
```

### 访问

```
http://你的IP:8888
默认账号: admin / admin123
```

---

## 🐳 镜像拉取（国内）

如果 Docker Hub 拉取慢，先配置镜像加速：

```bash
# 编辑 /etc/docker/daemon.json，添加：
{
  "registry-mirrors": ["https://docker.m.daocloud.io"]
}

# 重启 Docker
sudo systemctl restart docker
```

---

## 🔧 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `ADMIN_USERNAME` | `admin` | 登录用户名 |
| `ADMIN_PASSWORD` | `admin123` | 登录密码（**务必修改！**） |
| `JWT_SECRET_KEY` | `change-me-in-production` | JWT 签名密钥（**务必修改！**） |
| `JWT_EXPIRE_HOURS` | `24` | Token 有效期（小时） |
| `POLL_INTERVAL` | `30` | 数据刷新间隔（秒） |

---

## 🛡️ 安全设计

```
docker.sock :ro          → 只读挂载
代码白名单               → 仅允许 GET/LIST
JWT 中间件               → 全局拦截所有 /api/*
AuthGuard 路由守卫       → 未登录不渲染任何页面
SQLite 独立存储          → 自定义数据不写入 Docker
环境变量密码             → bcrypt 哈希比对
```

| 不会做的事 |
|-----------|
| ❌ 创建/删除/重启容器 |
| ❌ 修改镜像、网络、卷 |
| ❌ 写入 Docker 标签 |
| ❌ 执行任何特权操作 |
| ❌ 暴露敏感环境变量 |

---

## 📦 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Python FastAPI + Docker SDK + JWT + bcrypt |
| 前端 | React 18 + TypeScript + TailwindCSS + Vite |
| 数据库 | SQLite（仅存储自定义元数据） |
| 部署 | Docker Compose 单容器 |
| CI/CD | GitHub Actions 自动构建推送到 Docker Hub |

---

## 🔄 CI/CD

推送到 `main` 分支或打 `v*` 标签时，GitHub Actions 自动：

1. 构建前端 (Node 20 Alpine)
2. 构建后端 (Python 3.12 Slim)
3. 打包为多架构镜像 (`linux/amd64` + `linux/arm64`)
4. 推送到 Docker Hub

### 配置 Secrets

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：

| Secret | 说明 |
|--------|------|
| `DOCKERHUB_USERNAME` | Docker Hub 用户名 |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token |

---

## 📂 项目结构

```
DockerInfoManager/
├── backend/                  # FastAPI 后端
│   ├── app/
│   │   ├── main.py           # 入口
│   │   ├── middleware/auth.py # JWT 认证中间件
│   │   ├── routers/          # API 路由
│   │   ├── services/         # 业务逻辑
│   │   └── models/           # 数据模型
│   └── requirements.txt
├── frontend/                 # React 前端
│   └── src/
│       ├── pages/            # 页面组件
│       ├── components/       # UI 组件
│       └── hooks/            # 自定义 Hook
├── .github/workflows/        # CI/CD
│   └── docker-build.yml
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 📄 License

MIT
