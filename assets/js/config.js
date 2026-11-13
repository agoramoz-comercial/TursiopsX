/*
 * TursiopsX — runtime configuration.
 * Edit this file at deploy time. No secrets belong here: it is public.
 *
 * endpoint            POST target for applications (CRM / form backend). JSON body.
 *                     Leave empty to run in DEMO MODE: submissions are kept in the
 *                     visitor's localStorage outbox only and never leave the browser.
 * analyticsEndpoint   Optional beacon target for CTA / funnel events. Events are always
 *                     pushed to window.dataLayer as well.
 * contactEmail        Public contact address used by "Contact" and "Refer an organisation".
 * formVersion         Recorded with every consent so consent text can be traced to a version.
 */
window.TX_CONFIG = {
  endpoint: "",
  analyticsEndpoint: "",
  contactEmail: "hello@tursiopsx.com",
  formVersion: "WL-2026.11-v1"
};
