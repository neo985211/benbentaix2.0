# 部署到手机可打开的网址

这个项目现在包含：

- 前端页面：登录入口、用户端、车主端。
- Pages Function：`/api/order`。
- Durable Object Worker：`worker/order-do.js`，用于稳定保存最新来单。

## 为什么不用 KV

Cloudflare KV 是最终一致存储，不适合「一台手机刚下单，另一台手机马上看到」这种实时场景。Durable Object 会把同一个对象的读写集中到一起，更适合这个最新来单状态。

## 一、部署 Pages 前端

Cloudflare Pages 项目继续使用你现在的 `benbentaix2-0` 即可。

构建配置建议：

```text
Framework preset: Static HTML / None / No framework
Build command: exit 0
Build output directory: /
Root directory: /
```

如果 `Build output directory` 不接受 `/`，就填：

```text
.
```

## 二、部署 Durable Object Worker

在本项目根目录运行：

```bash
npx wrangler login
npx wrangler deploy --config wrangler-do.toml
```

部署成功后，Cloudflare 里会出现一个 Worker：

```text
bunbun-order-do
```

并创建 Durable Object class：

```text
BunbunOrderDurableObject
```

## 三、给 Pages 项目绑定 Durable Object

进入 Cloudflare Dashboard：

1. 打开 `Workers & Pages`
2. 进入你的 Pages 项目 `benbentaix2-0`
3. 进入 `Settings`
4. 找到 `Bindings`
5. 点 `Add`
6. 类型选择 `Durable Object namespace`
7. 填：

```text
Variable name: BUNBUN_ORDER_DO
Durable Object namespace/class: BunbunOrderDurableObject
Service/Worker: bunbun-order-do
```

如果界面让你选择环境，Production 和 Preview 都可以绑定；至少要绑定 Production。

保存后重新部署 Pages。

## 四、保留或删除 KV

现在 `/api/order` 会优先使用 Durable Object：

```text
BUNBUN_ORDER_DO
```

如果没有这个绑定，才会退回旧的 KV：

```text
BUNBUN_ORDERS
```

所以你可以暂时保留 KV 绑定，不影响 Durable Object 使用。

## 五、测试

打开：

```text
https://benbentaix2-0.pages.dev/api/order
```

如果返回里看到：

```json
"mode":"durable-object"
```

就说明已经切到 Durable Object。

如果还是：

```json
"mode":"cloudflare-kv"
```

说明 Pages 项目还没有绑定 `BUNBUN_ORDER_DO`，或者绑定后没有重新部署。

## 六、登录账号

用户端：

```text
账号：hjy
密码：440200
```

车主端：

```text
账号：benben
密码：463926
```

## 七、注意

这仍然不是原生 App 推送通知。车主端需要打开页面并登录，它会每 3 秒轮询一次 `/api/order`。Durable Object 解决的是跨设备读写一致性，不是后台推送通知。