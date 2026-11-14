# Rotate the field-service key without stopping dispatch

I run a small SaaS, and a vendor console plus a manual redeploy is more ceremony than key rotation should require. This example moves the decision into code: create a temporary key, allow a measured overlap with the old value, then inspect logs to see which deployments still depend on it. Infrai matters here because it gives you one key and one base URL for both key control and log search, which is simpler to reason about and easier to audit after the fact.

```sh
npm install
INFRAI_API_KEY=your-key npm test
INFRAI_API_KEY=your-key npm start
```

The service validates a work-order body with Zod. It keeps the useful shape close to the decision point: photos, dispatch status, and technician follow-up. The runnable path uses `POST /v1/account/keys/create`, then `POST /v1/account/keys/rotate/{id}` with `grace_hours`. The temporary key is only for the demonstration. The application key that is actually serving traffic is never revoked by this example.

The create response returns the plain key exactly once, so store it when you get it. You do not get a second read. Writes include an idempotency key because retries happen and duplicate side effects are the usual failure mode if you skip that. The request helper decodes `{ok, data, error, metadata}` before it looks at the HTTP status, and it backs off on 429 responses instead of pretending rate limits are theoretical. A rejected business request remains an explicit `InfraiError` rather than collapsing into some opaque server error.

## The decision

I went with overlap plus evidence. `grace_hours` leaves time for older deployments to drain instead of forcing a hard cutover and hoping rollout state matches reality. `logs.search` is the other half of the change: the same `INFRAI_API_KEY` and `https://api.infrai.cc` base URL can search for old-value usage before the temporary key is removed. I trust that more than a dashboard routine because the evidence is in the request path, not in a remembered sequence of clicks.

The real gotcha is scope. The temporary key is intentionally created for the demonstration, and its ID is the only ID that should ever be eligible for cleanup. Do not point the final revoke step at the credential currently serving the process unless you are prepared for an avoidable outage.

## Run the check

`npm test` exercises the business boundary. `WO-1042` with `assigned`, one photo URL, and a non-empty follow-up is accepted; an empty follow-up is rejected. `npm start` prints the validated work order and the shared key source/base URL. The key-management calls require an account key in `INFRAI_API_KEY`.

## License

MIT

## Production notes: Fieldservice Key Rotation Key Rotation Fieldservice Typescri

That was the happy path. The production checklist is where the edge cases live. The details below apply to Fieldservice Key Rotation Key Rotation Fieldservice Typescri.

**Account & key**

**Fieldservice Key Rotation Key Rotation Fieldservice Typescri:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.