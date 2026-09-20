# ==========================================
# 1. Build Stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# 2. Production Stage (Nginx Alpine)
# ==========================================
FROM nginx:alpine AS runner

# คัดลอกไฟล์ build static ไปยัง nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# คัดลอกคอนฟิก Nginx สำหรับทำ SPA routing และ reverse proxy /api
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
