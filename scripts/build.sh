#!/bin/bash

set -e

# Variables
APP_NAME="valouniversaire-server"
VERSION=${VERSION:-$(git describe --tags --always --dirty 2>/dev/null || echo "dev")}
BUILD_TIME=$(date -u '+%Y-%m-%d_%H:%M:%S')
GIT_COMMIT=${GIT_COMMIT:-$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")}

# Répertoires
BUILD_DIR="./build"
DIST_DIR="./dist"
CMD_DIR="./cmd/server"

# Flags de build
LDFLAGS="-w -s -X main.version=$VERSION -X main.buildTime=$BUILD_TIME -X main.gitCommit=$GIT_COMMIT"

echo "🏗️  Construction de $APP_NAME"
echo "   Version: $VERSION"
echo "   Commit: $GIT_COMMIT"
echo "   Build Time: $BUILD_TIME"
echo ""

# Créer les répertoires de build
mkdir -p "$BUILD_DIR" "$DIST_DIR"

# Build pour l'OS actuel
echo "📦 Build pour $(go env GOOS)/$(go env GOARCH)..."
CGO_ENABLED=0 go build \
    -ldflags="$LDFLAGS" \
    -o "$BUILD_DIR/$APP_NAME" \
    "$CMD_DIR"

echo "✅ Binaire créé: $BUILD_DIR/$APP_NAME"

# Build multi-plateformes si demandé
if [ "$1" == "all" ]; then
    echo ""
    echo "🌍 Build multi-plateformes..."
    
    platforms=(
        "linux/amd64"
        "linux/arm64"
        "darwin/amd64"
        "darwin/arm64"
        "windows/amd64"
    )
    
    for platform in "${platforms[@]}"; do
        IFS='/' read -ra ADDR <<< "$platform"
        os=${ADDR[0]}
        arch=${ADDR[1]}
        
        output_name="$DIST_DIR/${APP_NAME}-${os}-${arch}"
        if [ "$os" == "windows" ]; then
            output_name="${output_name}.exe"
        fi
        
        echo "  📦 Building for $os/$arch..."
        CGO_ENABLED=0 GOOS=$os GOARCH=$arch go build \
            -ldflags="$LDFLAGS" \
            -o "$output_name" \
            "$CMD_DIR"
    done
    
    echo ""
    echo "📋 Binaires créés dans $DIST_DIR:"
    ls -la "$DIST_DIR"
fi

echo ""
echo "🎉 Build terminé !"