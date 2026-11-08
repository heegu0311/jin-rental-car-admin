import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0,
  beforeSend(event) {
    // Only controlled, code-only events are sent. Provider errors and user input
    // may contain customer data, so discard all other automatic error events.
    if (!event.message?.startsWith("operation_failed:")) return null;
    delete event.request;
    delete event.user;
    delete event.breadcrumbs;
    delete event.contexts;
    return event;
  },
});
