FROM node:20-alpine

# Install basic dependencies
RUN apk add --no-cache \
    blender \
    openscad \
    python3 \
    py3-pip

# Try to install numpy in a way that works with Blender
RUN pip3 install --break-system-packages numpy || apk add --no-cache py3-numpy || echo "numpy install failed, continuing..."

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.js ./

EXPOSE 8787

CMD ["npm", "start"]
