FROM php:8.4-fpm

# Build arguments for user synchronization
ARG WWWUSER=1000
ARG WWWGROUP=1000

COPY php.ini /usr/local/etc/php/
COPY docker.conf /usr/local/etc/php-fpm.d/docker.conf
COPY .bashrc /root/

# Copy the entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# mix
RUN apt-get update \
  && apt-get install -y build-essential zlib1g-dev default-mysql-client curl gnupg procps vim git unzip libzip-dev libpq-dev gosu \
  && docker-php-ext-install zip pdo_mysql pdo_pgsql pgsql

# intl
RUN apt-get install -y libicu-dev \
  && docker-php-ext-configure intl \
  && docker-php-ext-install intl

# gd
RUN apt-get install -y libfreetype6-dev libjpeg62-turbo-dev libpng-dev && \
docker-php-ext-configure gd --with-freetype=/usr/include/ --with-jpeg=/usr/include/ && \
docker-php-ext-install gd

# redis
RUN pecl install redis && docker-php-ext-enable redis

# pcov
RUN pecl install pcov && docker-php-ext-enable pcov

# pcntl
RUN docker-php-ext-install pcntl

# Xdebug
# RUN pecl install xdebug \
# && docker-php-ext-enable xdebug \
# && echo ";zend_extension=xdebug" > /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

# Node.js, NPM, Yarn
RUN curl -sL https://deb.nodesource.com/setup_22.x | bash -
RUN apt-get install -y nodejs
RUN npm install npm@latest -g
RUN npm install yarn -g

# Composer
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
RUN php composer-setup.php
RUN php -r "unlink('composer-setup.php');"
RUN mv composer.phar /usr/local/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER 1
ENV COMPOSER_HOME /composer
ENV PATH $PATH:/composer/vendor/bin
RUN composer config --global process-timeout 3600
RUN composer global require "laravel/installer"

WORKDIR /root
RUN git clone https://github.com/seebi/dircolors-solarized

# Create application user with matching UID/GID from host
RUN groupmod -o -g ${WWWGROUP} www-data \
    && usermod -o -u ${WWWUSER} -g www-data www-data \
    && mkdir -p /home/www-data \
    && chown -R www-data:www-data /home/www-data

# Set up composer for www-data user
ENV COMPOSER_HOME /home/www-data/.composer
RUN mkdir -p /home/www-data/.composer \
    && chown -R www-data:www-data /home/www-data/.composer

# Copy bashrc for www-data
COPY .bashrc /home/www-data/.bashrc
RUN chown www-data:www-data /home/www-data/.bashrc

EXPOSE 5173
WORKDIR /var/www

# Set environment variables for user
ENV WWWUSER=${WWWUSER}
ENV WWWGROUP=${WWWGROUP}

#entrypoint
ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]