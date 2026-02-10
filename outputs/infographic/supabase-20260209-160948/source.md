核心概念：Supabase 到底是什么？
想象一下，你作为一个前端开发者，想要开发一个全栈应用（比如一个待办事项 App、一个博客、一个电商网站）。
传统做法你需要：
买服务器（AWS/阿里云）。
装数据库（MySQL/Postgres）。
写后端 API 代码（Node.js/Python/Go）来查数据库。
写鉴权逻辑（登录、注册、JWT）。
使用 Supabase 的做法：
你只需要创建一个 Supabase 项目，它会立刻为你提供：
一个完整的 PostgreSQL 数据库。
根据数据库表自动生成的 RESTful API 和 GraphQL API（你不用写后端 CRUD 代码了！）。
一套完整的 用户认证系统（登录、注册）。
实时订阅功能（类似 WebSocket）。
一句话总结：Supabase 就是一个“后端即服务”（BaaS），它让你只需要关注前端代码和数据库设计，无需编写繁琐的后端 API 层。