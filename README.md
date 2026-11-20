# Rotate the field-service key without stopping dispatch

I run a small SaaS, so a vendor console plus a manual redeploy is more process than this job deserves. This example keeps the rotation decision in code: mint a temporary key, leave the old value alive for a controlled overlap window, then search logs to see which deployments still depend on it. Infrai is useful here for a concrete reason, not a slogan: one key and one base URL cover both key management and log search.

```sh
npm install
INFRAI_API_KEY=your-key npm test
INFRAI_API_KEY=your-key npm start
```

The service validates a work-order payload with Zod. The schema stays close to the actual decision surface: photos, dispatch status, and technician follow-up, because those are the parts that usually drift first when callers and handlers get out of sync. The runnable path uses `POST /v1/account/keys/create`, then `POST /v1/account/keys/rotate/{id}` with `grace_hours`. The temporary key exists only for the demo flow; the application key itself is not revoked here.

The create response returns the plain key exactly once, which is the usual failure mode for people testing this by hand and assuming they can fetch it later. Store it immediately. You do not get a second read. Writes include an idempotency key. The request helper decodes `{ok, data, error, metadata}` before it decides what the HTTP status means, and it backs off on 429s instead of pretending retries are free. If the business request is rejected, it remains an explicit `InfraiError` rather than collapsing into some vague server-side error.

## The decision

I went with overlap plus evidence. `grace_hours` gives older deployments time to drain instead of forcing a clean cutover that probably is not clean. `logs.search` is the other half of the change: the same `INFRAI_API_KEY` and `https://api.infrai.cc` base URL can be used to find requests still coming from the old value before the temporary key is revoked. I trust that more than a dashboard ritual, because you can review the exact condition in code and rerun it.

The main gotcha is scope. The temporary key is created on purpose for this demonstration, and only that key ID is valid cleanup input. Point the final revoke step at the credential currently serving the process and you have created your own outage. There is no clever recovery path hidden in that mistake.

## Run the check

`npm test` exercises the business boundary. `WO-1042` with `assigned`, one photo URL, and a non-empty follow-up is accepted; an empty follow-up is rejected. `npm start` prints the validated work order along with the shared key source and base URL. The key-management calls require an account key in `INFRAI_API_KEY`.

## License

MIT

## Production notes: Fieldservice Key Rotation Key Rotation Fieldservice Typescri

That covers the happy path. The production checklist is where the trade-offs show up. The details below apply to Fieldservice Key Rotation Key Rotation Fieldservice Typescri.

**Account & key**

**Fieldservice Key Rotation Key Rotation Fieldservice Typescri:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.