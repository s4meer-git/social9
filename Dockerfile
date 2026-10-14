# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG NEXT_PUBLIC_SITE_URL=https://social9.s4meer.com
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
RUN npm run build && node scripts/generate-nginx-headers.mjs

FROM nginx:1.28-alpine AS runtime
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/.next/nginx-headers.conf /etc/nginx/social9-headers.conf
COPY --from=build /app/out /usr/share/nginx/html

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
