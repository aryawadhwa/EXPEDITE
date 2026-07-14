import { LOCAL_API_KEY } from "@/config/env";

export async function getAuthToken(): Promise<string> {
  // Local single-user mode token.
  return LOCAL_API_KEY;
}
