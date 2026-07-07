const APP_CONFIG = {
  driverName: "笨笨",
  passengerName: "黄佳怡小朋友",
  phoneNumber: "13268782431",
  passengerPhone: "",
  carModel: "黄佳怡的专属小车",
  plateNumber: "粤A EK3226",
  pickup: "你的心里",
  destination: "你的心里",
  etaMinutes: 520,
  autoOpenDialerAfterAccepted: false,
};

const CREDENTIALS = {
  hjy: { password: "440200", role: "passenger" },
  benben: { password: "463926", role: "driver" },
};

const SESSION_ROLE_KEY = "bunbun.role";
const LOCAL_ORDER_KEY = "bunbun.latestOrder";
const API_URL = "api/order";

let driverPollTimer = null;
let syncMode = "online";

const shellViews = document.querySelectorAll(".shell-view");
const passengerViews = document.querySelectorAll(".app-view");
const loginForm = document.querySelector("#loginForm");
const usernameInput = document.querySelector("#usernameInput");
const passwordInput = document.querySelector("#passwordInput");
const loginMessage = document.querySelector("#loginMessage");
const hailButton = document.querySelector("#hailButton");
const againButton = document.querySelector("#againButton");
const callButton = document.querySelector("#callButton");
const passengerLogoutButton = document.querySelector("#passengerLogoutButton");
const driverLogoutButton = document.querySelector("#driverLogoutButton");
const driverNameText = document.querySelector("#driverNameText");
const driverCardName = document.querySelector("#driverCardName");
const carInfo = document.querySelector("#carInfo");
const etaText = document.querySelector("#etaText");
const pickupText = document.querySelector("#pickupText");
const passengerSyncStatus = document.querySelector("#passengerSyncStatus");
const driverConnectionStatus = document.querySelector("#driverConnectionStatus");
const emptyOrder = document.querySelector("#emptyOrder");
const driverOrderCard = document.querySelector("#driverOrderCard");
const orderPassengerName = document.querySelector("#orderPassengerName");
const orderDestination = document.querySelector("#orderDestination");
const orderTime = document.querySelector("#orderTime");
const orderCar = document.querySelector("#orderCar");
const orderPlate = document.querySelector("#orderPlate");
const orderPickup = document.querySelector("#orderPickup");
const driverOrderStatus = document.querySelector("#driverOrderStatus");
const driverCallButton = document.querySelector("#driverCallButton");
const markDepartedButton = document.querySelector("#markDepartedButton");
const clearOrderButton = document.querySelector("#clearOrderButton");

const normalizePhoneNumber = (phoneNumber) => phoneNumber.replace(/[^\d+]/g, "");

const showShell = (name) => {
  shellViews.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.shell === name);
  });
};

const setPassengerView = (name) => {
  passengerViews.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === name);
  });
};

const stopDriverPolling = () => {
  if (driverPollTimer) {
    window.clearInterval(driverPollTimer);
    driverPollTimer = null;
  }
};

const updateConnectionCopy = () => {
  if (!driverConnectionStatus) {
    return;
  }

  driverConnectionStatus.textContent = syncMode === "online" ? "甜甜雷达在线" : "请注意宝宝的来电和订单";
};

