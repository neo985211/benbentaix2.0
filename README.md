# 笨笨专属接驾

一个给 iPhone Safari 使用的 H5/PWA 小工具：打开后先登录，用户端可以呼叫专属司机，车主端可以看到来单提醒。

## 登录账号

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

## 修改专属信息

打开 `app.js`，改最上面的配置：

```js
const APP_CONFIG = {
  driverName: "笨笨",
  passengerName: "黄佳怡小朋友",
  phoneNumber: "13800000000",
  passengerPhone: "",
  carModel: "黄佳怡的专属小车",
  plateNumber: "粤A EK3226",
  pickup: "你的心里",
  destination: "你的心里",
  etaMinutes: 3,
  autoOpenDialerAfterAccepted: false,
};
```

如果你想让车主端可以回拨黄佳怡小朋友，把 `passengerPhone` 填成她的手机号。

## 本地预览

```bash
node server.js
```

然后打开：

```text
http://localhost:5174
```

本地预览时，`server.js` 会提供一个临时的 `/api/order`，可以在两个浏览器标签页里测试用户端下单、车主端来单。

## 部署

跨手机来单同步需要后端接口。推荐部署到 Cloudflare Pages，并绑定 KV；详细步骤看 `DEPLOY.md`。

GitHub Pages 可以打开页面，但不能运行 `/api/order`，所以不能完成跨手机来单同步。