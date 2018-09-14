docker build -t ncent/sandbox .
docker run -p 8010:8010 --name sandboxContainer --env-file ./secret.env ncent/sandbox
