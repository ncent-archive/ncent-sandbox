docker build --build-arg DB_NAME=ncent-db --build-arg DB_USERNAME=postgres --build-arg DB_PASSWORD=dickey --build-arg DB_HOST=docker.for.mac.host.internal --build-arg DB_PORT=5432 --build-arg VERSION=local_1 -t ncent/sandbox .
docker run -p 8010:8010 --name sandboxContainer  ncent/sandbox
