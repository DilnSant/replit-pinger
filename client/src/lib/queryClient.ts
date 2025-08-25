import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};

  // Only set Content-Type for JSON data, not for FormData
  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // For DELETE operations, add admin credentials if user is admin
  if (method === 'DELETE' && localStorage.getItem('isAdmin') === 'true') {
    headers["Authorization"] = "AdminAppBrandness:Adminappbrandness";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const [url, params] = queryKey;
    let fetchUrl = url as string;

    // If there are query parameters, append them to the URL
    if (params && typeof params === 'object') {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        fetchUrl += `?${queryString}`;
      }
    }

    // No authentication needed for GET requests now
    const res = await fetch(fetchUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds for faster updates
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Keep enabled for fresh data
      refetchOnReconnect: false, // Keep disabled to avoid refetch storms
      retry: 1, // Allow 1 retry for temporary errors
      networkMode: 'online',
    },
    mutations: {
      retry: 1, // Allow 1 retry for mutations
      networkMode: 'online',
    },
  },
});