# Use the official Node.js image as a base image
FROM node:16

# Set the working directory for your app
WORKDIR /usr/src/app

# Create the directory path/to/file
RUN mkdir -p path/to/file

# Copy the package.json to /app
COPY package.json .

# Install node-fetch package
RUN npm install node-fetch

# Install your app dependencies using npm
RUN npm install

# Copy the rest of the application code to the container, excluding directory /node_modules
COPY . .

# Expose port 3001to allow communication to/from server
EXPOSE 3001

# Run your app using node
CMD [ "node", "index.mjs" ]