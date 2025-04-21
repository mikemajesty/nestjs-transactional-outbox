# Transactional Outbox

# Install

```
yarn infra
```

---

1 - Create Debezium connector config

```
POST: http://localhost:8083/connectors
{
"name": "mongo-connector",
"config": {
  "connector.class": "io.debezium.connector.mongodb.MongoDbConnector",
  "mongodb.connection.string": "mongodb://nestjs-microservice-primary:27017,nestjs-microservice-secondary:27017,nestjs-microservice-tertiary:27017/?replicaSet=app",
  "mongodb.hosts": "nestjs-microservice-primary:27017,nestjs-microservice-secondary:27017,nestjs-microservice-tertiary:27017",
  "mongodb.name": "dbserver1",
  "database.include.list": "order-db",
  "collection.include.list": "order-db.outbox",
  "tasks.max": "1",
  "topic.prefix": "dbz",
  "snapshot.mode": "initial",
  "transforms": "unwrap,setKey,customFilter",
  "transforms.unwrap.type": "io.debezium.connector.mongodb.transforms.ExtractNewDocumentState",
  "transforms.unwrap.drop.tombstones": "true",
  "transforms.unwrap.delete.handling.mode": "rewrite",
  "transforms.unwrap.remove.fields": "deletedAt,updatedAt,lastAttemptAt",
  "transforms.setKey.type": "org.apache.kafka.connect.transforms.ValueToKey",
  "transforms.setKey.fields": "aggregateId",
  "transforms.customFilter.type": "com.example.FilterRetryCountAndStatus",
  "key.converter": "org.apache.kafka.connect.json.JsonConverter",
  "value.converter": "org.apache.kafka.connect.json.JsonConverter",
  "key.converter.schemas.enable": "false",
  "value.converter.schemas.enable": "false",
  "topic.creation.groups": "dbz-order-db",
  "topic.creation.default.replication.factor": "1",
  "topic.creation.default.partitions": "1",
  "errors.tolerance": "all",
  "errors.log.enable": "true",
  "errors.deadletterqueue.topic.name": "dead-letter-topic",
  "errors.deadletterqueue.context.headers.enable": "true",
  "sanitize.field.names": "true",
  "database.history.logging.enabled": "true",
  "log.connection.messages": "true",
  "mongodb.log.connection": "true"
  }
}

```

✅ Padrão Outbox

Utilizamos o padrão Outbox para garantir consistência entre operações de banco de dados e publicação de mensagens Kafka. Cada evento é persistido antes do envio, garantindo resiliência e rastreabilidade.
🧵 Processamento assíncrono com Kafka

O serviço consome mensagens do Kafka utilizando eachMessage com controle de heartbeat, evitando reprocessamento por falha de conexão. Em caso de falha crítica, o consumidor é reinicializado automaticamente com disconnect() e connect().
🧠 Circuit Breaker (com Opossum)

Implementamos um Circuit Breaker usando Opossum para evitar propagação de falhas em chamadas que acessam o domínio principal. Ele:

    Garante controle de falhas com fallback

    Emite eventos de estado (open, halfOpen, close)

    Possui timeout, resetTimeout, threshold configuráveis

🔁 Retry com backoff exponencial + jitter

Falhas com status retryable (como 5xx, 429, etc) são tratadas com lógica de exponential backoff com jitter, evitando sobrecarga nos serviços downstream:

delay = baseDelay \* (2 \*\* retryCount) + jitter

O retry é limitado a 5 tentativas.
📊 Métricas e observabilidade

Através do MetricsService, são registradas:

    Tentativas de retry por erro

    Intervenções manuais

    Estados do Circuit Breaker

    Casos de falha máxima (max retries)

🧯 Fallback e intervenção manual

Falhas que ultrapassam o limite de tentativas ou não são passíveis de retry geram:

    Evento manual.intervention para operadores

    Evento retry.max_reached para filas de reprocessamento Ambos são publicados em tópicos específicos do Kafka para tratamento externo.
