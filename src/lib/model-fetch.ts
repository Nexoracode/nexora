import { fetch as undiciFetch, ProxyAgent } from "undici";
import { env } from "@/lib/env";

let agent: ProxyAgent | undefined;

/**
 * `fetch` for the model API. Node's own fetch ignores proxy settings, so when AI_PROXY_URL is set (a VPN client's local
 * HTTP proxy, e.g. http://127.0.0.1:10808) the request goes through undici with that proxy; without it, plain fetch.
 */
export function modelFetch(url: string, init: RequestInit): Promise<Response> {
  if (!env.AI_PROXY_URL) return fetch(url, init);
  agent ??= new ProxyAgent(env.AI_PROXY_URL);
  return undiciFetch(url, { ...init, dispatcher: agent } as never) as unknown as Promise<Response>;
}
