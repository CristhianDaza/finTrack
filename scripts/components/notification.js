export const NotificationService = (() => {
  const containerId = "notification-container";
  const maxNotifications = 3;

  const init = () => {
    if (!document.getElementById(containerId)) {
      const container = document.createElement("div");
      container.id = containerId;
      document.body.appendChild(container);
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case "success": return "✅";
      case "error": return "❌";
      case "info": return "ℹ️";
      default: return "";
    }
  }

  const show = (message, type = "info", timeout = 4000) => {
    init();
    const container = document.getElementById(containerId);

    if (container.children.length >= maxNotifications) {
      container.firstChild.remove();
    }

    const notif = document.createElement("div");
    notif.className = `notification ${type}`;

    notif.innerHTML = `
      <span class="icon">${getIcon(type)}</span>
      <span class="message">${message}</span>
      <button class="close-btn">×</button>
    `;

    const closeBtn = notif.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      notif.remove();
    });

    container.appendChild(notif);

    setTimeout(() => {
      notif.classList.add("hide");
      notif.addEventListener("transitionend", () => {
        notif.remove();
      });
    }, timeout);
  }

  return {
    success: (msg, t) => show(msg, "success", t),
    error: (msg, t) => show(msg, "error", t),
    info: (msg, t) => show(msg, "info", t)
  };
})();
