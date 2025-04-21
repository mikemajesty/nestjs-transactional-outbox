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

---

mas tem a oiutra tecnica onde eu abro uma transação, e so depois de tudo completo dentro dele eu commit, e tem o roollback no catch, no caso se der erro no kafka, ele iria para o rollback e cancelaria tudo, estou errado?
ChatGPT said:

Excelente raciocínio, Mike! Você está quase certo, mas tem um detalhe crucial que faz a diferença aqui. Bora descer no detalhe:
🧠 Teu raciocínio:

    "Se eu abrir a transação do banco, fizer tudo (inclusive o envio Kafka) antes do commit(), e se der erro no Kafka, eu dou rollback() no banco – então fica tudo certo, né?"

Resposta: Tecnicamente, sim... mas na prática, não é tão confiável.
⚠️ O problema real está no que o Kafka faz por debaixo dos panos.

Vamos olhar um exemplo real com typeorm e Kafka:

const queryRunner = dataSource.createQueryRunner();
await queryRunner.startTransaction();

try {
await queryRunner.manager.save(pedido);

await kafka.send({ topic: 'pedido_criado', message: { ... } }); // <-- Aqui pode falhar

await queryRunner.commitTransaction(); // Só chega aqui se tudo acima der certo
} catch (err) {
await queryRunner.rollbackTransaction(); // Se o Kafka falhar, rollback no banco
}

🧨 O que pode dar errado aqui?

    Latência ou timeout no Kafka: o envio pode ficar "pendurado", você faz rollback no banco, mas o Kafka já enviou mesmo assim (já foi pra rede).

    Acknowledge enganoso: mesmo com acks: all, o Kafka pode confirmar o envio, mas a mensagem pode estar numa partição offline e demorar a propagar.

    Erro após envio: e se o kafka.send() for assíncrono e falhar depois que já foi pro wire? Você deu rollback achando que nada foi enviado, mas o consumidor já recebeu o evento.

Isso gera mensagens órfãs, ou pior, inconsistência difícil de rastrear.
💡 Comparação com o Transactional Outbox:
Estratégia Vantagem Risco
await sendKafka() antes do commit() Parece seguro e simples Kafka não participa da transação → possíveis eventos "fantasmas"
Transactional Outbox Garante atomicidade de verdade Mais robusta, mas exige worker separado
✅ Por isso o Transactional Outbox ainda é o mais confiável:

    Você nunca depende do Kafka estar 100% sincronizado com o commit do banco.

    Mesmo que o processo caia, o evento tá salvo na tabela outbox e pode ser enviado depois.

    Pode garantir at-least-once delivery com retries e dead letter.

    É resiliente a falhas parciais.

⚙️ Quer algo mais próximo disso?

O padrão que você descreveu é semelhante ao chamado "Transactional Messaging" com manual commit, mas isso só é realmente confiável quando todos os participantes estão dentro da mesma transação distribuída — o que o Kafka não suporta nativamente com bancos externos.

Se quiser, posso te mostrar como fazer isso de forma híbrida:

    typeorm + outbox_event table

    KafkaProducerService lendo e enviando

    Retry automático com marcação de status no banco

Quer que eu monte esse esqueleto pra ti?
