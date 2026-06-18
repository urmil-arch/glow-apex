#!/bin/sh
set -e

# Named Docker volumes initialise as root:root.
# Fix ownership of the blog-images mount before dropping privileges.
chown -R appuser:appuser /app/static/blog-images

exec gosu appuser "$@"
