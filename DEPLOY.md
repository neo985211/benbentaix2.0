# 部署到手机可打开的网址

这个项目现在包含两个部分：

- 前端页面：登录入口、用户端、车主端。
- 来单接口：`/api/order`，用于让两台手机同步同一笔订单。

如果只用 GitHub Pages，页面可以打开，但 GitHub Pages 不能运行 `/api/order` 后端，所以车主端不会跨设备收到真实来单，只能本机演示。要实现「女朋友拨打电话后，你的车主端显示来单」，推荐部署到 Cloudflare Pages。

## 方案一：Cloudflare Pages，推荐

优点：免费、速度通常不错、可以运行 Pages Functions，还能绑定 KV 保存最新来单。

步骤：

1. 把整个项目上传到 GitHub 仓库。
2. 注册并登录 Cloudflare。
3. 进入 Workers & Pages。
4. 创建一个 KV namespace，名字可以叫 `bunbun_orders`。
5. 创建 Pages 项目，选择 Connect to Git，连接这个 GitHub 仓库。
6. 构建设置保持最简单：
   - Framework preset: None
   - Build command: 留空
   - Build output directory: `/`
7. 部署完成后，进入这个 Pages 项目的 Settings。
8. 找到 Functions 的 KV namespace bindings。
9. 添加绑定：
   - Variable name: `BUNBUN_ORDERS`
   - KV namespace: 选择刚才创建的 `bunbun_orders`
10. 重新部署一次。
11. 打开 Cloudflare 给你的 `https://xxx.pages.dev` 网址。

部署好以后：

- 用户端登录：账号 `hjy`，密码 `440200`
- 车主端登录：账号 `benben`，密码 `463926`
- 黄佳怡小朋友在用户端点「马上打给笨笨」后，车主端会在几秒内显示新来单。

## 方案二：GitHub Pages，只适合静态展示

优点：完全免费、配置少。

步骤：

1. 在 GitHub 新建一个仓库，例如 `bunbun-taxi`。
2. 把本项目所有文件上传到仓库根目录。
3. 进入仓库 Settings。
4. 找到 Pages。
5. Source 选择 Deploy from a branch。
6. Branch 选择 `main`，目录选择 `/root`。
7. 保存后等待 1 到 3 分钟。
8. GitHub 会生成类似 `https://你的用户名.github.io/bunbun-taxi/` 的网址。

注意：GitHub Pages 不能运行本项目的 `functions/api/order.js`，所以不能完成跨手机来单同步。

## 添加到 iPhone 主屏幕

用 iPhone Safari 打开部署后的 HTTPS 网址，点分享按钮，选择「添加到主屏幕」。以后从主屏幕图标打开时，会像一个轻量 App 一样运行。

## 注意隐私

这个是情侣小工具，不是真正的安全登录系统。账号密码和手机号都在前端代码里，懂技术的人拿到网址后可以查看源码。不要把网址公开分享。

## 改完内容后看不到新版？

PWA 会缓存页面。现在的 `sw.js` 已经改成网络优先，并且不会缓存 `/api/order`。如果手机还是显示旧文案，可以在 Safari 里清除该网站数据，或者换一个新部署网址再打开。