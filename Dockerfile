# Build stage
FROM golang:1.24.2-alpine AS builder

# Installer les dépendances pour la compilation
RUN apk add --no-cache git ca-certificates tzdata

# Créer un utilisateur non-root
RUN adduser -D -g '' appuser

# Définir le répertoire de travail
WORKDIR /build

# Copier les fichiers de dépendances
COPY go.mod go.sum ./

# Télécharger les dépendances
RUN go mod download

# Copier le code source
COPY . .

# Compiler l'application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o valouniversaire-server ./cmd/server

# Production stage
FROM scratch

# Copier les certificats CA
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copier les informations de timezone
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copier l'utilisateur
COPY --from=builder /etc/passwd /etc/passwd

# Copier l'exécutable
COPY --from=builder /build/valouniversaire-server /app/valouniversaire-server

# Copier les fichiers statiques et templates
COPY --from=builder /build/static /app/static
COPY --from=builder /build/templates /app/templates
COPY --from=builder /build/configs /app/configs

# Définir le répertoire de travail
WORKDIR /app

# Utiliser l'utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 8080

# Définir les variables d'environnement
ENV GIN_MODE=release
ENV PORT=8080

# Point d'entrée
ENTRYPOINT ["./valouniversaire-server"]