# Dockerfile

# arguments
ARG configPath
# Node version
FROM node:8
# Working directory
WORKDIR /var/stampede
# install app dependencies
COPY package*.json ./
RUN npm install
# copy the app into the container
COPY . .
COPY $configPath ./config
# setup the environment variables
ENV stampede_stampedeConfigPath /var/stampede/config
# expose our web port
EXPOSE 7766
# run the server
CMD ["node", "bin/stampede-server.js"]