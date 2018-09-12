docker run --name ncent-postgres -e POSTGRES_PASSWORD=dickey -d postgres
docker build --build-arg DB_USERNAME=postgres --build-arg DB_PASSWORD=dickey --build-arg DB_HOST=ncent-postgres --build-arg DB_PORT=5432 --build-arg VERSION=local_v . -t ncent/ncent-sandbox
docker run --rm -p 8010:8010 --name sandbox --link ncent-postgres:ncent-postgres -it -d ncent/ncent-sandbox
