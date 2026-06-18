# Stage 1: Build frontend assets
FROM node:20-alpine AS node_build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

COPY resources/js ./resources/js
COPY vite.config.js ./
COPY tailwind.config.js* ./
COPY postcss.config.js* ./
RUN npm run build

# Stage 2: Install PHP dependencies
FROM composer:2.7 AS composer_build

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-autoloader \
    --prefer-dist \
    --ignore-platform-reqs

COPY . .
RUN composer dump-autoload --optimize --no-dev

# Stage 3: Production image
FROM php:8.3-fpm-alpine

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    mysql-client \
    supervisor \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd xml \
    && pecl install redis \
    && docker-php-ext-enable redis

# Copy PHP-FPM config
COPY docker/php/php.ini /usr/local/etc/php/conf.d/app.ini

WORKDIR /var/www/html

# Copy application code
COPY --chown=www-data:www-data . .

# Copy built assets from previous stages
COPY --from=node_build --chown=www-data:www-data /app/public/build ./public/build
COPY --from=composer_build --chown=www-data:www-data /app/vendor ./vendor

# Set up storage and cache directories
RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

USER www-data

EXPOSE 9000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
