/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: Array<string | { url: string; revision: string | null }>;
  }
}

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener("push", (event) => {
  const data = (event as PushEvent).data?.json() as {
    title?: string;
    body?: string;
    url?: string;
  } | null ?? {};

  const title = data.title ?? "FollowUp";
  const options: NotificationOptions = {
    body: data.body ?? "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url ?? "/" },
  };

  (event as ExtendableEvent).waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  const notifEvent = event as NotificationEvent;
  notifEvent.notification.close();
  const targetUrl = (notifEvent.notification.data?.url as string | undefined) ?? "/dashboard";

  notifEvent.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        // Focus an existing window that is already on the target path
        for (const client of list) {
          const clientUrl = new URL((client as WindowClient).url);
          if (clientUrl.pathname === targetUrl && "focus" in client) {
            return (client as WindowClient).focus();
          }
        }
        // Focus any existing window and navigate it, or open a new one
        if (list.length > 0 && "focus" in list[0]) {
          return (list[0] as WindowClient).focus().then(() =>
            (list[0] as WindowClient).navigate(targetUrl)
          );
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
