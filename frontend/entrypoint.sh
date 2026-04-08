#!/bin/sh
# Generate runtime configuration from environment variables
cat <<EOF > /usr/share/nginx/html/config.js
window.__RUNTIME_CONFIG__ = {
  TASK_API_URL: "${VITE_TASK_API_URL:-http://localhost:8000}",
  NOTIFICATION_API_URL: "${VITE_NOTIFICATION_API_URL:-http://localhost:3001}",
  UTILITY_API_URL: "${VITE_UTILITY_API_URL:-http://localhost:8080/utility}"
};
EOF

echo "Runtime config generated:"
cat /usr/share/nginx/html/config.js

# Start nginx
exec nginx -g 'daemon off;'
