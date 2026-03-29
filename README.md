# NexDrive — Admin Dashboard

AIoT Smart Car Rental & Fleet Management · React · TypeScript · Vite · Tailwind CSS

---

## Stack

|               |                                     |
| ------------- | ----------------------------------- |
| Framework     | React 18 + TypeScript + Vite        |
| Styling       | Tailwind CSS + shadcn/ui            |
| Routing       | React Router v6                     |
| Data Fetching | TanStack React Query                |
| HTTP          | Axios (shared instance with JWT)    |
| Maps          | React Leaflet + OpenStreetMap       |
| Auth          | JWT in localStorage via AuthContext |

---

## Getting Started

```bash
npm install
npm run dev
```

Backend must be running first — from `NexDrive be/`:

```bash
node server.js   # starts all 8 microservices, gateway on :5000
```

`.env`:

```env
VITE_API_GATEWAY_URL=http://localhost:5000
VITE_USER_SERVICE_URL=http://localhost:5001
```

---

## Pages

| Route                      | Description                                               |
| -------------------------- | --------------------------------------------------------- |
| `/dashboard`               | Stat cards, recent bookings, recent reclamations          |
| `/dashboard/cars`          | Fleet table, status picker, car detail + edit drawers     |
| `/dashboard/users`         | User table, detail drawer with notes + booking history    |
| `/dashboard/bookings`      | Bookings table, detail + edit drawers, clickable user/car |
| `/dashboard/reclamations`  | Reclamations table, detail + edit drawers                 |
| `/dashboard/devices`       | Devices table, detail + edit drawers                      |
| `/dashboard/telemetry`     | Car grid with live device status, telemetry detail sheet  |
| `/dashboard/map`           | React Leaflet map with live car positions + auto-refresh  |
| `/dashboard/notifications` | Inbox + send notification form                            |
| `/dashboard/settings`      | Admin profile, photo upload, preferences                  |

---

## Key Patterns

**Axios instance** — always use this, never bare `fetch()`:

```typescript
// src/lib/axios.ts
const api = axios.create({ baseURL: import.meta.env.VITE_API_GATEWAY_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**File uploads** — send as FormData, never set Content-Type manually:

```typescript
const formData = new FormData();
formData.append("photo", file);
await api.post(`/users/${id}/photo`, formData);
```

**After mutations** — always invalidate cache:

```typescript
onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cars"] });
```

**Deep linking** — navigate to a page and auto-open a drawer:

```typescript
navigate("/dashboard/cars", { state: { openCarId: id } });
// Cars.tsx listens for location.state.openCarId on mount
```

**No raw IDs in UI** — always resolve before displaying:

- `userId` → `user.name` or `user.email`
- `carId` → `car.marque + ' — ' + car.matricule`

**Profile photo** — update AuthContext after upload so sidebar + topbar sync instantly:

```typescript
const { data } = await api.post(`/users/${user._id}/photo`, formData);
setUser({ ...user, profilePhoto: data.profilePhoto });
```

**Leaflet marker fix** — required in `FleetMap.tsx`:

```typescript
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow });
```

---

## Architecture Note

This is a **microservices backend** — no Mongoose `.populate()`. The backend enriches responses via HTTP between services so the frontend receives pre-enriched objects (`booking.user.name`, `booking.car.matricule`). Always handle null enrichment gracefully:

```typescript
{
  booking.user?.name ?? "Unknown";
}
```

---

_NexDrive v1.0_
