#!/bin/bash

docker-compose down -v
docker volume prune -f
docker-compose up -d --remove-orphans

sleep 30

docker exec nestjs-microservice-primary ./scripts/mongo/rs-init.sh