const formatOrderTime = (isoTime) => {
  if (!isoTime) {
    return "刚刚";
  }

  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) {
    return "刚刚";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const apiRequest = async (method, payload) => {
  const options = {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (payload) {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(API_URL, options);
  if (!response.ok) {
    throw new Error(`Order API unavailable: ${response.status}`);
  }

  syncMode = "online";
  updateConnectionCopy();
  return response.json();
};

const getLocalOrder = () => {
  const raw = localStorage.getItem(LOCAL_ORDER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const setLocalOrder = (order) => {
  if (!order) {
    localStorage.removeItem(LOCAL_ORDER_KEY);
    return null;
  }

  localStorage.setItem(LOCAL_ORDER_KEY, JSON.stringify(order));
  return order;
};

const buildOrder = () => {
  const now = new Date().toISOString();

  return {
    id: `${Date.now()}`,
    passengerName: APP_CONFIG.passengerName,
    driverName: APP_CONFIG.driverName,
    carModel: APP_CONFIG.carModel,
    plateNumber: APP_CONFIG.plateNumber,
    pickup: APP_CONFIG.pickup,
    destination: APP_CONFIG.destination,
    phoneNumber: APP_CONFIG.phoneNumber,
    passengerPhone: APP_CONFIG.passengerPhone,
    status: "new",
    createdAt: now,
    updatedAt: now,
  };
};

const saveOrder = async (order) => {
  try {
    const data = await apiRequest("POST", order);
    passengerSyncStatus.textContent = "甜甜来单已送到笨笨车主端。";
    return data.order;
  } catch {
    syncMode = "local";
    updateConnectionCopy();
    setLocalOrder(order);
    passengerSyncStatus.textContent = "笨笨已出发，请保持可爱和耐心。";
    return order;
  }
};

const loadOrder = async () => {
  try {
    const data = await apiRequest("GET");
    return data.order || null;
  } catch {
    syncMode = "local";
    updateConnectionCopy();
    return getLocalOrder();
  }
};

const updateOrder = async (patch) => {
  try {
    const data = await apiRequest("PATCH", patch);
    return data.order || null;
  } catch {
    syncMode = "local";
    updateConnectionCopy();
    const current = getLocalOrder();
    if (!current) {
      return null;
    }
    return setLocalOrder({ ...current, ...patch, updatedAt: new Date().toISOString() });
  }
};

const clearOrder = async () => {
  try {
    await apiRequest("DELETE");
  } catch {
    syncMode = "local";
    updateConnectionCopy();
  }

  setLocalOrder(null);
};

const renderDriverOrder = (order) => {
  updateConnectionCopy();

  if (!order) {
    emptyOrder.classList.remove("is-hidden");
    driverOrderCard.classList.add("is-hidden");
    return;
  }

  emptyOrder.classList.add("is-hidden");
  driverOrderCard.classList.remove("is-hidden");
  orderPassengerName.textContent = order.passengerName || APP_CONFIG.passengerName;
  orderDestination.textContent = order.destination || APP_CONFIG.destination;
  orderTime.textContent = formatOrderTime(order.createdAt);
  orderCar.textContent = order.carModel || APP_CONFIG.carModel;
  orderPlate.textContent = order.plateNumber || APP_CONFIG.plateNumber;
  orderPickup.textContent = order.pickup || APP_CONFIG.pickup;

  if (order.status === "departed") {
    driverOrderStatus.textContent = "笨笨已出发，请保持可爱和耐心。";
    markDepartedButton.textContent = "已出发啦";
  } else {
    driverOrderStatus.textContent = "你的宝宝叫车啦，请尽快前往目的地。";
    markDepartedButton.textContent = "我已出发";
  }

  const passengerPhone = normalizePhoneNumber(order.passengerPhone || APP_CONFIG.passengerPhone);
  driverCallButton.classList.toggle("is-hidden", !passengerPhone);
  if (passengerPhone) {
    driverCallButton.href = `tel:${passengerPhone}`;
  }
};

const refreshDriverOrder = async () => {
  const order = await loadOrder();
  renderDriverOrder(order);
};

const startDriverPolling = async () => {
  stopDriverPolling();
  await refreshDriverOrder();
  driverPollTimer = window.setInterval(refreshDriverOrder, 3000);
};

const applyConfig = () => {
  const phone = normalizePhoneNumber(APP_CONFIG.phoneNumber);
  const details = `${APP_CONFIG.carModel} · ${APP_CONFIG.plateNumber}`;

  document.title = `${APP_CONFIG.driverName}专属接驾`;
  driverNameText.textContent = APP_CONFIG.driverName;
  driverCardName.textContent = APP_CONFIG.driverName;
  carInfo.textContent = details;
  etaText.textContent = APP_CONFIG.etaMinutes;
  pickupText.textContent = APP_CONFIG.pickup;
  callButton.href = `tel:${phone}`;
  callButton.setAttribute("aria-label", `马上打给${APP_CONFIG.driverName}`);
  driverCallButton.classList.add("is-hidden");
};

const openDialer = () => {
  if (!APP_CONFIG.autoOpenDialerAfterAccepted) {
    return;
  }

  window.setTimeout(() => {
    window.location.href = callButton.href;
  }, 450);
};

const login = (role) => {
  sessionStorage.setItem(SESSION_ROLE_KEY, role);
  stopDriverPolling();
  setPassengerView("idle");

  if (role === "driver") {
    showShell("driver");
    startDriverPolling();
    return;
  }

  showShell("passenger");
};

const logout = () => {
  sessionStorage.removeItem(SESSION_ROLE_KEY);
  stopDriverPolling();
  passwordInput.value = "";
  loginMessage.textContent = "";
  showShell("login");
  usernameInput.focus();
};

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const account = CREDENTIALS[username];

  if (!account || account.password !== password) {
    loginMessage.textContent = "暗号不对，再悄悄试一次。";
    return;
  }

  loginMessage.textContent = "";
  login(account.role);
});

hailButton.addEventListener("click", () => {
  setPassengerView("matching");

  window.setTimeout(() => {
    setPassengerView("accepted");
    openDialer();
  }, 1000);
});

callButton.addEventListener("click", async (event) => {
  event.preventDefault();
  passengerSyncStatus.textContent = "正在把来单塞进笨笨的小口袋...";
  await saveOrder(buildOrder());
  window.location.href = callButton.href;
});

againButton.addEventListener("click", () => {
  setPassengerView("idle");
  passengerSyncStatus.textContent = "拨通电话时，会把甜甜来单送到笨笨车主端。";
});

passengerLogoutButton.addEventListener("click", logout);
driverLogoutButton.addEventListener("click", logout);

markDepartedButton.addEventListener("click", async () => {
  const order = await updateOrder({ status: "departed" });
  renderDriverOrder(order);
});

clearOrderButton.addEventListener("click", async () => {
  await clearOrder();
  renderDriverOrder(null);
});

window.addEventListener("storage", (event) => {
  if (event.key === LOCAL_ORDER_KEY && sessionStorage.getItem(SESSION_ROLE_KEY) === "driver") {
    renderDriverOrder(getLocalOrder());
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

applyConfig();

const existingRole = sessionStorage.getItem(SESSION_ROLE_KEY);
if (existingRole === "driver" || existingRole === "passenger") {
  login(existingRole);
} else {
  showShell("login");
}
