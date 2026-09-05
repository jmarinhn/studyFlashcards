# Multi-stage Dockerfile para StudyFlashcards
# Etapa 1: Build de la aplicación
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código fuente y compilar estáticos de producción
COPY . .
ARG VITE_GOOGLE_CLIENT_ID
RUN if [ -n "$VITE_GOOGLE_CLIENT_ID" ]; then export VITE_GOOGLE_CLIENT_ID; else unset VITE_GOOGLE_CLIENT_ID; fi && npm run build

# Etapa 2: Servidor web de producción Nginx ultraliviano (~25MB)
FROM nginx:alpine AS runner

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar bundle compilado de Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Puerto de escucha del contenedor
EXPOSE 80

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
